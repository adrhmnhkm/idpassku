# TODO — granular checklist

## 🔥 Prioritas tinggi (minggu ini)
[ ] Buat project Next.js (web/)
[ ] Buat halaman Register
[ ] Buat halaman Login → store token ke localStorage
[ ] Fetch /auth/me setelah login
[ ] Tampilkan daftar vault item
[ ] Form tambah item → hasil enkripsi ciphertext
[ ] Kirim ciphertext ke backend

## 🔐 Encryption tasks
[ ] KDF Argon2 → derive key dari master password
[ ] Generate AES-GCM IV
[ ] Encrypt JSON → ciphertext Base64
[ ] Decrypt ciphertext → JSON
[ ] Cache master key di memori (bukan localStorage)

## 🎨 UI
[ ] Layout dashboard
[ ] Password strength bar
[ ] Password generator modal

## 🧪 Testing
[ ] Tambah 5–10 item vault
[ ] Restart browser → login ulang → data harus tampil normal
