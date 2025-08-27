@echo off
echo ===================================
echo    DIAGNOSTICO SIMPLE DE AGENTES
echo ===================================
echo.

cd Electron

echo Verificando archivos necesarios...
if exist agents.json (
    echo ✓ agents.json encontrado
) else (
    echo ✗ agents.json NO encontrado
    echo Creando archivo de agentes básico...
    echo [{"id":"test-001","nombre":"Agente de Prueba","usuario":"test","correo":"test@empresa.com"},{"id":"test-002","nombre":"Eduardo Mondragon","usuario":"emondragon","correo":"emonadragon@ice.go.cr"}] > agents.json
    echo ✓ agents.json creado
)

if exist diagnostico-agentes-vivo.js (
    echo ✓ diagnostico-agentes-vivo.js encontrado
) else (
    echo ✗ diagnostico-agentes-vivo.js NO encontrado
)

if exist carga-forzada-agentes.js (
    echo ✓ carga-forzada-agentes.js encontrado
) else (
    echo ✗ carga-forzada-agentes.js NO encontrado
)

echo.
echo ===================================
echo    INSTRUCCIONES DE DIAGNOSTICO
echo ===================================
echo.
echo Cuando se abra la aplicación:
echo.
echo 1. Presiona F12 para abrir DevTools
echo 2. Ve a la pestaña "Console"
echo 3. Busca mensajes que empiecen con [FORZADO] o [DIAGNÓSTICO]
echo 4. Si no se cargan los agentes automáticamente, ejecuta:
echo    window.cargarAgentesForzado()
echo.
echo 5. Para diagnóstico completo, ejecuta:
echo    window.diagnosticarCargaAgentes()
echo.
echo 6. Para diagnóstico en vivo, ejecuta:
echo    window.diagnosticarAgentesEnVivo()
echo.
echo ===================================

echo.
set /p respuesta="¿Iniciar la aplicación ahora? (S/N): "
if /i "%respuesta%"=="S" (
    cd ..
    echo.
    echo Iniciando aplicación...
    echo Recuerda: F12 para abrir DevTools y ver la consola
    echo.
    npx electron .
) else (
    cd ..
    echo.
    echo Para iniciar manualmente: npx electron .
    pause
)

exit /b 0