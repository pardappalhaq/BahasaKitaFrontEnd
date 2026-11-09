# BahasaKita — Versi HTML, CSS, JavaScript Murni

Projek website **BahasaKita** yang dibuat ulang menggunakan **HTML, CSS, dan JavaScript murni (Vanilla JS)** tanpa menggunakan React atau framework/bundler apa pun.

Platform e-learning Bahasa Isyarat Indonesia yang ramah aksesibilitas dan inklusif untuk siswa tunarungu (jenjang SD, SMP, SMA).

---

## 📁 Struktur File

```
BahasaKitaFrontEnd/
├── index.html          # Halaman utama (SPA - Single Page Application)
├── css/
│   ├── reference.css   # Tema biru-putih terinspirasi referensi, hero dan navigasi horizontal
│   └── style.css       # Styling lengkap (desain sistem BahasaKita asli, tema gelap/terang, responsif)
├── js/
│   ├── app.js          # Logika aplikasi, router, state management, interaktivitas
│   ├── data.js         # Data materi pembelajaran, kamus visual, video YouTube, soal asesmen
│   └── icons.js        # Kumpulan ikon SVG kustom BahasaKita
└── README.md           # Dokumentasi projek
```

---

## ✨ Fitur-Fitur yang Tersedia

1. **Layar Pembuka (Splash Screen):**
   - Animasi logo dan tagline BahasaKita
   - Loading indicator tiga titik berkedip

2. **Autentikasi (Login & Register):**
   - Form Login dengan opsi simpan email dan sembunyikan/tampilkan kata sandi
   - Form Register dengan pemilihan peran: Siswa, Guru, Orang Tua
   - Pemilihan jenjang belajar (SD, SMP, SMA)
   - Opsi Masuk Demo / Akun Cepat menggunakan Google

3. **Beranda (Home Dashboard):**
   - Kartu fokus belajar sesuai kondisi murid (asesmen awal / rekomendasi materi / materi selesai)
   - Indikator progres materi yang dikuasai
   - Grid 4 Aspek Kemampuan: Kosakata, Kalimat, Bacaan, Matematika
   - Carousel video pembelajaran interaktif yang dapat digeser (video YouTube kurasi resmi SLB/PKPLK)
   - Tautan cepat ke Kamus Visual

4. **Jalur Belajar (Learning Path):**
   - Alur materi berurutan untuk jenjang SD, SMP, dan SMA
   - Materi terkunci yang terbuka secara otomatis setelah materi sebelumnya diselesaikan
   - Sesi belajar 4 tahap: **Pengantar → Isyarat & Visual → Latihan → Evaluasi**

5. **Kamus Visual (Visual Dictionary):**
   - Tab filter jenjang (SD / SMP / SMA)
   - Pencarian kosakata secara instan
   - Filter berdasarkan kategori (Tumbuhan, Hewan, Tubuh, Alam, Tempat, Sikap, dll.)
   - Dialog kartu kata lengkap dengan emoji, arti, kalimat contoh, dan tautan ke video konteks
   - Koleksi video pembelajaran tematik per jenjang

6. **Asesmen Awal (Assessment):**
   - 8 soal acak per jenjang yang menguji 4 aspek kemampuan
   - Menghasilkan profil skor awal dan membuka jalur belajar setelah lulus (nilai minimal 80)

7. **Kemajuan Saya (Progress):**
   - Statistik materi yang dikuasai, sesi belajar, dan estimasi waktu
   - Grafik profil kemampuan pada 4 aspek
   - Riwayat jejak belajar

8. **Profil & Pengaturan (Profile & Settings):**
   - Edit profil panggilan dan jenjang belajar
   - Reset data dan keluar akun

9. **Desain Responsif & Ramah Aksesibilitas:**
   - Sidebar navigasi untuk desktop
   - Bottom navigation bar untuk tampilan mobile (HP)
   - Tombol skip-link untuk pembaca layar (screen reader)
   - Desain responsif di semua ukuran layar (Desktop, Tablet, Ponsel)

---

## Cara Menjalankan

### Cara 1: Menggunakan XAMPP
Jalankan Apache dari XAMPP, lalu buka `http://localhost/BahasaKitaFrontEnd/` jika folder proyek berada di `htdocs`. Pemutar YouTube memerlukan halaman yang disajikan melalui HTTP atau HTTPS.

### Cara 2: Menggunakan Live Server
Jika Anda menggunakan VS Code:
1. Buka folder `BahasaKitaFrontEnd` di VS Code.
2. Klik kanan pada `index.html` lalu pilih **Open with Live Server**.

### Cara 3: Menggunakan Command Line
```bash
# Menggunakan serve (Node.js)
npx serve .

# Atau menggunakan Python
python -m http.server 8000
```
Buka browser di `http://localhost:8000` atau alamat yang tertera.

---

## Palet Warna & Desain

- **Warna Utama (Primary):** `#1559E8` (Biru)
- **Aksen Lembut:** `#EAF0FF`
- **Latar Belakang:** `#F8FAFC` (Terang) / `#0F172A` (Gelap)
- **Panel/Kartu:** `#FFFFFF` (Terang) / `#172237` (Gelap)
- **Teks Utama:** `#0F172A` (Terang) / `#F8FAFC` (Gelap)
- **Tipografi:** Segoe UI, Arial, sans-serif

## Pembaruan visual

Tema baru memakai navigasi horizontal di desktop, hero foto organik, judul serif, bar pintasan mengambang, serta kartu aspek belajar berwarna. Halaman masuk dan daftar mengikuti tema yang sama. Tata letak menyesuaikan ponsel, serta mendukung tema gelap, kontras tinggi, dan pengurangan animasi. Gunakan **Coba versi demo** pada halaman masuk untuk melihat beranda.

Foto belajar bersama disimpan lokal di `images/belajar-bersama.jpg`, bersumber dari [Unsplash](https://images.unsplash.com/photo-1523240795612-9a054b0db644). Video pembelajaran tetap membutuhkan koneksi internet.

## Tema referensi terbaru — Wander

`css/wander.css` menerapkan tampilan krem dengan bayangan timbul lembut, sidebar vertikal, hero lukisan, panel progres organik, dan kartu materi. Ilustrasi AI disimpan lokal di `images/lukisan-belajar.png`. Pratinjau desktop: `images/pratinjau-wander.png`. Tema ini dimuat setelah stylesheet sebelumnya. Pemeriksaan mencakup sintaks JavaScript, render desktop 1280px dan ponsel 390px, serta konsol browser.

## Tema terbaru — Astro

Tema aktif kini `css/astro.css`, menggantikan tema Wander. Desain mengikuti referensi putih-hijau: judul Anton besar, navigasi horizontal, lima kartu foto menggantung dengan penjepit hijau dan garis lengkung. Di ponsel, kartu dapat digeser horizontal. Font dan foto disimpan lokal di `images/`. Pratinjau: `images/pratinjau-astro.png`.

Foto: Unsplash (ID aset tercantum pada riwayat perubahan); font Anton dari Google Fonts, berlisensi SIL Open Font License.
