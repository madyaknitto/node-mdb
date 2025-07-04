# Aplikasi Node.js - Koneksi Database Access MDB

Aplikasi Node.js sederhana untuk mengakses database Microsoft Access (.mdb) menggunakan library `node-adodb`.

## 📋 Prasyarat

- Node.js (versi 12 atau lebih tinggi)
- pnpm (Package Manager)
- Database Access file: `iControl9.mdb` di folder `db/`

## 🚀 Instalasi

1. **Clone atau download project ini**
2. **Install dependencies:**
   ```bash
   pnpm install node-adodb
   ```

3. **Pastikan struktur folder seperti ini:**
   ```
   aplikasi-node-mdb/
   ├── index.js
   ├── package.json
   ├── README.md
   └── db/
       └── iControl9.mdb
   ```

4. **Jika mengalami error "Provider cannot be found", install driver berikut:**
   - Download: [Microsoft Access Database Engine 2016 Redistributable](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
   - **Pilih versi 32-bit (`accessdatabaseengine.exe` 77.8 MB)** - untuk versi X64 library tidak bekerja
   - Install driver (restart komputer jika driver tidak bekerja)

## 📖 Cara Penggunaan

### 1. Menjalankan dengan Query Default

```bash
pnpm start
```

Akan menjalankan query default: `SELECT TOP 10 * FROM DATA_GROUP`

### 2. Menjalankan dengan Query Custom

```bash
pnpm start "SELECT COUNT(*) FROM DATA_GROUP"
```

```bash
pnpm start "SELECT DNAME FROM DATA_GROUP"
```

### 3. Contoh Query Lainnya

**Mengambil semua data:**
```bash
pnpm start "SELECT * FROM DATA_GROUP"
```

**Mengambil data dengan filter:**
```bash
pnpm start "SELECT * FROM DATA_GROUP WHERE NAMA LIKE '%test%'"
```

**Mengambil data dengan limit:**
```bash
pnpm start "SELECT TOP 5 * FROM DATA_GROUP ORDER BY ID"
```

 