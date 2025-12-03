# Backend indo-vault

Tech: Node.js + Express + TypeScript + Prisma + PostgreSQL

## Auth
- Register → bcrypt/argon2 hash login password
- Login → JWT access + refresh
- Refresh token → hashed & disimpan di DB
- Logout → revoke refresh
- /auth/me → cek token

## Vault
- /vault/items → GET/POST/PUT/DELETE
- Backend TIDAK pernah memproses plaintext password
- Hanya terima ciphertext dari frontend
- versi (optimistic locking) disiapkan

## Development command
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
