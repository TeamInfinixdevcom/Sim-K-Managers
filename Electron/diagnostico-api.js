// Script para verificar disponibilidad de las funciones en tiempo de ejecución
console.log('[DIAGNÓSTICO] Inicializando herramienta de diagnóstico de API');

// Crear un botón flotante para el diagnóstico
function crearBotonDiagnostico() {
  const btnDiag = document.createElement('button');
  btnDiag.innerText = '🔍 Diagnosticar API';
  btnDiag.style.position = 'fixed';
  btnDiag.style.bottom = '10px';
  btnDiag.style.right = '10px';
  btnDiag.style.zIndex = '99999';
  btnDiag.style.padding = '8px 12px';
  btnDiag.style.background = '#4a4a4a';
  btnDiag.style.color = 'white';
  btnDiag.style.border = '1px solid #666';
  btnDiag.style.borderRadius = '4px';
  btnDiag.style.cursor = 'pointer';
  
  // Agregar efecto hover
  btnDiag.onmouseover = function() {
    this.style.background = '#666';
  };
  btnDiag.onmouseout = function() {
    this.style.background = '#4a4a4a';
  };
  
  // Función de diagnóstico
  btnDiag.onclick = function() {
    diagnosticarAPI();
  };
  
  document.body.appendChild(btnDiag);
  console.log('[DIAGNÓSTICO] Botón de diagnóstico agregado');
}

// Función principal de diagnóstico
function diagnosticarAPI() {
  console.log('[DIAGNÓSTICO] Iniciando diagnóstico de API...');
  
  // Crear ventana de resultados
  const resultadoDiv = document.createElement('div');
  resultadoDiv.style.position = 'fixed';
  resultadoDiv.style.top = '50%';
  resultadoDiv.style.left = '50%';
  resultadoDiv.style.transform = 'translate(-50%, -50%)';
  resultadoDiv.style.width = '80%';
  resultadoDiv.style.maxWidth = '800px';
  resultadoDiv.style.maxHeight = '80%';
  resultadoDiv.style.background = '#333';
  resultadoDiv.style.color = 'white';
  resultadoDiv.style.padding = '20px';
  resultadoDiv.style.borderRadius = '8px';
  resultadoDiv.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
  resultadoDiv.style.zIndex = '999999';
  resultadoDiv.style.overflowY = 'auto';
  
  // Agregar título
  const titulo = document.createElement('h2');
  titulo.innerText = 'Diagnóstico de API';
  titulo.style.marginTop = '0';
  resultadoDiv.appendChild(titulo);
  
  // Crear tabla para resultados
  const tabla = document.createElement('table');
  tabla.style.width = '100%';
  tabla.style.borderCollapse = 'collapse';
  tabla.innerHTML = `
    <tr style="background:#444">
      <th style="text-align:left; padding:8px; border:1px solid #555">Función</th>
      <th style="text-align:left; padding:8px; border:1px solid #555">Disponible</th>
      <th style="text-align:left; padding:8px; border:1px solid #555">Tipo</th>
    </tr>
  `;
  
  // Lista de funciones a verificar
  const funciones = [
    'precargar', 'precargarDatos',
    'authSupervisor', 'login',
    'listAgents', 'listarAgentes', 'addAgent', 'agregarAgente', 'removeAgent', 'eliminarAgente',
    'generateAndSendSIM', 'generarPDFsim',
    'listTerminales', 'listarTerminales', 'bulkAddTerminales',
    'listNotas', 'listarNotas', 'addNota', 'agregarNota', 'editNota', 'editarNota', 'removeNota', 'eliminarNota',
    'listHistorial', 'listarHistorial', 'historialPdf', 'generarPDFHistorial', 'resetHistorial',
    'diagnostico', 'debugPreload', 'crearNuevoPreload',
    'invalidarCache', 'estadisticasCache', 'monitorSnapshot'
  ];
  
  // Verificar cada función
  for (const func of funciones) {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td style="padding:8px; border:1px solid #555">${func}</td>
      <td style="padding:8px; border:1px solid #555">${window.electronAPI && typeof window.electronAPI[func] === 'function' ? '✅' : '❌'}</td>
      <td style="padding:8px; border:1px solid #555">${window.electronAPI ? typeof window.electronAPI[func] : 'N/A'}</td>
    `;
    
    // Colorear las filas según disponibilidad
    if (window.electronAPI && typeof window.electronAPI[func] === 'function') {
      fila.style.background = '#2a3a2a';
    } else {
      fila.style.background = '#3a2a2a';
    }
    
    tabla.appendChild(fila);
  }
  
  resultadoDiv.appendChild(tabla);
  
  // Agregar botón para cerrar
  const cerrarBtn = document.createElement('button');
  cerrarBtn.innerText = 'Cerrar';
  cerrarBtn.style.marginTop = '20px';
  cerrarBtn.style.padding = '8px 16px';
  cerrarBtn.style.cursor = 'pointer';
  cerrarBtn.onclick = function() {
    document.body.removeChild(resultadoDiv);
  };
  resultadoDiv.appendChild(cerrarBtn);
  
  // Agregar a la página
  document.body.appendChild(resultadoDiv);
  
  console.log('[DIAGNÓSTICO] Diagnóstico completado');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('[DIAGNÓSTICO] DOM cargado, inicializando...');
  setTimeout(crearBotonDiagnostico, 1000); // Esperar 1s para asegurar que todo esté cargado
});

// Auto-ejecutar si el DOM ya está listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('[DIAGNÓSTICO] Documento ya cargado, inicializando ahora...');
  setTimeout(crearBotonDiagnostico, 1000);
}