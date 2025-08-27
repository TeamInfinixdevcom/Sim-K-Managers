@echo off
echo ===================================
echo    INYECTAR CARGA DE AGENTES
echo ===================================
echo.

cd Electron

echo Verificando la versión actual del HTML...
powershell -Command "Try { $content = Get-Content -Path 'index.html'; $found = $false; foreach ($line in $content) { if ($line -like '*cargarAgentes*') { $found = $true; break; } }; if ($found) { Write-Host 'La función cargarAgentes ya existe en index.html' -ForegroundColor Yellow } else { Write-Host 'La función cargarAgentes no se encontró en index.html' -ForegroundColor Green } } Catch { Write-Host 'ERROR: No se pudo verificar index.html' -ForegroundColor Red }"

echo.
echo Creando copia de seguridad del HTML...
copy index.html index.html.bak > nul
echo Copia de seguridad creada en index.html.bak

echo.
echo Verificando que exista el archivo de corrección...
if exist cargar-agentes-fix.js (
    echo Archivo cargar-agentes-fix.js encontrado
) else (
    echo ERROR: No se encontró el archivo cargar-agentes-fix.js
    echo Operación abortada
    cd ..
    pause
    exit /b 1
)

echo.
echo Inyectando script de carga de agentes...
powershell -Command "Try { $content = Get-Content -Path 'index.html'; $head = $content.IndexOf('</head>'); if ($head -gt 0) { $content[$head] = '    <script src=\"cargar-agentes-fix.js\"></script>' + \"`n\" + $content[$head]; Set-Content -Path 'index.html' -Value $content; Write-Host 'Script de carga de agentes inyectado correctamente' -ForegroundColor Green } else { Write-Host 'No se pudo encontrar el cierre de la etiqueta head' -ForegroundColor Red } } Catch { Write-Host 'ERROR: No se pudo modificar index.html' -ForegroundColor Red }"

echo.
echo ¿Desea corregir también el evento DOMContentLoaded para evitar doble inicialización?
set /p corregir="> (S/N): "
if /i "%corregir%"=="S" (
    echo Corrigiendo evento DOMContentLoaded...
    powershell -Command "Try { $content = Get-Content -Path 'index.html'; $domLoaded = -1; for ($i = 0; $i -lt $content.Length; $i++) { if ($content[$i] -like '*DOMContentLoaded*') { $domLoaded = $i; break; } }; if ($domLoaded -gt 0) { $newContent = $content[0..$domLoaded]; $newContent += '    // NOTA: La carga de agentes se maneja en cargar-agentes-fix.js'; $newContent += '    // No se llama a cargarAgentes() aquí para evitar duplicación'; for ($i = $domLoaded + 1; $i -lt $content.Length; $i++) { if ($content[$i] -like '*cargarAgentes()*') { $newContent += '    // ' + $content[$i] + ' // Comentado para evitar doble inicialización'; } else { $newContent += $content[$i]; } }; Set-Content -Path 'index.html' -Value $newContent; Write-Host 'Llamada a cargarAgentes() comentada para evitar duplicación' -ForegroundColor Green } else { Write-Host 'No se encontró el evento DOMContentLoaded' -ForegroundColor Red } } Catch { Write-Host 'ERROR: No se pudo modificar el evento DOMContentLoaded' -ForegroundColor Red }"
)

echo.
echo Verificando el adaptador de compatibilidad...
powershell -Command "Try { $content = Get-Content -Path 'compatibility-adapter.js'; if ($content -like '*PRIORIDAD CRÍTICA: Garantizar que listAgents*') { Write-Host 'El adaptador ya tiene la prioridad crítica para listAgents' -ForegroundColor Green } else { Write-Host 'ADVERTENCIA: El adaptador no tiene prioridad crítica para listAgents' -ForegroundColor Yellow } } Catch { Write-Host 'ERROR: No se pudo verificar compatibility-adapter.js' -ForegroundColor Red }"

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