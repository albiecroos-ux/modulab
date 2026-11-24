# PROGRESS MODULAB

Status terakhir: **Fase 0 s.d. Fase 5 Selesai**. Siap dideploy ke GitHub & Vercel.

---

## Ringkasan Fase Kerja (PRD Bagian 10)

### Fase 0 — Audit (Selesai)
- Meninjau dokumen dan migrasi lama 0001–0006.
- Memetakan kebutuhan alur dua peran (admin dan user baca-saja), antrian persetujuan admin, serta aturan password kuat.

### Fase 1 — Database & Migrasi (Selesai)
- Dibuat migrasi baru:
  - `0007_roles_approval.sql`: Role check constraint (`admin`, `user`, `pending`, `rejected`), penguncian admin tunggal `adminmodullab@ui.ac.id`, trigger metadata profil pendaftaran baru.
  - `0008_rls_readonly.sql`: Fungsi `is_approved()`, RLS tabel konten (select untuk admin & user disetujui, write hanya admin), RLS Storage `lab-media` (upload/delete hanya admin).
  - `0009_audit_realtime.sql`: Tabel `audit_logs` + trigger perubahan role, RPC `admin_delete_user`, publikasi realtime untuk `profiles`.

### Fase 2 — Fondasi Frontend (Selesai)
- Modul validasi password: `src/lib/password.js` (12 karakter, uppercase, lowercase, digit, simbol, tanpa spasi, bebas nama/email, no triple repeat, blacklist 100 password umum, meter kekuatan 3 tingkat).
- Router hash: `src/lib/router.js` (`getHashPath`, `navigate`, `onRoute`).
- State sesi & Realtime profil: `src/lib/session.js`.
- Route guard ketat: `src/lib/guard.js`.
- Perluasan layanan: `src/services/auth.js` dan `src/services/members.js`.
- Uji unit `test/test-password.js`: 10/10 test lulus.

### Fase 3 — Halaman Autentikasi (Selesai)
- Landing: `src/views/auth/landing.js` (`#/`).
- Login User: `src/views/auth/login-user.js` (`#/login`).
- Login Admin: `src/views/auth/login-admin.js` (`#/admin/login`).
- Pendaftaran: `src/views/auth/register.js` (`#/daftar`) dengan live meter kekuatan dan checklist aturan.
- Menunggu ACC: `src/views/auth/pending.js` (`#/menunggu`) dengan listener Realtime.
- Ditolak: `src/views/auth/rejected.js` (`#/ditolak`).
- Lupa & Reset Password: `src/views/auth/forgot.js` dan `src/views/auth/reset.js`.

### Fase 4 — Mode Baca-Saja & Anggota & Akses (Selesai)
- Hak akses baca-saja di UI untuk user: menyembunyikan tombol buat modul, edit/hapus di modul, troubleshooting, checklist, dan evaluasi. Checkbox checklist dinonaktifkan untuk user.
- Guard proteksi fungsi handler tulis dengan pesan ramah: "Kamu hanya punya akses lihat."
- Menu Anggota & Akses: `src/views/admin/members.js` dengan tab Menunggu, Disetujui, Ditolak, hitungan badge Realtime, aksi Setujui, Tolak (alasan opsional), Cabut akses, dan Hapus akun (konfirmasi 2 langkah).

### Fase 5 — Profil & Penyempurnaan UI (Selesai)
- Halaman profil mandiri: `src/views/profile.js` (`#/profil`) dengan fitur ganti kata sandi kuat.
- Pembersihan branding: seluruh antarmuka menggunakan nama MODULAB.
- Header keamanan Vercel: `vercel.json` (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).
- Verifikasi build: `npm run build` sukses 80 modul transformed.

### Fase 6 — Deploy ke GitHub & Vercel
- Menyiapkan commit dan mendorong ke remote origin GitHub `main`.
