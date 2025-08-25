// Preload script para configurar la API de Electron
const { contextBridge, ipcRenderer } = require('electron');

console.log('[PRELOAD] Iniciando script de preload...');

// Exponer una API limitada en la ventana global
contextBridge.exposeInMainWorld('electronAPI', {
    // API para sistema de caché
    estadisticasCache: () => ipcRenderer.invoke('sistema:estadisticasCache'),
    invalidarCache: (tipo) => ipcRenderer.invoke('sistema:invalidarCache', tipo),
    precargar: () => ipcRenderer.invoke('sistema:precargar'),
    monitorSnapshot: () => ipcRenderer.invoke('sistema:monitorSnapshot'),
    
    // API para inventario (terminales)
    listarTerminales: () => ipcRenderer.invoke('terminales:list'),
    listTerminales: () => ipcRenderer.invoke('terminales:list'), // Alias para compatibilidad
    agregarTerminal: (terminal) => ipcRenderer.invoke('terminales:add', terminal),
    eliminarTerminal: (terminal) => ipcRenderer.invoke('terminales:remove', terminal),
    cargaMasivaTerminales: (datos) => ipcRenderer.invoke('terminales:bulkAdd', datos),
    
    // API para agentes
    listarAgentes: () => ipcRenderer.invoke('agents:list'),
    listAgents: () => ipcRenderer.invoke('agents:list'), // Alias para compatibilidad
    agregarAgente: (agente) => ipcRenderer.invoke('agents:add', agente),
    eliminarAgente: (correo) => ipcRenderer.invoke('agents:remove', correo),
    
    // API para notas
    listarNotas: () => ipcRenderer.invoke('notas:list'),
    listNotas: () => ipcRenderer.invoke('notas:list'), // Alias para compatibilidad
    agregarNota: (nota) => ipcRenderer.invoke('notas:add', nota),
    addNota: (nota) => ipcRenderer.invoke('notas:add', nota), // Alias para compatibilidad
    editarNota: (nota) => ipcRenderer.invoke('notas:edit', nota),
    eliminarNota: (id) => ipcRenderer.invoke('notas:remove', id),
    removeNota: (id) => ipcRenderer.invoke('notas:remove', id), // Alias para compatibilidad
    
    // API para supervisor
    autenticarSupervisor: (credenciales) => ipcRenderer.invoke('supervisor:auth', credenciales),
    authSupervisor: (credenciales) => ipcRenderer.invoke('supervisor:auth', credenciales), // Alias para compatibilidad
    
    // API para SIMs
    generarPDFSIM: (datos) => ipcRenderer.invoke('sims:generateSend', datos),
    generateAndSendSIM: (datos) => ipcRenderer.invoke('sims:generateSend', datos), // Alias para compatibilidad
    
    // API para historial
    listarHistorial: (correo) => ipcRenderer.invoke('historial:list', correo),
    listHistorial: (correo) => ipcRenderer.invoke('historial:list', correo), // Alias para compatibilidad
    generarPDFHistorial: (correo) => ipcRenderer.invoke('historial:pdf', correo),
    historialPdf: (correo) => ipcRenderer.invoke('historial:pdf', correo), // Alias para compatibilidad
    resetHistorial: () => ipcRenderer.invoke('historial:reset'),
    resetHistorial: () => ipcRenderer.invoke('historial:reset'),

    // API para diagnóstico
    diagnostico: () => ipcRenderer.invoke('sistema:diagnostico'),
});

console.log('[PRELOAD] API de Electron configurada');