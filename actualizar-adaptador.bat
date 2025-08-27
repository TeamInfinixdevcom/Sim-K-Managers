@echo off
echo ===================================
echo    ACTUALIZAR ADAPTADOR DE COMPATIBILIDAD
echo ===================================
echo.

cd Electron
echo Creando copia de seguridad del adaptador actual...
copy compatibility-adapter.js compatibility-adapter.js.bak > nul
echo Copia de seguridad creada en compatibility-adapter.js.bak

echo Actualizando adaptador de compatibilidad...
move /Y compatibility-adapter.js.new compatibility-adapter.js > nul
echo Adaptador actualizado correctamente.

echo.
echo ¿Desea iniciar la aplicación ahora? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    cd ..
    echo Iniciando aplicación...
    npx electron .
) else (
    cd ..
    echo Operación completada sin iniciar aplicación.
    pause
)

exit /b 0