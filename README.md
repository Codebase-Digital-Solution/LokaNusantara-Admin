# BaliGuide Admin (web)

Panel admin untuk mengelola data BaliGuide. Pengguna umum memakai aplikasi mobile (`../app`);
web ini hanya untuk admin.

## Yang bisa dikelola

| Menu | Isi |
| --- | --- |
| Dasbor | Jumlah data per jenis |
| Lokasi | Tambah, ubah, hapus tempat (koordinat bisa dipilih dari peta), termasuk deskripsi dan sejarah |
| Kategori | Kategori lokasi dan agenda |
| Agenda Budaya | Upacara dan acara, termasuk tanggal perkiraan |
| Jalur Kisah | Rute bertema dengan urutan perhentian |
| Ulasan | Moderasi ulasan pengguna (hapus) |

## Akun admin

Akun admin dibuat oleh API saat start dari variabel `ADMIN_EMAIL`, `ADMIN_PASSWORD`, dan
`ADMIN_NAME` di `api/.env`. Jika email itu sudah terdaftar sebagai pengguna biasa, akunnya
dinaikkan menjadi admin (password tidak diubah). Akun non-admin ditolak saat login, dan
semua endpoint tulis di API dijaga oleh role admin.

## Menjalankan

```bash
npm install
API_UPSTREAM_URL=http://localhost:8080 npm run dev
```

Browser memanggil `/api/v1` di origin web, lalu Next meneruskannya ke `API_UPSTREAM_URL`
(default: URL ngrok di `next.config.ts`). Restart `npm run dev` setelah mengubah variabel ini.

Buka http://localhost:3000, lalu masuk dengan akun admin.
