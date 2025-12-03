// Wrap everything in IIFE to avoid conflicts with page scripts
(function() {
    'use strict';

    // Safety check: ensure we're in a valid context
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        console.warn('Indo-Vault: Chrome runtime not available');
        return;
    }

// Check if user is logged in to Indo-Vault extension
async function isUserLoggedIn() {
    try {
        const result = await chrome.storage.local.get(['token', 'user']);
        return !!(result.token && result.user);
    } catch (err) {
        console.error('Indo-Vault: Error checking login status:', err);
        return false;
    }
}

async function captureCredentials(form) {
    try {
        // Check if user is logged in before capturing
        const loggedIn = await isUserLoggedIn();
        if (!loggedIn) {
            console.log("Indo-Vault: User not logged in, skipping credential capture");
            return;
        }
        
        console.log("Indo-Vault: User is logged in, attempting to capture credentials from form:", form);
        const passwordField = form.querySelector('input[type="password"]');

        if (passwordField) {
        console.log("Password field found");
        // Try to find username field (usually type="text" or "email" before password)
        let username = "Unknown User";
        // Use smart detection to find the username/email field
        const usernameField = findUsernameField(form, passwordField);

        if (usernameField && usernameField.value) {
            username = usernameField.value;
            console.log("Username/Email field found:", username);
        } else {
            console.log("Username field NOT found or empty, using default.");
        }

        if (passwordField.value) {
            const credentials = {
                username: username,
                password: passwordField.value,
                url: window.location.href,
                title: document.title
            };

            console.log("Credentials captured, caching for post-login prompt...");
            // Send to background to cache
            chrome.runtime.sendMessage({
                type: 'CACHE_CREDENTIALS',
                data: credentials
            });
        } else {
            console.log("Password field is empty, skipping.");
        }
    } else {
        console.log("No password field in this form");
    }
    } catch (err) {
        console.error('Indo-Vault: Error in captureCredentials:', err);
    }
}

// -------- Autofill (read from vault) --------

function detectLoginForm() {
    try {
        const passwordField = document.querySelector('input[type="password"]');
        if (!passwordField) {
            return null;
        }

        const form = passwordField.closest('form') || document;
        const usernameField = findUsernameField(form, passwordField);

        return { form, usernameField, passwordField };
    } catch (err) {
        console.error('Indo-Vault: Error in detectLoginForm:', err);
        return null;
    }
}

async function requestAutofill() {
    try {
        // Check if user is logged in before attempting autofill
        const loggedIn = await isUserLoggedIn();
        if (!loggedIn) {
            console.log("Indo-Vault: User not logged in, skipping autofill");
            return;
        }
        
        const loginForm = detectLoginForm();
        if (!loginForm) {
            console.log("Indo-Vault: no login form detected for autofill.");
            return;
        }

        const domain = window.location.origin;

        chrome.runtime.sendMessage(
            {
                type: 'REQUEST_AUTOFILL_CREDENTIALS',
                domain
            },
            (response) => {
                try {
                    if (!response || !Array.isArray(response.credentials) || response.credentials.length === 0) {
                        console.log("Indo-Vault: no matching credentials for this domain.");
                        return;
                    }

                    // Show a small in-page prompt asking whether to autofill,
                    // and optionally which credential to use.
                    showAutofillPrompt(loginForm, response.credentials);
                } catch (err) {
                    console.error('Indo-Vault: Error handling autofill response:', err);
                }
            }
        );
    } catch (err) {
        console.error('Indo-Vault: Error in requestAutofill:', err);
    }
}

function autofillForm(loginForm, credential) {
    try {
        const { usernameField, passwordField } = loginForm;

        if (usernameField) {
            usernameField.value = credential.username || '';
            usernameField.dispatchEvent(new Event('input', { bubbles: true }));
            usernameField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (passwordField) {
            passwordField.value = credential.password || '';
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        console.log("Indo-Vault: autofilled login form with stored credentials.");
    } catch (err) {
        console.error('Indo-Vault: Error in autofillForm:', err);
    }
}

// Prompt UI for choosing whether (and which) credential to autofill
function showAutofillPrompt(loginForm, credentials) {
    try {
        // Avoid multiple prompts at once
        if (document.getElementById('indo-vault-autofill-host')) {
            return;
        }

    const host = document.createElement('div');
    host.id = 'indo-vault-autofill-host';
    host.style.position = 'fixed';
    host.style.bottom = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.style.cssText = `
        background: #0f172a;
        color: white;
        padding: 14px 16px;
        border-radius: 8px;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.4), 0 4px 6px -4px rgba(0,0,0,0.4);
        font-family: system-ui, -apple-system, sans-serif;
        min-width: 260px;
        max-width: 320px;
        border: 1px solid #334155;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Autofill from Indo-Vault?';
    title.style.cssText = `
        margin: 0 0 6px 0;
        font-size: 15px;
        font-weight: 600;
    `;

    const text = document.createElement('p');
    text.textContent =
        credentials.length === 1
            ? `We found a saved login for this site.`
            : `We found ${credentials.length} logins for this site.`;
    text.style.cssText = `
        margin: 0 0 10px 0;
        font-size: 13px;
        color: #9ca3af;
    `;

    const selectWrapper = document.createElement('div');
    selectWrapper.style.cssText = `
        margin-bottom: 10px;
    `;

    let selectedIndex = 0;
    if (credentials.length > 1) {
        const select = document.createElement('select');
        select.style.cssText = `
            width: 100%;
            background: #020617;
            color: white;
            border-radius: 4px;
            border: 1px solid #4b5563;
            padding: 6px 8px;
            font-size: 13px;
        `;

        credentials.forEach((c, idx) => {
            const option = document.createElement('option');
            const label = c.username || c.name || 'Account ' + (idx + 1);
            option.value = String(idx);
            option.textContent = label;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            selectedIndex = parseInt(e.target.value, 10) || 0;
        });

        selectWrapper.appendChild(select);
    }

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    `;

    const btnStyle = `
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: background-color 0.15s, color 0.15s, opacity 0.15s;
    `;

    const autofillBtn = document.createElement('button');
    autofillBtn.textContent = 'Autofill';
    autofillBtn.style.cssText = btnStyle + `
        background: #22c55e;
        color: white;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Not now';
    cancelBtn.style.cssText = btnStyle + `
        background: transparent;
        color: #9ca3af;
    `;
    cancelBtn.onmouseover = () => (cancelBtn.style.color = 'white');
    cancelBtn.onmouseout = () => (cancelBtn.style.color = '#9ca3af');

    autofillBtn.onclick = () => {
        const cred = credentials[selectedIndex] || credentials[0];
        autofillForm(loginForm, cred);
        host.remove();
    };

    cancelBtn.onclick = () => {
        host.remove();
    };

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(autofillBtn);

    container.appendChild(title);
    container.appendChild(text);
    if (credentials.length > 1) {
        container.appendChild(selectWrapper);
    }
    container.appendChild(buttonContainer);
    shadow.appendChild(container);
    } catch (err) {
        console.error('Indo-Vault: Error in showAutofillPrompt:', err);
    }
}

/**
 * Smartly detects the username or email field relative to the password field.
 * Priorities:
 * 1. Input with type="email"
 * 2. Input with name/id/placeholder containing 'user', 'login', 'email'
 * 3. Nearest text input before the password field
 */
function findUsernameField(form, passwordField) {
    try {
        const inputs = Array.from(form.querySelectorAll('input'));

        // Filter for visible inputs only
        const visibleInputs = inputs.filter(input => {
            try {
                const style = window.getComputedStyle(input);
                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    input.type !== 'hidden' &&
                    input.type !== 'submit' &&
                    input.type !== 'button';
            } catch (err) {
                // If we can't get computed style, skip this input
                return false;
            }
        });

    const passIndex = visibleInputs.indexOf(passwordField);
    if (passIndex === -1) return null;

    // Search backwards from password field
    const candidates = visibleInputs.slice(0, passIndex).reverse();

    // 1. Check for explicit email type
    const emailInput = candidates.find(input => input.type === 'email');
    if (emailInput) return emailInput;

    // 2. Check for attributes matching keywords
    const keywords = ['user', 'login', 'email', 'id', 'account', 'username'];
    const keywordInput = candidates.find(input => {
        if (input.type !== 'text') return false;
        const attrs = (input.name + ' ' + input.id + ' ' + (input.placeholder || '')).toLowerCase();
        return keywords.some(k => attrs.includes(k));
    });
    if (keywordInput) return keywordInput;

    // 3. Fallback: Nearest text input
    return candidates.find(input => input.type === 'text');
    } catch (err) {
        console.error('Indo-Vault: Error in findUsernameField:', err);
        return null;
    }
}

function showSaveConfirmation(credentials) {
    try {
        // Check if prompt already exists
        if (document.getElementById('indo-vault-shadow-host')) {
            return;
        }

    const host = document.createElement('div');
    host.id = 'indo-vault-shadow-host';
    host.style.position = 'fixed';
    host.style.top = '20px';
    host.style.right = '20px';
    host.style.zIndex = '2147483647'; // Max z-index
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    const container = document.createElement('div');
    container.style.cssText = `
        background: #1e293b;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        font-family: system-ui, -apple-system, sans-serif;
        width: 300px;
        border: 1px solid #334155;
    `;

    const title = document.createElement('h3');
    title.textContent = 'Save to Indo-Vault?';
    title.style.cssText = `
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
    `;

    const text = document.createElement('p');
    text.textContent = `Do you want to save the password for ${credentials.username}?`;
    text.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #94a3b8;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: flex-end;
    `;

    const btnStyle = `
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: opacity 0.2s;
    `;

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText = btnStyle + `
        background: #3b82f6;
        color: white;
    `;

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Never';
    cancelBtn.style.cssText = btnStyle + `
        background: transparent;
        color: #94a3b8;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.color = 'white';
    cancelBtn.onmouseout = () => cancelBtn.style.color = '#94a3b8';

    saveBtn.onclick = () => {
        chrome.runtime.sendMessage({
            type: 'SAVE_CREDENTIALS',
            data: credentials
        });
        host.remove();
    };

    cancelBtn.onclick = () => {
        chrome.runtime.sendMessage({
            type: 'DISCARD_CREDENTIALS'
        });
        host.remove();
    };

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);
    container.appendChild(title);
    container.appendChild(text);
    container.appendChild(buttonContainer);
    shadow.appendChild(container);

    // Protect against DOM removal (e.g. SPA hydration)
    const observer = new MutationObserver((mutations) => {
        if (!document.getElementById('indo-vault-shadow-host')) {
            console.log("Popup removed by page, re-injecting...");
            document.body.appendChild(host);
        }
    });

    observer.observe(document.body, { childList: true });

    // Cleanup observer when host is properly removed by us
    const originalRemove = host.remove.bind(host);
    host.remove = () => {
        observer.disconnect();
        originalRemove();
    };
    } catch (err) {
        console.error('Indo-Vault: Error in showSaveConfirmation:', err);
    }
}

// Check for pending credentials on load (only if user is logged in)
async function checkForPendingCredentials() {
    try {
        const loggedIn = await isUserLoggedIn();
        if (!loggedIn) {
            console.log("Indo-Vault: User not logged in, skipping pending credentials check");
            return;
        }
        
        chrome.runtime.sendMessage({ type: 'CHECK_PENDING' }, (response) => {
            try {
                if (response && response.credentials) {
                    console.log("Found pending credentials, showing prompt...");
                    showSaveConfirmation(response.credentials);
                }
            } catch (err) {
                console.error('Indo-Vault: Error handling pending credentials:', err);
            }
        });
    } catch (err) {
        console.error('Indo-Vault: Error in checkForPendingCredentials:', err);
    }
}

// Initialize: Run checks on load
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkForPendingCredentials();
            requestAutofill();
        });
    } else {
        checkForPendingCredentials();
        requestAutofill();
    }
} catch (err) {
    console.error('Indo-Vault: Error during initialization:', err);
}

// Handle SPA navigations (URL changes)
let lastUrl = location.href;
try {
    new MutationObserver(() => {
        try {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                console.log("URL changed (SPA), checking for pending credentials and autofill...");
                checkForPendingCredentials();
                requestAutofill();
            }
        } catch (err) {
            console.error('Indo-Vault: Error in MutationObserver:', err);
        }
    }).observe(document, { subtree: true, childList: true });
} catch (err) {
    console.error('Indo-Vault: Error setting up MutationObserver:', err);
}

// Also poll just in case
try {
    setInterval(() => {
        try {
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                console.log("URL changed (detected via poll), checking...");
                checkForPendingCredentials();
                requestAutofill();
            }
        } catch (err) {
            console.error('Indo-Vault: Error in URL poll:', err);
        }
    }, 1000);
} catch (err) {
    console.error('Indo-Vault: Error setting up URL poll:', err);
}

// Listen for form submissions
try {
    document.addEventListener('submit', (e) => {
        try {
            console.log("Form submission detected via 'submit' event", e.target);
            captureCredentials(e.target);
        } catch (err) {
            console.error('Indo-Vault: Error handling form submit:', err);
        }
    }, true); // Use capture phase to catch events before they might be stopped
} catch (err) {
    console.error('Indo-Vault: Error setting up submit listener:', err);
}

// Fallback: Listen for clicks on ANY button-like element
try {
    document.addEventListener('click', (e) => {
        try {
            const target = e.target;
            const isButton = target.tagName === 'BUTTON' ||
                (target.tagName === 'INPUT' && ['submit', 'button'].includes(target.type)) ||
                target.getAttribute('role') === 'button' ||
                target.classList.contains('btn') || // Common class name
                target.classList.contains('button');

            if (isButton) {
                console.log("Button-like element clicked:", target);

                // 1. Try to find parent form
                const form = target.closest('form');
                if (form) {
                    console.log("Found parent form, capturing...");
                    setTimeout(() => captureCredentials(form), 100);
                    return;
                }

                // 2. If no form, look for any password field in the document
                console.log("No parent form found. Searching document for password fields...");
                const passwordFields = document.querySelectorAll('input[type="password"]');

                if (passwordFields.length > 0) {
                    // Use the first visible password field
                    for (const pf of passwordFields) {
                        if (pf.offsetParent !== null && pf.value) { // Check visibility and value
                            console.log("Found visible password field with value. Capturing from document context.");
                            setTimeout(() => captureCredentials(document.body), 100);
                            return;
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Indo-Vault: Error handling click:', err);
        }
    }, true);
} catch (err) {
    console.error('Indo-Vault: Error setting up click listener:', err);
}

})(); // End IIFE
