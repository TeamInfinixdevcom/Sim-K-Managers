// Preload script con corrección de nombres de funciones
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs protegidas al front-end
contextBridge.exposeInMainWorld('electronAPI', {
    // API para autenticación
    login: (email, password) => {
      console.log('Preload: Invocando supervisor:auth con email:', email);
      return ipcRenderer.invoke('supervisor:auth', { email, password });
    },
    authSupervisor: (email, password) => {
      console.log('Preload: Invocando supervisor:auth con email:', email);
      return ipcRenderer.invoke('supervisor:auth', { email, password });
    },  // API para terminales
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
});