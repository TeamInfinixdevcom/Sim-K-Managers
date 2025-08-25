// Script para mostrar el contenido real del archivo preload.js
const fs = require('fs');
const path = require('path');

const electronDir = path.join(__dirname, 'Electron');
const preloadPath = path.join(electronDir, 'preload.js');

console.log(`Verificando preload.js en ${preloadPath}...`);

try {
  if (!fs.existsSync(preloadPath)) {
    console.error(`ERROR: El archivo preload.js no existe en ${preloadPath}`);
    process.exit(1);
  }
  
  const contenido = fs.readFileSync(preloadPath, 'utf8');
  
  console.log('---- CONTENIDO DEL ARCHIVO preload.js ----');
  console.log(contenido);
  console.log('---- FIN DEL CONTENIDO ----');
  
  // Analizar línea por línea
  console.log('\n---- ANÁLISIS LÍNEA POR LÍNEA ----');
  const lineas = contenido.split('\n');
  console.log(`Total de líneas: ${lineas.length}`);
  
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (linea.includes(':') && linea.includes('=>')) {
      console.log(`Línea ${i+1}: ${linea} (POSIBLE FUNCIÓN)`);
    } else if (linea.length > 0) {
      console.log(`Línea ${i+1}: ${linea}`);
    }
  }
  
} catch (err) {
  console.error('Error al leer el archivo:', err);
}

// Ahora vamos a reescribir el preload.js directamente
console.log('\n---- CREANDO NUEVO ARCHIVO preload.js ----');

try {
  // Crear backup
  const backupPath = path.join(electronDir, `preload-backup-manual-${Date.now()}.js`);
  fs.copyFileSync(preloadPath, backupPath);
  console.log(`Backup creado en: ${backupPath}`);
  
  // Contenido correcto del preload.js
  const nuevoContenido = `// Preload script con corrección de nombres de funciones
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs protegidas al front-end
contextBridge.exposeInMainWorld('electronAPI', {
  // API para autenticación
  login: (email, password) => ipcRenderer.invoke('supervisor:auth', { email, password }),
  authSupervisor: (email, password) => ipcRenderer.invoke('supervisor:auth', { email, password }),
  
  // API para terminales
  listarTerminales: () => ipcRenderer.invoke('terminales:list'),
  listTerminales: () => ipcRenderer.invoke('terminales:list'),
  agregarTerminal: (t) => ipcRenderer.invoke('terminales:add', t),
  eliminarTerminal: (t) => ipcRenderer.invoke('terminales:remove', t),
  bulkAddTerminales: (bulk) => ipcRenderer.invoke('terminales:bulkAdd', bulk),
  
  // API para agentes
  listarAgentes: () => ipcRenderer.invoke('agents:list'),
  listAgents: () => ipcRenderer.invoke('agents:list'),
  agregarAgente: (a) => ipcRenderer.invoke('agents:add', a),
  addAgent: (a) => ipcRenderer.invoke('agents:add', a),
  eliminarAgente: (correo) => ipcRenderer.invoke('agents:remove', correo),
  removeAgent: (correo) => ipcRenderer.invoke('agents:remove', correo),
  
  // API para SIMs
  generarPDFsim: (payload) => ipcRenderer.invoke('sims:generateSend', payload),
  generateAndSendSIM: (payload) => ipcRenderer.invoke('sims:generateSend', payload),
  
  // API para notas
  listarNotas: () => ipcRenderer.invoke('notas:list'),
  listNotas: () => ipcRenderer.invoke('notas:list'),
  agregarNota: (n) => ipcRenderer.invoke('notas:add', n),
  addNota: (n) => ipcRenderer.invoke('notas:add', n),
  editarNota: (n) => ipcRenderer.invoke('notas:edit', n),
  editNota: (n) => ipcRenderer.invoke('notas:edit', n),
  eliminarNota: (id) => ipcRenderer.invoke('notas:remove', id),
  removeNota: (id) => ipcRenderer.invoke('notas:remove', id),
  
  // API para historial
  listarHistorial: (correo) => ipcRenderer.invoke('historial:list', correo),
  listHistorial: (correo) => ipcRenderer.invoke('historial:list', correo),
  generarPDFHistorial: (correo) => ipcRenderer.invoke('historial:pdf', correo),
  historialPdf: (correo) => ipcRenderer.invoke('historial:pdf', correo),
  resetHistorial: () => ipcRenderer.invoke('historial:reset'),
  
  // API para diagnóstico
  diagnostico: () => ipcRenderer.invoke('sistema:diagnostico'),
  debugPreload: () => ipcRenderer.invoke('sistema:debugPreload'),
  crearNuevoPreload: () => ipcRenderer.invoke('sistema:crearNuevoPreload'),
  
  // API para sistema
  invalidarCache: (tipo) => ipcRenderer.invoke('sistema:invalidarCache', tipo),
  precargar: () => ipcRenderer.invoke('sistema:precargar'),
  precargarDatos: () => ipcRenderer.invoke('sistema:precargar'),
  estadisticasCache: () => ipcRenderer.invoke('sistema:estadisticasCache'),
  monitorSnapshot: () => ipcRenderer.invoke('sistema:monitorSnapshot')
});`;

  // Escribir el nuevo contenido
  fs.writeFileSync(preloadPath, nuevoContenido);
  console.log('Archivo preload.js reescrito correctamente');
  console.log('Por favor reinicia la aplicación Electron para aplicar los cambios');
  
} catch (err) {
  console.error('Error al reescribir el archivo:', err);
}