// Monitor de rendimiento para el sistema
const fs = require('fs');
const path = require('path');
const os = require('os');

// Intervalo para monitorear el sistema (cada 5 minutos)
const INTERVALO_MONITOR = 5 * 60 * 1000;

// Función para obtener información del sistema
function obtenerInfoSistema() {
    return {
        memoria: {
            total: Math.round(os.totalmem() / (1024 * 1024)),
            libre: Math.round(os.freemem() / (1024 * 1024)),
            uso: Math.round((1 - os.freemem() / os.totalmem()) * 100)
        },
        cpu: os.loadavg()[0].toFixed(2),
        uptime: Math.floor(os.uptime() / 60),
        timestamp: new Date().toISOString()
    };
}

// Función para escribir el log
function escribirLogSistema() {
    const info = obtenerInfoSistema();
    
    const mensaje = `[${info.timestamp}] Memoria: ${info.memoria.uso}% (${info.memoria.libre}MB libres / ${info.memoria.total}MB total) | CPU: ${info.cpu} | Uptime: ${info.uptime} min\n`;
    
    // Escribir en un archivo de log
    const logPath = path.join(__dirname, 'sistema_monitor.log');
    
    fs.appendFile(logPath, mensaje, (err) => {
        if (err) {
            console.error('[MONITOR] Error escribiendo log:', err);
        }
    });
    
    // También mostrar en consola
    console.log(`[MONITOR] ${mensaje.trim()}`);
    
    // Comprobar si hay problemas
    if (info.memoria.uso > 90) {
        console.warn('[MONITOR] ¡ALERTA! Uso de memoria muy alto (>90%). Considere reiniciar la aplicación.');
        
        // Sugerir limpiar caché
        try {
            // Enviar mensaje a la ventana principal
            if (global.mainWindow && !global.mainWindow.isDestroyed()) {
                global.mainWindow.webContents.send('sistema:alerta', {
                    tipo: 'memoria',
                    mensaje: 'Uso de memoria muy alto. Se recomienda limpiar caché o reiniciar la aplicación.'
                });
            }
        } catch (err) {
            console.error('[MONITOR] Error enviando alerta:', err);
        }
    }
}

// Iniciar el monitor
function iniciarMonitor() {
    console.log('[MONITOR] Iniciando monitor de rendimiento del sistema');
    
    // Ejecutar inmediatamente una vez
    escribirLogSistema();
    
    // Configurar el intervalo
    setInterval(escribirLogSistema, INTERVALO_MONITOR);
}

// Exportar funcionalidad
module.exports = {
    iniciar: iniciarMonitor,
    obtenerInfo: obtenerInfoSistema
};