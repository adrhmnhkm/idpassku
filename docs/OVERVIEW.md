# indo-vault — Overview

indo-vault adalah aplikasi password manager gaya Bitwarden / 1Password,
dengan pendekatan lokal (Bahasa Indonesia, support lokal, deployment mudah).

## Visi
Menyediakan password manager yang aman, mudah digunakan, dan dapat di-hosting sendiri oleh pengguna maupun organisasi di Indonesia.

## Prinsip utama
- Zero-knowledge — server tidak tahu master password maupun plaintext vault
- Enkripsi dilakukan 100% di sisi client
- Multi-device via sinkronisasi ciphertext
- Kode backend open source untuk transparansi

## Current status
Backend: DONE (auth + JWT + vault CRUD)
Frontend: NOT STARTED
Encryption UI: NOT STARTED

## Next milestone
Membangun frontend + enkripsi client side + dashboard vault.
