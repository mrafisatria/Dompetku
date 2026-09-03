# Dompetku

Dashboard manajemen keuangan pribadi berbasis React dan Supabase. Aplikasi menyediakan ringkasan saldo, total pemasukan dan pengeluaran, grafik bulanan, komposisi kategori, pencatatan manual, pencarian, filter, ekspor CSV, dan tampilan mobile.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Dompetku menggunakan Supabase sebagai satu-satunya sumber data. Tanpa konfigurasi Supabase, aplikasi menampilkan pemberitahuan konfigurasi dan tidak menyimpan transaksi secara lokal.

Login aplikasi menggunakan satu kolom **secret key akun**. Dua akun tetap disimpan dalam tabel `public.app_users`, sehingga masing-masing memiliki data transaksi sendiri tanpa menggunakan email atau kata sandi Supabase Auth.

## Ikon layar utama

Ikon layar utama menggunakan logo yang sama dengan `public/favicon.svg`. iPhone menggunakan `public/apple-touch-icon.png` (180×180), sedangkan manifest `public/manifest.webmanifest` menyediakan ikon PNG berukuran 192×192 dan 512×512 di `public/icons/`. Ikon PNG memakai latar pastel solid agar tidak menjadi transparan atau hitam ketika dipasang.

Setelah pembaruan ikon sudah tayang, jika ikon lama masih berupa huruf D, hapus pintasan Dompetku dari layar utama, buka kembali situs di Safari, lalu pilih **Bagikan → Tambah ke Layar Utama**. Ini bukan tindakan hapus transaksi; transaksi tetap tersimpan di database. Login kembali jika diminta. Manifest mengatur pembukaan sebagai aplikasi mandiri, tetapi tidak menambahkan dukungan offline.

## Menghubungkan Supabase

1. Jalankan isi `supabase/schema.sql` di SQL Editor proyek Supabase.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari dialog **Connect** proyek.
4. Mulai ulang server pengembangan.

Gunakan hanya publishable key di frontend. Jangan menaruh secret key atau service-role key di aplikasi React.

> **Catatan:** secret key akun untuk login Dompetku berbeda dari Supabase Secret API Key. Secret akun disimpan sebagai hash bcrypt. Supabase Secret API Key maupun `service_role` hanya digunakan server-side oleh Edge Function dan tidak boleh dimasukkan ke frontend.

### Status integrasi

Database proyek Supabase **Lutu** sudah memiliki tabel `public.app_users`, `public.app_sessions`, `public.app_login_attempts`, dan `public.transactions`. Semua tabel memakai RLS tanpa akses langsung dari browser; operasi login dan transaksi melewati Edge Function `dompetku-api`. Konfigurasi lokal disimpan di `.env.local` dan sengaja tidak masuk Git.

Saat melakukan deployment, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` melalui pengaturan environment variables pada platform hosting. Setelah konfigurasi tersedia, aplikasi menggunakan sesi khusus berdurasi 30 hari dan memperbarui data secara berkala agar perangkat yang masuk dengan secret key sama menggunakan data yang sama.
