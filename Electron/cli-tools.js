const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Importar el módulo principal
const mainInventario = require('./main-inventario');
// Importar módulo de diagnóstico
const diagnosticoModule = require('./diagnostico-cache');
// Inicializar el diagnóstico
const diagnostico = diagnosticoModule.inicializar(
    mainInventario.TURBOCACHE,
    {
        TERMINALES_PATH: mainInventario.TERMINALES_PATH,
        AGENTS_PATH: mainInventario.AGENTS_PATH,
        HISTORIAL_PATH: mainInventario.HISTORIAL_PATH,
        NOTAS_PATH: mainInventario.NOTAS_PATH
    },
    mainInventario.readJSON
);

// Función para mostrar ayuda
function mostrarAyuda() {
    console.log(`
=================================================================
                SIM KMANAGER - HERRAMIENTAS CLI
=================================================================
Uso: node cli-tools.js [comando] [parámetro]

Comandos disponibles:

  stats                 Mostrar estadísticas de caché
  clear-cache           Limpiar toda la caché
  clear-cache:tipo      Limpiar un tipo específico de caché
                        (tipos: terminales, agents, historial, notas)
  preload               Precargar todos los datos
  diagnostico           Ejecutar diagnóstico del sistema de caché
  help                  Mostrar esta ayuda

Ejemplos:
  node cli-tools.js stats
  node cli-tools.js clear-cache
  node cli-tools.js clear-cache:terminales
  node cli-tools.js preload
  node cli-tools.js diagnostico
=================================================================
    `);
}

// Función principal
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === 'help') {
        mostrarAyuda();
        process.exit(0);
    }
    
    const comando = args[0];
    
    try {
        // Ejecutar el comando solicitado
        switch (comando) {
            case 'stats': {
                console.log('Obteniendo estadísticas de caché...');
                const stats = await mainInventario.obtenerEstadisticasCache();
                console.log('\n=== ESTADÍSTICAS DE CACHÉ ===\n');
                console.log(`Hits de caché: ${stats.stats.hits}`);
                console.log(`Misses de caché: ${stats.stats.misses}`);
                console.log(`Lecturas de disco: ${stats.stats.reads}`);
                console.log(`Escrituras a disco: ${stats.stats.writes}`);
                console.log('\n=== TAMAÑOS DE CACHÉ ===\n');
                console.log(`Terminales: ${Math.round(stats.sizes.terminales / 1024)} KB`);
                console.log(`Agentes: ${Math.round(stats.sizes.agents / 1024)} KB`);
                console.log(`Historial: ${Math.round(stats.sizes.historial / 1024)} KB`);
                console.log(`Notas: ${Math.round(stats.sizes.notas / 1024)} KB`);
                break;
            }
            
            case 'clear-cache': {
                console.log('Limpiando toda la caché...');
                await mainInventario.limpiarCache();
                console.log('✓ Caché limpiada correctamente');
                break;
            }
            
            case 'preload': {
                console.log('Precargando datos en caché...');
                const resultado = await mainInventario.precargarDatos();
                if (resultado.ok) {
                    console.log('✓ Datos precargados correctamente');
                } else {
                    console.error('✗ Error al precargar datos:', resultado.error);
                }
                break;
            }
            
            case 'diagnostico': {
                console.log('Ejecutando diagnóstico del sistema de caché...');
                await diagnostico.ejecutarDiagnostico();
                break;
            }
            
            default: {
                // Comprobar si es un comando de limpieza específico
                if (comando.startsWith('clear-cache:')) {
                    const tipo = comando.split(':')[1];
                    if (['terminales', 'agents', 'historial', 'notas'].includes(tipo)) {
                        console.log(`Limpiando caché de ${tipo}...`);
                        await mainInventario.limpiarCache(tipo);
                        console.log(`✓ Caché de ${tipo} limpiada correctamente`);
                    } else {
                        console.error(`✗ Tipo de caché no válido: ${tipo}`);
                        console.log('Tipos válidos: terminales, agents, historial, notas');
                    }
                } else {
                    console.error(`✗ Comando desconocido: ${comando}`);
                    mostrarAyuda();
                }
            }
        }
    } catch (err) {
        console.error('Error ejecutando comando:', err);
    }
    
    // Salir del proceso después de ejecutar el comando
    process.exit(0);
}

// Añadir funciones exportadas a main-inventario.js
mainInventario.obtenerEstadisticasCache = async function() {
    return {
        ok: true,
        stats: mainInventario.TURBOCACHE.stats,
        meta: mainInventario.TURBOCACHE.meta,
        sizes: {
            terminales: mainInventario.TURBOCACHE.data.terminales ? 
                JSON.stringify(mainInventario.TURBOCACHE.data.terminales).length : 0,
            agents: mainInventario.TURBOCACHE.data.agents ? 
                JSON.stringify(mainInventario.TURBOCACHE.data.agents).length : 0,
            historial: mainInventario.TURBOCACHE.data.historial ? 
                JSON.stringify(mainInventario.TURBOCACHE.data.historial).length : 0,
            notas: mainInventario.TURBOCACHE.data.notas ? 
                JSON.stringify(mainInventario.TURBOCACHE.data.notas).length : 0
        }
    };
};

mainInventario.limpiarCache = async function(tipo) {
    if (tipo && mainInventario.TURBOCACHE.data[tipo]) {
        mainInventario.TURBOCACHE.data[tipo] = null;
        mainInventario.TURBOCACHE.meta.timestamp[tipo] = 0;
        mainInventario.TURBOCACHE.meta.hashes[tipo] = '';
        mainInventario.TURBOCACHE.indexes[tipo] = {};
        console.log(`[CACHE] Invalidada caché de ${tipo}`);
    } else {
        // Invalidar toda la caché
        for (const key in mainInventario.TURBOCACHE.data) {
            mainInventario.TURBOCACHE.data[key] = null;
            mainInventario.TURBOCACHE.meta.timestamp[key] = 0;
            mainInventario.TURBOCACHE.meta.hashes[key] = '';
            mainInventario.TURBOCACHE.indexes[key] = {};
        }
        console.log('[CACHE] Caché completamente invalidada');
    }
    return { ok: true };
};

mainInventario.precargarDatos = async function() {
    console.log('[SISTEMA] Precargando datos...');
    
    try {
        await Promise.all([
            mainInventario.readJSON(mainInventario.TERMINALES_PATH, []),
            mainInventario.readJSON(mainInventario.AGENTS_PATH, { defaultAgent: null, agents: [] }),
            mainInventario.readJSON(mainInventario.HISTORIAL_PATH, []),
            mainInventario.readJSON(mainInventario.NOTAS_PATH, [])
        ]);
        console.log('[SISTEMA] Datos precargados con éxito');
        return { ok: true, stats: mainInventario.TURBOCACHE.stats };
    } catch (err) {
        console.error('[SISTEMA] Error en precarga:', err);
        return { ok: false, error: String(err) };
    }
};

// Iniciar la ejecución
main();