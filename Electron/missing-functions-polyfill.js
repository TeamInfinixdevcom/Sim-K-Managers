// Polyfill para funciones que pueden estar faltando en el HTML original
console.log('[POLYFILL] Inicializando polyfills para funciones faltantes...');

// ===== POLYFILLS PARA FUNCIONES DE CARGA =====

// Verificar y crear cargarTerminales si no existe
if (typeof window.cargarTerminales !== 'function') {
    window.cargarTerminales = async function() {
        console.log('[POLYFILL] Ejecutando cargarTerminales() polyfill');
        try {
            let terminales = [];
            
            // Intentar diferentes formas de obtener los terminales
            if (window.electronAPI) {
                if (typeof window.electronAPI.listTerminales === 'function') {
                    terminales = await window.electronAPI.listTerminales();
                } else if (typeof window.electronAPI.listarTerminales === 'function') {
                    terminales = await window.electronAPI.listarTerminales();
                }
            }
            
            console.log(`[POLYFILL] ${terminales.length} terminales cargados`);
            
            // Actualizar la interfaz de forma segura
            setTimeout(() => {
                try {
                    // Actualizar tabla u otros elementos UI
                    const tabla = document.getElementById('tablaInventario');
                    if (tabla && tabla.tBodies && tabla.tBodies[0]) {
                        let html = '';
                        
                        terminales.forEach(terminal => {
                            html += `<tr>
                                <td>${terminal.agencia || '-'}</td>
                                <td>${terminal.marca || '-'}</td>
                                <td>${terminal.terminal || '-'}</td>
                                <td align="right">${terminal.disponible || 0}</td>
                            </tr>`;
                        });
                        
                        tabla.tBodies[0].innerHTML = html;
                    }
                } catch (err) {
                    console.error('[POLYFILL] Error actualizando la tabla de terminales:', err);
                }
            }, 100);
            
            return terminales;
        } catch (err) {
            console.error('[POLYFILL] Error en cargarTerminales:', err);
            return [];
        }
    };
    console.log('[POLYFILL] Función cargarTerminales creada');
}

// Verificar y crear cargarAgentes si no existe
if (typeof window.cargarAgentes !== 'function') {
    window.cargarAgentes = async function() {
        console.log('[POLYFILL] Ejecutando cargarAgentes() polyfill');
        try {
            let agentes = [];
            
            // Intentar diferentes formas de obtener los agentes
            if (window.electronAPI) {
                if (typeof window.electronAPI.listAgents === 'function') {
                    agentes = await window.electronAPI.listAgents();
                } else if (typeof window.electronAPI.listarAgentes === 'function') {
                    agentes = await window.electronAPI.listarAgentes();
                }
            }
            
            console.log(`[POLYFILL] ${agentes.length} agentes cargados`);
            
            // Aquí podríamos actualizar la interfaz si es necesario
            
            return agentes;
        } catch (err) {
            console.error('[POLYFILL] Error en cargarAgentes:', err);
            return [];
        }
    };
    console.log('[POLYFILL] Función cargarAgentes creada');
}

// Verificar y crear cargarNotas si no existe
if (typeof window.cargarNotas !== 'function') {
    window.cargarNotas = async function() {
        console.log('[POLYFILL] Ejecutando cargarNotas() polyfill');
        try {
            let notas = [];
            
            // Intentar diferentes formas de obtener las notas
            if (window.electronAPI) {
                if (typeof window.electronAPI.listNotas === 'function') {
                    notas = await window.electronAPI.listNotas();
                } else if (typeof window.electronAPI.listarNotas === 'function') {
                    notas = await window.electronAPI.listarNotas();
                }
            }
            
            console.log(`[POLYFILL] ${notas.length} notas cargadas`);
            
            // Actualizar la interfaz de forma segura
            setTimeout(() => {
                try {
                    const notasContainer = document.getElementById('notasContainer');
                    if (notasContainer) {
                        let html = '';
                        if (notas && notas.length > 0) {
                            notas.forEach(nota => {
                                html += `<div class="nota">
                                    <h4>${nota.titulo || 'Sin título'}</h4>
                                    <p>${nota.texto || 'Sin contenido'}</p>
                                    <small>${nota.fecha || 'Fecha desconocida'}</small>
                                </div>`;
                            });
                        } else {
                            html = '<p>No hay notas disponibles</p>';
                        }
                        
                        if (typeof window.setInnerHTML === 'function') {
                            window.setInnerHTML('notasContainer', html);
                        } else {
                            notasContainer.innerHTML = html;
                        }
                    }
                } catch (err) {
                    console.error('[POLYFILL] Error actualizando la interfaz de notas:', err);
                }
            }, 100);
            
            return notas;
        } catch (err) {
            console.error('[POLYFILL] Error en cargarNotas:', err);
            return [];
        }
    };
    console.log('[POLYFILL] Función cargarNotas creada');
}

// Verificar y crear cargarEntregas si no existe
if (typeof window.cargarEntregas !== 'function') {
    window.cargarEntregas = async function(correo) {
        console.log(`[POLYFILL] Ejecutando cargarEntregas(${correo}) polyfill`);
        try {
            let historial = [];
            
            // Intentar diferentes formas de obtener el historial
            if (window.electronAPI) {
                if (typeof window.electronAPI.listHistorial === 'function') {
                    const filtroCorreo = correo || (document.getElementById('filtroCorreo')?.value?.trim() || null);
                    historial = await window.electronAPI.listHistorial(filtroCorreo);
                } else if (typeof window.electronAPI.listarHistorial === 'function') {
                    const filtroCorreo = correo || (document.getElementById('filtroCorreo')?.value?.trim() || null);
                    historial = await window.electronAPI.listarHistorial(filtroCorreo);
                }
            }
            
            console.log(`[POLYFILL] ${historial.length} entregas cargadas`);
            
            // Actualizar interfaz si es necesario
            const entregasList = document.getElementById('entregasList');
            const graficoDiv = document.getElementById('graficoEntregas');
            
            if (entregasList) {
                entregasList.innerHTML = '';
                historial.forEach(e => {
                    const div = document.createElement('div');
                    div.className = 'entrega-item';
                    div.innerHTML = `
                        <div><b>${e.agente || 'Sin nombre'}</b> <span class="muted">${e.fecha || '-'} ${e.hora || ''}</span></div>
                        <div><b>Usuario:</b> ${e.usuario || '-'} <b>Correo:</b> ${e.correo || '-'}</div>
                        <pre>${e.contenido || 'Sin contenido'}</pre>
                        ${e.pdf ? `<a href="${e.pdf}" target="_blank">Abrir PDF</a>` : ''}
                        <hr>
                    `;
                    entregasList.appendChild(div);
                });
            }
            
            if (graficoDiv) {
                // Gráfico simple: entregas por agente
                const conteo = {};
                historial.forEach(e => {
                    if (e.agente) {
                        conteo[e.agente] = (conteo[e.agente] || 0) + 1;
                    }
                });
                
                graficoDiv.innerHTML = '<h4>Entregas por agente</h4>';
                
                if (Object.keys(conteo).length === 0) {
                    const emptyMsg = document.createElement('div');
                    emptyMsg.style.padding = '8px';
                    emptyMsg.textContent = 'No hay datos de entregas para mostrar';
                    graficoDiv.appendChild(emptyMsg);
                } else {
                    Object.entries(conteo).forEach(([agente, total]) => {
                        const bar = document.createElement('div');
                        bar.style.background = '#0c59cc';
                        bar.style.color = '#fff';
                        bar.style.margin = '4px 0';
                        bar.style.padding = '4px 8px';
                        bar.style.width = `${40 + total * 40}px`;
                        bar.textContent = `${agente}: ${total}`;
                        graficoDiv.appendChild(bar);
                    });
                }
            }
            
            return historial;
        } catch (err) {
            console.error('[POLYFILL] Error en cargarEntregas:', err);
            
            // Mostrar error en la interfaz
            const entregasList = document.getElementById('entregasList');
            if (entregasList) {
                entregasList.innerHTML = `<div style="color:red;padding:10px;">Error al cargar entregas: ${err.message || 'Desconocido'}</div>`;
            }
            
            return [];
        }
    };
    console.log('[POLYFILL] Función cargarEntregas creada');
}

// ===== POLYFILLS PARA OTRAS FUNCIONES =====

// Verificar y crear buscarTerminal si no existe
if (typeof window.buscarTerminal !== 'function') {
    window.buscarTerminal = function(texto) {
        console.log(`[POLYFILL] Ejecutando buscarTerminal('${texto}') polyfill`);
        // Implementación básica - podría mejorarse si tienes datos disponibles
        return [];
    };
    console.log('[POLYFILL] Función buscarTerminal creada');
}

// Verificar y crear formatoNumero si no existe
if (typeof window.formatoNumero !== 'function') {
    window.formatoNumero = function(num) {
        console.log(`[POLYFILL] Formateando número: ${num}`);
        return Number(num).toLocaleString();
    };
    console.log('[POLYFILL] Función formatoNumero creada');
}

console.log('[POLYFILL] Todos los polyfills instalados correctamente');

// Detectar intentos de acceder a null.property después de que el script cargue
window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('null') && event.message.includes('property')) {
        console.error('[POLYFILL] Detectado error de propiedad nula:', event);
        event.preventDefault();
    }
}, true);