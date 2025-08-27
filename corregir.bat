@echo off
echo ===================================
echo    CORRECCIÓN DE ERRORES
echo ===================================
echo.

echo Ejecutando corrección automática de errores...
node corregir-errores.js
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] El proceso de corrección encontró problemas.
    pause
    exit /b 1
)

echo.
echo ¿Desea iniciar la aplicación ahora? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    echo Iniciando aplicación...
    npx electron .
) else (
    echo Operación cancelada.
    pause
)

exit /b 0