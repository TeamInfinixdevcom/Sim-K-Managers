// Script para corregir problemas comunes en SIM-K-Manager
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const basePath = path.join(__dirname, 'Electron');
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

// Funciones auxiliares
function log(mensaje, tipo = 'info') {
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    
    switch (tipo) {
        case 'error':
            console.error(`${RED}[ERROR]${RESET} ${timestamp} - ${mensaje}`);
            break;
        case 'success':
            console.log(`${GREEN}[OK]${RESET} ${timestamp} - ${mensaje}`);
            break;
        case 'warning':
            console.log(`${YELLOW}[AVISO]${RESET} ${timestamp} - ${mensaje}`);
            break;
        case 'info':
            console.log(`${BLUE}[INFO]${RESET} ${timestamp} - ${mensaje}`);
            break;
        default:
            console.log(`${timestamp} - ${mensaje}`);
    }
}

// 1. Verificar estructura del restaurar.js
function corregirRestauraJs() {
    log('Verificando restaurar.js...', 'info');
    const restaurarPath = path.join(basePath, 'restaurar.js');
    
    try {
        const contenido = fs.readFileSync(restaurarPath, 'utf8');
        
        // Buscar declaraciones duplicadas
        if (contenido.split('const fs = require').length > 2) {
            log('Se encontró un problema: Múltiples declaraciones de fs', 'warning');
            
            // Crear copia de seguridad
            fs.copyFileSync(restaurarPath, `${restaurarPath}.bak`);
            log('Copia de seguridad creada en restaurar.js.bak', 'info');
            
            // Corregir el archivo
            const corregido = contenido.replace(/\/\/ Script para verificar y restaurar archivos de datos\r?\nconst fs = require\('fs'\);\r?\nconst path = require\('path'\);/g, 
                '// Script para verificar y restaurar archivos de datos');
                
            fs.writeFileSync(restaurarPath, corregido);
            log('Archivo restaurar.js corregido', 'success');
            return true;
        } else {
            log('Archivo restaurar.js está correcto', 'success');
            return false;
        }
    } catch (error) {
        log(`Error al procesar restaurar.js: ${error.message}`, 'error');
        return false;
    }
}

// 2. Corregir main-inventario.js
function corregirMainInventario() {
    log('Verificando main-inventario.js...', 'info');
    const mainInventarioPath = path.join(basePath, 'main-inventario.js');
    
    try {
        const contenido = fs.readFileSync(mainInventarioPath, 'utf8');
        
        // Verificar si faltan importaciones
        const necesitaImportaciones = !contenido.includes('const fs = require(\'fs\')');
        
        // Verificar si faltan funciones
        const necesitaFuncionesTerminales = !contenido.includes('function listarTerminales(') && 
                                           contenido.includes('ipcMain.handle(\'terminales:list\', listarTerminales)');
                                           
        // Verificar si faltan funciones de datos
        const necesitaFuncionesDatos = !contenido.includes('function obtenerDatos(') && 
                                      (necesitaFuncionesTerminales || contenido.includes('obtenerDatos('));
        
        if (necesitaImportaciones || necesitaFuncionesTerminales || necesitaFuncionesDatos) {
            // Crear copia de seguridad
            fs.copyFileSync(mainInventarioPath, `${mainInventarioPath}.bak`);
            log('Copia de seguridad creada en main-inventario.js.bak', 'info');
            
            // Agregar importaciones si es necesario
            if (necesitaImportaciones) {
                log('Agregando importaciones a main-inventario.js', 'warning');
                const nuevasImportaciones = '// Importaciones necesarias\nconst fs = require(\'fs\');\nconst path = require(\'path\');\n\n';
                const nuevoContenido = nuevasImportaciones + contenido;
                fs.writeFileSync(mainInventarioPath, nuevoContenido);
            }
            
            // Reportar necesidad de funciones
            if (necesitaFuncionesTerminales) {
                log('Se necesitan implementar funciones de terminales', 'warning');
            }
            
            if (necesitaFuncionesDatos) {
                log('Se necesitan implementar funciones de manejo de datos', 'warning');
            }
            
            log('Archivo main-inventario.js parcialmente corregido', 'success');
            return true;
        } else {
            log('Archivo main-inventario.js está correcto', 'success');
            return false;
        }
    } catch (error) {
        log(`Error al procesar main-inventario.js: ${error.message}`, 'error');
        return false;
    }
}

// 3. Verificar estructura de archivos JSON
function verificarArchivosJSON() {
    log('Verificando archivos JSON...', 'info');
    const archivos = [
        'agents.json',
        'terminales.json',
        'notas.json',
        'historial_entregas.json',
        'supervisores.json'
    ];
    
    let arreglosCorregidos = 0;
    
    archivos.forEach(archivo => {
        const archivoPath = path.join(basePath, archivo);
        
        try {
            // Verificar si existe
            if (!fs.existsSync(archivoPath)) {
                log(`Creando archivo ${archivo} vacío`, 'warning');
                const valorPorDefecto = archivo === 'supervisores.json' ? '{"supervisores":[]}' : '[]';
                fs.writeFileSync(archivoPath, valorPorDefecto, 'utf8');
                arreglosCorregidos++;
                return;
            }
            
            // Leer contenido
            const contenido = fs.readFileSync(archivoPath, 'utf8');
            
            // Verificar validez
            try {
                if (contenido.trim() === '') {
                    throw new Error('Archivo vacío');
                }
                
                JSON.parse(contenido);
                log(`Archivo ${archivo} es válido`, 'success');
            } catch (error) {
                log(`Corrigiendo archivo ${archivo} inválido`, 'warning');
                const valorPorDefecto = archivo === 'supervisores.json' ? '{"supervisores":[]}' : '[]';
                fs.writeFileSync(archivoPath, valorPorDefecto, 'utf8');
                arreglosCorregidos++;
            }
        } catch (error) {
            log(`Error al procesar ${archivo}: ${error.message}`, 'error');
        }
    });
    
    if (arreglosCorregidos > 0) {
        log(`Se corrigieron ${arreglosCorregidos} archivos JSON`, 'success');
        return true;
    } else {
        log('Todos los archivos JSON son válidos', 'success');
        return false;
    }
}

// 4. Verificar compatibilidad entre archivos
function verificarCompatibilidad() {
    log('Verificando compatibilidad entre archivos...', 'info');
    const preloadPath = path.join(basePath, 'preload.js');
    const agentesUtilsPath = path.join(basePath, 'agentes-utils.js');
    
    try {
        // Verificar preload.js
        if (!fs.existsSync(preloadPath)) {
            log('No se encontró preload.js', 'error');
            return false;
        }
        
        // Verificar agentes-utils.js
        if (!fs.existsSync(agentesUtilsPath)) {
            log('No se encontró agentes-utils.js', 'error');
            return false;
        }
        
        const preloadContent = fs.readFileSync(preloadPath, 'utf8');
        const agentesUtilsContent = fs.readFileSync(agentesUtilsPath, 'utf8');
        
        // Verificar que preload importa agentes-utils
        if (!preloadContent.includes('require(\'./agentes-utils\')') && 
            !preloadContent.includes('require("./agentes-utils")')) {
            log('preload.js no importa agentes-utils.js correctamente', 'warning');
            return false;
        }
        
        // Verificar funciones expuestas
        const exponeGuardarAgente = preloadContent.includes('guardarAgente:') && 
                                   agentesUtilsContent.includes('function guardarAgente(');
        const exponeObtenerAgentes = preloadContent.includes('obtenerAgentes:') && 
                                    agentesUtilsContent.includes('function obtenerAgentes(');
        
        if (!exponeGuardarAgente || !exponeObtenerAgentes) {
            log('Posible incompatibilidad entre preload.js y agentes-utils.js', 'warning');
            return false;
        }
        
        log('Los archivos son compatibles', 'success');
        return true;
    } catch (error) {
        log(`Error al verificar compatibilidad: ${error.message}`, 'error');
        return false;
    }
}

// Función principal
async function main() {
    console.log(`${BLUE}===================================================${RESET}`);
    console.log(`${BLUE}         CORRECCIÓN AUTOMÁTICA DE ERRORES          ${RESET}`);
    console.log(`${BLUE}===================================================${RESET}`);
    console.log('');
    
    const correcciones = [];
    
    // 1. Corregir restaurar.js
    if (corregirRestauraJs()) {
        correcciones.push('restaurar.js');
    }
    
    // 2. Corregir main-inventario.js
    if (corregirMainInventario()) {
        correcciones.push('main-inventario.js');
    }
    
    // 3. Verificar archivos JSON
    if (verificarArchivosJSON()) {
        correcciones.push('archivos JSON');
    }
    
    // 4. Verificar compatibilidad
    verificarCompatibilidad();
    
    // Reporte final
    console.log('');
    console.log(`${BLUE}===================================================${RESET}`);
    console.log(`${BLUE}                  INFORME FINAL                    ${RESET}`);
    console.log(`${BLUE}===================================================${RESET}`);
    
    if (correcciones.length > 0) {
        log(`Se realizaron correcciones en: ${correcciones.join(', ')}`, 'info');
        log('Se recomienda reiniciar la aplicación', 'warning');
        console.log('');
        console.log(`Para iniciar la aplicación, ejecute: ${BLUE}npx electron .${RESET}`);
    } else {
        log('No se requirieron correcciones importantes', 'success');
        console.log('');
        console.log(`Para iniciar la aplicación, ejecute: ${BLUE}npx electron .${RESET}`);
    }
}

// Ejecutar
main().catch(err => {
    log(`Error fatal: ${err.message}`, 'error');
    process.exit(1);
});