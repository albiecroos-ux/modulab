# Setup Admin & Supabase (Manual)

Langkah ini dijalankan sekali oleh admin di dashboard Supabase.

## 1. Jalankan migrasi

Buka **Supabase → SQL Editor**, lalu jalankan berurutan:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/migrations/0003_auth_trigger.sql`
4. `supabase/migrations/0004_storage.sql`
5. `supabase/migrations/0005_realtime.sql`
6. `supabase/migrations/0006_seed.sql` (opsional, data contoh)

Atau dengan Supabase CLI: `supabase db push` (butuh project ter-link).

## 2. Daftarkan email admin pertama

Di SQL Editor:

```sql
insert into public.allowed_emails (email, role)
values ('admin@contoh.ac.id', 'admin')
on conflict (email) do update set role = 'admin';
```

Ganti dengan email admin yang sebenarnya (huruf kecil).

## 3. Buat akun admin

Pilih salah satu:

- **Dashboard:** Authentication → Users → **Add user** → isi email yang sama →
  centang "Auto Confirm User". Trigger `handle_new_user` otomatis membuat
  `profiles` dengan role `admin`.
- **Aplikasi:** buka aplikasi → Daftar dengan email tersebut → login. Email lain
  yang tidak ada di `allowed_emails` akan menjadi `pending`.

Setelah akun ada, cek:

```sql
select id, email, role from public.profiles order by created_at;
```

Role admin harus `admin`. Bila masih `pending`, jalankan manual:

```sql
update public.profiles p
set role = 'admin'
from public.allowed_emails a
where lower(p.email) = a.email and a.role = 'admin';
```

## 4. Atur Auth URL

**Authentication → URL Configuration**:

- Site URL: `http://localhost:5173` (dev) atau domain produksi.
- Redirect URLs: tambahkan `http://localhost:5173/**` dan domain produksi
  (mis. `https://labassist.example.com/**`).

**Authentication → Providers → Email**: aktifkan Email/Password.
Pendaftaran email lain tetap boleh terbuka; mereka hanya mendapat role
`pending` dan tidak bisa membaca data. Bila ingin menutup pendaftaran sama
sekali setelah semua anggota dibuat, nonaktifkan "Allow new users to sign up"
di **Authentication → Sign In / Providers**.

## 5. Storage

Migrasi `0004` membuat bucket privat `lab-media` beserta policy. Tidak perlu
membuat bucket manual. Pastikan **Storage → lab-media** berstatus *Private*.

## 6. Kunci API

- Frontend hanya memakai **Project URL** + **anon/publishable key**.
- **service_role key** hanya boleh dipakai di server/dashboard, tidak pernah
  di `.env` frontend, repo, atau log.

## 7. Tambah anggota

Masuk sebagai admin → menu **Anggota**:

1. Tambahkan email anggota dengan role `member` (atau `admin`).
2. Minta anggota mendaftar memakai email tersebut.
3. Bila akun sudah ada tetapi masih `pending`, menambahkan email ke daftar
   otomatis menaikkan role (trigger `sync_allowed_email_role`).
4. Admin dapat mengubah role lewat tombol **Ubah Role** di panel Anggota.

## 8. Impor data lama

Masuk sebagai admin → menu **Anggota** → **Impor Data Lama**. Fitur membaca
`public.labassist_shared_state` (bila tabel lama masih ada) dan/atau
`localStorage` browser admin, lalu memindahkan media base64 ke Storage.
Aman dijalankan berulang (idempoten lewat `legacy_id`).

> Tabel lama `labassist_shared_state` tidak dihapus otomatis. Hapus manual
> hanya setelah impor diverifikasi.
