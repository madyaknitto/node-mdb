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

3. **Jika mengalami error "Provider cannot be found", install driver berikut:**
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
pnpm start "SELECT DDATE, DNAME, DTSV_1, DTSV_2, DTSV_3 FROM DATA_GROUP WHERE DNAME = 'K6T389BE-BEM032AE0' ORDER BY DDATE ASC"
```

```bash
pnpm start "SELECT DDATE, DNAME, DTSV_1, DTSV_2, DTSV_3, STSV_1, STSV_2, STSV_3 FROM DATA_GROUP d INNER JOIN STANDARDS_GROUP s ON (s.SSPECTRAL_ID1=d.DSTANDARD_ID1 AND s.SSPECTRAL_ID2=d.DSTANDARD_ID2 and s.SSPECTRAL_ID3=d.DSTANDARD_ID3)"
```

### 3. Contoh Query Lainnya

**Mengambil data dengan filter:**
```bash
pnpm start "SELECT DNAME, DDATE FROM DATA_GROUP WHERE DNAME LIKE '%BEM%'"
```

**Mengambil data dengan limit:**
```bash
pnpm start "SELECT TOP 5 DDATE, DNAME, DTSV_1 FROM DATA_GROUP ORDER BY DDATE DESC"
```

**Count data:**
```bash
pnpm start "SELECT COUNT(*) FROM DATA_GROUP"
```

 