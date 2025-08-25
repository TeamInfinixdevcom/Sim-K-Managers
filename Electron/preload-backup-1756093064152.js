// Preload script con corrección de nombres de funciones
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs protegidas al front-end a través del puente de contexto
contextBridge.exposeInMainWorld(
  'electronAPI', {
    // API para autenticación
    login: (email, password) => ipcRenderer.invoke('supervisor:auth', { email, password }),
    authSupervisor: (email, password) => ipcRenderer.invoke('supervisor:auth', { email, password }), // Alias para compatibilidad
    
    // API para terminales
    listarTerminales: () => ipcRenderer.invoke('terminales:list'),
    listTerminales: () => ipcRenderer.invoke('terminales:list'), // Alias para compatibilidad
    agregarTerminal: (t) => ipcRenderer.invoke('terminales:add', t),
    eliminarTerminal: (t) => ipcRenderer.invoke('terminales:remove', t),
    bulkAddTerminales: (bulk) => {
      console.log('Preload: Llamando a terminales:bulkAdd con', bulk.length, 'terminales');
      return ipcRenderer.invoke('terminales:bulkAdd', bulk);
    },
    
    // API para agentes
    listarAgentes: () => ipcRenderer.invoke('agents:list'),
    listAgents: () => ipcRenderer.invoke('agents:list'), // Alias para compatibilidad
    agregarAgente: (a) => ipcRenderer.invoke('agents:add', a),
    addAgent: (a) => ipcRenderer.invoke('agents:add', a), // Alias para compatibilidad
    eliminarAgente: (correo) => ipcRenderer.invoke('agents:remove', correo),
    removeAgent: (correo) => ipcRenderer.invoke('agents:remove', correo), // Alias para compatibilidad
    
    // API para SIMs
    generarPDFsim: (payload) => ipcRenderer.invoke('sims:generateSend', payload),
    generateAndSendSIM: (payload) => ipcRenderer.invoke('sims:generateSend', payload), // Alias para compatibilidad
    
    // API para notas
    listarNotas: () => ipcRenderer.invoke('notas:list'),
    listNotas: () => ipcRenderer.invoke('notas:list'), // Alias para compatibilidad
    agregarNota: (n) => ipcRenderer.invoke('notas:add', n),
    addNota: (n) => ipcRenderer.invoke('notas:add', n), // Alias para compatibilidad
    editarNota: (n) => ipcRenderer.invoke('notas:edit', n),
    editNota: (n) => ipcRenderer.invoke('notas:edit', n), // Alias para compatibilidad
    eliminarNota: (id) => ipcRenderer.invoke('notas:remove', id),
    removeNota: (id) => ipcRenderer.invoke('notas:remove', id), // Alias para compatibilidad
    
    // API para historial
    listarHistorial: (correo) => ipcRenderer.invoke('historial:list', correo),
    listHistorial: (correo) => ipcRenderer.invoke('historial:list', correo), // Alias para compatibilidad
    generarPDFHistorial: (correo) => ipcRenderer.invoke('historial:pdf', correo),
    historialPdf: (correo) => ipcRenderer.invoke('historial:pdf', correo), // Alias para compatibilidad
    resetHistorial: () => ipcRenderer.invoke('historial:reset'),
    
    // API para diagnóstico
    diagnostico: () => ipcRenderer.invoke('sistema:diagnostico'),
    debugPreload: () => ipcRenderer.invoke('sistema:debugPreload'),
    crearNuevoPreload: () => ipcRenderer.invoke('sistema:crearNuevoPreload'),
    
    // API para sistema
    invalidarCache: (tipo) => ipcRenderer.invoke('sistema:invalidarCache', tipo),
    precargar: () => ipcRenderer.invoke('sistema:precargar'),
    precargarDatos: () => ipcRenderer.invoke('sistema:precargar'), // Alias para compatibilidad
    estadisticasCache: () => ipcRenderer.invoke('sistema:estadisticasCache'),
    monitorSnapshot: () => ipcRenderer.invoke('sistema:monitorSnapshot')
  }
);