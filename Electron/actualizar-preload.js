// Script para actualizar preload.js
const fs = require('fs');
const path = require('path');

function actualizarPreload() {
  try {
    const preloadPath = path.join(__dirname, 'preload.js');
    const nuevoPreloadPath = path.join(__dirname, 'preload-nuevo.js');
    const backupPath = path.join(__dirname, 'preload-backup-' + Date.now() + '.js');
    
    // Verificar que el nuevo preload existe
    if (!fs.existsSync(nuevoPreloadPath)) {
      console.error('Error: No se encuentra el archivo preload-nuevo.js');
      process.exit(1);
    }
    
    // Hacer backup del preload actual si existe
    if (fs.existsSync(preloadPath)) {
      console.log(`Creando backup del preload actual en ${backupPath}`);
      fs.copyFileSync(preloadPath, backupPath);
    }
    
    // Copiar el nuevo preload
    console.log('Actualizando preload.js con la nueva versión...');
    fs.copyFileSync(nuevoPreloadPath, preloadPath);
    
    console.log('¡Preload actualizado con éxito!');
    console.log('Por favor, reinicia la aplicación para que los cambios surtan efecto.');
  } catch (err) {
    console.error('Error durante la actualización:', err);
    process.exit(1);
  }
}

// Ejecutar actualización
actualizarPreload();