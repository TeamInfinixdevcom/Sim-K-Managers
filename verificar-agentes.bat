@echo off
echo ===================================
echo    VERIFICACION DE AGENTES
echo ===================================
echo.

cd Electron

echo Verificando archivo de agentes...
if exist agents.json (
    echo Archivo agents.json encontrado: %CD%\agents.json
    echo Tamaño: 
    for %%F in (agents.json) do echo %%~zF bytes
    
    echo.
    echo Verificando contenido del archivo...
    powershell -Command "Try { $content = Get-Content -Raw -Path 'agents.json' | ConvertFrom-Json; Write-Host 'Numero de agentes:' $content.length; if($content.length -eq 0) { Write-Host 'ADVERTENCIA: No hay agentes en el archivo' -ForegroundColor Yellow } else { Write-Host 'Archivo validado correctamente' -ForegroundColor Green } } Catch { Write-Host 'ERROR: El archivo JSON no es valido' -ForegroundColor Red }"
) else (
    echo ERROR: No se encontró el archivo agents.json
    echo Creando archivo de agentes vacío...
    echo [] > agents.json
    echo Archivo agents.json creado con un array vacío
)

echo.
echo Creando agente de prueba...
echo Esta acción agregará un agente de prueba para verificar que la funcionalidad esté trabajando correctamente.
echo.
set /p crear="¿Desea crear un agente de prueba? (S/N): "
if /i "%crear%"=="S" (
    echo Creando agente de prueba...
    powershell -Command "$agentes = if(Test-Path 'agents.json') { Get-Content -Raw -Path 'agents.json' | ConvertFrom-Json } else { @() }; $nuevoAgente = @{nombre='Agente de Prueba';usuario='test';correo='test@empresa.com';id=[guid]::NewGuid().ToString()} | ConvertTo-Json; $agentes += (ConvertFrom-Json $nuevoAgente); ConvertTo-Json $agentes | Set-Content -Path 'agents.json'; Write-Host 'Agente de prueba creado correctamente' -ForegroundColor Green"
)

echo.
echo Verificando canales IPC de agentes...
if exist ipc-diagnostico.json (
    echo Archivo de diagnóstico IPC encontrado, verificando canales de agentes...
    powershell -Command "Try { $diag = Get-Content -Raw -Path 'ipc-diagnostico.json' | ConvertFrom-Json; $canalesAgentes = $diag.canalesRegistrados | Where-Object { $_ -like '*agent*' }; Write-Host 'Canales de agentes registrados:'; $canalesAgentes; if ($canalesAgentes.Count -eq 0) { Write-Host 'ADVERTENCIA: No se encontraron canales relacionados con agentes' -ForegroundColor Yellow } } Catch { Write-Host 'ERROR: No se pudo leer el archivo de diagnóstico IPC' -ForegroundColor Red }"
) else (
    echo No se encontró archivo de diagnóstico IPC
)

echo.
echo Verificando la implementación de funciones en preload.js...
powershell -Command "Try { $preload = Get-Content -Path 'preload.js' -Raw; if ($preload -like '*listAgents*') { Write-Host 'OK: Función listAgents encontrada en preload.js' -ForegroundColor Green } else { Write-Host 'ERROR: No se encontró la función listAgents en preload.js' -ForegroundColor Red }; if ($preload -like '*guardarAgente*' -or $preload -like '*addAgent*') { Write-Host 'OK: Función guardarAgente/addAgent encontrada en preload.js' -ForegroundColor Green } else { Write-Host 'ERROR: No se encontró función para guardar agentes en preload.js' -ForegroundColor Red } } Catch { Write-Host 'ERROR: No se pudo leer preload.js' -ForegroundColor Red }"

echo.
echo Actualizando cargarAgentes en la interfaz...
powershell -Command "Try { $js = 'async function cargarAgentes() { console.log(\"[UI] Solicitando lista de agentes...\"); try { console.log(\"[UI] Verificando API disponible:\", !!window.electronAPI); const agentes = await window.electronAPI.listAgents(); console.log(`[UI] ${agentes.length} agentes recibidos`); const sel = document.getElementById(\"selAgente\"); if (!sel) { console.error(\"[UI] Elemento selAgente no encontrado\"); return; } sel.innerHTML = \"<option value=\"\">— Seleccione —</option>\"; agentes.forEach(a => { const opt = document.createElement(\"option\"); opt.value = a.correo; opt.textContent = `${a.nombre || \"\"} (${a.correo})`; sel.appendChild(opt); }); } catch (err) { console.error(\"[UI] Error al cargar agentes:\", err); } }'; Set-Content -Path 'cargar-agentes-fix.js' -Value $js; Write-Host 'Archivo cargar-agentes-fix.js creado correctamente' -ForegroundColor Green } Catch { Write-Host 'ERROR: No se pudo crear el archivo cargar-agentes-fix.js' -ForegroundColor Red }"

echo.
echo Inyectando arreglo para la carga de agentes...
powershell -Command "Try { $index = Get-Content -Path 'index.html'; $scriptPos = $index.IndexOf('<script>') + 1; if ($scriptPos -gt 0) { $index[$scriptPos] = $index[$scriptPos] + \"`n// Función mejorada para cargar agentes`n\" + \"async function cargarAgentes() { `n  console.log('[UI] Solicitando lista de agentes...'); `n  try { `n    console.log('[UI] Verificando API disponible:', !!window.electronAPI); `n    const agentes = await window.electronAPI.listAgents(); `n    console.log(`[UI] \${agentes.length} agentes recibidos`); `n    const sel = document.getElementById('selAgente'); `n    if (!sel) { `n      console.error('[UI] Elemento selAgente no encontrado'); `n      return; `n    } `n    sel.innerHTML = '<option value=\"\">— Seleccione —</option>'; `n    agentes.forEach(a => { `n      const opt = document.createElement('option'); `n      opt.value = a.correo; `n      opt.textContent = `\${a.nombre || ''} (\${a.correo})`; `n      sel.appendChild(opt); `n    }); `n  } catch (err) { `n    console.error('[UI] Error al cargar agentes:', err); `n  } `n}`; Set-Content -Path 'index.html' -Value $index; Write-Host 'Función cargarAgentes mejorada inyectada en index.html' -ForegroundColor Green } else { Write-Host 'No se pudo encontrar la posición para inyectar la función cargarAgentes' -ForegroundColor Red } } Catch { Write-Host 'ERROR: No se pudo modificar index.html' -ForegroundColor Red }"

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