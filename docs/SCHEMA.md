# Skema Database LabAssist

Semua tabel berada di schema `public`. ID berupa `uuid` (`gen_random_uuid()`),
memiliki `created_at`, `updated_at` (diperbarui trigger `set_updated_at`), dan
`created_by` (FK ke `profiles.id`, `on delete set null`, default `auth.uid()`).

Kolom `legacy_id` hanya dipakai oleh fitur "Impor data lama" agar idempoten
(unique partial index); bukan bagian dari tampilan.

## Tabel

### `profiles`
| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `id` | uuid PK | FK `auth.users(id)` on delete cascade |
| `email` | text | lowercase |
| `role` | text | `admin` / `member` / `pending` |
| `created_at`, `updated_at` | timestamptz | |

### `allowed_emails`
| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| `email` | text PK | harus lowercase |
| `role` | text | `admin` / `member` |
| `created_by` | uuid | FK profiles |

Trigger `0003` menaikkan role profil yang cocok saat email ditambahkan, dan
menurunkan ke `pending` saat email dihapus.

### `modules`
`id`, `legacy_id`, `title`, `duration`, `goal`, `tools`, `created_by`, timestamps.

### `module_steps`
`id`, `module_id` (FK modules on delete cascade), `position` (urutan),
`instruction`, `tip`, `media_name`, `media_type`, `media_url`, `created_by`, timestamps.

### `module_attachments`
`id`, `module_id` (FK modules on delete cascade), `position`, `name`, `type`,
`url`, `size`, `created_by`, timestamps.

### `troubleshooting_cases`
`id`, `legacy_id`, `category`, `symptom`, `cause`, `solution`, `media_name`,
`media_type`, `media_url`, `created_by`, timestamps.

### `glossary_terms`
`id`, `legacy_id`, `term`, `def`, `analogy`, `media_name`, `media_type`,
`media_url`, `created_by`, timestamps.

### `checklist_items`
`id`, `legacy_id`, `text`, `checked` (bool), `position`, `created_by`, timestamps.
Checklist bersifat **bersama** untuk seluruh workspace tim.

### `eval_logs`
`id`, `legacy_id`, `date` (teks, mis. "Baru saja"), `session`, `confused`,
`action`, `media_name`, `media_type`, `media_url`, `created_by`, timestamps.

## Batasan `media_type`

`media_type` hanya boleh `image`, `video`, `pdf`, `youtube`, `link`, `file`,
atau `NULL` (belum ada media).

Arti nilai:
- `youtube` → `media_url` berisi URL embed YouTube.
- `link` / `file` → URL http/https eksternal atau path Storage.
- `image`, `video`, `pdf` → path Storage privat atau URL http/https.

**File yang diunggah disimpan di bucket Storage `lab-media` (privat).**
`media_url`/`url` menyimpan *path* (`{user_id}/{uuid}-{nama}`), bukan base64.

## RLS

RLS aktif di seluruh tabel. Helper:

- `public.is_member()` → true bila `profiles.role in ('admin','member')`.
- `public.is_admin()` → true bila `profiles.role = 'admin'`.

Keduanya `security definer` dengan `set search_path = ''` dan hanya diberi
`execute` untuk role `authenticated`.

| Tabel | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `profiles` | self atau admin | (trigger saja) | admin | - |
| `allowed_emails` | admin | admin | admin | admin |
| tabel konten | member | member | member | member |

Policy ditulis eksplisit `to authenticated`; tidak ada `using (true)` untuk
tulis/hapus. Akun `pending` tidak memenuhi `is_member()` sehingga tidak dapat
membaca/mengubah data.

## Storage

- Bucket: `lab-media`, privat, limit 10 MB.
- Path: `{user_id}/{uuid}-{namaFileAman}`.
- Policy: member boleh `select` semua objek bucket, `insert` hanya folder miliknya,
  `update`/`delete` folder miliknya (admin boleh delete semua).
- Tampilan memakai signed URL (cache 1 jam) via `createSignedUrl`.

## Realtime

Tabel konten ditambahkan ke publication `supabase_realtime` oleh `0005`.
Frontend berlangganan `postgres_changes` dan me-refresh tampilan tanpa reload.

## Variabel lingkungan frontend

Hanya dua (lihat `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY` **tidak boleh** ada di repo/frontend/log.
