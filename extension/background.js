importScripts('crypto.js');

const API_URL = "http://localhost:5000";

// In-memory cache for decrypted login items (not persisted to storage)
let decryptedLoginCache = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CACHE_CREDENTIALS') {
        handleCacheCredentials(message.data);
    } else if (message.type === 'CHECK_PENDING') {
        handleCheckPending(sendResponse);
        return true; // Keep channel open for async response
    } else if (message.type === 'SAVE_CREDENTIALS') {
        handleSaveCredentials(message.data);
    } else if (message.type === 'DISCARD_CREDENTIALS') {
        handleDiscardCredentials();
    } else if (message.type === 'REQUEST_AUTOFILL_CREDENTIALS') {
        handleRequestAutofillCredentials(message.domain, sendResponse);
        return true;
    } else if (message.type === 'TRIGGER_VAULT_SYNC') {
        syncVaultItems().then(
            () => sendResponse({ ok: true }),
            (err) => {
                console.error('Vault sync failed:', err);
                sendResponse({ ok: false, error: err.message });
            }
        );
        return true;
    }
});

async function handleCacheCredentials(credentials) {
    console.log("Caching credentials for post-login prompt:", credentials);
    await chrome.storage.local.set({
        pendingCredentials: {
            data: credentials,
            timestamp: Date.now()
        }
    });
}

async function handleCheckPending(sendResponse) {
    const { pendingCredentials } = await chrome.storage.local.get(['pendingCredentials']);

    if (pendingCredentials) {
        // Check if expired (e.g., > 60 seconds)
        if (Date.now() - pendingCredentials.timestamp > 60000) {
            await chrome.storage.local.remove('pendingCredentials');
            sendResponse({ credentials: null });
        } else {
            sendResponse({ credentials: pendingCredentials.data });
        }
    } else {
        sendResponse({ credentials: null });
    }
}

async function handleDiscardCredentials() {
    await chrome.storage.local.remove('pendingCredentials');
}

async function handleSaveCredentials(credentials) {
    await chrome.storage.local.remove('pendingCredentials');
    // Proceed with original saving logic
    saveToVault(credentials);
}

// --- Autofill: vault sync + lookup ---

async function syncVaultItems() {
    const tokenValid = await validateToken();
    if (!tokenValid) {
        throw new Error('Authentication required');
    }

    try {
        const response = await makeAuthenticatedRequest(`${API_URL}/vault/items`, {
            method: 'GET'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to fetch vault items');
        }

        const json = await response.json();
        const items = Array.isArray(json) ? json : json.items || [];

        // Only store ciphertext items + metadata in storage (safe)
        await chrome.storage.local.set({ vaultItems: items });

        // Clear in-memory cache; it will be lazily rebuilt per-domain
        decryptedLoginCache = {};
    } catch (err) {
        console.error('Error syncing vault items:', err);
        throw err;
    }
}

function normalizeDomain(rawUrlOrDomain) {
    try {
        const url = new URL(rawUrlOrDomain);
        return url.hostname;
    } catch {
        // If it's already a hostname, just return it
        return rawUrlOrDomain;
    }
}

async function handleRequestAutofillCredentials(rawDomain, sendResponse) {
    try {
        const domain = normalizeDomain(rawDomain);

        // Ensure we have latest vault items
        const { vaultItems } = await chrome.storage.local.get(['vaultItems']);
        if (!vaultItems || !Array.isArray(vaultItems)) {
            // Try to sync once if nothing in storage
            await syncVaultItems();
        }

        const { vaultItems: refreshedItems } = await chrome.storage.local.get(['vaultItems']);
        if (!refreshedItems || !Array.isArray(refreshedItems)) {
            sendResponse({ credentials: [] });
            return;
        }

        // Use in-memory cache per domain to avoid re-decrypting everything
        if (!decryptedLoginCache[domain]) {
            decryptedLoginCache[domain] = await decryptLoginItemsForDomain(domain, refreshedItems);
        }

        sendResponse({ credentials: decryptedLoginCache[domain] || [] });
    } catch (err) {
        console.error('Error handling autofill request:', err);
        sendResponse({ credentials: [], error: err.message });
    }
}

async function decryptLoginItemsForDomain(domain, items) {
    // Retrieve encryption key (derived at login) from storage
    const { encryptionKey } = await chrome.storage.local.get(['encryptionKey']);
    if (!encryptionKey) {
        console.warn('No encryption key found, cannot decrypt vault items for autofill.');
        return [];
    }

    const key = await importKey(encryptionKey);

    const matched = [];

    for (const item of items) {
        try {
            // Basic heuristic: skip if no ciphertext
            if (!item.ciphertext) continue;

            // Decrypt payload; assume it contains JSON with at least password, note, and optional url/username
            const plaintextJson = await decryptPassword(item.ciphertext, key);
            const payload = JSON.parse(plaintextJson);

            // If payload has URL, use it for domain matching
            let itemDomain = null;
            if (payload.url) {
                itemDomain = normalizeDomain(payload.url);
            }

            if (itemDomain && !domain.endsWith(itemDomain)) {
                continue;
            }

            // We only care about "login-like" items
            const username = payload.username || item.username || '';
            const password = payload.password;

            if (!password) continue;

            matched.push({
                id: item.id,
                username,
                password,
                name: item.name || itemDomain || domain
            });
        } catch (e) {
            // Ignore bad/deprecated items silently to avoid breaking autofill
            console.warn('Failed to decrypt or parse vault item for autofill:', e);
            continue;
        }
    }

    return matched;
}

async function saveToVault(credentials) {
    const { token, tokenExpiry } = await chrome.storage.local.get(['token', 'tokenExpiry']);

    if (!token) {
        showNotification("Please login to Indo-Vault extension first.", "Login Required");
        return;
    }

    // Check if token is expired
    if (tokenExpiry && Date.now() > tokenExpiry) {
        await invalidateToken("Token expired. Please login again.");
        return;
    }

    // ... (comments)

    try {
        // Retrieve encryption key from storage
        const { encryptionKey } = await chrome.storage.local.get(['encryptionKey']);

        if (!encryptionKey) {
            console.error("No encryption key found. Cannot save password securely.");
            showNotification("Encryption key missing. Please login again.", "Error");
            return;
        }

        // Import the key
        const key = await importKey(encryptionKey);

        // Encrypt the password
        // Note: We create a payload with password, empty note, and url, similar to frontend
        const payload = JSON.stringify({
            password: credentials.password,
            note: "",
            url: credentials.url || ""
        });

        const ciphertext = await encryptPassword(payload, key);

        const response = await makeAuthenticatedRequest(`${API_URL}/vault/items`, {
            method: 'POST',
            body: JSON.stringify({
                name: credentials.title || new URL(credentials.url).hostname,
                username: credentials.username,
                ciphertext: ciphertext
            })
        });

        if (response.ok) {
            showNotification("Password saved to Indo-Vault!", "Success");
        } else {
            const errorText = await response.text();
            console.error("Failed to save password", errorText);
            showNotification("Failed to save password: " + (errorText || "Unknown error"), "Error");
        }
    } catch (err) {
        console.error("Error saving password:", err);
        showNotification("Error saving password: " + err.message, "Error");
    }
}

function showNotification(message, title = "Indo-Vault") {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png', // Make sure icon.png exists, or use a default
        title: title,
        message: message,
        priority: 2
    });
}

// Centralized token management
async function invalidateToken(reason = "Token invalidated") {
    console.log(reason);
    await chrome.storage.local.remove(['token', 'encryptionKey', 'user', 'tokenExpiry']);
    
    // Show notification and clean up any pending credentials
    showNotification(reason, "Login Required");
    await chrome.storage.local.remove('pendingCredentials');
}

async function validateToken() {
    const { token, tokenExpiry } = await chrome.storage.local.get(['token', 'tokenExpiry']);
    
    if (!token) {
        return false;
    }
    
    // Check expiry if set
    if (tokenExpiry && Date.now() > tokenExpiry) {
        await invalidateToken("Token expired");
        return false;
    }
    
    return true;
}

// Refresh token mechanism
async function refreshTokenIfExpired() {
    const { refreshToken, tokenExpiry } = await chrome.storage.local.get(['refreshToken', 'tokenExpiry']);
    
    // Check if token is expiring soon (within 5 minutes)
    if (!refreshToken || !tokenExpiry) {
        return false;
    }
    
    const timeToExpiry = tokenExpiry - Date.now();
    if (timeToExpiry > (5 * 60 * 1000)) { // More than 5 minutes left
        return true; // Token still valid
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refreshToken })
        });
        
        if (!response.ok) {
            throw new Error('Token refresh failed');
        }
        
        const data = await response.json();
        
        // Update token and expiry
        const newTokenExpiry = Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 60 * 60 * 1000);
        
        await chrome.storage.local.set({
            token: data.accessToken,
            tokenExpiry: newTokenExpiry,
            refreshToken: data.refreshToken || refreshToken
        });
        
        return true;
    } catch (error) {
        console.error('Token refresh failed:', error);
        await invalidateToken('Session expired. Please login again.');
        return false;
    }
}

// Enhanced API call function with token management
async function makeAuthenticatedRequest(url, options = {}) {
    // Ensure token is valid
    const tokenValid = await validateToken();
    if (!tokenValid) {
        throw new Error('Authentication required');
    }
    
    // Try to refresh if expiring soon
    await refreshTokenIfExpired();
    
    // Get fresh token
    const { token } = await chrome.storage.local.get(['token']);
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // Handle token expiration during request
    if (response.status === 401) {
        await invalidateToken('Session expired. Please login again.');
        throw new Error('Authentication expired');
    }
    
    return response;
}


