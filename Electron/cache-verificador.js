// Verificador de funcionamiento del sistema de caché TURBOCACHE
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Importar módulos
const mainInventario = require('./main-inventario');
const { TURBOCACHE, readJSON, TERMINALES_PATH } = mainInventario;

// Generar datos de prueba
function generarDatosPrueba(cantidad) {
    console.log(`[TEST] Generando ${cantidad} terminales de prueba...`);
    const terminales = [];
    
    for (let i = 0; i < cantidad; i++) {
        const terminal = {
            id: `test-${i}`,
            agencia: `Agencia Test ${Math.floor(i/10)}`,
            marca: `Marca ${i % 5}`,
            terminal: `Terminal ${i}`,
            disponible: Math.floor(Math.random() * 10),
            test: true
        };
        terminales.push(terminal);
    }
    
    return terminales;
}

// Verificar la caché
async function verificarCache() {
    console.log('[TEST] Iniciando verificación de caché...');
    
    try {
        // Generar archivo de prueba
        const cantidadTerminales = 100;
        const terminalesPrueba = generarDatosPrueba(cantidadTerminales);
        const archivoTemporal = path.join(__dirname, 'test_cache.json');
        
        // Escribir archivo
        fs.writeFileSync(archivoTemporal, JSON.stringify(terminalesPrueba), 'utf8');
        console.log('[TEST] Archivo de prueba creado');
        
        // Limpiar caché
        console.log('[TEST] Limpiando caché...');
        TURBOCACHE.data.test = null;
        TURBOCACHE.meta.timestamp.test = 0;
        TURBOCACHE.indexes.test = {};
        
        // Primera lectura (debería ser un miss)
        console.log('[TEST] Primera lectura (esperando miss)...');
        const hitsMiss = TURBOCACHE.stats.hits;
        const missesMiss = TURBOCACHE.stats.misses;
        
        const inicioMiss = Date.now();
        const datosMiss = await readJSON(archivoTemporal, []);
        const finMiss = Date.now();
        
        // Segunda lectura (debería ser un hit)
        console.log('[TEST] Segunda lectura (esperando hit)...');
        const inicioHit = Date.now();
        const datosHit = await readJSON(archivoTemporal, []);
        const finHit = Date.now();
        
        const hitsHit = TURBOCACHE.stats.hits;
        const missesHit = TURBOCACHE.stats.misses;
        
        // Verificar resultados
        const resultados = {
            primeraLectura: {
                tipo: missesMiss < TURBOCACHE.stats.misses ? 'MISS ✓' : 'HIT ✗',
                tiempo: finMiss - inicioMiss,
                estadoHits: `${hitsMiss} -> ${TURBOCACHE.stats.hits}`,
                estadoMisses: `${missesMiss} -> ${TURBOCACHE.stats.misses}`
            },
            segundaLectura: {
                tipo: hitsHit < TURBOCACHE.stats.hits ? 'HIT ✓' : 'MISS ✗',
                tiempo: finHit - inicioHit,
                estadoHits: `${hitsHit} -> ${TURBOCACHE.stats.hits}`,
                estadoMisses: `${missesHit} -> ${TURBOCACHE.stats.misses}`
            },
            datosCorrectos: JSON.stringify(datosMiss) === JSON.stringify(datosHit),
            mejora: (finMiss - inicioMiss) / (finHit - inicioHit)
        };
        
        // Limpiar
        try {
            fs.unlinkSync(archivoTemporal);
            console.log('[TEST] Archivo de prueba eliminado');
        } catch (e) {
            console.warn('[TEST] No se pudo eliminar el archivo de prueba:', e);
        }
        
        // Mostrar resultados
        console.log('\n===== RESULTADOS DE LA VERIFICACIÓN =====');
        console.log(`Primera lectura: ${resultados.primeraLectura.tipo} en ${resultados.primeraLectura.tiempo}ms`);
        console.log(`Segunda lectura: ${resultados.segundaLectura.tipo} en ${resultados.segundaLectura.tiempo}ms`);
        console.log(`Datos correctos: ${resultados.datosCorrectos ? 'SÍ ✓' : 'NO ✗'}`);
        console.log(`Mejora de rendimiento: ${resultados.mejora.toFixed(2)}x más rápido`);
        
        if (resultados.primeraLectura.tipo.includes('✓') && 
            resultados.segundaLectura.tipo.includes('✓') && 
            resultados.datosCorrectos) {
            console.log('\n✅ VERIFICACIÓN EXITOSA: La caché funciona correctamente');
        } else {
            console.log('\n❌ VERIFICACIÓN FALLIDA: La caché no funciona como se esperaba');
        }
        
        return resultados;
    } catch (err) {
        console.error('[TEST] Error durante la verificación:', err);
        return { error: String(err) };
    }
}

// Exportar funciones
module.exports = {
    verificarCache
};

// Si se ejecuta directamente
if (require.main === module) {
    verificarCache()
        .then(() => {
            console.log('\nVerificación completada');
        })
        .catch(err => {
            console.error('Error en verificación:', err);
        });
}