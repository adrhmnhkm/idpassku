# Development Setup untuk Domain Routing

 aplikasi ini menggunakan multi-domain routing:

 - **Main Domain (idpassku.com/localhost)**: Landing page, login, register
 - **Vault Domain (vault.idpassku.com/vault.localhost)**: Dashboard aplikasi vault

## Cara Menjalankan untuk Development

### 1. Start Backend Server
```bash
cd backend
npm run dev
# atau
pnpm dev
```

### 2. Start Frontend untuk Main Domain (idpassku.com/localhost)
```bash
cd frontend
npm run dev:local
# atau
pnpm dev:local
```
Server berjalan di: http://localhost:3000

### 3. Start Frontend untuk Vault Domain (vault.localhost)
Buka terminal baru:
```bash
cd frontend
PORT=3001 npm run dev:local
# atau
PORT=3001 pnpm dev:local
```
Server berjalan di: http://vault.localhost:3001

### Konfigurasi Hosts (Opsional)

Tambahkan ke `/etc/hosts` (Linux/Mac) atau `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 idpassku.com
127.0.0.1 vault.idpassku.com
127.0.0.1 vault.localhost
```

## Alur Login

1. User membuka **http://localhost:3000** (landing page)
2. Klik "Login" atau "Register" → **http://localhost:3000/login** atau **http://localhost:3000/register**
3. Setelah login berhasil, user akan di-redirect ke **http://vault.localhost:3001/dashboard**

## Testing Routes

### Main Domain Routes (localhost:3000)
- `/` - Landing page
- `/login` - Login page
- `/register` - Register page
- `/forgot-password` - Lupa password
- `/reset-password` - Reset password
- `/verify-email` - Verifikasi email

### Vault Domain Routes (vault.localhost:3001)
- `/dashboard` - Dashboard vault
- `/dashboard/items` - Daftar items

## Middleware Rules

Middleware akan otomatis:
- Redirect user dari vault domain ke main domain untuk login/register
- Redirect user dari main domain ke vault domain untuk dashboard
- Mencegah akses protected routes di main domain
- Mencegah akses public routes di vault domain

## Troubleshooting

### Login tidak berfungsi
1. Pastikan backend berjalan di port 5000
2. Cek console browser untuk error
3. Pastikan mengakses via domain yang benar (localhost untuk development)

### Redirect tidak berfungsi
1. Pastikan middleware.ts sudah dikonfigurasi dengan benar
2. Restart development server setelah mengubah middleware
3. Cek hostname di browser console: `console.log(window.location.hostname)`

### Cross-origin issues
1. Pastikan API URL di environment variables benar
2. Gunakan `npm run dev:local` untuk development
3. Pastikan backend CORSAllow localhost dan vault.localhost
