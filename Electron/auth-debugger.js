// Script para depurar problemas de autenticación
const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');

// Configuración de depuración
const DEBUG_AUTH = true;
const DEBUG_LOG_FILE = path.join(__dirname, 'auth-debug.log');

// No registrar un manejador propio, para que el auth-handler funcione correctamente
const OVERRIDE_HANDLER = false;

// Iniciar archivo de registro
function initDebugLog() {
  const timestamp = new Date().toISOString();
  const header = `\n--------------------\nSesión de depuración de autenticación iniciada: ${timestamp}\n--------------------\n`;
  
  try {
    fs.appendFileSync(DEBUG_LOG_FILE, header);
    console.log('[AUTH-DEBUG] Registro de depuración iniciado en:', DEBUG_LOG_FILE);
  } catch (err) {
    console.error('[AUTH-DEBUG] Error al iniciar archivo de registro:', err);
  }
}

// Función para registrar información
function logAuth(message, data = null) {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    // Sanitizar contraseñas o información sensible
    const safeData = { ...data };
    if (safeData.password) safeData.password = '********';
    logMessage += `\nDatos: ${JSON.stringify(safeData, null, 2)}`;
  }
  
  console.log('[AUTH-DEBUG]', logMessage);
  
  try {
    fs.appendFileSync(DEBUG_LOG_FILE, logMessage + '\n');
  } catch (err) {
    console.error('[AUTH-DEBUG] Error al escribir en archivo de registro:', err);
  }
}

// Configuración de usuarios predeterminados para pruebas
const USUARIOS_PRUEBA = [
  { email: 'msanabria@ice.go.cr', password: 'Kolbi2525', nombre: 'Manuel Sanabria' },
  { email: 'admin@ejemplo.com', password: 'admin123', nombre: 'Administrador' },
  { email: 'test@test.com', password: 'test123', nombre: 'Usuario Prueba' }
];

// Manejador de autenticación para pruebas
function manejarAutenticacion(evento, credenciales) {
  logAuth('Intento de autenticación recibido', credenciales);
  
  // Verificar credenciales contra usuarios predeterminados
  const usuario = USUARIOS_PRUEBA.find(u => 
    u.email.toLowerCase() === credenciales.email.toLowerCase() && 
    u.password === credenciales.password
  );
  
  if (usuario) {
    logAuth('Autenticación exitosa para el usuario', { email: usuario.email, nombre: usuario.nombre });
    return { 
      ok: true, 
      usuario: { 
        email: usuario.email, 
        nombre: usuario.nombre 
      } 
    };
  } else {
    // Buscar si el correo existe pero la contraseña es incorrecta
    const usuarioExistente = USUARIOS_PRUEBA.find(u => 
      u.email.toLowerCase() === credenciales.email.toLowerCase()
    );
    
    if (usuarioExistente) {
      logAuth('Autenticación fallida: Contraseña incorrecta para el usuario', { email: credenciales.email });
      return { ok: false, error: 'Contraseña incorrecta' };
    } else {
      logAuth('Autenticación fallida: Usuario no encontrado', { email: credenciales.email });
      return { ok: false, error: 'Usuario no encontrado' };
    }
  }
}

// Inicialización
function inicializar() {
  initDebugLog();
  
  // Registrar manejador de autenticación para pruebas solo si se desea sobreescribir
  if (DEBUG_AUTH && OVERRIDE_HANDLER) {
    if (!ipcMain.listenerCount('supervisor:auth')) {
      ipcMain.handle('supervisor:auth', (evento, credenciales) => {
        return manejarAutenticacion(evento, credenciales);
      });
      logAuth('Manejador de autenticación de prueba registrado');
    } else {
      logAuth('Ya existe un manejador para supervisor:auth, no se registrará el de prueba');
    }
  }
  
  // Solo hacer logging de las llamadas si existe un manejador
  if (DEBUG_AUTH && ipcMain.listenerCount('supervisor:auth') > 0) {
    // Obtener referencia al manejador existente
    try {
      const originalHandler = ipcMain._events['supervisor:auth'] || 
                             (ipcMain._handlers && ipcMain._handlers['supervisor:auth']);
      
      if (originalHandler) {
        // Wrappear el handler existente para depuración
        const wrapperHandler = async (evento, credenciales) => {
          logAuth('Llamada a manejador de autenticación', credenciales);
          try {
            const resultado = await originalHandler(evento, credenciales);
            logAuth('Resultado del manejador de autenticación', resultado);
            return resultado;
          } catch (err) {
            logAuth('Error en manejador de autenticación', { error: err.message });
            throw err;
          }
        };
        
        // Reemplazar el manejador original con el wrapper
        if (ipcMain._handlers && ipcMain._handlers['supervisor:auth']) {
          ipcMain._handlers['supervisor:auth'] = wrapperHandler;
        } else if (ipcMain._events['supervisor:auth']) {
          ipcMain._events['supervisor:auth'] = wrapperHandler;
        }
        
        logAuth('Manejador de autenticación wrapped para depuración');
      }
    } catch (err) {
      logAuth('Error al intentar wrappear el manejador', { error: err.message });
    }
  }
  
  logAuth('Módulo de depuración de autenticación inicializado correctamente');
}

// Inicializar cuando se carga el módulo
inicializar();

module.exports = { 
  logAuth,
  manejarAutenticacion,
  USUARIOS_PRUEBA
};