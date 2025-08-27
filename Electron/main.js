// main.js principal que importa el inventario
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');

// Mantener una referencia global del objeto window para evitar que la ventana 
// se cierre automáticamente cuando el objeto JavaScript es basura recolectada.
let mainWindow;

// Importar módulo inventario
let mainInventario;

// Cerca del inicio donde se cargan los módulos
const agentesUtils = require('./agentes-utils');

function createWindow() {
    console.log('[MAIN] Creando ventana principal...');
    
    // Crear la ventana del navegador.
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            worldSafeExecuteJavaScript: true,
            sandbox: false // Necesario para algunas funcionalidades
        }
    });

    // y cargar el archivo index.html de la aplicación.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));
    
    // Importar el módulo de inventario sin inicializar los manejadores
    try {
        // Importar el módulo pero evitar que se registren los manejadores automáticamente
        process.env.NO_AUTO_REGISTER = 'true';
        mainInventario = require('./main-inventario');
        
        // Ahora registramos los manejadores manualmente
        if (typeof mainInventario.registrarManejadoresIPC === 'function') {
            // Pasar ipcMain explícitamente
            const resultado = mainInventario.registrarManejadoresIPC(ipcMain);
            if (resultado) {
                console.log('[MAIN] Módulo de inventario cargado correctamente');
            } else {
                console.log('[MAIN] Módulo de inventario: error al registrar manejadores');
            }
        } else {
            console.log('[MAIN] Módulo de inventario cargado pero la función registrarManejadoresIPC no está disponible');
        }
    } catch (err) {
        console.error('[MAIN] Error cargando módulo de inventario:', err);
    }
    
    // Cargar módulo de manejo de autenticación
    try {
        console.log('[MAIN] Cargando módulo de autenticación...');
        // Evitar doble registro del handler de autenticación
        try { ipcMain.removeHandler('supervisor:auth'); } catch (e) {}
        const authHandler = require('./auth-handler');
        authHandler.registerAuthHandler();
        console.log('[MAIN] Módulo de autenticación cargado correctamente');
    } catch (err) {
        console.error('[MAIN] Error al cargar módulo de autenticación:', err);
    }
    
    // Cargar módulo de depuración de autenticación
    try {
        console.log('[MAIN] Cargando módulo de depuración de autenticación...');
        const authDebugger = require('./auth-debugger');
        console.log('[MAIN] Módulo de depuración de autenticación cargado correctamente');
    } catch (err) {
        console.error('[MAIN] Error al cargar módulo de depuración de autenticación:', err);
    }

    // Cargar módulo de diagnóstico
    try {
        console.log('[MAIN] Cargando módulo de diagnóstico...');
        const diagnostico = require('./diagnostico');
        console.log('[MAIN] Módulo de diagnóstico cargado correctamente');
    } catch (err) {
        console.error('[MAIN] Error al cargar módulo de diagnóstico:', err);
    }

    // Cargar módulo de depuración de preload
    try {
        console.log('[MAIN] Cargando módulo de depuración de preload...');
        const debugPreload = require('./debug-preload');
        console.log('[MAIN] Módulo de depuración de preload cargado correctamente');
    } catch (err) {
        console.error('[MAIN] Error al cargar módulo de depuración de preload:', err);
    }

    // Iniciar el monitor de caché
    setTimeout(() => {
        try {
            const cacheMonitor = require('./cache-monitor');
            if (mainInventario && mainInventario.TURBOCACHE) {
                if (!global.__monitorIniciado) {
                    cacheMonitor.iniciarMonitor(mainInventario.TURBOCACHE);
                    global.__monitorIniciado = true;
                    console.log('[SISTEMA] Monitor de caché iniciado correctamente');
                } else {
                    console.log('[SISTEMA] Monitor ya estaba iniciado, reusando instancia');
                }
                // Asegurar un único handler
                try { ipcMain.removeHandler('sistema:monitorSnapshot'); } catch (e) {}
                ipcMain.handle('sistema:monitorSnapshot', async () => cacheMonitor.tomarSnapshotAhora());
            } else {
                console.error('[SISTEMA] No se pudo iniciar el monitor: TURBOCACHE no está disponible');
            }
        } catch (err) {
            console.error('[SISTEMA] Error al iniciar el monitor de caché:', err);
        }
    }, 2000); // Retraso para evitar problemas de inicialización

    // Abrir DevTools solo en desarrollo o si se fuerza por variable
    if (process.env.NODE_ENV === 'development' || process.env.SHOW_DEVTOOLS === '1') {
        mainWindow.webContents.openDevTools();
    }
    
    // Inyectar scripts de herramientas en la ventana
    mainWindow.webContents.on('did-finish-load', () => {
        try {
            const fs = require('fs');
            
            // Inyectar script de diagnóstico-api
            const diagPath = path.join(__dirname, 'diagnostico-api.js');
            if (fs.existsSync(diagPath)) {
                const diagScript = fs.readFileSync(diagPath, 'utf8');
                mainWindow.webContents.executeJavaScript(diagScript)
                    .then(() => console.log('[MAIN] Script de diagnóstico-api inyectado correctamente'))
                    .catch(err => console.error('[MAIN] Error al ejecutar script de diagnóstico-api:', err));
            }
            
            // Inyectar herramienta de autenticación
            const authToolPath = path.join(__dirname, 'auth-tool.js');
            if (fs.existsSync(authToolPath)) {
                const authToolScript = fs.readFileSync(authToolPath, 'utf8');
                mainWindow.webContents.executeJavaScript(authToolScript)
                    .then(() => console.log('[MAIN] Herramienta de autenticación inyectada correctamente'))
                    .catch(err => console.error('[MAIN] Error al ejecutar herramienta de autenticación:', err));
            }
        } catch (err) {
            console.error('[MAIN] Error al cargar scripts de herramientas:', err);
        }
    });

    // Emitido cuando la ventana es cerrada.
    mainWindow.on('closed', function () {
        // Eliminar la referencia al objeto window
        // guardarlo en un array si tu aplicación soporta multi ventanas
        mainWindow = null;
    });
}

// Este método será llamado cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
app.on('ready', createWindow);

// Salir cuando todas las ventanas estén cerradas.
app.on('window-all-closed', function () {
    // En macOS es común para las aplicaciones permanecer
    // activo hasta que el usuario salga explícitamente con Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // En macOS es común volver a crear una ventana en la aplicación cuando el
    // icono del dock es clicado y no hay otras ventanas abiertas.
    if (mainWindow === null) {
        createWindow();
    }
});

// Inicializar diagnóstico IPC primero
let ipcDiag;
try {
  console.log('[MAIN] Inicializando diagnóstico de IPC...');
  const ipcDiagnostico = require('./ipc-diagnostico');
  ipcDiag = ipcDiagnostico.inicializar();
  console.log('[MAIN] Diagnóstico de IPC inicializado correctamente');
} catch (error) {
  console.error('[MAIN] Error al inicializar diagnóstico IPC:', error);
}

// Verificar y reparar archivos de datos
try {
  console.log('[MAIN] Verificando integridad de archivos de datos...');
  const restaurador = require('./restaurar');
  restaurador.verificarYReparar();
  console.log('[MAIN] Verificación de archivos completada');
} catch (error) {
  console.error('[MAIN] Error al verificar archivos:', error);
}

// En la sección donde se inicializan los módulos
console.log('[MAIN] Cargando módulo de agentes optimizado...');
try {
  // Inicializar la caché de agentes al inicio
  agentesUtils.obtenerAgentes()
    .then(agentes => {
      console.log(`[AGENTES] Caché inicializada con ${agentes.length} agentes`);
    })
    .catch(err => {
      console.error('[AGENTES] Error al inicializar caché:', err);
    });
  console.log('[MAIN] Módulo de agentes optimizado cargado correctamente');
} catch (error) {
  console.error('[MAIN] Error al cargar módulo de agentes optimizado:', error);
}