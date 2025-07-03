// FILE: index-node-adodb.js
// Menggunakan library: node-adodb

const ADODB = require('node-adodb');

// --- KONFIGURASI ---
const dbPath = './db/iControl9.mdb';
const defaultSqlQuery = "SELECT TOP 10 * FROM DATA_GROUP";
const sqlQuery = process.argv[2] || defaultSqlQuery;
// -------------------

const connection = ADODB.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${dbPath};`);

async function getData() {
  console.log('--- Menguji node-adodb ---');
  try {
    console.log(`🚀 Menjalankan query: ${sqlQuery}`);
    const data = await connection.query(sqlQuery);
    console.log('✅ Hasil:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getData();