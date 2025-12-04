/**
 * Client-Side Encryption using AES-256-GCM
 * Zero-knowledge architecture - server never sees plaintext passwords
 */

// Session-based encryption key manager (non-persistent)
class EncryptionKeyManager {
    private key: CryptoKey | null = null;
    private salt: Uint8Array | null = null;

    async deriveKey(masterPassword: string): Promise<void> {
        // FIXED SALT for MVP consistency.
        // In production, this should be unique per user and stored in the DB.
        // Using the same fixed salt as the extension.
        this.salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);

        // Convert password to key material
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(masterPassword);

        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            passwordBuffer,
            "PBKDF2",
            false,
            ["deriveBits", "deriveKey"]
        );

        // Derive AES-256 key using PBKDF2
        // Note: Backend uses Argon2id, but WebCrypto doesn't support it
        // PBKDF2 is used as an alternative for client-side encryption
        this.key = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: this.salt as BufferSource,
                iterations: 100000, // High iteration count for security
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true, // Make key exportable so we can store it
            ["encrypt", "decrypt"]
        );

        // Store key in sessionStorage (will be cleared when tab closes)
        const exportedKey = await crypto.subtle.exportKey("jwk", this.key);
        sessionStorage.setItem("vault-encryption-key", JSON.stringify(exportedKey));
        console.log("Encryption key derived and stored in session");
    }

    async loadKeyFromSession(): Promise<boolean> {
        const storedKey = sessionStorage.getItem("vault-encryption-key");
        if (!storedKey) {
            return false;
        }

        try {
            const keyData = JSON.parse(storedKey);
            this.key = await crypto.subtle.importKey(
                "jwk",
                keyData,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            console.log("Encryption key loaded from session");
            return true;
        } catch (error) {
            console.error("Failed to load key from session:", error);
            sessionStorage.removeItem("vault-encryption-key");
            return false;
        }
    }

    getKey(): CryptoKey | null {
        return this.key;
    }

    hasKey(): boolean {
        return this.key !== null;
    }

    clearKey(): void {
        this.key = null;
        this.salt = null;
        sessionStorage.removeItem("vault-encryption-key");
        console.log("Encryption key cleared");
    }
}

// Singleton instance
export const keyManager = new EncryptionKeyManager();

/**
 * Encrypt plaintext password using AES-256-GCM
 * @param plaintext - The password to encrypt
 * @param key - The CryptoKey to use for encryption
 * @returns Base64 encoded string: IV + ciphertext + authTag
 */
export async function encryptPassword(
    plaintext: string,
    key: CryptoKey
): Promise<string> {
    // Generate random 12-byte IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert plaintext to buffer
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // Encrypt using AES-GCM
    const ciphertextBuffer = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        plaintextBuffer
    );

    // Combine IV + ciphertext (ciphertext already includes auth tag from GCM)
    const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertextBuffer), iv.length);

    // Convert to Base64
    return arrayBufferToBase64(combined);
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param ciphertext - Base64 encoded string: IV + ciphertext + authTag
 * @param key - The CryptoKey to use for decryption
 * @returns Decrypted plaintext password
 */
export async function decryptPassword(
    ciphertext: string,
    key: CryptoKey
): Promise<string> {
    // Decode from Base64
    const combined = base64ToArrayBuffer(ciphertext);

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12);
    const ciphertextBuffer = combined.slice(12);

    if (combined.byteLength < 12) {
        throw new Error("Ciphertext too short (less than 12 bytes)");
    }

    // Decrypt using AES-GCM
    const plaintextBuffer = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        ciphertextBuffer
    );

    // Convert buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
}

/**
 * Helper: Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

/**
 * Helper: Convert Base64 string to Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encrypt vault item data
 * - password, note, and optional url are stored inside ciphertext
 * - name and username remain plaintext metadata in DB
 * Returns a JSON string that will be encrypted as ciphertext
 */
export function createVaultItemPayload(
    password: string,
    note: string,
    url?: string
): string {
    return JSON.stringify({
        password,
        note,
        url: url || "",
    });
}

/**
 * Parse decrypted vault item payload
 */
export function parseVaultItemPayload(decrypted: string): {
    password: string;
    note: string;
    url?: string;
} {
    try {
        const parsed = JSON.parse(decrypted);
        return {
            password: parsed.password || "",
            note: parsed.note || "",
            url: parsed.url || "",
        };
    } catch {
        // Fallback for old format (just password)
        return {
            password: decrypted,
            note: "",
            url: "",
        };
    }
}
