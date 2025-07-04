param (
    [Parameter(Mandatory=$true)]
    [string]$SqlQuery,

    [Parameter(Mandatory=$true)]
    [string]$DbPath
)

# Inisialisasi variabel koneksi dan data
$connection = $null
$command = $null
$adapter = $null
$dataTable = $null

try {
    # Validasi path database sebelum digunakan
    if (-not (Test-Path $DbPath)) {
        throw "Database path not found: $DbPath"
    }
    $fullPath = (Resolve-Path $DbPath).Path

    # String koneksi untuk provider Microsoft Access Database Engine (ACE)
    # Diperlukan 'Microsoft Access Database Engine 2010/2016 Redistributable'
    $connString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$fullPath;"

    # Membuat dan membuka koneksi ke database
    $connection = New-Object System.Data.OleDb.OleDbConnection($connString)
    $connection.Open()

    # Menyiapkan command dan data adapter untuk eksekusi query
    $command = New-Object System.Data.OleDb.OleDbCommand($SqlQuery, $connection)
    $adapter = New-Object System.Data.OleDb.OleDbDataAdapter($command)
    $dataTable = New-Object System.Data.DataTable

    # Mengisi DataTable dengan hasil query. Output jumlah baris disembunyikan dengan Out-Null.
    $adapter.Fill($dataTable) | Out-Null

    # Memproses setiap baris dari hasil query
    $results = foreach ($row in $dataTable.Rows) {
        # Membuat PowerShell Custom Object untuk setiap baris
        $rowObject = [PSCustomObject]@{}
        foreach ($col in $dataTable.Columns) {
            $colName = $col.ColumnName
            $value = $row[$colName]

            # Perlakuan khusus untuk data biner (byte array)
            if ($value -is [byte[]]) {
                # Konversi data biner ke string Base64 agar aman ditransfer via JSON
                $processedValue = [Convert]::ToBase64String($value)
            } else {
                $processedValue = $value
            }
            # Menambahkan properti ke objek
            Add-Member -InputObject $rowObject -MemberType NoteProperty -Name $colName -Value $processedValue
        }
        # Mengembalikan objek yang sudah diproses
        $rowObject
    }

    # Mengonversi array hasil ke format JSON dengan kedalaman yang cukup untuk objek kompleks
    # -Compress untuk output yang lebih ringkas
    return $results | ConvertTo-Json -Depth 10 -Compress

} catch {
    # Menangani error dengan pesan yang lebih informatif dan mengarahkannya ke stream error
    $errorMessage = "❌ An error occurred in PowerShell script: $($_.Exception.Message)"
    Write-Error $errorMessage
    exit 1 # Keluar dengan status error
} finally {
    # Blok finally akan selalu dieksekusi, baik ada error maupun tidak.
    # Penting untuk menutup koneksi dan melepaskan resource untuk mencegah kebocoran memori.
    if ($connection -and $connection.State -eq "Open") {
        $connection.Close()
    }
    # Melepaskan objek COM secara eksplisit
    if ($adapter) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($adapter) | Out-Null }
    if ($command) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($command) | Out-Null }
    if ($connection) { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($connection) | Out-Null }
}
