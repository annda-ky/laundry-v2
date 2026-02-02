# 🧺 Laundry Management System (Sistem Informasi Manajemen Laundry)

**Professional Web-Based POS & Management System for Laundry Businesses**
*(Sistem Kasir & Manajemen Berbasis Web untuk Bisnis Laundry)*

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg) ![React](https://img.shields.io/badge/react-18-blue.svg)

---

## 🇬🇧 English Version

A comprehensive Laundry Management Information System designed for MSMEs. Built with a modern tech stack ensuring performance, scalability, and a premium user experience.

### ✨ Key Features

#### 👑 Owner Panel
- **Analytics Dashboard**: Real-time stats for daily, monthly, and yearly revenue.
- **Service Management**: CRUD operations for services (Kilo/Unit based).
- **User Management**: Manage Owner and Cashier accounts with role-based access.
- **Financial Reports**: Generate and export detailed reports to Excel/PDF.
- **Customization**: Configure business profile, logo, and receipt templates.

#### 🏪 Cashier (POS) Panel
- **Point of Sales**: Fast order input with customer search and cart system.
- **Order Tracking**: Update laundry status (Received, Washing, Ironing, etc.).
- **Digital Receipts**: Print thermal receipts or send via WhatsApp.
- **Daily History**: View today's transactions at a glance.

### 🛠 Tech Stack
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL (via Supabase)
- **Frontend**: Next.js 14, React, Recharts
- **Styling**: CSS Modules (Navy + Orange Theme)

### 🚀 Getting Started

1. **Database Setup**
   Ensure you have a PostgreSQL database connection string (e.g., from Supabase). Configure your environment variables in `backend/.env`.

2. **Run Backend**
   ```bash
   cd backend
   npm install
   npx prisma db push  # Sync database schema
   node src/prisma/seed.js  # (Optional) Seed default data
   npm run dev
   ```
   Server runs on `http://localhost:5000`

3. **Run Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   App runs on `http://localhost:3000`

### 👤 Default Credentials
- **Owner**: `owner` / `owner123`
- **Cashier**: `kasir` / `kasir123`

---

## 🇮🇩 Versi Bahasa Indonesia

Sistem Informasi Manajemen Laundry lengkap untuk UMKM dengan fitur Point of Sales (POS), manajemen layanan, dan laporan keuangan yang eksportabel.

### ✨ Fitur Utama

#### 👑 Panel Owner
- **Dashboard Analitik**: Statistik pendapatan harian/bulanan/tahunan secara realtime.
- **Manajemen Layanan**: Tambah/ubah/hapus layanan (Kiloan/Satuan).
- **Manajemen Pengguna**: Kelola akun kasir dan owner dengan hak akses berbeda.
- **Laporan Keuangan**: Laporan detail yang bisa diexport ke Excel & PDF.
- **Pengaturan**: Kustomisasi profil bisnis, logo, dan footer nota.

#### 🏪 Panel Kasir (POS)
- **Point of Sales**: Input order cepat dengan pencarian pelanggan otomatis.
- **Pelacakan Order**: Ubah status proses (Diterima, Dicuci, Disetrika, dll).
- **Nota Digital**: Cetak nota thermal atau kirim langsung via WhatsApp.
- **Riwayat Harian**: Pantau transaksi hari ini dengan mudah.

### 🛠 Teknologi
- **Backend**: Node.js, Express, Prisma ORM
- **Database**: PostgreSQL (via Supabase)
- **Frontend**: Next.js 14, React, Recharts
- **Desain**: Next.js CSS Modules (Tema Navy + Orange)

### 🚀 Cara Menjalankan

1. **Persiapan Database**
   Pastikan Anda memiliki URL koneksi database PostgreSQL (misal dari Supabase). Atur environment variables di `backend/.env`.

2. **Jalankan Backend**
   ```bash
   cd backend
   npm install
   npx prisma db push  # Sinkronisasi skema database
   node src/prisma/seed.js  # (Opsional) Isi data awal user
   npm run dev
   ```
   Server berjalan di `http://localhost:5000`

3. **Jalankan Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Aplikasi berjalan di `http://localhost:3000`

### 👤 Akun Default
- **Owner**: `owner` / `owner123`
- **Kasir**: `kasir` / `kasir123`
# Laundry-Management
