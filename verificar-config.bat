@echo off
echo ===================================
echo    VERIFICACIÓN DE CONFIGURACIÓN
echo ===================================
echo.

echo Ejecutando verificación de configuración...
node verificar-configuracion.js
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ADVERTENCIA] La verificación detectó posibles problemas.
    echo ¿Desea intentar reparar automáticamente? (S/N)
    set /p respuesta="> "
    if /i "%respuesta%"=="S" (
        echo.
        echo Ejecutando corrección automática...
        node corregir-errores.js
    ) else (
        echo Operación de reparación cancelada.
    )
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
    echo Inicio de la aplicación cancelado.
    pause
)

exit /b 0