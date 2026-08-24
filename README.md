# Dompetku

Dashboard manajemen keuangan pribadi berbasis React dan Supabase. Aplikasi menyediakan ringkasan saldo, total pemasukan dan pengeluaran, grafik bulanan, komposisi kategori, pencatatan manual, pencarian, filter, ekspor CSV, dan tampilan mobile.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Dompetku menggunakan Supabase sebagai satu-satunya sumber data. Tanpa konfigurasi Supabase, aplikasi menampilkan pemberitahuan konfigurasi dan tidak menyimpan transaksi secara lokal.

## Menghubungkan Supabase

1. Jalankan isi `supabase/schema.sql` di SQL Editor proyek Supabase.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari dialog **Connect** proyek.
4. Mulai ulang server pengembangan.

Gunakan hanya publishable key di frontend. Jangan menaruh secret key atau service-role key di aplikasi React.

### Status integrasi

Database proyek Supabase **Lutu** sudah memiliki tabel `public.transactions`, indeks tanggal per pengguna, empat kebijakan Row Level Security, dan hak Data API untuk pengguna terautentikasi. Konfigurasi lokal disimpan di `.env.local` dan sengaja tidak masuk Git.

Saat melakukan deployment, tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` melalui pengaturan environment variables pada platform hosting. Setelah konfigurasi tersedia, aplikasi menggunakan Supabase Auth, menyimpan transaksi ke database, dan berlangganan Supabase Realtime agar perangkat yang login dengan akun sama memperoleh pembaruan data.
