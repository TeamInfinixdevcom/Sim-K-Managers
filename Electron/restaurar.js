// Script de restauración de emergencia
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== SISTEMA DE RESTAURACIÓN DE EMERGENCIA ===');
console.log('Este script le ayudará a restaurar la aplicación si algo salió mal');

// Función para listar archivos de backup
function listarBackups() {
  try {
    const archivos = fs.readdirSync(__dirname)
      .filter(nombre => nombre.startsWith('preload-backup-') && nombre.endsWith('.js'));
    
    if (archivos.length === 0) {
      console.log('No se encontraron copias de seguridad');
      return null;
    }
    
    console.log('\nCopias de seguridad disponibles:');
    archivos.forEach((archivo, index) => {
      const stats = fs.statSync(path.join(__dirname, archivo));
      const fecha = new Date(stats.mtime).toLocaleString();
      console.log(`${index + 1}. ${archivo} (${fecha})`);
    });
    
    return archivos;
  } catch (err) {
    console.error('Error al listar copias de seguridad:', err);
    return null;
  }
}

// Función para restaurar desde un backup
function restaurarDesdeBackup(backupPath) {
  try {
    const preloadPath = path.join(__dirname, 'preload.js');
    
    // Hacer una copia de seguridad del preload actual
    const nuevoBackup = path.join(__dirname, `preload-antes-restauracion-${Date.now()}.js`);
    fs.copyFileSync(preloadPath, nuevoBackup);
    console.log(`Se ha creado una copia de seguridad del preload.js actual en ${nuevoBackup}`);
    
    // Restaurar desde el backup seleccionado
    fs.copyFileSync(backupPath, preloadPath);
    console.log(`¡Restauración completada! El archivo preload.js ha sido restaurado desde ${backupPath}`);
    console.log('Por favor reinicie la aplicación para que los cambios surtan efecto');
  } catch (err) {
    console.error('Error durante la restauración:', err);
  }
}

// Verificar el estado actual
console.log('\nVerificando estado actual...');
const preloadPath = path.join(__dirname, 'preload.js');

if (!fs.existsSync(preloadPath)) {
  console.error(`ERROR: El archivo preload.js no existe en ${preloadPath}`);
  console.log('Debe crear un archivo preload.js antes de continuar');
  rl.close();
  return;
}

console.log(`El archivo preload.js existe (${fs.statSync(preloadPath).size} bytes)`);

// Listar backups disponibles
const backups = listarBackups();

if (!backups || backups.length === 0) {
  console.log('\nNo hay copias de seguridad disponibles para restaurar');
  rl.close();
  return;
}

// Preguntar qué backup restaurar
rl.question('\n¿Qué copia de seguridad desea restaurar? (Ingrese el número o "s" para salir): ', respuesta => {
  if (respuesta.toLowerCase() === 's') {
    console.log('Operación cancelada');
    rl.close();
    return;
  }
  
  const indice = parseInt(respuesta) - 1;
  
  if (isNaN(indice) || indice < 0 || indice >= backups.length) {
    console.error('Número inválido');
    rl.close();
    return;
  }
  
  const backupSeleccionado = backups[indice];
  const backupPath = path.join(__dirname, backupSeleccionado);
  
  rl.question(`¿Está seguro que desea restaurar desde ${backupSeleccionado}? (s/n): `, confirmacion => {
    if (confirmacion.toLowerCase() === 's') {
      restaurarDesdeBackup(backupPath);
    } else {
      console.log('Operación cancelada');
    }
    
    rl.close();
  });
});

// Script para verificar y restaurar archivos de datos
// Archivos a verificar
const archivos = [
    { 
        ruta: path.join(__dirname, 'agents.json'),
        valorPorDefecto: '[]',
        descripcion: 'Archivo de agentes'
    },
    { 
        ruta: path.join(__dirname, 'notas.json'),
        valorPorDefecto: '[]',
        descripcion: 'Archivo de notas'
    },
    { 
        ruta: path.join(__dirname, 'historial_entregas.json'),
        valorPorDefecto: '[]',
        descripcion: 'Archivo de historial'
    },
    { 
        ruta: path.join(__dirname, 'terminales.json'),
        valorPorDefecto: '[]',
        descripcion: 'Archivo de terminales'
    },
        { 
            ruta: path.join(__dirname, 'supervisores.json'),
            valorPorDefecto: '{"supervisores":[]}',
            descripcion: 'Archivo de supervisores'
        }
    ];

// Función para verificar y reparar archivos
function verificarYReparar() {
    let archivosReparados = 0;
    let archivosCreados = 0;
    
    console.log('\nVerificando archivos de datos...');
    
    archivos.forEach(archivo => {
        try {
            console.log(`Verificando ${archivo.descripcion}...`);
            
            // Verificar existencia
            if (!fs.existsSync(archivo.ruta)) {
                console.log(`${archivo.descripcion} no existe. Creando...`);
                fs.writeFileSync(archivo.ruta, archivo.valorPorDefecto, 'utf8');
                archivosCreados++;
                console.log(`${archivo.descripcion} creado correctamente.`);
                return;
            }
            
            // Leer contenido
            const contenido = fs.readFileSync(archivo.ruta, 'utf8');
            
            // Verificar que sea JSON válido
            try {
                if (contenido.trim() === '') {
                    throw new Error('Archivo vacío');
                }
                JSON.parse(contenido);
                console.log(`${archivo.descripcion} está en buen estado.`);
            } catch (error) {
                console.log(`${archivo.descripcion} está dañado. Reparando...`);
                fs.writeFileSync(archivo.ruta, archivo.valorPorDefecto, 'utf8');
                archivosReparados++;
                console.log(`${archivo.descripcion} reparado correctamente.`);
            }
        } catch (error) {
            console.error(`Error al procesar ${archivo.descripcion}:`, error);
        }
    });
    
    console.log(`\nResumen:`);
    console.log(`- Archivos verificados: ${archivos.length}`);
    console.log(`- Archivos reparados: ${archivosReparados}`);
    console.log(`- Archivos creados: ${archivosCreados}`);
    
    return {
        reparados: archivosReparados,
        creados: archivosCreados,
        total: archivos.length
    };
}

// Exportar funciones
module.exports = {
    verificarYReparar
};

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
    console.log('=== VERIFICACIÓN Y REPARACIÓN DE ARCHIVOS ===');
    verificarYReparar();
    console.log('\nProceso completado.');
}