# Dompetku

Dashboard manajemen keuangan pribadi berbasis React dan Supabase. Aplikasi menyediakan ringkasan saldo, total pemasukan dan pengeluaran, grafik bulanan, komposisi kategori, pencatatan manual, pencarian, filter, ekspor CSV, dan tampilan mobile.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Tanpa konfigurasi Supabase, aplikasi otomatis berjalan dalam **mode demo** dan menyimpan perubahan di browser (`localStorage`).

## Menghubungkan Supabase

1. Jalankan isi `supabase/schema.sql` di SQL Editor proyek Supabase.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari dialog **Connect** proyek.
4. Mulai ulang server pengembangan.

Gunakan hanya publishable key di frontend. Jangan menaruh secret key atau service-role key di aplikasi React.
