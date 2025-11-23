<p align="center">
  <img src="https://img.shields.io/github/stars/fjrmhri/Program-CRS?style=for-the-badge&logo=github&color=8b5cf6" alt="Stars"/>
  <img src="https://img.shields.io/github/license/fjrmhri/Program-CRS?style=for-the-badge&color=10b981" alt="License"/>
  <img src="https://img.shields.io/badge/React-18.3.1-61dafb?style=for-the-badge&logo=react&logoColor=000" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-7.0.4-646cff?style=for-the-badge&logo=vite&logoColor=fff" alt="Vite"/>
  <img src="https://img.shields.io/badge/Firebase-12.0.0-FFCA28?style=for-the-badge&logo=firebase" alt="Firebase"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4.17-38bdf8?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS"/>
</p>

# Program Corporate Social Responsibility Dashboard

Dasbor admin responsif untuk memantau program Corporate Social Responsibility (CSR) di Estate Cerenti. Aplikasi ini memusatkan analitik Pre-Post Test, pengelolaan MSE offline, serta pengaturan administrator dalam satu pengalaman berbasis Firebase.

## Fitur Utama
- **Autentikasi aman** dengan nomor telepon menggunakan Firebase Authentication & Firestore.
- **Analitik Pre-Post Test** untuk unggah Excel/CSV, melihat statistik otomatis, grafik, serta ekspor peringkat peserta.
- **Manajemen MSE offline** guna meninjau entri monitoring, membandingkan rentang waktu, dan membuka detail modal.
- **Pengaturan admin** meliputi pembaruan profil, rotasi sandi, dan penelusuran log aktivitas di Realtime Database.
- **Pencatatan aktivitas** di Firestore untuk setiap aksi penting (unggah, edit, hapus) sebagai audit trail.
- **Antarmuka responsif** dengan Tailwind CSS dan tipografi Poppins yang nyaman di desktop maupun mobile.

## Cara Instalasi & Menjalankan
1. **Klon repositori & masuk ke folder proyek**
   ```bash
   git clone <URL_REPO>
   cd Program-CRS
   ```
2. **Pasang dependensi**
   ```bash
   npm install
   ```
3. **Jalankan server pengembangan**
   ```bash
   npm run dev
   ```
   Vite akan menampilkan URL lokal (default `http://localhost:5173`).
4. **Opsi pengecekan kode**
   ```bash
   npm run lint
   ```
5. **Bangun versi produksi**
   ```bash
   npm run build
   ```

## Konfigurasi Lingkungan
Buat berkas `.env` di akar proyek (sejajar dengan `package.json`) dan isi dengan kredensial Firebase Anda:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Struktur Proyek
```
src/
├─ components/
│  ├─ auth/              # Form login & signup
│  ├─ mse/               # Dashboard & modal MSE offline
│  ├─ preposttest/       # Dashboard, grafik, dan modal Pre/Post Test
│  ├─ setting/           # Layar konfigurasi admin
│  └─ SettingModal.jsx   # Modal pengaturan cepat
├─ utils/                # Utilitas parsing Excel & pencatatan log
├─ firebase.js           # Inisialisasi klien Firebase
├─ App.jsx               # Kerangka aplikasi & navigasi menu
└─ main.jsx              # Entrypoint React
```

## Lisensi
Proyek ini digunakan internal oleh tim CSR Estate Cerenti. Hubungi maintainer bila memerlukan izin penggunaan lebih lanjut.
