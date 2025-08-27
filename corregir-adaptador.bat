@echo off
echo ===================================
echo    CORREGIR ADAPTADOR DE COMPATIBILIDAD
echo ===================================
echo.

cd Electron

echo Creando copia de seguridad del adaptador actual...
if exist compatibility-adapter.js (
    copy compatibility-adapter.js compatibility-adapter.js.error > nul
    echo Copia de seguridad creada en compatibility-adapter.js.error
) else (
    echo No se encontró compatibility-adapter.js
)

echo.
echo Instalando adaptador limpio...
copy compatibility-adapter-clean.js compatibility-adapter.js > nul
echo Adaptador limpio instalado correctamente.

echo.
echo Actualizando index.html para cargar adaptador al inicio...
powershell -Command "(Get-Content index.html) -replace '<script src=\"compatibility-adapter.js\" defer></script>', '<script src=\"compatibility-adapter.js\"></script>' | Set-Content index.html.tmp"
if %ERRORLEVEL% EQU 0 (
    move /y index.html.tmp index.html > nul
    echo index.html actualizado para cargar el adaptador sin defer.
) else (
    echo No se pudo actualizar index.html automáticamente.
)

echo.
echo Verificando que no haya scripts duplicados...
powershell -Command "$content = Get-Content index.html; $count = ($content | Select-String -Pattern 'compatibility-adapter.js' -AllMatches).Matches.Count; if ($count -gt 1) { Write-Host 'ADVERTENCIA: Se encontraron múltiples referencias al adaptador en index.html' } else { Write-Host 'OK: Solo hay una referencia al adaptador en index.html' }"

echo.
echo ¿Desea iniciar la aplicación ahora? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    cd ..
    echo Iniciando aplicación...
    npx electron .
) else (
    cd ..
    echo.
    echo Para iniciar la aplicación manualmente, ejecute:
    echo npx electron .
    pause
)

exit /b 0