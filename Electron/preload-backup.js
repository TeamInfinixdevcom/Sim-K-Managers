// Preload script con corrección de nombres de funciones
const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const agentesUtils = require('./agentes-utils');

// Verificación de errores de ipcRenderer
if (!ipcRenderer || typeof ipcRenderer.invoke !== 'function') {
  console.error('[PRELOAD] Error: ipcRenderer no está disponible o no tiene método invoke');
}

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
  listAgents: () => {
    try {
        const agentsPath = path.resolve(__dirname, 'agents.json');
        const data = fs.readFileSync(agentsPath, 'utf8');
        const json = JSON.parse(data);
        return Array.isArray(json.agents) ? json.agents : [];
    } catch (err) {
        console.error('Error leyendo agents.json:', err);
        return [];
    }
  },
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
  monitorSnapshot: () => ipcRenderer.invoke('sistema:monitorSnapshot'),
  
  // Funciones optimizadas para agentes
  guardarAgente: async (datos) => {
    try {
        return await agentesUtils.guardarAgente(datos);
    } catch (error) {
        console.error('Error en guardarAgente:', error);
        return { exito: false, mensaje: 'Error en la operación' };
    }
  },
  
  eliminarAgente: async (correo) => {
    try {
        return await agentesUtils.eliminarAgentePorCorreo(correo);
    } catch (error) {
        console.error('Error en eliminarAgente:', error);
        return { exito: false, mensaje: 'Error en la operación' };
    }
  },
  
  obtenerAgentes: async () => {
    try {
        return await agentesUtils.obtenerAgentes();
    } catch (error) {
        console.error('Error en obtenerAgentes:', error);
        return [];
    }
  },
});

// REVISIÓN: Verificar si window.electronAPI.listAgents está correctamente definida y enlazada, y si accede bien a agents.json