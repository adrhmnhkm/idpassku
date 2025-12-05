# Setup Routing & Environment Variables

## 🎯 Prinsip Routing

**Routing di Next.js sudah konsisten antara dev dan production!** Semua routing menggunakan **relative paths** yang otomatis menyesuaikan dengan domain.

### ✅ Yang Sudah Benar:
- Semua internal routing menggunakan `next/link` dengan relative paths (`/dashboard`, `/login`, dll)
- API calls menggunakan environment variable `NEXT_PUBLIC_API_URL`
- Tidak ada hardcoded domain atau absolute URLs untuk routing internal

## 📝 Setup Environment Variables

### Development (Local)
Buat file `.env.local` di folder `frontend/`:

```bash
# Development - Backend running di localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Production
Buat file `.env.production` atau set di server:

```bash
# Production - Backend di api.idpassku.com
NEXT_PUBLIC_API_URL=https://api.idpassku.com
```

## 🚀 Cara Menggunakan

### Opsi 1: Menggunakan File .env.local (Recommended)

**Development:**
```bash
# 1. Copy .env.local.example ke .env.local
cp .env.local.example .env.local

# 2. Pastikan .env.local berisi:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# 3. Jalankan
pnpm dev
```

**Production:**
```bash
# 1. Set environment variable di server atau buat .env.production
# NEXT_PUBLIC_API_URL=https://api.idpassku.com

# 2. Build & Start
pnpm build
pnpm start
```

### Opsi 2: Menggunakan Script dengan Inline Env (Quick Switch)

**Development dengan localhost:**
```bash
pnpm dev:local
```

**Development dengan production API (untuk testing):**
```bash
pnpm dev:prod
```

**Build untuk production:**
```bash
pnpm build:prod
```

### ⚡ Quick Start

```bash
# Development (paling mudah)
cp .env.local.example .env.local
pnpm dev

# Atau langsung pakai script
pnpm dev:local
```

## 📋 Checklist

- [x] Routing menggunakan relative paths (sudah benar)
- [x] API URL menggunakan environment variable (sudah benar)
- [ ] Buat `.env.local` untuk development
- [ ] Set `NEXT_PUBLIC_API_URL` di production server

## ⚠️ Catatan Penting

1. **Routing tidak perlu diubah** - Next.js otomatis handle relative paths (`/dashboard`, `/login`, dll)
2. **Hanya API URL yang perlu diset** - lewat environment variable `NEXT_PUBLIC_API_URL`
3. **File `.env.local` tidak di-commit** - sudah ada di `.gitignore`
4. **Production** - set environment variable di server atau gunakan `.env.production`
5. **Semua routing internal sudah konsisten** - tidak ada perbedaan antara dev dan production

## 🔍 Verifikasi

Untuk cek environment variable yang aktif:
```bash
# Di browser console (setelah app running)
console.log(process.env.NEXT_PUBLIC_API_URL)
```

