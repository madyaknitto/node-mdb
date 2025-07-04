# Konektor Node.js -> MDB via PowerShell

## 🎯 **Fokus Utama**
Mengekstrak data, termasuk kolom `BLOB` yang kompleks, dari database Microsoft Access (.mdb) menggunakan Node.js sebagai *orchestrator* dan PowerShell sebagai *executor*.

## 🏗️ **Arsitektur**
- **Orchestrator**: Node.js (`analyst-blob/blob.js`)
- **Executor**: PowerShell (`analyst-blob/db_executor.ps1`)
- **Mekanisme**: Node.js menjalankan PowerShell *child process* untuk mengakses database via `System.Data.OleDb`.
- **Data Flow**: `MDB -> PowerShell -> JSON (stdout) -> Node.js -> Decode BLOB -> File Output (.json, .txt)`

## ⚙️ **Dependensi Kunci**
- **Driver**: [Microsoft Access Database Engine 2016 Redistributable (64-bit)](https://www.microsoft.com/en-us/download/details.aspx?id=54920)
    - **PENTING**: **Wajib install versi 64-bit (`accessdatabaseengine_X64.exe`)** powershell support.

## 🚀 **Setup & Eksekusi**
1.  **Jalankan Skrip**: Buka terminal di root proyek dan jalankan:
    ```bash
    pnpm start:ps
    ```
2.  **Isi Hexadecimal**: Command untuk cek hexadecimal
    ```bash
    pnpm start:hex
    ```

## 📄 **Struktur Output**
Skrip akan menghasilkan dua file di dalam folder `analyst-blob/` dengan *timestamp*:
-   `raw_data_[timestamp].json`: Output JSON mentah dari database.
-   `decoded_data_[timestamp].txt`: Ekstrak hasil decode dari kolom `BLOB`, diformat untuk analisis.
