// Monitor de caché para rendimiento de la aplicación
console.log('[MONITOR] Iniciando sistema de monitoreo de caché');

// Variables globales para el módulo
let cacheRef = null;
let monitorActivo = false;
let intervaloMonitor = null;
let ultimoSnapshot = null;
const historicoSnapshots = [];
const MAX_HISTORICO = 10;

// Inicializar el monitor con una referencia a la caché
function iniciarMonitor(refTurboCache) {
    if (!refTurboCache) {
        console.error('[MONITOR] Error: No se proporcionó objeto de caché');
        return false;
    }
    
    // Guardar referencia a la caché
    cacheRef = refTurboCache;
    
    // Comprobar que la referencia es válida
    if (!cacheRef || !cacheRef.stats) {
        console.error('[MONITOR] Error: La referencia a la caché no es válida');
        return false;
    }
    
    // Si ya hay un monitor activo, detenerlo
    if (monitorActivo) {
        detenerMonitor();
    }
    
    // Tomar snapshot inicial
    tomarSnapshot();
    
    // Iniciar monitoreo periódico (cada 60 segundos)
    intervaloMonitor = setInterval(tomarSnapshot, 60000);
    monitorActivo = true;
    
    return true;
}

// Detener el monitor
function detenerMonitor() {
    if (intervaloMonitor) {
        clearInterval(intervaloMonitor);
        intervaloMonitor = null;
    }
    monitorActivo = false;
    console.log('[MONITOR] Monitor detenido');
}

// Tomar un snapshot de las estadísticas actuales
function tomarSnapshot() {
    if (!cacheRef || !cacheRef.stats) {
        console.error('[MONITOR] Error: No hay referencia válida a la caché');
        return null;
    }
    
    // Crear un snapshot con timestamp y estadísticas
    const snapshot = {
        timestamp: new Date().toISOString(),
        hits: cacheRef.stats.hits || 0,
        misses: cacheRef.stats.misses || 0,
        reads: cacheRef.stats.reads || 0,
        writes: cacheRef.stats.writes || 0,
        cacheTam: calcularTamCache()
    };
    
    // Guardar como último snapshot
    ultimoSnapshot = snapshot;
    
    // Añadir al histórico
    historicoSnapshots.push(snapshot);
    
    // Limitar el tamaño del histórico
    if (historicoSnapshots.length > MAX_HISTORICO) {
        historicoSnapshots.shift();
    }
    
    return snapshot;
}

// Función pública para tomar un snapshot bajo demanda
function tomarSnapshotAhora() {
    return {
        actual: tomarSnapshot(),
        historico: historicoSnapshots
    };
}

// Calcular tamaño aproximado de la caché
function calcularTamCache() {
    if (!cacheRef || !cacheRef.data) return 0;
    
    try {
        const tam = {
            terminales: cacheRef.data.terminales ? JSON.stringify(cacheRef.data.terminales).length : 0,
            agents: cacheRef.data.agents ? JSON.stringify(cacheRef.data.agents).length : 0,
            historial: cacheRef.data.historial ? JSON.stringify(cacheRef.data.historial).length : 0,
            notas: cacheRef.data.notas ? JSON.stringify(cacheRef.data.notas).length : 0
        };
        
        return {
            ...tam,
            total: tam.terminales + tam.agents + tam.historial + tam.notas
        };
    } catch (err) {
        console.error('[MONITOR] Error calculando tamaño de caché:', err);
        return { total: 0 };
    }
}

// Exportar funciones públicas
module.exports = {
    iniciarMonitor,
    detenerMonitor,
    tomarSnapshotAhora
};