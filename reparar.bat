@echo off
echo ===================================
echo    REPARACIÓN SIM-K-MANAGER
echo ===================================
echo.

echo Esta herramienta intentará reparar problemas comunes.
echo Por favor, asegúrese de que la aplicación está cerrada.
echo.
echo Presione cualquier tecla para continuar o Ctrl+C para cancelar...
pause > nul

echo.
echo [1/4] Verificando estructura de archivos...
node Electron/restaurar.js
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Error al restaurar archivos.
    pause
    exit /b 1
)

echo.
echo [2/4] Verificando integridad de agents.json...
node Electron/diagnostico-agentes.js
IF %ERRORLEVEL% NEQ 0 (
    echo [ADVERTENCIA] Problemas con agents.json. Intentando corregir...
    echo [] > Electron\agents.json
    echo Archivo agents.json reiniciado.
)

echo.
echo [3/4] Restaurando preload.js desde backup...
copy /Y "Electron\preload-backup.js" "Electron\preload.js"
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo restaurar preload.js
) else (
    echo Archivo preload.js restaurado correctamente.
)

echo.
echo [4/4] Limpiando archivos temporales...
del /F /Q Electron\*.log 2>nul
del /F /Q Electron\debug-preload-resultados.json 2>nul
echo Limpieza completada.

echo.
echo ===================================
echo    REPARACIÓN COMPLETADA
echo ===================================
echo.
echo La aplicación ha sido reparada. Ahora puede ejecutar:
echo - verificar.bat (para diagnóstico)
echo - npx electron . (para iniciar la aplicación)
echo.
pause