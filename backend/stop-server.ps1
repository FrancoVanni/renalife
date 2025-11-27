# Detener todos los procesos Node que puedan estar usando el puerto 3000
Write-Host "Buscando procesos Node en el puerto 3000..."

# Método 1: Buscar por puerto
$connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Deteniendo proceso: $($process.ProcessName) (PID: $pid)"
            Stop-Process -Id $pid -Force
        }
    }
    Write-Host "✅ Procesos detenidos."
} else {
    Write-Host "No se encontraron procesos usando el puerto 3000."
}

# Método 2: Detener todos los procesos node (más agresivo)
Write-Host "`nDeteniendo todos los procesos Node..."
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Write-Host "Deteniendo: $($_.ProcessName) (PID: $($_.Id))"
        Stop-Process -Id $_.Id -Force
    }
    Write-Host "✅ Todos los procesos Node detenidos."
} else {
    Write-Host "No se encontraron procesos Node corriendo."
}

Write-Host "`nEspera 2 segundos y luego ejecuta: npm run start:dev"
Start-Sleep -Seconds 2

