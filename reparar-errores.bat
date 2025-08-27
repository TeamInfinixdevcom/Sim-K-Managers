@echo off
echo ===================================
echo    REPARACION COMPLETA DE ERRORES
echo ===================================
echo.

cd Electron

echo Creando copia de seguridad del HTML...
copy index.html index.html.error > nul
echo Copia de seguridad creada en index.html.error

echo.
echo Verificando archivo de agentes...
if exist agents.json (
    echo Archivo agents.json encontrado
    type agents.json
) else (
    echo ERROR: Archivo agents.json no encontrado
    echo Creando archivo de agentes con datos de prueba...
    echo [^
  {^
    "id": "test-001",^
    "nombre": "Agente de Prueba",^
    "usuario": "test",^
    "correo": "test@empresa.com"^
  },^
  {^
    "id": "test-002",^
    "nombre": "Eduardo Mondragon",^
    "usuario": "emondragon",^
    "correo": "emonadragon@ice.go.cr"^
  }^
] > agents.json
    echo Archivo de agentes creado con datos de prueba
)

echo.
echo Verificando que el adaptador de compatibilidad esté funcionando...
if exist compatibility-adapter.js (
    echo Adaptador de compatibilidad encontrado
) else (
    echo ERROR: No se encontró compatibility-adapter.js
    echo Por favor asegúrese de que el archivo existe
    cd ..
    pause
    exit /b 1
)

echo.
echo Verificando que cargar-agentes-fix.js esté presente...
if exist cargar-agentes-fix.js (
    echo Archivo cargar-agentes-fix.js encontrado
) else (
    echo ERROR: No se encontró cargar-agentes-fix.js
    echo Creando archivo básico...
    echo // Función básica para cargar agentes > cargar-agentes-fix.js
    echo async function cargarAgentes() { >> cargar-agentes-fix.js
    echo   try { >> cargar-agentes-fix.js
    echo     const agentes = await window.electronAPI.listAgents(); >> cargar-agentes-fix.js
    echo     const sel = document.getElementById('selAgente'); >> cargar-agentes-fix.js
    echo     if (!sel) return; >> cargar-agentes-fix.js
    echo     sel.innerHTML = '<option value="">— Seleccione —</option>'; >> cargar-agentes-fix.js
    echo     agentes.forEach(a => { >> cargar-agentes-fix.js
    echo       const opt = document.createElement('option'); >> cargar-agentes-fix.js
    echo       opt.value = a.correo; >> cargar-agentes-fix.js
    echo       opt.textContent = `${a.nombre || ''} (${a.correo})`; >> cargar-agentes-fix.js
    echo       sel.appendChild(opt); >> cargar-agentes-fix.js
    echo     }); >> cargar-agentes-fix.js
    echo   } catch (err) { >> cargar-agentes-fix.js
    echo     console.error('Error al cargar agentes:', err); >> cargar-agentes-fix.js
    echo   } >> cargar-agentes-fix.js
    echo } >> cargar-agentes-fix.js
    echo if (document.readyState === 'loading') { >> cargar-agentes-fix.js
    echo   document.addEventListener('DOMContentLoaded', () => setTimeout(cargarAgentes, 1000)); >> cargar-agentes-fix.js
    echo } else { >> cargar-agentes-fix.js
    echo   setTimeout(cargarAgentes, 1000); >> cargar-agentes-fix.js
    echo } >> cargar-agentes-fix.js
    echo Archivo cargar-agentes-fix.js creado
)

echo.
echo Verificando archivos faltantes...
set MISSING=0

if not exist duplicate-detector.js (
    echo ADVERTENCIA: duplicate-detector.js no encontrado
    set MISSING=1
)

if not exist universal-api-bridge.js (
    echo ADVERTENCIA: universal-api-bridge.js no encontrado
    set MISSING=1
)

if not exist agentes-ui.js (
    echo ADVERTENCIA: agentes-ui.js no encontrado
    set MISSING=1
)

if %MISSING%==1 (
    echo.
    echo Algunos archivos están faltando, pero la aplicación puede funcionar sin ellos.
    echo ¿Desea continuar? (S/N)
    set /p continuar="> "
    if /i not "%continuar%"=="S" (
        cd ..
        exit /b 1
    )
)

echo.
echo Verificando la estructura del HTML...
powershell -Command "Try { $content = Get-Content index.html; $errors = @(); if ($content -like '*</head>*</head>*') { $errors += 'HTML tiene etiquetas </head> duplicadas' }; if ($content -like '*cargarAgentes(); // Comentado*') { $errors += 'Función cargarAgentes está comentada' }; if ($errors.Count -gt 0) { Write-Host 'ERRORES ENCONTRADOS:' -ForegroundColor Red; $errors | ForEach-Object { Write-Host '- ' $_ -ForegroundColor Red }; exit 1 } else { Write-Host 'Estructura HTML validada correctamente' -ForegroundColor Green } } Catch { Write-Host 'ERROR: No se pudo validar el HTML' -ForegroundColor Red; exit 1 }"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Se encontraron errores en el HTML. Esto puede causar problemas.
    echo ¿Desea continuar de todos modos? (S/N)
    set /p continuar="> "
    if /i not "%continuar%"=="S" (
        cd ..
        exit /b 1
    )
)

echo.
echo Iniciando aplicación con diagnóstico detallado...
echo Si la aplicación no muestra agentes, revise la consola del navegador
echo presionando F12 y buscando errores.
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