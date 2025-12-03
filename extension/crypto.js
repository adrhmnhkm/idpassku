// Crypto utilities for Indo-Vault Extension
//
// NOTE:
// - This MVP uses PBKDF2 + AES-GCM.
// - Long term, this should be aligned with docs/CRYPTO.md (Argon2id + AES-256-GCM)
//   so that web frontend and extension share the same crypto spec.
//
// Derive AES-256-GCM key from master password using PBKDF2
async function deriveKey(masterPassword, salt = null) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);

  // If no salt provided, generate one (for new key derivation)
  // For this MVP, we are not storing the salt per user in the DB for the client-side key.
  // In a real app, the salt should be consistent or stored.
  // For now, to ensure the SAME key is generated every time (deterministic),
  // we will use a static salt or the user's email as salt (better than nothing, but not ideal).
  // Ideally: Fetch user's salt from backend.
  // WARNING: FIXED SALT IS NOT SECURE FOR PRODUCTION.
  const fixedSalt = new Uint8Array([
    1, 2, 3, 4, 5, 6, 7, 8,
    9, 10, 11, 12, 13, 14, 15, 16
  ]);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fixedSalt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // Exportable
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext using AES-GCM
async function encryptPassword(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    plaintextBuffer
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.length);

  // Convert to Base64
  return arrayBufferToBase64(combined);
}

// Decrypt ciphertext produced by encryptPassword (Base64(iv + ciphertext))
async function decryptPassword(ciphertextBase64, key) {
  const combined = base64ToArrayBuffer(ciphertextBase64);

  // First 12 bytes = IV
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  let binary = "";
  const len = buffer.byteLength;
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Export key to JWK for storage
async function exportKey(key) {
  return await crypto.subtle.exportKey("jwk", key);
}

// Import key from JWK
async function importKey(jwk) {
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}


