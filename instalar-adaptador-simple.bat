@echo off
echo ===================================
echo    ACTUALIZAR A ADAPTADOR SIMPLE
echo ===================================
echo.

cd Electron

echo Creando copia de seguridad del adaptador actual...
if exist compatibility-adapter.js (
    copy compatibility-adapter.js compatibility-adapter.js.bak > nul
    echo Copia de seguridad creada en compatibility-adapter.js.bak
) else (
    echo No se encontró compatibility-adapter.js
)

echo.
echo Instalando adaptador simplificado...
copy compatibility-adapter-simple.js compatibility-adapter.js > nul
echo Adaptador simplificado instalado correctamente.

echo.
echo Actualizando index.html para cargar el adaptador correctamente...
powershell -Command "(Get-Content index.html) -replace '<script src=\"compatibility-adapter.js\" defer></script>', '<script src=\"compatibility-adapter.js\"></script>' | Set-Content index.html.tmp"
if %ERRORLEVEL% EQU 0 (
    move /y index.html.tmp index.html > nul
    echo index.html actualizado correctamente.
) else (
    echo Error al actualizar index.html
)

echo.
echo ¿Desea iniciar la aplicación ahora? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    cd ..
    echo Iniciando aplicación...
    npx electron .
) else (
    echo.
    echo Para iniciar la aplicación manualmente, ejecute:
    echo npx electron .
    cd ..
    pause
)

exit /b 0