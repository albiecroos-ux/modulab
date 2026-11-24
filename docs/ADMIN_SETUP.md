# Panduan Setup Administrator MODULAB

Panduan langkah demi langkah untuk konfigurasi awal Supabase dan Vercel sesuai alur pendaftaran mandiri dan persetujuan admin.

## 1. Buat Akun Admin Pertama di Supabase Dashboard
Sebelum mengaktifkan aturan password server, buat akun administrator tunggal:
1. Buka **Supabase Dashboard → Authentication → Users**.
2. Klik tombol **Add user** → **Create user**:
   - **Email:** `adminmodullab@ui.ac.id`
   - **Password:** Masukkan kata sandi awal yang telah ditentukan pemilik proyek.
   - **Auto Confirm User:** Centang opsi ini.
3. Klik **Create user**.

> [!WARNING]
> Segera ganti kata sandi awal admin ke kata sandi kuat yang memenuhi seluruh aturan keamanan setelah setup selesai (melalui menu Profil Saya atau Supabase Dashboard).

## 2. Jalankan File Migrasi Database
Buka **Supabase Dashboard → SQL Editor**, lalu jalankan berurutan:
1. `supabase/migrations/0007_roles_approval.sql`
   *(Mengubah role member menjadi user, mengunci admin tunggal `adminmodullab@ui.ac.id`, dan mengaktifkan trigger pending).*
2. `supabase/migrations/0008_rls_readonly.sql`
   *(Mengatur RLS: baca untuk admin & user, operasi tulis hanya untuk admin).*
3. `supabase/migrations/0009_audit_realtime.sql`
   *(Membuat tabel audit_logs, fungsi admin_delete_user, dan Realtime publication untuk profiles).*

## 3. Konfigurasi Autentikasi Supabase
1. **Providers → Email:**
   - Aktifkan **Email**.
   - Matikan **Confirm email** (verifikasi email dimatikan karena admin adalah gerbang persetujuan ACC).
   - Aktifkan **Allow new users to sign up**.
2. **Password Protection:**
   - **Minimum password length:** 12 karakter.
   - Centang kewajiban: **Lowercase**, **Uppercase**, **Digits**, dan **Symbols**.
   - Aktifkan *Leaked password protection* jika plan Supabase mendukung (Pro).
3. **URL Configuration:**
   - **Site URL:** `https://modulab-6.vercel.app`
   - **Redirect URLs:**
     - `https://modulab-6.vercel.app`
     - `https://modulab-6.vercel.app/**`
     - `http://localhost:5173`
     - `http://localhost:5173/**`

## 4. Konfigurasi Vercel (Produksi)
1. Buka [Vercel Dashboard](https://vercel.com) → Proyek **modulab-6**.
2. Masuk ke **Settings → Environment Variables**:
   - Tambahkan `VITE_SUPABASE_URL` dengan URL proyek Supabase Anda.
   - Tambahkan `VITE_SUPABASE_ANON_KEY` dengan Anon/Publishable key Supabase Anda.
3. Lakukan redeploy atau dorong commit terbaru ke branch `main`.

## 5. Alur Persetujuan Anggota Baru
1. Mahasiswa / praktikan mendaftar mandiri melalui tautan **Daftar Akun Baru** (`#/daftar`).
2. Setelah form dikirim, akun berstatus `pending` dan menampilkan layar **Menunggu Persetujuan Admin** (`#/menunggu`).
3. Admin masuk ke portal (`#/admin/login`), membuka menu **Anggota & Akses** di tab **Menunggu**.
4. Admin menekan tombol **Setujui** (role menjadi `user`) atau **Tolak** (role menjadi `rejected`).
5. Layar pengguna yang sedang menunggu akan langsung terbuka ke aplikasi utama secara Realtime tanpa perlu memuat ulang browser.
