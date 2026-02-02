# Panduan Deployment: Github, Railway & Vercel

Panduan ini akan membantu Anda mengupload source code ke GitHub, kemudian mendeploy Backend ke Railway dan Frontend ke Vercel.

## 1. Upload ke GitHub

### Langkah 1: Inisialisasi Git
Buka terminal di root folder aplikasi (`d:\Downloads\Laundry V1.5`) dan jalankan perintah berikut satu per satu:

```bash
git init
git add .
git commit -m "Initial commit - Sistem Laundry Lengkap"
```

### Langkah 2: Buat Repositori di GitHub
1. Buka [GitHub.com](https://github.com) dan login.
2. Klik tombol **+** di pojok kanan atas -> **New repository**.
3. Beri nama (misal: `sistem-laundry-v1`).
4. Pilih **Public** atau **Private**.
5. Klik **Create repository**.

### Langkah 3: Push ke GitHub
Salin perintah yang muncul di halaman GitHub (baigan "…or push an existing repository from the command line"), contohnya:

```bash
git remote add origin https://github.com/USERNAME_ANDA/sistem-laundry-v1.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy Backend ke Railway

### Langkah 4: Setup Project Railway
1. Buka [Railway.app](https://railway.app) dan login dengan GitHub.
2. Klik **+ New Project** -> **Deploy from GitHub repo**.
3. Pilih repositori `sistem-laundry-v1` Anda.
4. Klik **Deploy Now**.

### Langkah 5: Konfigurasi Backend
Railway mungkin akan mendeteksi project sebagai monorepo. Kita perlu mengatur agar ia hanya men-deploy folder `backend`.

1. Klik pada card project yang baru dibuat.
2. Masuk ke **Settings**.
3. Cari **Root Directory** dan ubah menjadi `backend`.
4. Railway akan redeploy otomatis.

### Langkah 6: Tambahkan Database PostgreSQL
1. Di dashboard project Railway Anda, klik tombol **New** (atau klik kanan di canvas).
2. Pilih **Database** -> **PostgreSQL**.
3. Tunggu hingga database dibuat.

### Langkah 7: Hubungkan Database & Environment Variables
1. Klik pada service **PostgreSQL** -> tab **Variables**.
2. Copy `DATABASE_URL`.
3. Klik pada service **sistem-laundry-v1** (Backend Anda) -> tab **Variables**.
4. Tambahkan variable berikut (sesuaikan dengan `.env` di komputer Anda tapi gunakan nilai produksi):
   - `DATABASE_URL`: (Paste URL dari PostgreSQL Railway tadi)
   - `DIRECT_URL`: (Paste URL yang sama)
   - `JWT_SECRET`: (Isi dengan text acak yang panjang dan aman)
   - `PORT`: `8080` (Railway menggunakan port dinamis, tapi 8080 aman sebagai default)

### Langkah 8: Run Migration & Seed
Karena kita butuh table database dan akun default:
1. Di service Backend, buka tab **Build** -> **Build Command**.
2. Ubah menjadi: `npm install && npx prisma db push && node prisma/seed.js`
   *(Ini akan membuat tabel dan akun owner/kasir setiap kali deploy, pastikan seed.js aman dijalankan berulang)*

3. Backend akan restart. Setelah sukses, copy **Public Domain** (URL) dari service backend (misal: `https://laundry-backend-production.up.railway.app`).

---

## 3. Deploy Frontend ke Vercel

### Langkah 9: Setup Vercel
1. Buka [Vercel.com](https://vercel.com) dan login GitHub.
2. Klik **Add New...** -> **Project**.
3. Import repositori `sistem-laundry-v1`.

### Langkah 10: Konfigurasi Frontend
1. Di bagian **Root Directory**, klik **Edit** dan pilih folder `frontend`.
2. Buka bagian **Environment Variables**.
3. Tambahkan variable:
   - `NEXT_PUBLIC_API_URL`: Isi dengan URL Backend Railway Anda (contoh: `https://laundry-backend-production.up.railway.app/api`).
     *(PENTING: Jangan lupa tambah `/api` di ujungnya jika routing backend Anda menggunakan prefix `/api`)*

### Langkah 11: Deploy
1. Klik **Deploy**.
2. Tunggu proses build selesai.

---

## 🎉 Selesai!

Sistem Anda sekarang online:
- **Backend**: Di URL Railway (untuk API).
- **Frontend**: Di URL Vercel (untuk diakses pengguna).

**Akun Login:**
- Owner: `owner` / `owner123`
- Kasir: `kasir` / `kasir123`
