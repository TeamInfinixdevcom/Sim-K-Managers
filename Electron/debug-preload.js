// Archivo para depurar problemas con el preload
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Leer el contenido del archivo preload.js
function analizarPreload() {
  try {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log(`[DEBUG] Analizando archivo preload en: ${preloadPath}`);
    
    if (!fs.existsSync(preloadPath)) {
      console.error(`[DEBUG] Error: El archivo preload.js no existe en: ${preloadPath}`);
      return { error: 'Archivo no encontrado' };
    }
    
    const contenido = fs.readFileSync(preloadPath, 'utf8');
    console.log(`[DEBUG] Tamaño del archivo preload.js: ${contenido.length} bytes`);
    
    // Buscar función bulkAddTerminales
    const tieneBulkAdd = contenido.includes('bulkAddTerminales');
    console.log(`[DEBUG] ¿Incluye bulkAddTerminales?: ${tieneBulkAdd}`);
    
    // Guardar resultados
    const resultados = {
      tieneBulkAdd,
      longitud: contenido.length,
      fecha: new Date().toISOString(),
      lineas: contenido.split('\n').length
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'debug-preload-resultados.json'), 
      JSON.stringify(resultados, null, 2)
    );
    console.log('[DEBUG] Resultados guardados en debug-preload-resultados.json');
    
    // Guardar copia del preload
    fs.writeFileSync(
      path.join(__dirname, 'preload-backup.js'), 
      contenido
    );
    console.log('[DEBUG] Copia de seguridad guardada en preload-backup.js');
    
    return resultados;
  } catch (err) {
    console.error('[DEBUG] Error al analizar preload.js:', err);
    return { error: String(err) };
  }
}

// Crear un nuevo preload con bulkAddTerminales si no existe
function crearNuevoPreload() {
  try {
    const preloadPath = path.join(__dirname, 'preload.js');
    const contenido = fs.readFileSync(preloadPath, 'utf8');
    
    // Verificar si ya tiene bulkAddTerminales
    if (contenido.includes('bulkAddTerminales')) {
      console.log('[DEBUG] El preload.js ya incluye bulkAddTerminales, no se necesita modificar');
      return { modificado: false };
    }
    
    // Buscar la sección de API para terminales
    const apiTerminalesRegex = /\/\/ API para terminales[\s\S]*?eliminarTerminal:[^,}]*[,}]/;
    const match = contenido.match(apiTerminalesRegex);
    
    if (!match) {
      console.error('[DEBUG] No se pudo encontrar la sección API para terminales');
      return { modificado: false, error: 'Sección no encontrada' };
    }
    
    // Reemplazar la sección
    const original = match[0];
    const reemplazo = original.replace(
      /([^,}])(\s*[}]|$)/, 
      '$1,\n    bulkAddTerminales: (bulk) => ipcRenderer.invoke(\'terminales:bulkAdd\', bulk)$2'
    );
    
    // Crear nuevo contenido
    const nuevoContenido = contenido.replace(original, reemplazo);
    
    // Guardar nuevo preload
    fs.writeFileSync(
      path.join(__dirname, 'preload-nuevo.js'), 
      nuevoContenido
    );
    console.log('[DEBUG] Nuevo preload guardado en preload-nuevo.js');
    
    return { modificado: true };
  } catch (err) {
    console.error('[DEBUG] Error al crear nuevo preload:', err);
    return { error: String(err) };
  }
}

// Registrar manejador IPC para debug
ipcMain.handle('sistema:debugPreload', () => {
  return analizarPreload();
});

ipcMain.handle('sistema:crearNuevoPreload', () => {
  return crearNuevoPreload();
});

// Ejecutar análisis inmediatamente
setTimeout(() => {
  console.log('[DEBUG] Iniciando análisis de preload.js...');
  analizarPreload();
  crearNuevoPreload();
}, 1000);

module.exports = { analizarPreload, crearNuevoPreload };