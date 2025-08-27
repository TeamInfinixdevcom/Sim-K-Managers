/**
 * Script de verificación rápida para la configuración de SIM-K-Manager
 * Este script comprueba la configuración del sistema antes de ejecutar la aplicación
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuración
const basePath = path.join(__dirname, 'Electron');
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

console.log(`${BLUE}==================================================${RESET}`);
console.log(`${BLUE}    VERIFICACIÓN RÁPIDA DE CONFIGURACIÓN          ${RESET}`);
console.log(`${BLUE}==================================================${RESET}`);

// Función para imprimir mensajes
function log(mensaje, tipo = 'info') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    switch (tipo) {
        case 'error':
            console.error(`${RED}[ERROR]${RESET} ${timestamp} - ${mensaje}`);
            break;
        case 'success':
            console.log(`${GREEN}[OK]${RESET} ${timestamp} - ${mensaje}`);
            break;
        case 'warning':
            console.log(`${YELLOW}[ADVERTENCIA]${RESET} ${timestamp} - ${mensaje}`);
            break;
        case 'info':
            console.log(`${BLUE}[INFO]${RESET} ${timestamp} - ${mensaje}`);
            break;
        default:
            console.log(`${timestamp} - ${mensaje}`);
    }
}

// Función para verificar y arreglar preload.js
async function verificarPreload() {
    log('Verificando preload.js...', 'info');
    const preloadPath = path.join(basePath, 'preload.js');
    
    try {
        if (!fs.existsSync(preloadPath)) {
            log('preload.js no existe', 'error');
            return false;
        }
        
        const contenido = fs.readFileSync(preloadPath, 'utf8');
        
        // Verificar la exposición de la API
        const exposePattern = /contextBridge\.exposeInMainWorld\('(\w+)'/;
        const match = exposePattern.exec(contenido);
        
        if (match) {
            const apiName = match[1];
            if (apiName !== 'electronAPI' && apiName !== 'api') {
                log(`API expuesta con nombre incorrecto: ${apiName}`, 'warning');
                
                // Corregir la exposición
                const corrected = contenido.replace(
                    /contextBridge\.exposeInMainWorld\('(\w+)'/g, 
                    "contextBridge.exposeInMainWorld('electronAPI'"
                );
                
                // Crear copia de seguridad
                const backupPath = path.join(basePath, `preload-backup-${Date.now()}.js`);
                fs.writeFileSync(backupPath, contenido, 'utf8');
                log(`Copia de seguridad creada en ${backupPath}`, 'info');
                
                // Escribir el archivo corregido
                fs.writeFileSync(preloadPath, corrected, 'utf8');
                log('preload.js corregido para exponer electronAPI', 'success');
                return true;
            } else {
                log(`API expuesta correctamente como ${apiName}`, 'success');
                return true;
            }
        } else {
            log('No se pudo detectar la exposición de la API', 'error');
            return false;
        }
    } catch (error) {
        log(`Error al verificar preload.js: ${error.message}`, 'error');
        return false;
    }
}

// Verificar que el bridge API esté configurado
async function verificarBridgeAPI() {
    log('Verificando puente API...', 'info');
    const bridgePath = path.join(basePath, 'universal-api-bridge.js');
    const indexPath = path.join(basePath, 'index.html');
    
    try {
        // Verificar que existe el puente API
        if (!fs.existsSync(bridgePath)) {
            log('El puente API (universal-api-bridge.js) no existe', 'error');
            return false;
        }
        
        // Verificar que está incluido en index.html
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        if (!indexContent.includes('universal-api-bridge.js')) {
            log('El puente API no está incluido en index.html', 'warning');
            
            // Inyectar script al principio del head
            const headTagPattern = /<head([^>]*)>/i;
            if (headTagPattern.test(indexContent)) {
                const updated = indexContent.replace(
                    headTagPattern,
                    '<head$1>\n    <!-- Puente API universal -->\n    <script src="universal-api-bridge.js"></script>'
                );
                
                // Crear copia de seguridad
                const backupPath = path.join(basePath, `index-backup-${Date.now()}.html`);
                fs.writeFileSync(backupPath, indexContent, 'utf8');
                log(`Copia de seguridad creada en ${backupPath}`, 'info');
                
                // Escribir el archivo actualizado
                fs.writeFileSync(indexPath, updated, 'utf8');
                log('Puente API inyectado en index.html', 'success');
                return true;
            } else {
                log('No se pudo encontrar la etiqueta head en index.html', 'error');
                return false;
            }
        } else {
            log('Puente API correctamente incluido en index.html', 'success');
            return true;
        }
    } catch (error) {
        log(`Error al verificar puente API: ${error.message}`, 'error');
        return false;
    }
}

// Verificar archivos JSON básicos
async function verificarArchivosJSON() {
    log('Verificando archivos JSON esenciales...', 'info');
    const archivos = [
        'agents.json',
        'terminales.json'
    ];
    
    let todosCorrecto = true;
    
    for (const archivo of archivos) {
        const archivoPath = path.join(basePath, archivo);
        
        try {
            if (!fs.existsSync(archivoPath)) {
                log(`Creando archivo ${archivo}...`, 'warning');
                fs.writeFileSync(archivoPath, '[]', 'utf8');
                log(`Archivo ${archivo} creado correctamente`, 'success');
            } else {
                // Verificar que sea JSON válido
                const contenido = fs.readFileSync(archivoPath, 'utf8');
                try {
                    JSON.parse(contenido || '[]');
                    log(`Archivo ${archivo} es válido`, 'success');
                } catch (parseError) {
                    log(`Archivo ${archivo} contiene JSON inválido, reparando...`, 'warning');
                    fs.writeFileSync(archivoPath, '[]', 'utf8');
                    log(`Archivo ${archivo} reparado`, 'success');
                }
            }
        } catch (error) {
            log(`Error al procesar ${archivo}: ${error.message}`, 'error');
            todosCorrecto = false;
        }
    }
    
    return todosCorrecto;
}

// Ejecutar todas las verificaciones
async function ejecutarVerificaciones() {
    const inicio = Date.now();
    
    const resultados = {
        preload: await verificarPreload(),
        bridge: await verificarBridgeAPI(),
        json: await verificarArchivosJSON()
    };
    
    const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
    
    console.log(`${BLUE}==================================================${RESET}`);
    console.log(`${BLUE}    RESULTADO DE LA VERIFICACIÓN                  ${RESET}`);
    console.log(`${BLUE}==================================================${RESET}`);
    
    log(`Tiempo de ejecución: ${duracion} segundos`, 'info');
    
    if (resultados.preload && resultados.bridge && resultados.json) {
        log('Todas las verificaciones pasadas correctamente', 'success');
        console.log('');
        console.log(`${GREEN}La aplicación está correctamente configurada${RESET}`);
        console.log(`Para iniciar la aplicación, ejecute: ${BLUE}npx electron .${RESET}`);
        return 0;
    } else {
        const fallos = [];
        if (!resultados.preload) fallos.push('preload.js');
        if (!resultados.bridge) fallos.push('puente API');
        if (!resultados.json) fallos.push('archivos JSON');
        
        log(`Verificaciones fallidas: ${fallos.join(', ')}`, 'error');
        console.log('');
        console.log(`${YELLOW}Se recomienda ejecutar el script de reparación:${RESET}`);
        console.log(`${BLUE}node corregir-errores.js${RESET}`);
        return 1;
    }
}

// Ejecutar verificaciones
ejecutarVerificaciones()
    .then(codigo => {
        process.exit(codigo);
    })
    .catch(error => {
        log(`Error fatal: ${error.message}`, 'error');
        process.exit(1);
    });