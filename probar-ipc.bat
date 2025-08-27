@echo off
echo ===================================
echo    DIAGNÓSTICO Y CORRECCIÓN IPC
echo ===================================
echo.

cd Electron
echo Ejecutando diagnóstico de IPC...
node -e "const fs=require('fs');const path=require('path');try{const data=require('./ipc-diagnostico.json');console.log('Canales registrados: '+Object.keys(data.canales.detalle).join(', '));console.log('Total de llamadas: '+data.llamadas.total);const errores=Object.keys(data.errores.detalle);if(errores.length>0){console.log('Errores detectados en canales: '+errores.join(', '));}else{console.log('No se detectaron errores.');}}catch(e){console.log('No hay informe de diagnóstico disponible.');}"

echo.
echo ¿Desea realizar la corrección de los problemas IPC? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    echo.
    echo Realizando correcciones...
    copy /Y main-inventario.js main-inventario.bak.js > nul
    echo Copia de seguridad creada en main-inventario.bak.js
    
    echo Asegurando que las funciones sean asincrónicas...
    powershell -Command "(Get-Content main-inventario.js) | ForEach-Object { $_ -replace 'function (listarTerminales|agregarTerminal|eliminarTerminal|bulkAddTerminales)\(', 'async function $1(' } | Set-Content main-inventario.js.tmp"
    move /Y main-inventario.js.tmp main-inventario.js > nul
    
    echo Corrigiendo manejadores IPC...
    powershell -Command "(Get-Content main-inventario.js) | ForEach-Object { $_ -replace 'ipcMain\.handle\(''(.*?)'', ([^)]+)\)', 'ipcMain.handle(''$1'', async (event, ...args) => { try { return await $2(...args); } catch (error) { console.error(''[IPC] Error en $1:'', error); throw error; } })' } | Set-Content main-inventario.js.tmp"
    move /Y main-inventario.js.tmp main-inventario.js > nul
    
    echo Correcciones aplicadas correctamente.
) else (
    echo Corrección cancelada.
)

echo.
echo ¿Desea iniciar la aplicación ahora? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    cd ..
    echo Iniciando aplicación...
    npx electron .
) else (
    cd ..
    echo Inicio de la aplicación cancelado.
    pause
)

exit /b 0