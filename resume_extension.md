# Resume Fitur Indo-Vault Extension

Berikut adalah ringkasan fitur yang telah berfungsi dengan baik di versi Browser Extension:

## 🛡️ Keamanan & Enkripsi
- **Enkripsi Client-Side Otomatis**:
  - Extension melakukan enkripsi password **sebelum** dikirim ke server.
  - Menggunakan algoritma **AES-256-GCM** (standar industri).
  - Kunci enkripsi diturunkan (derived) dari password master pengguna menggunakan **PBKDF2** (100.000 iterasi).
  - Kunci tersimpan aman di `chrome.storage.local` dalam format JWK.
- **Otentikasi Aman**:
  - Login menggunakan email dan password master.
  - Dukungan penuh untuk **Two-Factor Authentication (2FA)**. Jika akun mengaktifkan 2FA, extension akan meminta kode verifikasi 6 digit.
  - Token sesi (JWT) disimpan secara lokal untuk menjaga status login.

## 🕵️‍♂️ Fitur Utama (Auto-Capture)
- **Deteksi Login Otomatis**:
  - Script konten (`content.js`) berjalan di semua halaman web.
  - Mendeteksi saat pengguna mengirimkan formulir login (`submit` event).
  - Mekanisme fallback cerdas: Mendeteksi klik pada tombol login jika form submit standar tidak terdeteksi (misal pada aplikasi Single Page Application / AJAX).
- **Pengambilan Kredensial Cerdas**:
  - Otomatis mengidentifikasi kolom password.
  - **Deteksi Cerdas Username/Email**: Menggunakan algoritma prioritas untuk menemukan kolom yang tepat (tipe email > atribut keyword > posisi).
  - Mendukung berbagai variasi form login (username atau email).
  - Mengambil URL halaman dan judul website sebagai metadata.
- **Penyimpanan ke Vault**:
  - **Konfirmasi Pengguna**: Menampilkan popup konfirmasi ("Save to Indo-Vault?") sebelum menyimpan data.
  - Kredensial yang tertangkap (username & password) otomatis dienkripsi di background process setelah user menyetujui.
  - Data terenkripsi (ciphertext) dikirim ke backend API (`/vault/items`) untuk disimpan secara permanen.

## 🧩 Antarmuka Pengguna (Popup UI)
- **Status Login Real-time**:
  - Menampilkan form login jika belum masuk.
  - Menampilkan form input kode 2FA jika diperlukan.
  - Menampilkan status "Logged in as [email]" jika sudah terotentikasi.
- **Feedback Visual**:
  - Indikator status (sukses/gagal) untuk aksi login dan verifikasi.
  - Tombol Logout untuk mengakhiri sesi dan menghapus kunci enkripsi dari memori lokal.

## ⚙️ Arsitektur Teknis
- **Manifest V3**: Menggunakan standar ekstensi Chrome terbaru (Service Workers).
- **Background Service Worker**: Menangani logika enkripsi dan komunikasi API secara terpusat, terpisah dari konten halaman web.
- **Content Scripts**: Ringan dan hanya bertugas mendeteksi input pengguna tanpa membebani performa browsing.
