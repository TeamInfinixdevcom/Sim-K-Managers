// Diagnóstico y solución de problemas IPC
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

console.log('[IPC-DIAG] Inicializando diagnóstico de IPC...');

// Variables para registrar estado
let canalesRegistrados = {};
let contadorLlamadas = {};
let ultimosErrores = {};

// Función para monitorear el registro de canales
function monitorearRegistro() {
    // Guardar la función original
    const handleOriginal = ipcMain.handle;
    
    // Reemplazar con nuestra versión instrumentada
    ipcMain.handle = function(canal, callback) {
        console.log(`[IPC-DIAG] Registrando canal: ${canal}`);
        canalesRegistrados[canal] = {
            registrado: true,
            timestamp: Date.now()
        };
        
        // Envolver el callback para capturar errores
        const callbackSeguro = async (event, ...args) => {
            try {
                // Incrementar contador de llamadas
                contadorLlamadas[canal] = (contadorLlamadas[canal] || 0) + 1;
                
                console.log(`[IPC-DIAG] Invocando canal: ${canal} (llamada #${contadorLlamadas[canal]})`);
                
                // Llamar al callback original
                const resultado = await callback(event, ...args);
                
                // Registrar éxito
                canalesRegistrados[canal].ultimaEjecucion = Date.now();
                canalesRegistrados[canal].ultimoResultado = 'éxito';
                
                return resultado;
            } catch (error) {
                // Registrar error
                console.error(`[IPC-DIAG] Error en canal ${canal}:`, error);
                ultimosErrores[canal] = {
                    mensaje: error.message,
                    stack: error.stack,
                    timestamp: Date.now()
                };
                
                canalesRegistrados[canal].ultimaEjecucion = Date.now();
                canalesRegistrados[canal].ultimoResultado = 'error';
                
                // Re-lanzar para que se propague al frontend
                throw error;
            }
        };
        
        // Llamar a la función original
        return handleOriginal.call(ipcMain, canal, callbackSeguro);
    };
    
    console.log('[IPC-DIAG] Monitoreo de registro de canales activado');
}

// Registrar nuestros propios canales de diagnóstico
function registrarCanalesDiagnostico() {
    console.log('[IPC-DIAG] Registrando canales de diagnóstico');
    
    // Obtener información de diagnóstico
    ipcMain.handle('sistema:ipcDiagnostico', async () => {
        return {
            canalesRegistrados,
            contadorLlamadas,
            ultimosErrores
        };
    });
    
    // Reparar canales comunes (re-registrando funciones básicas)
    ipcMain.handle('sistema:repararIPC', async () => {
        try {
            // Intentar cargar inventario nuevamente
            const inventario = require('./main-inventario');
            
            if (typeof inventario.registrarManejadoresIPC === 'function') {
                const resultado = inventario.registrarManejadoresIPC(ipcMain);
                return {
                    ok: resultado === true,
                    mensaje: resultado ? 'Canales re-registrados correctamente' : 'Error al re-registrar canales'
                };
            } else {
                return {
                    ok: false,
                    mensaje: 'La función registrarManejadoresIPC no está disponible'
                };
            }
        } catch (error) {
            console.error('[IPC-DIAG] Error al reparar canales:', error);
            return {
                ok: false,
                mensaje: 'Error al reparar canales: ' + error.message
            };
        }
    });
    
    // Probar canal específico
    ipcMain.handle('sistema:probarCanal', async (event, canal) => {
        try {
            if (!canalesRegistrados[canal]) {
                return {
                    ok: false,
                    mensaje: `El canal ${canal} no está registrado`
                };
            }
            
            // Registrar la prueba
            canalesRegistrados[canal].ultimaPrueba = Date.now();
            
            return {
                ok: true,
                mensaje: `Canal ${canal} probado correctamente`,
                registro: canalesRegistrados[canal]
            };
        } catch (error) {
            return {
                ok: false,
                mensaje: 'Error al probar canal: ' + error.message
            };
        }
    });
}

// Función para generar informe de diagnóstico
function generarInforme() {
    const informe = {
        timestamp: Date.now(),
        fecha: new Date().toISOString(),
        canales: {
            total: Object.keys(canalesRegistrados).length,
            detalle: canalesRegistrados
        },
        llamadas: {
            total: Object.values(contadorLlamadas).reduce((a, b) => a + b, 0),
            detalle: contadorLlamadas
        },
        errores: {
            total: Object.keys(ultimosErrores).length,
            detalle: ultimosErrores
        }
    };
    
    // Guardar informe en archivo
    try {
        const rutaInforme = path.join(__dirname, 'ipc-diagnostico.json');
        fs.writeFileSync(rutaInforme, JSON.stringify(informe, null, 2), 'utf8');
        console.log(`[IPC-DIAG] Informe guardado en ${rutaInforme}`);
    } catch (error) {
        console.error('[IPC-DIAG] Error al guardar informe:', error);
    }
    
    return informe;
}

// Función para inicializar el diagnóstico
function inicializar() {
    monitorearRegistro();
    registrarCanalesDiagnostico();
    
    // Generar informe periódicamente
    setInterval(() => {
        generarInforme();
    }, 60000); // Cada minuto
    
    console.log('[IPC-DIAG] Diagnóstico IPC inicializado correctamente');
    
    // Devolver funciones útiles
    return {
        generarInforme,
        getCanalesRegistrados: () => canalesRegistrados,
        getContadorLlamadas: () => contadorLlamadas,
        getUltimosErrores: () => ultimosErrores
    };
}

// Exportar módulo
module.exports = {
    inicializar
};