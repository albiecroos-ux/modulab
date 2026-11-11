# QA Checklist LabAssist

Tandai `[x]` hanya setelah benar-benar dijalankan.

## Panduan langkah demi langkah

Ikuti urutan ini. Jangan pernah mengirim `SUPABASE_SECRET_KEY` ke aplikasi,
file `.env`, atau chat. Secret key yang sempat dibagikan harus diganti dulu.

### A. Amankan kunci Supabase

1. Buka [dashboard Supabase](https://supabase.com/dashboard), lalu pilih proyek
   LabAssist.
2. Di menu proyek, buka **Project Settings → API Keys** (pada tampilan lama:
   **Project Settings → API**).
3. Cari bagian **Secret keys**, lalu revoke/rotate key yang sudah dibagikan.
   Jika ada pilihan membuat key baru sebelum menghapus yang lama, lakukan itu.
   Jangan salin key baru ke aplikasi.
4. Aplikasi hanya memakai **Project URL** dan **Publishable key**. Jangan
   bagikan nilai key di chat.

### B. Jalankan database

Lakukan setiap file satu per satu di Supabase:

1. Di menu proyek, klik **SQL Editor → New query**.
2. Di VS Code, buka file pertama: `supabase/migrations/0001_schema.sql`.
   Tekan `Ctrl+A`, lalu `Ctrl+C` untuk menyalin isinya.
3. Kembali ke SQL Editor, tempel dengan `Ctrl+V`, lalu klik **Run**.
4. Jika selesai tanpa pesan error, ulangi langkah tersebut untuk file berikut,
   dengan urutan:
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_auth_trigger.sql`
   - `supabase/migrations/0004_storage.sql`
   - `supabase/migrations/0005_realtime.sql`
   - `supabase/migrations/0006_seed.sql` (opsional; mengisi data contoh)
5. Jika muncul error, berhenti di file itu. Jangan lanjut ke file berikutnya;
   salin pesan errornya untuk diperiksa. Jangan kirim password atau key.

### C. Daftarkan akun admin

1. Di **SQL Editor → New query**, tempel perintah di bawah. Ganti alamat contoh
   dengan email Anda sendiri dalam huruf kecil, lalu klik **Run**:

   ```sql
   insert into public.allowed_emails (email, role)
   values ('email-anda@contoh.com', 'admin')
   on conflict (email) do update set role = 'admin';
   ```

2. Buka aplikasi lokal di `http://localhost:5173`, klik **Daftar**, lalu buat
   akun menggunakan email yang sama dan kata sandi Anda.
3. Jika Supabase mengirim email konfirmasi, buka email tersebut dan klik tautan
   konfirmasinya.
4. Kembali ke aplikasi, masuk dengan email dan kata sandi tadi. Seharusnya
   halaman utama terbuka dan menu **Anggota** tersedia.

### D. Atur alamat masuk aplikasi

1. Di dashboard Supabase, buka **Authentication → URL Configuration**.
2. Isi **Site URL** dengan `http://localhost:5173`.
3. Pada **Redirect URLs**, tambahkan `http://localhost:5173/**`, lalu simpan.
   Setelah punya alamat website produksi, tambahkan alamat produksi di sini
   juga (contoh `https://nama-website.com/**`).
4. Untuk memastikan email/password aktif, buka **Authentication → Sign In /
   Providers → Email** dan pastikan penyedia Email aktif.

### E. Jalankan aplikasi dan mulai tes

1. Pastikan `.env` hanya berisi `VITE_SUPABASE_URL` dan
   `VITE_SUPABASE_ANON_KEY` (nilainya harus URL proyek dan Publishable key).
   Jangan tambahkan Secret key atau JWKS URL.
2. Di terminal VS Code, jalankan `npm run dev`. Buka
   `http://localhost:5173` di Chrome dan masuk sebagai admin.
3. Jika Vite sudah berjalan saat `.env` diubah, hentikan server dengan
   `Ctrl+C`, lalu jalankan `npm run dev` lagi.
4. Ikuti bagian **Manual** di bawah: coba daftar dengan email lain, lalu uji
   tambah/edit/hapus data di menu aplikasi. File upload bisa dilihat di
   dashboard Supabase lewat **Storage → lab-media**.
5. Coba tampilan HP dengan mengecilkan jendela browser. Untuk Realtime, buka
   dua tab aplikasi dan lihat apakah perubahan di satu tab muncul di tab lain.
6. Centang `[x]` hanya setelah langkah terkait benar-benar dicoba dan berhasil.

## Otomatis (sudah dijalankan di mesin ini)

- [x] `npm install` berhasil (Vite 8.3.5, @supabase/supabase-js 2.x).
- [x] `npm run build` berhasil (67 modul, output `dist/`).
- [x] `npm audit` → 0 vulnerabilities.
- [x] Dev server Vite menyajikan `index.html` + `/src/main.js` (HTTP 200).
- [x] Headless Chrome memuat halaman tanpa error log; layar auth + peringatan
      konfigurasi tampil saat `.env` kosong; tab Anggota ada di DOM.
- [x] Uji unit helper: `escapeHtml`, `parseYoutubeEmbed`, `isSafeHttpUrl`,
      `roleLabel` lulus.
- [x] Build dengan env contoh menyisipkan `VITE_SUPABASE_URL` ke bundle
      (309 kB; jalur auth/data ikut ter-bundle).
- [x] Dev server dengan env contoh: layar auth tampil, layar pending
      `display:none`, peringatan konfigurasi tidak muncul, tanpa error log.
- [x] Grep: tidak ada `readAsDataURL` di kode aplikasi baru; tidak ada nilai
      `service_role` di repo; tidak ada policy `using (true)`.

## Manual (butuh Supabase + `.env`)

### Auth & peran

- [x] Isi `.env`, jalankan migrasi 0001–0006.
- [x] Daftarkan email admin di `allowed_emails`, buat akun admin.
- [x] Login admin → dashboard memuat data contoh (jika seed dijalankan).
- [x] Daftar dengan email yang tidak ada di `allowed_emails` → layar
      "Menunggu persetujuan admin"; tidak bisa membaca data (cek di console:
      query konten gagal/0 baris).
- [x] Admin menambahkan email pending ke daftar → user pending menjadi member
      setelah reload/login.
- [] Member tidak melihat menu Anggota; mencoba update role via API ditolak RLS.
- [x] Logout → kembali ke layar login.

### CRUD tiap fitur

- [x] Modul: buat, edit judul/waktu/tujuan/alat, tambah/hapus langkah,
      tambah/hapus lampiran, live preview ikut berubah, tombol salin bekerja.
- [x] Upload gambar/PDF kecil pada lampiran modul, media langkah,
      troubleshooting, analogi, evaluasi → tampil via signed URL.
- [x] File > 10 MB ditolak dengan pesan jelas; tipe terlarang ditolak.
- [x] Link YouTube ditempel → tampil iframe embed; URL non-http ditolak.
- [x] Troubleshooting: tambah, edit, hapus, cari, filter kategori.
- [x] Glosarium: tambah, edit, hapus, cari.
- [x] Checklist: tambah, edit, centang, reset centang, hapus selesai, hapus satu.
- [x] Evaluasi: tambah, edit, hapus, lampiran bukti.
- [x] Undo hapus pada tiap jenis data mengembalikan baris.
- [x] Reset data contoh (admin) berjalan dan bisa di-undo.

### Realtime

- [x] Buka dua tab/browser dengan akun member berbeda.
- [x] Tambah/edit data di tab A → tab B ter-update tanpa reload.
- [x] Saat tab B sedang mengetik di form, perubahan tab A tidak menimpa form;
      update diterapkan setelah fokus meninggalkan form.

### Impor lama

- [x] Jalankan "Impor Data Lama" sekali → ringkasan jumlah masuk.
- [x] Jalankan lagi → jumlah "dilewati" bertambah, tidak ada duplikat.
- [x] Media base64 lama pindah ke Storage dan tampil.

### Tampilan

- [x] Bandingkan tiap tab dengan versi lama: teks, warna, kelas Tailwind,
      urutan tombol, toast, menu mobile tetap sama.
- [x] Uji lebar mobile (< 1024px): sidebar overlay, tombol hamburger, tab.
- [x] Tidak ada error di console browser saat navigasi semua tab.

### Keamanan

- [x] `service_role` tidak ada di `.env`, bundle, atau log.
- [x] Anon user tidak bisa select/insert tabel konten.
- [x] Member tidak bisa select `allowed_emails` / update `profiles` orang lain.
- [x] Object Storage di luar folder milik user tidak bisa dihapus member.
