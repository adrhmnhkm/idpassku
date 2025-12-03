# Resume Fitur Indo-Vault

Berikut adalah ringkasan fitur yang telah berfungsi dengan baik dalam proyek Indo-Vault:

## 🛡️ Keamanan (Security)
- **Enkripsi Client-Side (End-to-End Encryption)**:
  - Menggunakan algoritma **AES-256-GCM** untuk mengenkripsi data vault sebelum dikirim ke server.
  - **Zero-Knowledge Architecture**: Server tidak pernah mengetahui password master atau data vault dalam bentuk plaintext.
  - Derivasi kunci menggunakan **PBKDF2** dengan salt dan iterasi tinggi (100.000 iterasi).
  - Kunci enkripsi hanya disimpan di memori (Session Storage) dan hilang saat tab ditutup.
- **Two-Factor Authentication (2FA)**:
  - Dukungan untuk setup dan verifikasi 2FA (TOTP) untuk keamanan tambahan akun.
- **Secure Clipboard**:
  - Fitur "Copy to Clipboard" yang otomatis menghapus data dari clipboard setelah 30 detik untuk mencegah kebocoran data.
- **Password Generator**:
  - Alat pembuat password kuat yang terintegrasi langsung di dashboard.

## 🔐 Otentikasi & Akun
- **Sistem Login & Register**:
  - Pendaftaran akun baru dan login aman menggunakan JWT (Access Token & Refresh Token).
- **Manajemen Akun**:
  - **Verifikasi Email**: Endpoint dan UI untuk memverifikasi email pengguna.
  - **Reset Password**: Alur "Forgot Password" dan "Reset Password" yang lengkap.
  - Logout aman dengan pencabutan token.

## 📦 Manajemen Vault
- **CRUD Vault Items**:
  - **Create**: Menambah item baru (password, username, catatan) yang otomatis terenkripsi.
  - **Read**: Melihat daftar item di dashboard dan detail item yang didekripsi secara lokal.
  - **Update**: Mengubah data item vault.
  - **Delete**: Menghapus item vault.
- **Dashboard Interaktif**:
  - Menampilkan statistik total password dan skor keamanan (Security Score).
  - Daftar item yang baru diakses (Recent Items).
  - Pencarian dan filter item (UI ready).

## 💻 Teknologi & Arsitektur
- **Frontend**:
  - Dibangun dengan **Next.js 16** (App Router) dan **React 19**.
  - Styling modern menggunakan **Tailwind CSS** dan komponen **Radix UI**.
  - State management menggunakan **Zustand**.
  - Form handling dengan **React Hook Form** dan validasi **Zod**.
- **Backend**:
  - REST API menggunakan **Express** dan **TypeScript**.
  - Database PostgreSQL dengan ORM **Prisma**.
  - Struktur modular (Auth, Vault) yang mudah dikembangkan.
- **Ekstensi Browser**:
  - Kerangka dasar ekstensi browser sudah tersedia (manifest, popup).

## 🚀 Status Pengembangan
- **Backend**: ✅ Stabil (Auth, 2FA, Vault CRUD, Email).
- **Frontend**: ✅ Fungsional (Auth Flow, Dashboard, Encryption/Decryption, Vault Operations).
- **Integrasi**: ✅ Frontend dan Backend terhubung dengan baik menggunakan Axios interceptors untuk penanganan token.
