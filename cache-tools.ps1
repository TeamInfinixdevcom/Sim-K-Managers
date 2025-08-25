# SimKManager - Herramientas de Rendimiento PowerShell Script

param (
    [string]$Comando = "help"
)

# Función para mostrar ayuda
function Show-Help {
    Write-Host ""
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "                SIM KMANAGER - HERRAMIENTAS POWERAHELL            " -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso: .\cache-tools.ps1 [comando]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comandos disponibles:"
    Write-Host ""
    Write-Host "  stats                 Mostrar estadísticas de caché" -ForegroundColor Green
    Write-Host "  clear-all             Limpiar toda la caché" -ForegroundColor Green
    Write-Host "  clear-terminales      Limpiar caché de terminales" -ForegroundColor Green
    Write-Host "  clear-agents          Limpiar caché de agentes" -ForegroundColor Green
    Write-Host "  clear-historial       Limpiar caché de historial" -ForegroundColor Green
    Write-Host "  clear-notas           Limpiar caché de notas" -ForegroundColor Green
    Write-Host "  preload               Precargar todos los datos" -ForegroundColor Green
    Write-Host "  diagnostico           Ejecutar diagnóstico del sistema de caché" -ForegroundColor Green
    Write-Host "  help                  Mostrar esta ayuda" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ejemplos:"
    Write-Host "  .\cache-tools.ps1 stats" -ForegroundColor Yellow
    Write-Host "  .\cache-tools.ps1 clear-all" -ForegroundColor Yellow
    Write-Host "  .\cache-tools.ps1 clear-terminales" -ForegroundColor Yellow
    Write-Host "  .\cache-tools.ps1 preload" -ForegroundColor Yellow
    Write-Host "  .\cache-tools.ps1 diagnostico" -ForegroundColor Yellow
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host ""
}

# Función para ejecutar comandos Node.js
function Invoke-NodeCommand {
    param(
        [string]$NodeCommand
    )
    
    try {
        # Comprobar si estamos en el directorio correcto
        $currentDir = Get-Location
        $cliToolsPath = Join-Path $currentDir "Electron\cli-tools.js"
        
        if (-not (Test-Path $cliToolsPath)) {
            # Intentar buscar en el directorio Electron
            if (Test-Path ".\Electron") {
                Set-Location ".\Electron"
                $cliToolsPath = ".\cli-tools.js"
            } else {
                Write-Host "Error: No se encontró el archivo cli-tools.js" -ForegroundColor Red
                Write-Host "Ejecute este script desde el directorio raíz de SimKManager" -ForegroundColor Red
                return
            }
        }
        
        # Ejecutar el comando
        Write-Host "Ejecutando: node $cliToolsPath $NodeCommand" -ForegroundColor DarkGray
        node $cliToolsPath $NodeCommand
    }
    catch {
        Write-Host "Error al ejecutar el comando: $_" -ForegroundColor Red
    }
}

# Procesar el comando
switch ($Comando) {
    "help" {
        Show-Help
    }
    "stats" {
        Invoke-NodeCommand -NodeCommand "stats"
    }
    "clear-all" {
        Invoke-NodeCommand -NodeCommand "clear-cache"
    }
    "clear-terminales" {
        Invoke-NodeCommand -NodeCommand "clear-cache:terminales"
    }
    "clear-agents" {
        Invoke-NodeCommand -NodeCommand "clear-cache:agents"
    }
    "clear-historial" {
        Invoke-NodeCommand -NodeCommand "clear-cache:historial"
    }
    "clear-notas" {
        Invoke-NodeCommand -NodeCommand "clear-cache:notas"
    }
    "preload" {
        Invoke-NodeCommand -NodeCommand "preload"
    }
    "diagnostico" {
        Invoke-NodeCommand -NodeCommand "diagnostico"
    }
    default {
        Write-Host "Comando desconocido: $Comando" -ForegroundColor Red
        Show-Help
    }
}