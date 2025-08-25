// Script para verificar la consistencia de nombres de funciones
const fs = require('fs');
const path = require('path');

// Establecer el directorio de trabajo correcto
const electronDir = path.join(__dirname, 'Electron');
console.log(`Directorio de trabajo: ${electronDir}`);

// Analizar preload.js
function analizarPreload() {
  try {
    const preloadPath = path.join(electronDir, 'preload.js');
    console.log(`Analizando preload.js en ${preloadPath}...`);
    
    if (!fs.existsSync(preloadPath)) {
      console.error(`ERROR: El archivo preload.js no existe en ${preloadPath}`);
      return null;
    }
    
    const contenido = fs.readFileSync(preloadPath, 'utf8');
    
    // Mostrar información general
    console.log(`Tamaño del archivo: ${contenido.length} bytes`);
    console.log(`Número de líneas: ${contenido.split('\n').length}`);
    
    // Mostrar contenido completo para debug
    console.log('Primeros 100 caracteres del archivo:');
    console.log(contenido.substring(0, 100));
    
    // Extraer nombres de funciones usando un método más simple
    // Buscar todas las líneas que contienen un patrón como "name: () =>"
    const lineas = contenido.split('\n');
    const funciones = [];
    
    for (const linea of lineas) {
      // Buscar patrón básico: algo seguido por : y =>
      if (linea.includes(':') && linea.includes('=>')) {
        // Extraer el nombre de la función
        const match = linea.match(/\s*([a-zA-Z0-9_]+):/);
        if (match && match[1]) {
          funciones.push(match[1]);
        }
      }
    }
    
    // Método alternativo si el anterior no funciona
    if (funciones.length === 0) {
      const apiPattern = /electronAPI',\s*{([^}]*)}/s;
      const apiMatch = contenido.match(apiPattern);
      
      if (apiMatch && apiMatch[1]) {
        const apiSection = apiMatch[1];
        const fnPattern = /\s+([a-zA-Z0-9_]+):\s*(?:\([^)]*\)|[^=]*)\s*=>/g;
        let match;
        
        while ((match = fnPattern.exec(apiSection)) !== null) {
          funciones.push(match[1]);
        }
      }
    }
    
    // Eliminar duplicados
    const funcionesUnicas = [...new Set(funciones)];
    
    console.log(`Se encontraron ${funcionesUnicas.length} funciones en preload.js:`);
    console.log(funcionesUnicas);
    
    return funcionesUnicas;
  } catch (err) {
    console.error('Error al analizar preload.js:', err);
    return null;
  }
}

// Analizar index.html
function analizarIndexHtml() {
  try {
    const indexPath = path.join(electronDir, 'index.html');
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