// Script para probar la autenticación
const { app, BrowserWindow } = require('electron');
const path = require('path');

let authWindow;

function createAuthWindow() {
  // Crear la ventana de autenticación
  authWindow = new BrowserWindow({
    width: 700,
    height: 700,
    title: 'Prueba de Autenticación',
    webPreferences: {
      preload: path.join(__dirname, 'Electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Cargar la página HTML de prueba
  authWindow.loadFile(path.join(__dirname, 'Electron', 'auth-test.html'));
  
  // Abrir DevTools para depuración
  authWindow.webContents.openDevTools();

  // Limpiar la referencia cuando se cierra la ventana
  authWindow.on('closed', () => {
    authWindow = null;
  });
  
  console.log('Ventana de prueba de autenticación creada');
}

// Iniciar la aplicación
app.on('ready', () => {
  console.log('Iniciando prueba de autenticación...');
  createAuthWindow();
});

// Manejar cierre de ventanas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (authWindow === null) {
    createAuthWindow();
  }
});