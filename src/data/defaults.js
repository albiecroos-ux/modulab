export const defaultInitialData = {
  modules: [
    {
      title: 'Praktikum 1: Koneksi Database MySQL dengan PHP Dasar',
      duration: '90 Menit',
      goal: 'Mahasiswa mampu membuat koneksi antara halaman web PHP dan database MySQL tanpa mengalami kendala error konfigurasi port atau nama tabel.',
      tools: 'XAMPP Control Panel, Visual Studio Code, Web Browser (Chrome/Firefox)',
      attachments: [
        {
          name: 'Video Panduan Singkat Setup XAMPP & MySQL (YouTube)',
          type: 'youtube',
          url: 'https://www.youtube.com/embed/yM8b0715Y2k'
        }
      ],
      steps: [
        {
          instruction:
            "Buka aplikasi XAMPP Control Panel, lalu klik tombol 'Start' pada baris module Apache dan MySQL hingga indikator berubah warna menjadi hijau.",
          tip: 'Jika MySQL gagal menyala (merah), jangan panik. Cek apakah aplikasi MySQL Workbench sedang terbuka dan menutup jalur port 3306.'
        },
        {
          instruction:
            "Buka folder instalasi XAMPP di C:\\xampp\\htdocs, kemudian buat folder baru bernama 'praktikum_db' menggunakan huruf kecil semua dan tanpa spasi.",
          tip: "Hindari penggunaan spasi pada nama folder agar URL di browser tidak berubah menjadi karakter '%20' yang membingungkan."
        },
        {
          instruction:
            "Buka browser dan akses alamat http://localhost/phpmyadmin, lalu buat database baru dengan nama 'db_kampus'.",
          tip: 'Ingat baik-baik ejaan nama database yang Anda ketik karena harus sama persis saat ditulis di dalam kode program.'
        },
        {
          instruction:
            "Buat file baru bernama 'koneksi.php' di dalam VS Code, ketik perintah mysqli_connect('localhost', 'root', '', 'db_kampus'), lalu simpan dan uji di browser.",
          tip: "Parameter ketiga adalah password. Untuk XAMPP standar di laboratorium, biarkan kosong menggunakan tanda kutip dua '' tanpa spasi di dalamnya."
        }
      ]
    },
    {
      title: 'Praktikum 2: Percabangan Logika (If-Else) pada Python',
      duration: '60 Menit',
      goal: 'Mahasiswa memahami cara kerja pengambilan keputusan dalam kode program dan tidak melakukan kesalahan spasi (indentasi).',
      tools: 'Python 3.x, VS Code / IDLE Python',
      attachments: [],
      steps: [
        {
          instruction: "Buka VS Code dan buat file baru dengan nama 'cek_nilai.py'. Pastikan akhiran nama file adalah .py.",
          tip: 'Periksa ikon di sebelah nama file, jika sudah bergambar logo Python berarti ekstensi file sudah benar.'
        },
        {
          instruction: "Buat variabel nilai = int(input('Masukkan nilai ujian: ')) pada baris pertama.",
          tip: 'Fungsi int() wajib ditulis agar angka yang diketik pengguna tidak dianggap sebagai teks biasa oleh komputer.'
        },
        {
          instruction:
            "Ketik kondisi 'if nilai >= 75:' diakhiri tanda titik dua (:), lalu tekan Enter dan ketik print('Lulus') secara menjorok ke dalam (1x tombol Tab).",
          tip: "Bahasa Python sangat sensitif terhadap jarak spasi (Tab). Baris di bawah 'if' wajib menjorok ke kanan agar terbaca sebagai bagian dari kondisi tersebut."
        }
      ]
    }
  ],
  troubleshooting: [
    {
      category: 'Basis Data',
      symptom: "Muncul pesan 'Error: MySQL shutdown unexpectedly' saat menekan Start di XAMPP.",
      cause: 'Port standar 3306 sedang dipakai oleh layanan MySQL lain di komputer laboratorium atau komputer dimatikan secara paksa sebelumnya.',
      solution: "Minta mahasiswa membuka Task Manager -> tab Services -> cari 'MySQL80' -> klik kanan dan pilih 'Stop', lalu coba klik Start kembali di XAMPP."
    },
    {
      category: 'Pemrograman Dasar',
      symptom: "Muncul pesan 'IndentationError: expected an indented block' saat menjalankan kode Python.",
      cause: 'Mahasiswa lupa menekan tombol Tab (menjorokkan teks ke dalam) setelah menulis baris yang diakhiri tanda titik dua (seperti if, for, atau def).',
      solution: "Tunjukkan baris nomor error yang tertera di terminal, lalu arahkan mahasiswa untuk menekan tombol 'Tab' satu kali tepat di awal baris kode di bawah titik dua."
    },
    {
      category: 'Basis Data',
      symptom: "Halaman web menampilkan 'Unknown database' padahal mahasiswa merasa sudah membuat database.",
      cause: 'Terjadi salah ketik (typo) antara nama database di phpMyAdmin dengan nama yang ditulis di dalam file koneksi.php.',
      solution: 'Ajak mahasiswa menyandingkan layar phpMyAdmin dan kode program secara berdampingan, lalu periksa huruf besar/kecil dan garis bawah (_) satu per satu.'
    },
    {
      category: 'Jaringan & Server',
      symptom: "Browser menampilkan '404 Not Found' saat membuka file praktikum di localhost.",
      cause: 'Mahasiswa menyimpan file di folder Documents atau Desktop, bukan di dalam folder C:\\xampp\\htdocs.',
      solution: "Jelaskan bahwa 'localhost' hanya membaca isi folder 'htdocs'. Pandu mahasiswa memindahkan folder kerja mereka ke dalam C:\\xampp\\htdocs."
    },
    {
      category: 'Perangkat Lab',
      symptom: 'Tombol Run / Terminal di VS Code tidak merespons atau tidak memunculkan hasil apa pun.',
      cause: 'File program belum disimpan (Save) setelah diedit sehingga komputer menjalankan file kosong versi lama.',
      solution: 'Tunjukkan tanda bulatan putih di tab nama file atas (tanda belum di-save). Ingatkan mahasiswa untuk selalu menekan Ctrl + S sebelum menekan tombol Run.'
    }
  ],
  analogies: [
    {
      term: 'Variabel vs Tipe Data',
      def: 'Tempat penyimpanan data di dalam memori komputer beserta jenis isinya.',
      analogy:
        "Ibaratkan Variabel seperti 'Toples Dapur' yang diberi label nama, sedangkan Tipe Data adalah jenis isinya: ada toples khusus cairan (Float), khusus beras/butiran (Integer), atau khusus label kertas (String)."
    },
    {
      term: 'Primary Key & Foreign Key',
      def: 'Kunci pengenal unik pada tabel database dan kunci penghubung antar-tabel.',
      analogy:
        "Primary Key ibarat 'Nomor Induk Mahasiswa (NIM)' di kartu mahasiswa yang tidak mungkin kembar. Saat Anda meminjam buku di perpustakaan, NIM yang ditulis di buku pinjaman itulah yang disebut Foreign Key."
    },
    {
      term: 'Perulangan (Looping For / While)',
      def: 'Instruksi untuk menjalankan blok kode secara berulang selama kondisi terpenuhi.',
      analogy:
        "Seperti instruksi pelatih olahraga: 'Lari keliling lapangan sebanyak 5 putaran (For Loop)' atau 'Lari terus sampai peluit berbunyi (While Loop)'."
    },
    {
      term: 'Frontend vs Backend',
      def: 'Pemisahan antara bagian antarmuka pengguna dan pemrosesan data di balik layar.',
      analogy:
        'Seperti di restoran: Frontend adalah ruang makan dan buku menu yang dilihat pelanggan, sedangkan Backend adalah dapur tempat koki memasak pesanan Anda.'
    },
    {
      term: 'Array / List (Indeks mulai dari 0)',
      def: 'Kumpulan data berurutan dalam satu variabel dengan penomoran posisi mulai dari angka 0.',
      analogy:
        'Ibarat gedung lift di pusat perbelanjaan yang lantainya dimulai dari Lantai Dasar (Ground / 0) terlebih dahulu sebelum naik ke Lantai 1, 2, dan seterusnya.'
    }
  ],
  checklist: [
    { text: 'Sudah mencoba seluruh langkah modul praktikum hari ini dari awal hingga akhir tanpa error.', checked: true },
    { text: 'Memastikan aplikasi/software utama di komputer laboratorium berjalan normal.', checked: true },
    { text: 'Menyiapkan minimal 2 analogi sederhana untuk menjelaskan konsep sulit di modul hari ini.', checked: true },
    { text: 'Membaca daftar kemungkinan error di menu Bank Troubleshooting sesuai topik hari ini.', checked: false },
    { text: 'Membagikan file modul / aset praktikum ke folder bersama mahasiswa sebelum kelas dimulai.', checked: false }
  ],
  evalLogs: [
    {
      date: 'Sesi Sebelumnya',
      session: 'Kelas TI-1B - Praktikum Pengenalan Python',
      confused:
        'Mahasiswa bingung membedakan tanda sama dengan satu (=) dan sama dengan dua (==) pada materi If-Else.',
      action:
        'Menambahkan kotak catatan khusus di Langkah ke-3 modul dan menambahkan analoginya di menu Glosarium.'
    }
  ]
};
