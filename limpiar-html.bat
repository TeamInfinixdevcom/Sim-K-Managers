@echo off
echo ===================================
echo    DIAGNOSTICO Y CORRECCION DE SCRIPTS
echo ===================================
echo.

cd Electron

echo Buscando scripts duplicados en index.html...
powershell -Command "$content = Get-Content index.html; $count = ($content | Select-String -Pattern 'compatibility-adapter.js' -AllMatches).Matches.Count; Write-Host \"Referencias encontradas: $count\""

echo.
echo Verificando estructura del documento HTML...
powershell -Command "$content = Get-Content index.html; $docTypeCount = ($content | Select-String -Pattern '<!DOCTYPE html>' -AllMatches).Matches.Count; if ($docTypeCount -gt 1) { Write-Host \"ERROR: Se encontraron $docTypeCount declaraciones DOCTYPE\" -ForegroundColor Red } else { Write-Host \"OK: Solo hay una declaracion DOCTYPE\" -ForegroundColor Green }"

echo.
echo Limpiando HTML...
echo Creando copia de seguridad de index.html...
copy index.html index.html.bak > nul
echo Copia de seguridad creada en index.html.bak

echo.
echo Asegurando que compatibility-adapter.js se cargue solo una vez...
powershell -Command "$content = Get-Content index.html; $newContent = $content -replace './compatibility-adapter.js', ''; Set-Content -Path 'index.html.tmp' -Value $newContent"

powershell -Command "$content = Get-Content index.html.tmp; $headerFixed = $content -replace '<!DOCTYPE html>[^<]*<html[^>]*>([^<]*<head[^>]*>)', '<!DOCTYPE html>`n<html lang=\"es\">`n<head>`n    <meta charset=\"UTF-8\">`n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">`n    <meta http-equiv=\"Content-Security-Policy\" content=\"default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline''\">`n    <title>SIM KManager - Sistema de Inventario</title>`n'; Set-Content -Path 'index.html.fixed' -Value $headerFixed"

echo.
echo Agregando scripts en orden correcto...
powershell -Command "$content = Get-Content index.html.fixed; $scriptPattern = '<link rel=\"icon\" href=\"./kolbi.png\" type=\"image/png\">'; $scriptReplacement = '<link rel=\"icon\" href=\"./kolbi.png\" type=\"image/png\">`n    <!-- Detector de scripts duplicados primero -->`n    <script src=\"duplicate-detector.js\"></script>`n    <!-- Adaptador de compatibilidad -->`n    <script src=\"compatibility-adapter.js\"></script>`n    <!-- Puente API universal -->`n    <script src=\"universal-api-bridge.js\"></script>'
$newContent = $content -replace [regex]::Escape($scriptPattern), $scriptReplacement; Set-Content -Path 'index.html.new' -Value $newContent"

echo.
echo Eliminando duplicacion de scripts en la carga dinamica...
powershell -Command "$content = Get-Content index.html.new; $scriptsDynamicPattern = 'const scripts = \[.*?\];'; $scriptsDynamicReplacement = 'const scripts = [`n                    ''./dom-protector.js'', // Protección DOM primero`n                    ''./missing-functions-polyfill.js'', // Polyfills para funciones faltantes`n                    // Eliminada la referencia duplicada a compatibility-adapter.js`n                    ''./index-patches.js'', // Parches específicos para index.html`n                    ''./terminal-helpers.js'',`n                    ''./precargador.js'',`n                    ''./cache-tools.js''`n                ];'; $newContent = $content -replace $scriptsDynamicPattern, $scriptsDynamicReplacement -replace 'mode'; Set-Content -Path 'index.html.new2' -Value $newContent"

echo.
echo Aplicando cambios...
move /Y index.html.new2 index.html > nul

echo.
echo Verificando resultado final...
powershell -Command "$content = Get-Content index.html; $count = ($content | Select-String -Pattern 'compatibility-adapter.js' -AllMatches).Matches.Count; Write-Host \"Referencias después de la corrección: $count\""

echo.
echo Limpiando archivos temporales...
if exist index.html.tmp del index.html.tmp
if exist index.html.fixed del index.html.fixed
if exist index.html.new del index.html.new

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