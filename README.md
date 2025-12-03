# indo-vault (backend starter)

Ini adalah backend starter untuk proyek password manager gaya Bitwarden versi Indonesia.

## Struktur

- `backend/` - API (Express + TypeScript + Prisma)
- `infra/docker-compose.yml` - Postgres + backend

## Cara jalanin (development lokal)

1. Masuk folder backend dan install dependency:

```bash
cd backend
npm install
```

2. Copy `.env.example` jadi `.env` dan kalau perlu sesuaikan.

3. Jalankan Postgres (bisa via Docker atau lokal sendiri).

4. Generate client & migrate schema:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. Jalankan server dev:

```bash
npm run dev
```

Backend akan listen di `http://localhost:5000`.

## Endpoint utama

- `POST /auth/register` - register user baru
- `POST /auth/login` - login, dapat accessToken + refreshToken
- `POST /auth/refresh` - refresh access token
- `POST /auth/logout` - revoke refresh token
- `GET /auth/me` - info user (butuh Bearer token)

- `GET /vault/items` - list item vault (ciphertext)
- `POST /vault/items` - buat item vault baru
- `PUT /vault/items/:id` - update item
- `DELETE /vault/items/:id` - hapus item

> Catatan: field `ciphertext` diasumsikan sudah terenkripsi di sisi client.
