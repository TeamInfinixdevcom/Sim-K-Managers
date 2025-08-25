# Documentación: Solución al problema de autenticación

## Problema
La aplicación mostraba el error: `Error invoking remote method 'supervisor:auth': Error: No handler registered for 'supervisor:auth'` al intentar iniciar sesión con los usuarios supervisores.

## Causa
El problema se debía a que no existía un manejador (handler) registrado para el canal IPC `supervisor:auth`, que es el canal utilizado por las funciones `authSupervisor` y `login` del preload.js.

## Solución implementada

### 1. Creación de un manejador de autenticación
Se creó un archivo `auth-handler.js` que implementa y registra el manejador para `supervisor:auth`, permitiendo autenticar a los usuarios supervisores:

```javascript
// Fragmento de auth-handler.js
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
```

### 2. Base de datos de usuarios
Se creó un archivo `supervisores.json` con los usuarios autorizados:
- msanabria@ice.go.cr (Manuel Sanabria)
- emonadragon@ice.go.cr (Elizabeth Mondragon)

### 3. Carga del manejador en el inicio de la aplicación
Se modificó `main.js` para cargar el manejador de autenticación al inicio:

```javascript
// Fragmento de main.js
try {
    console.log('[MAIN] Cargando módulo de autenticación...');
    const authHandler = require('./auth-handler');
    authHandler.registerAuthHandler();
    console.log('[MAIN] Módulo de autenticación cargado correctamente');
} catch (err) {
    console.error('[MAIN] Error al cargar módulo de autenticación:', err);
}
```

### 4. Mejora en las funciones de autenticación en preload.js
Se mejoraron las funciones `login` y `authSupervisor` en el preload.js para incluir registros de depuración:

```javascript
// Fragmento de preload.js
login: (email, password) => {
  console.log('Preload: Invocando supervisor:auth con email:', email);
  return ipcRenderer.invoke('supervisor:auth', { email, password });
},
authSupervisor: (email, password) => {
  console.log('Preload: Invocando supervisor:auth con email:', email);
  return ipcRenderer.invoke('supervisor:auth', { email, password });
},
```

### 5. Herramienta de prueba de autenticación
Se implementó una herramienta visual (`auth-tool.js`) para probar la autenticación directamente desde la interfaz de usuario, evitando el uso de `prompt()` que no es compatible con Electron.

## Cómo probar la solución

1. Iniciar la aplicación normalmente:
   ```
   npx electron ./Electron
   ```

2. Buscar el botón "🔑 Auth" en la esquina inferior derecha de la ventana

3. Hacer clic en el botón para abrir el formulario de autenticación

4. Ingresar las credenciales:
   - Email: msanabria@ice.go.cr
   - Contraseña: Kolbi2525
   
   O seleccionar un usuario predefinido del menú desplegable

5. Hacer clic en "Iniciar sesión" para probar la autenticación

## Herramientas adicionales para depuración

1. **Módulo auth-debugger.js**:
   - Registra todos los intentos de autenticación en un archivo log (auth-debug.log)

2. **Aplicación de prueba dedicada**:
   - Ejecutar `npx electron probar-auth.js` para abrir una ventana dedicada a probar la autenticación

## Usuarios disponibles para pruebas

| Correo | Contraseña | Nombre |
|--------|------------|--------|
| msanabria@ice.go.cr | Kolbi2525 | Manuel Sanabria |
| emonadragon@ice.go.cr | Kolbi2525 | Elizabeth Mondragon |