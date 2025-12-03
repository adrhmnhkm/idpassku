# Frontend indo-vault

Tech: Next.js + TypeScript + Tailwind

## Pages
/pages/login
/pages/register
/pages/vault (dashboard)
/pages/vault/[id] (edit)

## State
- accessToken disimpan di localStorage
- user info via /auth/me

## Crypto
Lokasi file:
`web/src/lib/crypto/`

Fungsi:
- deriveKey(password, salt)
- encryptVaultItem(json)
- decryptVaultItem(ciphertext)

Master key hanya disimpan di memori (state), bukan localStorage.

## User flow
1. User login → deriveKey dari master password
2. Fetch daftar item (ciphertext)
3. Decrypt satu-per-satu sebelum ditampilkan
4. User buat / edit item → encrypt → upload ciphertext
