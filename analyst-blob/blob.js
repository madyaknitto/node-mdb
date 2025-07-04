const { spawn } = require('child_process');
const path = require('path');
const util = require('util');
const fs = require('fs');

// --- KONFIGURASI ---
const dbPath = path.join(__dirname, '..', 'db', 'iControl9.mdb');
const powershellScriptPath = path.join(__dirname, 'db_executor.ps1');
const sqlQuery = "SELECT TOP 20 * FROM FORMULA_GROUP";
// -------------------

/**
 * Helper class untuk membaca data dari Buffer secara sekuensial.
 */
class BinaryReader {
    constructor(buffer) {
        this.buffer = buffer;
        this.offset = 0;
    }
    isAtEnd(padding = 0) { return this.offset >= this.buffer.length - padding; }
    skip(bytes) { this.offset += bytes; }
    readUInt8() {
        if (this.isAtEnd()) return 0;
        const value = this.buffer.readUInt8(this.offset);
        this.offset += 1;
        return value;
    }
    readString(length, encoding) {
        if (this.offset + length > this.buffer.length) {
            length = this.buffer.length - this.offset;
        }
        if (length <= 0) return '';
        const slice = this.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return slice.toString(encoding).replace(/\u0000/g, '').trim();
    }
    peekBytes(length) { return this.buffer.slice(this.offset, this.offset + length); }
}

/**
 * ✅ DECODER BLOB (REFAKTORED)
 * Mengubah data biner menjadi string tunggal yang digabungkan.
 */
function decodeFormulaBlob(base64String) {
    if (!base64String || typeof base64String !== 'string') return null;
    try {
        const buffer = Buffer.from(base64String, 'base64');
        const reader = new BinaryReader(buffer);
        const decodedParts = []; // Array untuk menampung semua bagian string

        while (!reader.isAtEnd(3)) {
            const peekHex3 = reader.peekBytes(3).toString('hex');
            const peekHex4 = reader.peekBytes(4).toString('hex');

            if (peekHex4 === '01fffeff') { // Marker untuk judul
                reader.skip(4);
                const titleLength = reader.readUInt8();
                const title = reader.readString(titleLength * 2, 'utf16le');
                if (title) decodedParts.push(title);
                continue;

            } else if (peekHex3 === 'fffeff') { // Marker untuk string generik
                reader.skip(3);
                const stringLength = reader.readUInt8();
                if (stringLength === 0) continue;
                const fullString = reader.readString(stringLength * 2, 'utf16le');
                if (fullString) decodedParts.push(fullString);

            } else {
                reader.skip(1);
            }
        }

        if (decodedParts.length === 0) {
            return `[Data Biner Tidak Dikenali: ${buffer.length} bytes]`;
        }
        
        // Gabungkan semua bagian menjadi satu string, dipisahkan oleh " | "
        return decodedParts.join(' | ');

    } catch (error) {
        console.error(`[Decode Error] Gagal mem-parsing BLOB: ${error.message}`);
        return `[Decode Error: ${error.message}]`;
    }
}

/**
 * Fungsi utama untuk menjalankan seluruh proses.
 */
async function main() {
    console.log('--- Node.js PowerShell Executor ---');
    try {
        console.log(`🚀 Menjalankan query: "${sqlQuery}"`);
        const ps = spawn('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-NoLogo', '-WindowStyle', 'Hidden',
            '-ExecutionPolicy', 'Bypass',
            '-File', powershellScriptPath,
            '-SqlQuery', sqlQuery,
            '-DbPath', dbPath
        ]);

        let jsonData = '';
        let errorData = '';
        ps.stdout.on('data', (chunk) => jsonData += chunk.toString());
        ps.stderr.on('data', (chunk) => errorData += chunk.toString());

        await new Promise((resolve, reject) => {
            ps.on('close', (code) => {
                if (code === 0) {
                    try {
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        
                        const jsonStartIndex = jsonData.indexOf('[');
                        const jsonEndIndex = jsonData.lastIndexOf(']');
                        if (jsonStartIndex === -1 || jsonEndIndex === -1) {
                            throw new Error("Output dari PowerShell bukan JSON array yang valid.");
                        }
                        const cleanJsonString = jsonData.substring(jsonStartIndex, jsonEndIndex + 1);
                        
                        let parsedData = JSON.parse(cleanJsonString);
                        if (!Array.isArray(parsedData)) parsedData = [parsedData];

                        const jsonFilePath = path.join(__dirname, `raw_data_${timestamp}.json`);
                        fs.writeFileSync(jsonFilePath, JSON.stringify(parsedData, null, 2));
                        console.log(`💾 Data JSON mentah disimpan ke: ${jsonFilePath}`);

                        const decodedData = parsedData.map(row => {
                            const newRow = { ...row };
                            for (const key in newRow) {
                                if (key.includes('FORM') && newRow[key]) {
                                    newRow[`${key}_DECODED`] = decodeFormulaBlob(newRow[key]);
                                }
                            }
                            return newRow;
                        });

                        let decodedTextContent = '';
                        decodedData.forEach((row, index) => {
                            let hasDecodedData = false;
                            const recordHeader = `=== RECORD ${index + 1} ===\n`;
                            let recordContent = '';

                            for (const key in row) {
                                if (key.endsWith('_DECODED') && typeof row[key] === 'string') {
                                    hasDecodedData = true;
                                    recordContent += `[Kolom: ${key.replace('_DECODED', '')}] ${row[key]}\n`;
                                }
                            }

                            if (hasDecodedData) {
                                decodedTextContent += recordHeader + recordContent + '\n';
                            }
                        });

                        if (decodedTextContent) {
                            const txtFilePath = path.join(__dirname, `decoded_data_${timestamp}.txt`);
                            fs.writeFileSync(txtFilePath, decodedTextContent.trim());
                            console.log(`💾 Data hasil decode disimpan ke: ${txtFilePath}`);
                        } else {
                            console.log('ℹ️ Tidak ada data BLOB untuk di-decode dan disimpan.');
                        }

                        console.log('✅ Hasil (juga ditampilkan di konsol):');
                        console.log('\n📋 Data yang sudah di-decode:\n' + '='.repeat(80));
                        console.log(util.inspect(decodedData, { depth: null, colors: true }));
                        resolve();

                    } catch (parseError) {
                        console.error('❌ Error parsing JSON dari PowerShell:', parseError);
                        console.error('--- Raw Data from PowerShell ---');
                        console.error(jsonData);
                        console.error('--------------------------------');
                        reject(parseError);
                    }
                } else {
                    console.error(`❌ PowerShell exited with code ${code}.`);
                    console.error('--- PowerShell Error Details ---');
                    console.error(errorData);
                    console.error('--------------------------------');
                    reject(new Error(`PowerShell script failed. See details above.`));
                }
            });
        });
    } catch (err) {
        console.error('❌ Terjadi error pada proses utama:', err.message);
    }
}

main();
