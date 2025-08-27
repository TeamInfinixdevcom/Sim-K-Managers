// Script de diagnóstico completo para Sim-K-Manager
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

// Ruta base de la aplicación
const basePath = path.join(__dirname, 'Electron');

// Archivos críticos que deben existir
const archivosCriticos = [
    'main.js',
    'preload.js',
    'index.html',
    'main-inventario.js',
    'agentes-utils.js',
    'agentes-ui.js',
    'restaurar.js'
];

// Archivos de datos
const archivosDatos = [
    'agents.json',
    'terminales.json',
    'notas.json',
    'historial_entregas.json',
    'supervisores.json'
];

// Funciones de módulos que se deben verificar
const funciones = [
    { modulo: './Electron/agentes-utils', nombre: 'obtenerAgentes' },
    { modulo: './Electron/agentes-utils', nombre: 'guardarAgente' },
    { modulo: './Electron/main-inventario', nombre: 'registrarManejadoresIPC' },
    { modulo: './Electron/restaurar', nombre: 'verificarYReparar' }
];

// Contadores para el informe
let errores = 0;
let advertencias = 0;
let ok = 0;

// Colores para la consola
const colores = {
    reset: '\x1b[0m',
    rojo: '\x1b[31m',
    verde: '\x1b[32m',
    amarillo: '\x1b[33m',
    azul: '\x1b[34m',
    magenta: '\x1b[35m',
    cian: '\x1b[36m'
};

// Utilidad para imprimir mensajes con formato
function imprimir(tipo, mensaje) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    switch(tipo) {
        case 'error':
            console.error(`${colores.rojo}[ERROR]${colores.reset} ${timestamp} - ${mensaje}`);
            errores++;
            break;
        case 'warning':
            console.warn(`${colores.amarillo}[ADVERTENCIA]${colores.reset} ${timestamp} - ${mensaje}`);
            advertencias++;
            break;
        case 'ok':
            console.log(`${colores.verde}[OK]${colores.reset} ${timestamp} - ${mensaje}`);
            ok++;
            break;
        case 'info':
            console.log(`${colores.azul}[INFO]${colores.reset} ${timestamp} - ${mensaje}`);
            break;
        case 'title':
            console.log(`\n${colores.magenta}=== ${mensaje} ===${colores.reset}`);
            break;
        default:
            console.log(mensaje);
    }
}

// Verificar existencia de archivos críticos
async function verificarArchivosCriticos() {
    imprimir('title', 'VERIFICACIÓN DE ARCHIVOS CRÍTICOS');
    
    for (const archivo of archivosCriticos) {
        const rutaArchivo = path.join(basePath, archivo);
        
        try {
            const stats = fs.statSync(rutaArchivo);
            const tamanoKB = (stats.size / 1024).toFixed(2);
            imprimir('ok', `Archivo ${archivo} existe (${tamanoKB} KB)`);
        } catch (error) {
            imprimir('error', `Archivo ${archivo} NO existe o no es accesible`);
        }
    }
}

// Verificar archivos de datos
async function verificarArchivosDatos() {
    imprimir('title', 'VERIFICACIÓN DE ARCHIVOS DE DATOS');
    
    for (const archivo of archivosDatos) {
        const rutaArchivo = path.join(basePath, archivo);
        
        try {
            if (!fs.existsSync(rutaArchivo)) {
                imprimir('warning', `Archivo de datos ${archivo} NO existe (se creará automáticamente)`);
                continue;
            }
            
            const contenido = fs.readFileSync(rutaArchivo, 'utf8');
            
            if (contenido.trim() === '') {
                imprimir('warning', `Archivo de datos ${archivo} está vacío`);
                continue;
            }
            
            try {
                const datos = JSON.parse(contenido);
                const esArray = Array.isArray(datos);
                const elementos = esArray ? datos.length : (typeof datos === 'object' ? Object.keys(datos).length : 0);
                
                imprimir('ok', `Archivo ${archivo} contiene datos válidos (${elementos} elementos)`);
            } catch (error) {
                imprimir('error', `Archivo ${archivo} tiene formato JSON inválido: ${error.message}`);
            }
            
        } catch (error) {
            imprimir('error', `Error al verificar archivo ${archivo}: ${error.message}`);
        }
    }
}

// Verificar funciones críticas
async function verificarFunciones() {
    imprimir('title', 'VERIFICACIÓN DE FUNCIONES CRÍTICAS');
    
    for (const func of funciones) {
        try {
            const modulo = require(func.modulo);
            
            if (typeof modulo[func.nombre] === 'function') {
                imprimir('ok', `Función ${func.nombre} en ${func.modulo} existe`);
            } else {
                imprimir('error', `Función ${func.nombre} en ${func.modulo} NO es una función válida`);
            }
        } catch (error) {
            imprimir('error', `Error al cargar módulo ${func.modulo}: ${error.message}`);
        }
    }
}

// Verificar dependencias
async function verificarDependencias() {
    imprimir('title', 'VERIFICACIÓN DE DEPENDENCIAS');
    
    try {
        const pjsonPath = path.join(__dirname, 'package.json');
        if (!fs.existsSync(pjsonPath)) {
            imprimir('error', 'No se encontró el archivo package.json');
            return;
        }
        
        const packageJson = JSON.parse(fs.readFileSync(pjsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Verificar dependencias críticas
        const dependenciasCriticas = ['electron', 'fs', 'path'];
        
        for (const dep of dependenciasCriticas) {
            if (dep === 'fs' || dep === 'path') {
                // Módulos nativos de Node.js
                imprimir('ok', `Dependencia nativa ${dep} disponible`);
            } else if (deps[dep]) {
                imprimir('ok', `Dependencia ${dep} instalada (${deps[dep]})`);
            } else {
                imprimir('error', `Dependencia crítica ${dep} NO está instalada`);
            }
        }
        
        imprimir('info', `Total de dependencias: ${Object.keys(deps).length}`);
    } catch (error) {
        imprimir('error', `Error al verificar dependencias: ${error.message}`);
    }
}

// Verificar configuración de Electron
async function verificarElectron() {
    imprimir('title', 'VERIFICACIÓN DE ELECTRON');
    
    try {
        const { stdout } = await execPromise('npx electron --version');
        imprimir('ok', `Electron instalado: ${stdout.trim()}`);
    } catch (error) {
        imprimir('error', `Error al verificar Electron: ${error.message}`);
    }
}

// Ejecutar restauración de archivos
async function ejecutarRestauracion() {
    imprimir('title', 'RESTAURACIÓN DE ARCHIVOS');
    
    try {
        const restaurador = require('./Electron/restaurar');
        restaurador.verificarYReparar();
        imprimir('ok', 'Proceso de restauración completado');
    } catch (error) {
        imprimir('error', `Error al restaurar archivos: ${error.message}`);
    }
}

// Ejecutar todas las verificaciones
async function ejecutarDiagnostico() {
    console.log(colores.cian + '╔══════════════════════════════════════════════════════════╗');
    console.log('║             DIAGNÓSTICO DE SIM-K-MANAGER                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝' + colores.reset);
    
    const inicio = Date.now();
    
    await verificarArchivosCriticos();
    await verificarArchivosDatos();
    await verificarFunciones();
    await verificarDependencias();
    await verificarElectron();
    await ejecutarRestauracion();
    
    const duracion = ((Date.now() - inicio) / 1000).toFixed(2);
    
    console.log(colores.cian + '\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                   RESUMEN DEL DIAGNÓSTICO                ║');
    console.log('╚══════════════════════════════════════════════════════════╝' + colores.reset);
    
    imprimir('info', `Tiempo de ejecución: ${duracion} segundos`);
    imprimir('ok', `Verificaciones exitosas: ${ok}`);
    
    if (advertencias > 0) {
        imprimir('warning', `Advertencias: ${advertencias}`);
    } else {
        imprimir('ok', 'No se encontraron advertencias');
    }
    
    if (errores > 0) {
        imprimir('error', `Errores encontrados: ${errores}`);
        console.log(colores.rojo + '\n¡ATENCIÓN! Se encontraron errores que deben corregirse.' + colores.reset);
    } else {
        console.log(colores.verde + '\n¡ÉXITO! El sistema está listo para ejecutarse.' + colores.reset);
    }
    
    console.log('\nPara iniciar la aplicación, ejecute: ' + colores.cian + 'npx electron .' + colores.reset);
}

// Ejecutar el diagnóstico
ejecutarDiagnostico().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});