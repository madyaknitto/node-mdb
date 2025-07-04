const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// --- KONFIGURASI ---
const dbPath = path.join(__dirname, '..', 'db', 'iControl9.mdb');
const powershellScriptPath = path.join(__dirname, 'db_executor.ps1');
const sqlQuery = process.argv[2] || "SELECT TOP 20 * FROM FORMULA_GROUP";
const outputReportFile = './analyst-blob/multi_blob_analysis_report.txt';
// -------------------

/**
 * Menghasilkan laporan hex dump yang detail dari buffer biner.
 * @param {Buffer} buffer - Buffer biner dari data BLOB.
 * @returns {string} - Laporan hex dump dalam format string.
 */
function createHexDump(buffer) {
    const bytesPerRow = 16;
    let output = "Offset(h) | Hex                                             | ASCII\n";
    output += "----------|-------------------------------------------------|----------------\n";

    for (let i = 0; i < buffer.length; i += bytesPerRow) {
        const rowBytes = buffer.slice(i, i + bytesPerRow);
        const offsetHex = i.toString(16).padStart(8, '0').toUpperCase();
        output += `${offsetHex} | `;

        let hexString = '';
        for (let j = 0; j < bytesPerRow; j++) {
            hexString += (j < rowBytes.length)
                ? rowBytes[j].toString(16).padStart(2, '0').toUpperCase() + ' '
                : '   ';
        }
        output += `${hexString.padEnd(bytesPerRow * 3)}| `;

        let charString = '';
        for (let j = 0; j < rowBytes.length; j++) {
            const byte = rowBytes[j];
            charString += (byte >= 32 && byte < 127) ? String.fromCharCode(byte) : '.';
        }
        output += `${charString}\n`;
    }
    return output;
}

/**
 * Fungsi utama untuk menjalankan proses analisis.
 */
async function runAnalysis() {
    console.log('--- 🚀 Memulai Analisis BLOB Otomatis dari Database ---');
    try {
        console.log(`🔍 Menjalankan Kueri: ${sqlQuery}`);

        const powershell = spawn('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-NoLogo', '-WindowStyle', 'Hidden',
            '-ExecutionPolicy', 'Bypass', '-File', powershellScriptPath,
            '-SqlQuery', sqlQuery, '-DbPath', dbPath
        ]);

        let jsonData = '';
        let errorData = '';
        powershell.stdout.on('data', (chunk) => jsonData += chunk.toString());
        powershell.stderr.on('data', (chunk) => errorData += chunk.toString());

        await new Promise((resolve, reject) => {
            powershell.on('close', (code) => {
                if (code !== 0) {
                    console.error(`❌ Skrip PowerShell gagal dengan kode ${code}:\n${errorData}`);
                    return reject(new Error(errorData));
                }

                try {
                    let records = JSON.parse(jsonData);
                    if (!Array.isArray(records)) records = [records];

                    console.log(`\n📊 Ditemukan ${records.length} record. Memulai analisis...\n`);
                    let fullReport = `Laporan Analisis Biner untuk Kueri: ${sqlQuery}\n\n`;

                    // **PERBAIKAN UTAMA**: Loop dan tampilkan semua analisis di konsol
                    records.forEach((record, index) => {
                        const reportHeader = `\n${'='.repeat(80)}\n| Analisis untuk Record #${index + 1}\n${'='.repeat(80)}\n\n`;
                        console.log(reportHeader);
                        fullReport += reportHeader;

                        if (record.ALTERNATE_FORM3) {
                            const buffer = Buffer.from(record.ALTERNATE_FORM3, 'base64');
                            const hexDump = createHexDump(buffer);
                            console.log(hexDump); // <-- Tampilkan di konsol
                            fullReport += hexDump;
                        } else {
                            const noDataMsg = "Tidak ada data BLOB di kolom ALTERNATE_FORM3 untuk record ini.\n";
                            console.log(noDataMsg);
                            fullReport += noDataMsg;
                        }
                        fullReport += "\n\n";
                    });

                    fs.writeFileSync(outputReportFile, fullReport, 'utf8');
                    console.log(`\n\n--- ✅ Laporan lengkap juga disimpan ke file: ${outputReportFile} ---`);
                    resolve();

                } catch (parseError) {
                    console.error('❌ Gagal mem-parsing JSON dari PowerShell:', parseError);
                    reject(parseError);
                }
            });
        });

    } catch (err) {
        console.error('❌ Terjadi kesalahan pada proses utama:', err);
    }
}

runAnalysis();