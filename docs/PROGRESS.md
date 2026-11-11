# PROGRESS

Status terakhir: Tahap 0–7 dikerjakan. Verifikasi runtime Supabase **menunggu
`.env` + migrasi dijalankan** (lihat bagian "Menunggu").

## Tahap 0 — Audit (selesai)

- File: `docs/PLAN.md` (baru).
- Hasil: peta fungsi lama → modul baru, tabel, risiko.
- Verifikasi: audit read-only; tidak ada kode diubah.

## Tahap 1 — Skema, RLS, Storage (selesai ditulis; sintaks belum dieksekusi)

- File baru: `supabase/migrations/0001_schema.sql` … `0006_seed.sql`,
  `docs/SCHEMA.md`, `docs/ADMIN_SETUP.md`.
- Isi: 9 tabel + `legacy_id`, trigger `updated_at`, helper `is_member()`/`is_admin()`
  (security definer, `search_path=''`), policy eksplisit `to authenticated`,
  bucket privat `lab-media` (10 MB), publication realtime, seed idempoten.
- Verifikasi: tinjauan manual. **Tidak ada** `psql`/Supabase CLI/Docker di mesin
  ini, jadi migrasi belum dijalankan ke database. Jalankan di SQL Editor.

## Tahap 2 — Vite + modularisasi (selesai)

- File: `package.json`, `vite.config.js`, `.gitignore`, `.env.example`,
  `index.html` (script inline dipindah), `src/main.js`, `src/state.js`,
  `src/lib/{supabase,ui}.js`, `src/views/*`, `src/data/defaults.js`.
- HTML tetap memakai `onclick="fn()"`; handler diekspos lewat `Object.assign(window, ...)`
  di `src/main.js` agar tidak perlu menulis ulang seluruh markup.
- Verifikasi:
  - `npm install` berhasil.
  - `npm run build` berhasil (Vite 8.3.5, 67 modul).
  - Dev server Vite: `GET /` 200 (57.269 bytes) dan `GET /src/main.js` 200.
  - Headless Chrome: DOM 86.508 bytes, layar auth + peringatan konfigurasi
    tampil (karena `.env` belum ada), tab Anggota ada, tidak ada baris error
    di stderr Chrome.
  - Dev server dengan env contoh: layar auth tampil, layar pending
    `display:none`, peringatan konfigurasi tidak muncul, tanpa error log.
  - Build dengan env contoh: 309 kB (jalur auth/data tidak ter-tree-shake),
    `VITE_SUPABASE_URL` tersisip di bundle.
  - Uji unit helper UI lulus.

## Tahap 3 — Data layer + Auth peran (selesai ditulis; runtime menunggu)

- File: `src/services/{auth,modules,troubleshooting,glossary,checklist,evaluations,members}.js`,
  `src/views/*`, `src/main.js`, `src/state.js`, `index.html` (layar pending,
  menu Anggota, role di sidebar).
- Semua query hanya di services; views hanya render. Auth membaca `profiles.role`.
  `pending` → layar menunggu; `admin` → panel Anggota; dashboard dihitung dari data nyata.
- Undo hapus memakai re-insert baris (modul mengembalikan steps + attachments).
- Verifikasi: `npm run build` sukses. **Belum diuji ke Supabase** karena kredensial
  belum ada.

## Tahap 4 — Storage + impor data lama (selesai ditulis; runtime menunggu)

- File: `src/services/storage.js`, `src/services/importLegacy.js`,
  handler upload di `src/main.js`, panel impor di `index.html`.
- Semua `FileReader.readAsDataURL` dihapus; file diunggah ke `lab-media`
  (`{user_id}/{uuid}-{namaAman}`), validasi tipe & 10 MB di client (bucket juga).
  Signed URL di-cache 1 jam. YouTube/URL eksternal tidak diunggah.
- Impor idempoten via `legacy_id`, memindahkan base64 ke Storage, menampilkan ringkasan.
- Verifikasi: grep tidak menemukan `readAsDataURL`; build sukses. Upload/impor
  nyata belum dijalankan.

## Tahap 5 — Realtime (selesai ditulis; runtime menunggu)

- File: `src/main.js` (`setupRealtime`, `scheduleRealtimeRefresh`,
  `isEditingContent`), `0005_realtime.sql`.
- Langganan 7 tabel konten; refresh tanpa reload; jika fokus ada di input form,
  refresh ditunda sampai fokus keluar.
- Verifikasi: build sukses. Uji dua tab belum dijalankan tanpa Supabase.

## Tahap 6 — Hardening & dokumentasi (selesai)

- File: `README.md`, `AGENTS.md`, `docs/SCHEMA.md`, `docs/ADMIN_SETUP.md`,
  pembaruan `SUPABASE_SETUP.md`.
- Audit: `npm audit` → 0 vulnerabilities (Vite dinaikkan ke ^8.3.5).
- Grep: tidak ada `service_role` bernilai, tidak ada `using (true)`,
  semua `innerHTML` memakai `escapeHtml` untuk teks pengguna, URL media
  divalidasi http/https.
- Kode lama berupa blob JSON/localStorage tidak lagi dipakai aplikasi (hanya
  dibaca oleh fitur impor). File lama `supabase-config.js`, `supabase-setup.sql`,
  `SUPABASE_SETUP.md` **tidak dihapus** (menunggu persetujuan pemilik) dan tidak
  lagi direferensikan.

## Tahap 7 — QA akhir (otomatis selesai; manual menunggu)

- File: `docs/QA_CHECKLIST.md`.
- Otomatis: build, dev server, headless render, unit helper, audit, grep keamanan.
- Manual: login/peran, CRUD ke Supabase, upload, realtime 2 tab, impor 2x,
  tampilan mobile — menunggu kredensial.

## Menunggu pemilik proyek

1. Isi `.env` dari `.env.example` (URL + anon key).
2. Jalankan migrasi 0001–0006 di SQL Editor.
3. Daftarkan email admin pertama di `allowed_emails`, buat akun admin.
4. Atur Auth Site URL / Redirect URL.
5. Setelah itu jalankan `docs/QA_CHECKLIST.md` bagian manual.
