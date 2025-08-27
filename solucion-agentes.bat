@echo off
echo ===================================
echo    SOLUCION COMPLETA - CARGA DE AGENTES
echo ===================================
echo.

cd Electron

echo Verificando problema con notasContainer...
powershell -Command "Try { $html = Get-Content -Path 'index.html' -Raw; if ($html -like '*notasContainer*') { Write-Host 'ENCONTRADO: Referencias a notasContainer en HTML' -ForegroundColor Yellow } else { Write-Host 'OK: No hay referencias problemáticas a notasContainer' -ForegroundColor Green } } Catch { Write-Host 'ERROR: No se pudo verificar el HTML' -ForegroundColor Red }"

echo.
echo Verificando archivo agents.json...
if exist agents.json (
    echo Archivo agents.json encontrado
    powershell -Command "Try { $agents = Get-Content -Path 'agents.json' | ConvertFrom-Json; Write-Host 'Agentes en archivo:' $agents.Count; if ($agents.Count -eq 0) { Write-Host 'PROBLEMA: Archivo de agentes está vacío' -ForegroundColor Red } else { Write-Host 'OK: Hay agentes disponibles' -ForegroundColor Green; $agents | ForEach-Object { Write-Host '  -' $_.nombre '(' $_.correo ')' } } } Catch { Write-Host 'ERROR: Archivo JSON inválido' -ForegroundColor Red }"
) else (
    echo ERROR: Archivo agents.json no encontrado
    echo Creando archivo con agentes de prueba...
    echo [^
  {^
    "id": "test-001",^
    "nombre": "Agente de Prueba 1",^
    "usuario": "test1",^
    "correo": "test1@empresa.com"^
  },^
  {^
    "id": "test-002",^
    "nombre": "Eduardo Mondragon",^
    "usuario": "emondragon",^
    "correo": "emonadragon@ice.go.cr"^
  },^
  {^
    "id": "test-003",^
    "nombre": "Maria Sanabria",^
    "usuario": "msanabria",^
    "correo": "msanabria@ice.go.cr"^
  }^
] > agents.json
    echo Archivo agents.json creado con agentes de prueba
)

echo.
echo Verificando scripts de carga de agentes...
if exist cargar-agentes-simple.js (
    echo Script cargar-agentes-simple.js encontrado
) else (
    echo ADVERTENCIA: cargar-agentes-simple.js no encontrado
)

if exist cargar-agentes-fix.js (
    echo Script cargar-agentes-fix.js encontrado
) else (
    echo ADVERTENCIA: cargar-agentes-fix.js no encontrado
)

echo.
echo Verificando preload.js...
if exist preload.js (
    powershell -Command "Try { $preload = Get-Content -Path 'preload.js' -Raw; if ($preload -like '*listAgents*') { Write-Host 'OK: preload.js incluye función listAgents' -ForegroundColor Green } else { Write-Host 'PROBLEMA: preload.js no incluye función listAgents' -ForegroundColor Red } } Catch { Write-Host 'ERROR: No se pudo verificar preload.js' -ForegroundColor Red }"
) else (
    echo ERROR: preload.js no encontrado
)

echo.
echo Limpiando HTML de referencias problemáticas...
powershell -Command "Try { $html = Get-Content -Path 'index.html'; $fixed = $html -replace 'notasContainer', 'notasList'; Set-Content -Path 'index.html' -Value $fixed; Write-Host 'HTML limpiado de referencias problemáticas' -ForegroundColor Green } Catch { Write-Host 'ERROR: No se pudo limpiar el HTML' -ForegroundColor Red }"

echo.
echo Agregando función de diagnóstico en vivo...
powershell -Command "Try { $scriptDiag = @'
// Función de diagnóstico en vivo para agentes
window.diagnosticarAgentesEnVivo = function() {
    console.log('[DIAGNÓSTICO] === ESTADO ACTUAL ===');
    console.log('[DIAGNÓSTICO] window.electronAPI:', !!window.electronAPI);
    console.log('[DIAGNÓSTICO] window.electronAPI.listAgents:', typeof window.electronAPI?.listAgents);
    console.log('[DIAGNÓSTICO] Elemento selAgente:', !!document.getElementById('selAgente'));
    console.log('[DIAGNÓSTICO] DOM readyState:', document.readyState);
    
    if (window.electronAPI && typeof window.electronAPI.listAgents === 'function') {
        window.electronAPI.listAgents().then(agentes => {
            console.log('[DIAGNÓSTICO] Agentes obtenidos:', agentes);
            if (agentes && agentes.length > 0) {
                console.log('[DIAGNÓSTICO] ✅ Los agentes se pueden obtener correctamente');
            } else {
                console.log('[DIAGNÓSTICO] ❌ No hay agentes disponibles');
            }
        }).catch(err => {
            console.error('[DIAGNÓSTICO] ❌ Error al obtener agentes:', err);
        });
    } else {
        console.log('[DIAGNÓSTICO] ❌ Función listAgents no disponible');
    }
};

// Auto-ejecutar diagnóstico después de 3 segundos
setTimeout(window.diagnosticarAgentesEnVivo, 3000);
'@; Set-Content -Path 'diagnostico-agentes-vivo.js' -Value $scriptDiag; Write-Host 'Archivo de diagnóstico en vivo creado' -ForegroundColor Green } Catch { Write-Host 'ERROR: No se pudo crear el diagnóstico en vivo' -ForegroundColor Red }"

echo.
echo Creando script de carga forzada...
powershell -Command "Try { $scriptForzado = @'
// Script de carga forzada de agentes
console.log('[FORZADO] Iniciando carga forzada de agentes...');

async function cargarAgentesForzado() {
    try {
        // Esperar hasta que la API esté disponible
        let intentos = 0;
        while (!window.electronAPI && intentos < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            intentos++;
        }
        
        if (!window.electronAPI) {
            console.error('[FORZADO] No se pudo acceder a window.electronAPI');
            return;
        }
        
        // Intentar obtener agentes
        const agentes = await window.electronAPI.listAgents();
        console.log('[FORZADO] Agentes obtenidos:', agentes);
        
        // Actualizar el select
        const select = document.getElementById('selAgente');
        if (select && agentes) {
            select.innerHTML = '<option value="">— Seleccione —</option>';
            agentes.forEach(agente => {
                const option = document.createElement('option');
                option.value = agente.correo;
                option.textContent = `${agente.nombre} (${agente.correo})`;
                select.appendChild(option);
            });
            console.log('[FORZADO] ✅ Agentes cargados exitosamente');
        }
    } catch (error) {
        console.error('[FORZADO] Error:', error);
    }
}

// Ejecutar después de que todo esté cargado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(cargarAgentesForzado, 1000);
    });
} else {
    setTimeout(cargarAgentesForzado, 1000);
}

window.cargarAgentesForzado = cargarAgentesForzado;
'@; Set-Content -Path 'carga-forzada-agentes.js' -Value $scriptForzado; Write-Host 'Script de carga forzada creado' -ForegroundColor Green } Catch { Write-Host 'ERROR: No se pudo crear el script de carga forzada' -ForegroundColor Red }"

echo.
echo Añadiendo scripts al HTML...
powershell -Command "Try { $html = Get-Content -Path 'index.html'; $headClose = -1; for ($i = 0; $i -lt $html.Length; $i++) { if ($html[$i] -like '*</head>*') { $headClose = $i; break; } }; if ($headClose -gt 0) { $newHtml = $html[0..($headClose-1)]; $newHtml += '    <script src=\"diagnostico-agentes-vivo.js\"></script>'; $newHtml += '    <script src=\"carga-forzada-agentes.js\"></script>'; $newHtml += $html[$headClose..($html.Length-1)]; Set-Content -Path 'index.html' -Value $newHtml; Write-Host 'Scripts añadidos al HTML' -ForegroundColor Green } else { Write-Host 'No se pudo encontrar </head> en el HTML' -ForegroundColor Red } } Catch { Write-Host 'ERROR: No se pudo modificar el HTML' -ForegroundColor Red }"

echo.
echo ¿Desea iniciar la aplicación para probar los cambios? (S/N)
set /p respuesta="> "
if /i "%respuesta%"=="S" (
    cd ..
    echo.
    echo ===================================
    echo Para diagnosticar en la aplicación:
    echo 1. Abra DevTools (F12)
    echo 2. En la consola, ejecute: window.diagnosticarAgentesEnVivo()
    echo 3. Si no funcionan los agentes, ejecute: window.cargarAgentesForzado()
    echo ===================================
    echo.
    echo Iniciando aplicación...
    npx electron .
) else (
    cd ..
    echo.
    echo Para iniciar la aplicación manualmente:
    echo npx electron .
    pause
)

exit /b 0