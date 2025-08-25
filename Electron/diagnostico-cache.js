// Diagnosticador para el sistema de caché TURBOCACHE
const fs = require('fs');
const path = require('path');

// Objeto para almacenar referencia al TURBOCACHE
let TURBOCACHE = null;
let PATHS = {
    TERMINALES_PATH: null,
    AGENTS_PATH: null,
    HISTORIAL_PATH: null,
    NOTAS_PATH: null
};
let readJSONFn = null;

// Función para inicializar el diagnosticador
function inicializar(cacheObject, paths, readJSON) {
    TURBOCACHE = cacheObject;
    PATHS = paths;
    readJSONFn = readJSON;
    
    return {
        ejecutarDiagnostico
    };
}

// Configuración para el diagnóstico
const DIAGNOSTICO_CONFIG = {
    // Archivos a verificar
    archivos: [
        { nombre: 'terminales', cacheKey: 'terminales' },
        { nombre: 'agentes', cacheKey: 'agents' },
        { nombre: 'historial', cacheKey: 'historial' },
        { nombre: 'notas', cacheKey: 'notas' }
    ],
    // Imágenes a verificar
    imagenes: [
        { nombre: 'Logo Kolbi', cacheKey: 'kolbi' },
        { nombre: 'Firma Supervisor', cacheKey: 'default' },
        { nombre: 'Firma Supervisora', cacheKey: 'msanabria' }
    ],
    // Thresholds para advertencias
    thresholds: {
        tamanoMaximoArchivo: 10 * 1024 * 1024, // 10MB
        longitudMaximaArray: 10000, // Número máximo de elementos
        tiempoMaximoCarga: 1000, // 1 segundo
        minimoIndicesEsperados: 0.9 // 90% de elementos deberían tener índice
    }
};

// Función para verificar un archivo JSON
async function verificarArchivo(config) {
    // Determinar la ruta del archivo
    let filePath = null;
    switch (config.cacheKey) {
        case 'terminales':
            filePath = PATHS.TERMINALES_PATH;
            break;
        case 'agents':
            filePath = PATHS.AGENTS_PATH;
            break;
        case 'historial':
            filePath = PATHS.HISTORIAL_PATH;
            break;
        case 'notas':
            filePath = PATHS.NOTAS_PATH;
            break;
    }
    
    if (!filePath) {
        return {
            archivo: config.nombre,
            archivoExiste: false,
            errores: ['Ruta de archivo no configurada']
        };
    }
    
    const resultado = {
        archivo: config.nombre,
        archivoExiste: false,
        tamanoDisco: 0,
        tiempoCarga: 0,
        elementosTotal: 0,
        indicesCreados: 0,
        enCache: false,
        errores: [],
        advertencias: []
    };

    try {
        // Verificar si el archivo existe
        if (fs.existsSync(filePath)) {
            resultado.archivoExiste = true;
            
            // Obtener tamaño
            const stats = fs.statSync(filePath);
            resultado.tamanoDisco = stats.size;
            
            // Si el archivo es muy grande, emitir advertencia
            if (stats.size > DIAGNOSTICO_CONFIG.thresholds.tamanoMaximoArchivo) {
                resultado.advertencias.push(`Archivo muy grande (${Math.round(stats.size/1024/1024*100)/100}MB), considerar optimización`);
            }
            
            // Cargar datos y medir tiempo
            const inicio = Date.now();
            let data;
            
            try {
                data = await readJSONFn(filePath, null);
                const fin = Date.now();
                resultado.tiempoCarga = fin - inicio;
                
                // Verificar tiempo de carga
                if (resultado.tiempoCarga > DIAGNOSTICO_CONFIG.thresholds.tiempoMaximoCarga) {
                    resultado.advertencias.push(`Tiempo de carga elevado: ${resultado.tiempoCarga}ms`);
                }
                
                // Verificar estructura
                if (data === null) {
                    resultado.errores.push('Datos nulos o formato JSON incorrecto');
                } else {
                    // Verificar tipo de datos
                    if (config.cacheKey === 'agents') {
                        // Estructura especial para agents.json
                        if (!data.agents || !Array.isArray(data.agents)) {
                            resultado.errores.push('Estructura inválida: no contiene array "agents"');
                        } else {
                            resultado.elementosTotal = data.agents.length;
                        }
                    } else {
                        // Estructura para otros archivos (array)
                        if (!Array.isArray(data)) {
                            resultado.errores.push(`Estructura inválida: se esperaba un array, se encontró ${typeof data}`);
                        } else {
                            resultado.elementosTotal = data.length;
                            
                            // Advertencia si hay muchos elementos
                            if (data.length > DIAGNOSTICO_CONFIG.thresholds.longitudMaximaArray) {
                                resultado.advertencias.push(`Array muy grande (${data.length} elementos), puede afectar rendimiento`);
                            }
                        }
                    }
                }
                
                // Verificar índices
                if (TURBOCACHE.indexes[config.cacheKey]) {
                    resultado.indicesCreados = Object.keys(TURBOCACHE.indexes[config.cacheKey]).length;
                    
                    // Advertencia si faltan índices
                    if (resultado.elementosTotal > 0) {
                        const ratioIndices = resultado.indicesCreados / resultado.elementosTotal;
                        if (ratioIndices < DIAGNOSTICO_CONFIG.thresholds.minimoIndicesEsperados) {
                            resultado.advertencias.push(`Índices incompletos: solo ${Math.round(ratioIndices*100)}% de elementos indexados`);
                        }
                    }
                } else {
                    resultado.advertencias.push('No se han creado índices para este tipo de datos');
                }
                
                // Verificar caché
                resultado.enCache = TURBOCACHE.data[config.cacheKey] !== null;
                
            } catch (err) {
                resultado.errores.push(`Error al cargar datos: ${err.message}`);
            }
            
        } else {
            resultado.errores.push('Archivo no encontrado');
        }
        
    } catch (err) {
        resultado.errores.push(`Error en diagnóstico: ${err.message}`);
    }
    
    return resultado;
}

// Función para verificar imágenes
function verificarImagen(config) {
    const resultado = {
        imagen: config.nombre,
        existe: false,
        tamano: 0,
        enCache: false,
        errores: [],
        advertencias: []
    };
    
    try {
        // Determinar ruta de la imagen según el tipo
        let imagePath = '';
        if (config.cacheKey === 'kolbi') {
            imagePath = path.join(__dirname, 'kolbi.png');
        } else if (config.cacheKey === 'default') {
            imagePath = path.join(__dirname, 'firmasupervisor.jpg');
        } else if (config.cacheKey === 'msanabria') {
            imagePath = path.join(__dirname, 'fima_supervisora.jpg');
        }
        
        if (!imagePath) {
            resultado.errores.push('Ruta de imagen no determinada');
            return resultado;
        }
        
        if (fs.existsSync(imagePath)) {
            resultado.existe = true;
            
            // Obtener tamaño
            const stats = fs.statSync(imagePath);
            resultado.tamano = stats.size;
            
            // Verificar caché
            resultado.enCache = TURBOCACHE.data.logos[config.cacheKey] !== undefined || 
                             TURBOCACHE.data.firmas[config.cacheKey] !== undefined;
            
        } else {
            resultado.errores.push('Imagen no encontrada');
        }
    } catch (err) {
        resultado.errores.push(`Error en diagnóstico: ${err.message}`);
    }
    
    return resultado;
}

// Función principal de diagnóstico
async function ejecutarDiagnostico() {
    if (!TURBOCACHE) {
        console.error('Error: TURBOCACHE no inicializado. Debe llamar a inicializar() primero.');
        return {
            error: 'TURBOCACHE no inicializado'
        };
    }
    
    console.log('===== INICIANDO DIAGNÓSTICO DEL SISTEMA DE CACHÉ =====');
    
    const resultados = {
        configuracion: {
            TTL: TURBOCACHE.TTL,
            estadisticas: { ...TURBOCACHE.stats }
        },
        archivos: [],
        imagenes: [],
        resumen: {
            totalErrores: 0,
            totalAdvertencias: 0,
            tiempoTotalDiagnostico: 0
        }
    };
    
    const inicioDiagnostico = Date.now();
    
    // Verificar archivos
    console.log('1. Verificando archivos JSON...');
    for (const archivo of DIAGNOSTICO_CONFIG.archivos) {
        console.log(`   - Analizando ${archivo.nombre}...`);
        const resultado = await verificarArchivo(archivo);
        resultados.archivos.push(resultado);
        
        // Contar errores y advertencias
        resultados.resumen.totalErrores += resultado.errores.length;
        resultados.resumen.totalAdvertencias += resultado.advertencias.length;
        
        // Imprimir resultados
        if (resultado.errores.length > 0) {
            console.log(`     ❌ Errores (${resultado.errores.length}): ${resultado.errores.join(', ')}`);
        }
        if (resultado.advertencias.length > 0) {
            console.log(`     ⚠️ Advertencias (${resultado.advertencias.length}): ${resultado.advertencias.join(', ')}`);
        }
        if (resultado.errores.length === 0 && resultado.advertencias.length === 0) {
            console.log('     ✓ Sin problemas');
        }
    }
    
    // Verificar imágenes
    console.log('\n2. Verificando imágenes...');
    for (const imagen of DIAGNOSTICO_CONFIG.imagenes) {
        console.log(`   - Analizando ${imagen.nombre}...`);
        const resultado = verificarImagen(imagen);
        resultados.imagenes.push(resultado);
        
        // Contar errores y advertencias
        resultados.resumen.totalErrores += resultado.errores.length;
        resultados.resumen.totalAdvertencias += resultado.advertencias.length;
        
        // Imprimir resultados
        if (resultado.errores.length > 0) {
            console.log(`     ❌ Errores (${resultado.errores.length}): ${resultado.errores.join(', ')}`);
        }
        if (resultado.advertencias.length > 0) {
            console.log(`     ⚠️ Advertencias (${resultado.advertencias.length}): ${resultado.advertencias.join(', ')}`);
        }
        if (resultado.errores.length === 0 && resultado.advertencias.length === 0) {
            console.log('     ✓ Sin problemas');
        }
    }
    
    // Calcular tiempo total
    const finDiagnostico = Date.now();
    resultados.resumen.tiempoTotalDiagnostico = finDiagnostico - inicioDiagnostico;
    
    // Mostrar resumen final
    console.log('\n===== RESUMEN DEL DIAGNÓSTICO =====');
    console.log(`Errores encontrados: ${resultados.resumen.totalErrores}`);
    console.log(`Advertencias encontradas: ${resultados.resumen.totalAdvertencias}`);
    console.log(`Tiempo total: ${resultados.resumen.tiempoTotalDiagnostico}ms`);
    
    // Estado general
    if (resultados.resumen.totalErrores > 0) {
        console.log('\n❌ ESTADO GENERAL: NECESITA ATENCIÓN URGENTE');
    } else if (resultados.resumen.totalAdvertencias > 0) {
        console.log('\n⚠️ ESTADO GENERAL: REQUIERE REVISIÓN');
    } else {
        console.log('\n✅ ESTADO GENERAL: SISTEMA FUNCIONAL');
    }
    
    // Generar informe
    try {
        const informePath = path.join(__dirname, 'diagnostico-cache.json');
        fs.writeFileSync(informePath, JSON.stringify(resultados, null, 2), 'utf8');
        console.log(`\nInforme detallado guardado en: ${informePath}`);
    } catch (err) {
        console.error('Error al guardar informe:', err);
    }
    
    return resultados;
}

// Exportar funciones
module.exports = {
    inicializar
};

// No ejecutar automáticamente, ahora requiere inicialización