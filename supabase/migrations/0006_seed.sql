-- 0006_seed.sql
-- Data contoh dari defaultInitialData (idempoten: tidak menggandakan data).

do $$
declare
    v_mod1 uuid := gen_random_uuid();
    v_mod2 uuid := gen_random_uuid();
begin
    if not exists (select 1 from public.modules) then
        insert into public.modules (id, legacy_id, title, duration, goal, tools)
        values
            (
                v_mod1,
                'seed-1',
                $txt$Praktikum 1: Koneksi Database MySQL dengan PHP Dasar$txt$,
                $txt$90 Menit$txt$,
                $txt$Mahasiswa mampu membuat koneksi antara halaman web PHP dan database MySQL tanpa mengalami kendala error konfigurasi port atau nama tabel.$txt$,
                $txt$XAMPP Control Panel, Visual Studio Code, Web Browser (Chrome/Firefox)$txt$
            ),
            (
                v_mod2,
                'seed-2',
                $txt$Praktikum 2: Percabangan Logika (If-Else) pada Python$txt$,
                $txt$60 Menit$txt$,
                $txt$Mahasiswa memahami cara kerja pengambilan keputusan dalam kode program dan tidak melakukan kesalahan spasi (indentasi).$txt$,
                $txt$Python 3.x, VS Code / IDLE Python$txt$
            );

        insert into public.module_attachments (module_id, position, name, type, url)
        values (
            v_mod1,
            0,
            $txt$Video Panduan Singkat Setup XAMPP & MySQL (YouTube)$txt$,
            'youtube',
            'https://www.youtube.com/embed/yM8b0715Y2k'
        );

        insert into public.module_steps (module_id, position, instruction, tip)
        values
            (v_mod1, 0,
             $txt$Buka aplikasi XAMPP Control Panel, lalu klik tombol 'Start' pada baris module Apache dan MySQL hingga indikator berubah warna menjadi hijau.$txt$,
             $txt$Jika MySQL gagal menyala (merah), jangan panik. Cek apakah aplikasi MySQL Workbench sedang terbuka dan menutup jalur port 3306.$txt$),
            (v_mod1, 1,
             $txt$Buka folder instalasi XAMPP di C:\xampp\htdocs, kemudian buat folder baru bernama 'praktikum_db' menggunakan huruf kecil semua dan tanpa spasi.$txt$,
             $txt$Hindari penggunaan spasi pada nama folder agar URL di browser tidak berubah menjadi karakter '%20' yang membingungkan.$txt$),
            (v_mod1, 2,
             $txt$Buka browser dan akses alamat http://localhost/phpmyadmin, lalu buat database baru dengan nama 'db_kampus'.$txt$,
             $txt$Ingat baik-baik ejaan nama database yang Anda ketik karena harus sama persis saat ditulis di dalam kode program.$txt$),
            (v_mod1, 3,
             $txt$Buat file baru bernama 'koneksi.php' di dalam VS Code, ketik perintah mysqli_connect('localhost', 'root', '', 'db_kampus'), lalu simpan dan uji di browser.$txt$,
             $txt$Parameter ketiga adalah password. Untuk XAMPP standar di laboratorium, biarkan kosong menggunakan tanda kutip dua '' tanpa spasi di dalamnya.$txt$),
            (v_mod2, 0,
             $txt$Buka VS Code dan buat file baru dengan nama 'cek_nilai.py'. Pastikan akhiran nama file adalah .py.$txt$,
             $txt$Periksa ikon di sebelah nama file, jika sudah bergambar logo Python berarti ekstensi file sudah benar.$txt$),
            (v_mod2, 1,
             $txt$Buat variabel nilai = int(input('Masukkan nilai ujian: ')) pada baris pertama.$txt$,
             $txt$Fungsi int() wajib ditulis agar angka yang diketik pengguna tidak dianggap sebagai teks biasa oleh komputer.$txt$),
            (v_mod2, 2,
             $txt$Ketik kondisi 'if nilai >= 75:' diakhiri tanda titik dua (:), lalu tekan Enter dan ketik print('Lulus') secara menjorok ke dalam (1x tombol Tab).$txt$,
             $txt$Bahasa Python sangat sensitif terhadap jarak spasi (Tab). Baris di bawah 'if' wajib menjorok ke kanan agar terbaca sebagai bagian dari kondisi tersebut.$txt$);
    end if;

    if not exists (select 1 from public.troubleshooting_cases) then
        insert into public.troubleshooting_cases (legacy_id, category, symptom, cause, solution)
        values
            ('seed-101', 'Basis Data',
             $txt$Muncul pesan 'Error: MySQL shutdown unexpectedly' saat menekan Start di XAMPP.$txt$,
             $txt$Port standar 3306 sedang dipakai oleh layanan MySQL lain di komputer laboratorium atau komputer dimatikan secara paksa sebelumnya.$txt$,
             $txt$Minta mahasiswa membuka Task Manager -> tab Services -> cari 'MySQL80' -> klik kanan dan pilih 'Stop', lalu coba klik Start kembali di XAMPP.$txt$),
            ('seed-102', 'Pemrograman Dasar',
             $txt$Muncul pesan 'IndentationError: expected an indented block' saat menjalankan kode Python.$txt$,
             $txt$Mahasiswa lupa menekan tombol Tab (menjorokkan teks ke dalam) setelah menulis baris yang diakhiri tanda titik dua (seperti if, for, atau def).$txt$,
             $txt$Tunjukkan baris nomor error yang tertera di terminal, lalu arahkan mahasiswa untuk menekan tombol 'Tab' satu kali tepat di awal baris kode di bawah titik dua.$txt$),
            ('seed-103', 'Basis Data',
             $txt$Halaman web menampilkan 'Unknown database' padahal mahasiswa merasa sudah membuat database.$txt$,
             $txt$Terjadi salah ketik (typo) antara nama database di phpMyAdmin dengan nama yang ditulis di dalam file koneksi.php.$txt$,
             $txt$Ajak mahasiswa menyandingkan layar phpMyAdmin dan kode program secara berdampingan, lalu periksa huruf besar/kecil dan garis bawah (_) satu per satu.$txt$),
            ('seed-104', 'Jaringan & Server',
             $txt$Browser menampilkan '404 Not Found' saat membuka file praktikum di localhost.$txt$,
             $txt$Mahasiswa menyimpan file di folder Documents atau Desktop, bukan di dalam folder C:\xampp\htdocs.$txt$,
             $txt$Jelaskan bahwa 'localhost' hanya membaca isi folder 'htdocs'. Pandu mahasiswa memindahkan folder kerja mereka ke dalam C:\xampp\htdocs.$txt$),
            ('seed-105', 'Perangkat Lab',
             $txt$Tombol Run / Terminal di VS Code tidak merespons atau tidak memunculkan hasil apa pun.$txt$,
             $txt$File program belum disimpan (Save) setelah diedit sehingga komputer menjalankan file kosong versi lama.$txt$,
             $txt$Tunjukkan tanda bulatan putih di tab nama file atas (tanda belum di-save). Ingatkan mahasiswa untuk selalu menekan Ctrl + S sebelum menekan tombol Run.$txt$);
    end if;

    if not exists (select 1 from public.glossary_terms) then
        insert into public.glossary_terms (legacy_id, term, def, analogy)
        values
            ('seed-201', $txt$Variabel vs Tipe Data$txt$,
             $txt$Tempat penyimpanan data di dalam memori komputer beserta jenis isinya.$txt$,
             $txt$Ibaratkan Variabel seperti 'Toples Dapur' yang diberi label nama, sedangkan Tipe Data adalah jenis isinya: ada toples khusus cairan (Float), khusus beras/butiran (Integer), atau khusus label kertas (String).$txt$),
            ('seed-202', $txt$Primary Key & Foreign Key$txt$,
             $txt$Kunci pengenal unik pada tabel database dan kunci penghubung antar-tabel.$txt$,
             $txt$Primary Key ibarat 'Nomor Induk Mahasiswa (NIM)' di kartu mahasiswa yang tidak mungkin kembar. Saat Anda meminjam buku di perpustakaan, NIM yang ditulis di buku pinjaman itulah yang disebut Foreign Key.$txt$),
            ('seed-203', $txt$Perulangan (Looping For / While)$txt$,
             $txt$Instruksi untuk menjalankan blok kode secara berulang selama kondisi terpenuhi.$txt$,
             $txt$Seperti instruksi pelatih olahraga: 'Lari keliling lapangan sebanyak 5 putaran (For Loop)' atau 'Lari terus sampai peluit berbunyi (While Loop)'.$txt$),
            ('seed-204', $txt$Frontend vs Backend$txt$,
             $txt$Pemisahan antara bagian antarmuka pengguna dan pemrosesan data di balik layar.$txt$,
             $txt$Seperti di restoran: Frontend adalah ruang makan dan buku menu yang dilihat pelanggan, sedangkan Backend adalah dapur tempat koki memasak pesanan Anda.$txt$),
            ('seed-205', $txt$Array / List (Indeks mulai dari 0)$txt$,
             $txt$Kumpulan data berurutan dalam satu variabel dengan penomoran posisi mulai dari angka 0.$txt$,
             $txt$Ibarat gedung lift di pusat perbelanjaan yang lantainya dimulai dari Lantai Dasar (Ground / 0) terlebih dahulu sebelum naik ke Lantai 1, 2, dan seterusnya.$txt$);
    end if;

    if not exists (select 1 from public.checklist_items) then
        insert into public.checklist_items (legacy_id, text, checked, position)
        values
            ('seed-301', $txt$Sudah mencoba seluruh langkah modul praktikum hari ini dari awal hingga akhir tanpa error.$txt$, true, 0),
            ('seed-302', $txt$Memastikan aplikasi/software utama di komputer laboratorium berjalan normal.$txt$, true, 1),
            ('seed-303', $txt$Menyiapkan minimal 2 analogi sederhana untuk menjelaskan konsep sulit di modul hari ini.$txt$, true, 2),
            ('seed-304', $txt$Membaca daftar kemungkinan error di menu Bank Troubleshooting sesuai topik hari ini.$txt$, false, 3),
            ('seed-305', $txt$Membagikan file modul / aset praktikum ke folder bersama mahasiswa sebelum kelas dimulai.$txt$, false, 4);
    end if;

    if not exists (select 1 from public.eval_logs) then
        insert into public.eval_logs (legacy_id, date, session, confused, action)
        values (
            'seed-401',
            $txt$Sesi Sebelumnya$txt$,
            $txt$Kelas TI-1B - Praktikum Pengenalan Python$txt$,
            $txt$Mahasiswa bingung membedakan tanda sama dengan satu (=) dan sama dengan dua (==) pada materi If-Else.$txt$,
            $txt$Menambahkan kotak catatan khusus di Langkah ke-3 modul dan menambahkan analoginya di menu Glosarium.$txt$
        );
    end if;
end;
$$;
