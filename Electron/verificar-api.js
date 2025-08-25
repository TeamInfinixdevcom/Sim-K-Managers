// Script para verificar la consistencia de nombres de funciones
const fs = require('fs');
const path = require('path');

// Analizar preload.js
function analizarPreload() {
  try {
    const preloadPath = path.join(__dirname, 'preload.js');
    console.log(`Analizando preload.js en ${preloadPath}...`);
    
    if (!fs.existsSync(preloadPath)) {
      console.error(`ERROR: El archivo preload.js no existe en ${preloadPath}`);
      return null;
    }
    
    const contenido = fs.readFileSync(preloadPath, 'utf8');
    
    // Extraer nombres de funciones
    const regex = /['"]([^'"]+)['"]:\s*\([^)]*\)\s*=>/g;
    let match;
    const funciones = [];
    
    while ((match = regex.exec(contenido)) !== null) {
      funciones.push(match[1]);
    }
    
    console.log(`Se encontraron ${funciones.length} funciones en preload.js:`);
    console.log(funciones);
    
    return funciones;
  } catch (err) {
    console.error('Error al analizar preload.js:', err);
    return null;
  }
}

// Analizar index.html
function analizarIndexHtml() {
  try {
    const indexPath = path.join(__dirname, 'index.html');
    console.log(`Analizando index.html en ${indexPath}...`);
    
    if (!fs.existsSync(indexPath)) {
      console.error(`ERROR: El archivo index.html no existe en ${indexPath}`);
      return null;
    }
    
    const contenido = fs.readFileSync(indexPath, 'utf8');
    
    // Extraer referencias a window.electronAPI
    const regex = /window\.electronAPI\.([a-zA-Z0-9_]+)/g;
    let match;
    const referencias = new Set();
    
    while ((match = regex.exec(contenido)) !== null) {
      referencias.add(match[1]);
    }
    
    const refArray = Array.from(referencias);
    console.log(`Se encontraron ${refArray.length} referencias a window.electronAPI en index.html:`);
    console.log(refArray);
    
    return refArray;
  } catch (err) {
    console.error('Error al analizar index.html:', err);
    return null;
  }
}

// Verificar consistencia
function verificarConsistencia() {
  const funcionesPreload = analizarPreload();
  const referenciasIndex = analizarIndexHtml();
  
  if (!funcionesPreload || !referenciasIndex) {
    console.error('No se pudo completar la verificación debido a errores');
    return;
  }
  
  console.log('\n--- Verificación de Consistencia ---');
  
  // Funciones faltantes en preload.js
  const faltantesEnPreload = referenciasIndex.filter(ref => !funcionesPreload.includes(ref));
  
  if (faltantesEnPreload.length === 0) {
    console.log('✅ Todas las funciones referenciadas en index.html están definidas en preload.js');
  } else {
    console.log('❌ Funciones referenciadas en index.html pero NO definidas en preload.js:');
    faltantesEnPreload.forEach(func => console.log(`  - ${func}`));
  }
  
  // Funciones no utilizadas en preload.js
  const noUtilizadas = funcionesPreload.filter(func => !referenciasIndex.includes(func));
  
  if (noUtilizadas.length === 0) {
    console.log('✅ Todas las funciones definidas en preload.js son utilizadas en index.html');
  } else {
    console.log('⚠️ Funciones definidas en preload.js pero NO utilizadas en index.html:');
    noUtilizadas.forEach(func => console.log(`  - ${func}`));
  }
}

// Ejecutar verificación
verificarConsistencia();