// Manejador de autenticación para supervisores
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  // Archivo donde se guardarán los usuarios (si se necesita)
  usersFile: path.join(__dirname, 'supervisores.json'),
  // Usuarios predefinidos para la aplicación
  defaultUsers: [
    { email: 'msanabria@ice.go.cr', password: 'Kolbi2525', nombre: 'Manuel Sanabria' },
    { email: 'emonadragon@ice.go.cr', password: 'Kolbi2525', nombre: 'Elizabeth Mondragon' }
  ]
};

// Función para cargar usuarios
function loadUsers() {
  try {
    if (fs.existsSync(CONFIG.usersFile)) {
      const data = fs.readFileSync(CONFIG.usersFile, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[AUTH] Error al cargar archivo de usuarios:', err);
  }

  // Si no hay archivo o hay error, usar los usuarios predefinidos
  return CONFIG.defaultUsers;
}

// Función para autenticar usuario
function authenticateUser(credentials) {
  console.log('[AUTH] Intentando autenticar usuario:', credentials.email);
  
  const users = loadUsers();
  
  // Buscar el usuario por email (case insensitive)
  const user = users.find(u => 
    u.email.toLowerCase() === credentials.email.toLowerCase() && 
    u.password === credentials.password
  );
  
  if (user) {
    console.log('[AUTH] Autenticación exitosa para:', credentials.email);
    return { 
      ok: true, 
      usuario: { 
        email: user.email, 
        nombre: user.nombre || user.email 
      } 
    };
  } else {
    // Verificar si el usuario existe pero la contraseña es incorrecta
    const userExists = users.find(u => 
      u.email.toLowerCase() === credentials.email.toLowerCase()
    );
    
    if (userExists) {
      console.log('[AUTH] Contraseña incorrecta para:', credentials.email);
      return { ok: false, error: 'Contraseña incorrecta' };
    } else {
      console.log('[AUTH] Usuario no encontrado:', credentials.email);
      return { ok: false, error: 'Usuario no encontrado' };
    }
  }
}

// Registrar el manejador IPC
function registerAuthHandler() {
  // Verificar si ya existe el manejador
  if (ipcMain.listenerCount('supervisor:auth') > 0) {
    console.log('[AUTH] El manejador supervisor:auth ya está registrado');
    return false;
  }
  
  // Registrar el manejador
  ipcMain.handle('supervisor:auth', (event, credentials) => {
    return authenticateUser(credentials);
  });
  
  console.log('[AUTH] Manejador supervisor:auth registrado correctamente');
  return true;
}

// Exportar las funciones
module.exports = {
  registerAuthHandler,
  authenticateUser
};