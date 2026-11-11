# Aturan Kerja & Keamanan LabAssist

Disalin dari aturan proyek (bagian C). Wajib dipatuhi oleh agent/kontributor.

## Kerja

1. `index.html` besar: JANGAN baca utuh. Pakai grep cari nama fungsi, baca per rentang baris.
2. Edit kecil dan terarah; jangan menulis ulang seluruh file sekaligus. Baca dulu sebelum mengubah.
3. Jangan mengarang nama tabel/kolom/fungsi/env var. Rujuk `supabase/migrations` dan `docs/SCHEMA.md`.
4. Jangan menebak API supabase-js v2; bila ragu, buka dokumentasi resmi atau nyatakan keraguan.
5. Setiap tahap diakhiri verifikasi nyata (build/lint/dev server/skrip uji). Laporkan hasil sebenarnya,
   termasuk kegagalan. Dilarang menulis "berfungsi" bila belum dijalankan.
6. Perintah destruktif (drop table, hapus file, reset DB, force push) hanya setelah pemilik proyek setuju.
7. Balas ringkas dalam bahasa Indonesia: apa yang diubah, file mana, cara uji, apa yang belum.

## Keamanan

- `service_role` key TIDAK PERNAH masuk frontend/repo/log. Frontend hanya
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- `.env` masuk `.gitignore`; sediakan `.env.example` tanpa nilai asli.
- RLS AKTIF di semua tabel dengan policy eksplisit untuk role `authenticated`, memakai
  `(select auth.uid())`. Fungsi helper `is_member()`/`is_admin()` bersifat security definer dengan
  `set search_path = ''`. Tidak ada `using (true)` untuk operasi tulis/hapus.
- Semua teks pengguna yang dirender lewat `innerHTML` wajib `escapeHtml()`; URL lampiran hanya http/https.
- Upload dibatasi tipe & ukuran (client dan bucket); simpan di Storage, bukan base64 di database.

## Alur kerja yang sudah dijalankan

Tahap 0 audit → Tahap 1 skema/RLS/Storage → Tahap 2 Vite + modularisasi → Tahap 3 data layer + auth peran →
Tahap 4 Storage + impor lama → Tahap 5 Realtime → Tahap 6 hardening/dokumentasi → Tahap 7 QA.
Status dan bukti verifikasi ada di `docs/PROGRESS.md`.
