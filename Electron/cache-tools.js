// Herramientas de caché para la consola del navegador
console.log("[CACHE-TOOLS] Inicializando herramientas de caché...");

// Función para verificar que electronAPI existe
function verificarAPI() {
    if (!window.electronAPI) {
        console.error('⚠️ Error: API de Electron no disponible');
        console.error('Las herramientas de caché requieren que la API de Electron esté configurada en preload.js');
        return false;
    }
    return true;
}

// Exponer funciones de caché para uso en consola
window.mostrarEstadisticasCache = async function() {
    if (!verificarAPI()) {
        return null;
    }
    
    try {
        const stats = await window.electronAPI.estadisticasCache();
        
        if (!stats || !stats.stats) {
            console.error('Error: Estadísticas de caché no disponibles o en formato incorrecto');
            return null;
        }
        
        // Asegurar que las propiedades existan para evitar errores
        const safeStats = {
            stats: stats.stats || { hits: 0, misses: 0, reads: 0, writes: 0 },
            meta: stats.meta || { timestamp: {} },
            sizes: stats.sizes || { terminales: 0, agents: 0, historial: 0, notas: 0 }
        };
        
        // Asegurar que timestamp existe
        if (!safeStats.meta.timestamp) {
            safeStats.meta.timestamp = {};
        }
        
        console.table({
            'Hits de caché': safeStats.stats.hits || 0,
            'Misses de caché': safeStats.stats.misses || 0,
            'Lecturas de disco': safeStats.stats.reads || 0,
            'Escrituras a disco': safeStats.stats.writes || 0,
            'Terminales en caché': !!(safeStats.meta.timestamp.terminales),
            'Agentes en caché': !!(safeStats.meta.timestamp.agents),
            'Historial en caché': !!(safeStats.meta.timestamp.historial),
            'Notas en caché': !!(safeStats.meta.timestamp.notas),
            'Tamaño Terminales (KB)': Math.round((safeStats.sizes.terminales || 0) / 1024),
            'Tamaño Agentes (KB)': Math.round((safeStats.sizes.agents || 0) / 1024),
            'Tamaño Historial (KB)': Math.round((safeStats.sizes.historial || 0) / 1024),
            'Tamaño Notas (KB)': Math.round((safeStats.sizes.notas || 0) / 1024)
        });
        
        return safeStats;
    } catch (err) {
        console.error('Error obteniendo estadísticas:', err);
        return null;
    }
};

window.limpiarCache = async function(tipo) {
    if (!verificarAPI()) {
        return null;
    }
    
    try {
        const result = await window.electronAPI.invalidarCache(tipo);
        console.log(`${tipo ? `Caché de ${tipo}` : 'Toda la caché'} ha sido limpiada`);
        return result;
    } catch (err) {
        console.error('Error limpiando caché:', err);
    }
};

// Mostrar mensaje de ayuda en consola al iniciar
console.log(`
====================== HERRAMIENTAS DE CACHÉ ======================
Para usar las herramientas de rendimiento, abre las herramientas de 
desarrollo (F12 o Ctrl+Shift+I) y ejecuta:

1. Ver estadísticas de caché:
   > mostrarEstadisticasCache()

2. Limpiar toda la caché:
   > limpiarCache()

3. Limpiar solo un tipo de caché:
   > limpiarCache('terminales')  // Solo terminales
   > limpiarCache('agents')      // Solo agentes
   > limpiarCache('historial')   // Solo historial
   > limpiarCache('notas')       // Solo notas
=====================================================================
`);