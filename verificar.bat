@echo off
echo ===================================
echo    DIAGNÓSTICO SIM-K-MANAGER
echo ===================================
echo.

echo Ejecutando diagnóstico completo...
node diagnostico-completo.js
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] El diagnóstico ha encontrado errores críticos.
    echo.
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