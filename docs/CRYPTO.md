# Specifications — Encryption

Goal: Zero knowledge

## KDF (key derivation)
- Argon2id
- parameter:
  memory: 65536
  iterations: 3
  parallelism: 1

## Encryption
Algorithm: AES-256-GCM
Key size: 256 bit
IV: 12 bytes random
Output format (Base64):
Base64( iv + ciphertext + authTag )

## Reset password
Reset password = menghapus vault seluruhnya.
Server tidak bisa memulihkan vault yang terenkripsi.

## No sensitive logs
- plaintext password
- URL
- username
- note
Tidak boleh masuk log / DB.
