# 🧺 Laundry Management System (Sistem Informasi Manajemen Laundry)

**Professional Web-Based POS & Management System for Laundry Businesses**
_(Sistem Kasir & Manajemen Berbasis Web untuk Bisnis Laundry)_

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg) ![React](https://img.shields.io/badge/react-18-blue.svg)

---

## 🚀 Deployment Guide (Panduan Deployment)

Panduan lengkap cara deploy aplikasi ini ke **Railway (Backend)** dan **Vercel (Frontend)**.

### 1. Persiapan (GitHub)

Pastikan kode Anda sudah ada di GitHub repository. Jika belum:

```bash
git init
git add .
git commit -m "Initial commit"
# Buat repositori baru di GitHub.com
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

### 2. Deploy Backend (Railway)

Kami menggunakan Railway untuk hosting Backend (Express) dan Database (PostgreSQL) karena mendukung Docker/Node.js dengan mudah.

1. Buka [Railway.app](https://railway.app/) dan login dengan GitHub.
2. Klik **New Project** -> **Deploy from GitHub repo** -> Pilih repo Anda.
3. Klik **Deploy Now**.
4. **PENTING: Konfigurasi Project**
   - Masuk ke **Settings** project Railway Anda.
   - Ubah **Root Directory** menjadi `backend`.
   - Railway akan redeploy otomatis.

#### Konfigurasi Database & Environment

1. Di Dashboard Railway, klik tombol **New** -> **Database** -> **PostgreSQL**.
2. Setelah jadi, buka tab **Variables** di PostgreSQL dan copy `DATABASE_URL`.
3. Buka layanan **Backend** Anda -> tab **Variables**, tambahkan:
   - `DATABASE_URL`: (Paste URL PostgreSQL)
   - `DIRECT_URL`: (Paste URL yang sama)
   - `JWT_SECRET`: (Isi text acak yang panjang)
   - `PORT`: `8080` (Opsional)

#### Konfigurasi Command (PENTING!)

Agar database otomatis dimigrasi saat deploy, ubah **Start Command** di Settings Backend:

- **Build Command**: `npm install`
- **Start Command**: `npm run start:prod`
  _(Script `start:prod` ini akan menjalankan `prisma db push` dan `seed.js` setiap kali server restart)_

---

### 3. Deploy Frontend (Vercel)

1. Buka [Vercel.com](https://vercel.com/) dan login GitHub.
2. Klik **Add New...** -> **Project** -> Import repo Anda.
3. **Konfigurasi Project**:
   - **Root Directory**: Klik Edit -> Pilih folder `frontend`.
   - **Environment Variables**:
     - `NEXT_PUBLIC_API_URL`: Isi dengan URL Backend Railway Anda (contoh: `https://laundry-backend.up.railway.app/api`).
       _(Pastikan menggunakan `https` dan `/api` di akhir jika diperlukan, frontend akan menyesuaikan)_
4. Klik **Deploy**.

---

## 💻 Local Development (Menjalankan di Komputer)

### 1. Backend

```bash
cd backend
npm install
# Buat file .env sesuaikan dengan .env.example
npx prisma db push
node prisma/seed.js
npm run dev
```

Server berjalan di `http://localhost:5000`

### 2. Frontend

```bash
cd frontend
npm install
# Buat file .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`

---

## ✨ Fitur Utama (Features)

### 👑 Owner Panel

- **Analytics Dashboard**: Real-time stats for revenue.
- **Service Management**: CRUD services (Kiloan/Satuan).
- **User Management**: Manage Owner/Cashier accounts.
- **Financial Reports**: Export to Excel/PDF.

### 🏪 Cashier (POS) Panel

- **Point of Sales**: Fast order input & customer search.
- **Order Tracking**: Update statuses (Received, Washing, etc.).
- **Digital Receipts**: Print thermal or WhatsApp integration.
- **Daily History**: View today's transactions.

---

### 👤 Default Credentials (Akun Bawaan)

Jika Anda menggunakan `npm run start:prod` atau `seed.js`:

- **Owner**: `owner` / `owner123`
- **Kasir**: `kasir` / `kasir123`
