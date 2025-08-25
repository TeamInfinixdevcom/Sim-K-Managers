// Archivo de diagnóstico para solucionar problemas
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Escribir diagnóstico a un archivo
function escribirDiagnostico() {
  try {
    const diagnostico = {
      fecha: new Date().toISOString(),
      sistemaMonitorSnapshot: ipcMain.listenerCount('sistema:monitorSnapshot'),
      handlers: {
        'sistema:invalidarCache': ipcMain.listenerCount('sistema:invalidarCache'),
        'sistema:precargar': ipcMain.listenerCount('sistema:precargar'),
        'sistema:estadisticasCache': ipcMain.listenerCount('sistema:estadisticasCache'),
        'terminales:list': ipcMain.listenerCount('terminales:list'),
        'terminales:add': ipcMain.listenerCount('terminales:add'),
        'terminales:remove': ipcMain.listenerCount('terminales:remove'),
        'terminales:bulkAdd': ipcMain.listenerCount('terminales:bulkAdd'),
        'historial:reset': ipcMain.listenerCount('historial:reset')
      }
    };
    
    const diagnosticoPath = path.join(__dirname, 'diagnostico.json');
    fs.writeFileSync(diagnosticoPath, JSON.stringify(diagnostico, null, 2));
    console.log(`[DIAGNÓSTICO] Informe generado en ${diagnosticoPath}`);
    return diagnostico;
  } catch (err) {
    console.error('[DIAGNÓSTICO] Error al generar informe:', err);
    return { error: String(err) };
  }
}

// Exponer el método para diagnóstico solo si no existe ya
if (!ipcMain.listenerCount('sistema:diagnostico')) {
  ipcMain.handle('sistema:diagnostico', () => {
    return escribirDiagnostico();
  });
  console.log('[DIAGNÓSTICO] Manejador sistema:diagnostico registrado');
}

// Llamar al diagnóstico inmediatamente
setTimeout(() => {
  escribirDiagnostico();
}, 1000);

module.exports = { escribirDiagnostico };