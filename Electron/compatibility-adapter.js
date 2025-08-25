// Adaptador de compatibilidad para la API de Electron
console.log("[ADAPTADOR] Inicializando adaptador de compatibilidad...");

// Función para verificar que electronAPI existe
function esperarElectronAPI() {
    if (window.electronAPI) {
        inicializarAdaptador();
    } else {
        console.log("[ADAPTADOR] Esperando API de Electron...");
        setTimeout(esperarElectronAPI, 300);
    }
}

// Función para inicializar el adaptador
function inicializarAdaptador() {
    console.log("[ADAPTADOR] API de Electron detectada, inicializando adaptador...");
    
    // Implementar funciones de compatibilidad en window
    if (!window.listTerminales && window.electronAPI.listTerminales) {
        window.listTerminales = window.electronAPI.listTerminales;
        console.log("[ADAPTADOR] Función listTerminales implementada");
    }
    
    if (!window.listAgents && window.electronAPI.listAgents) {
        window.listAgents = window.electronAPI.listAgents;
        console.log("[ADAPTADOR] Función listAgents implementada");
    }
    
    if (!window.listNotas && window.electronAPI.listNotas) {
        window.listNotas = window.electronAPI.listNotas;
        console.log("[ADAPTADOR] Función listNotas implementada");
    }
    
    if (!window.listHistorial && window.electronAPI.listHistorial) {
        window.listHistorial = window.electronAPI.listHistorial;
        console.log("[ADAPTADOR] Función listHistorial implementada");
    }
    
    // Garantizar que existan las funciones en caso de que electronAPI no las tenga
    if (!window.listTerminales) {
        window.listTerminales = async function() {
            console.warn("[ADAPTADOR] Usando adaptador para listTerminales");
            try {
                return await window.electronAPI.listarTerminales();
            } catch (err) {
                console.error("[ADAPTADOR] Error en listTerminales:", err);
                return [];
            }
        };
    }
    
    if (!window.listAgents) {
        window.listAgents = async function() {
            console.warn("[ADAPTADOR] Usando adaptador para listAgents");
            try {
                return await window.electronAPI.listarAgentes();
            } catch (err) {
                console.error("[ADAPTADOR] Error en listAgents:", err);
                return [];
            }
        };
    }
    
    if (!window.listNotas) {
        window.listNotas = async function() {
            console.warn("[ADAPTADOR] Usando adaptador para listNotas");
            try {
                return await window.electronAPI.listarNotas();
            } catch (err) {
                console.error("[ADAPTADOR] Error en listNotas:", err);
                return [];
            }
        };
    }
    
    if (!window.listHistorial) {
        window.listHistorial = async function(correo) {
            console.warn("[ADAPTADOR] Usando adaptador para listHistorial");
            try {
                return await window.electronAPI.listarHistorial(correo);
            } catch (err) {
                console.error("[ADAPTADOR] Error en listHistorial:", err);
                return [];
            }
        };
    }
    
    console.log("[ADAPTADOR] Adaptador de compatibilidad inicializado correctamente");
    
    // Verificar elementos DOM específicos después de que el DOM esté listo
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        arreglarReferenciasDOM();
    } else {
        window.addEventListener('DOMContentLoaded', arreglarReferenciasDOM);
    }
}

// Función para arreglar referencias DOM específicas que puedan estar causando problemas
function arreglarReferenciasDOM() {
    try {
        console.log("[ADAPTADOR] Arreglando referencias DOM...");
        
        // Arreglar elementos null - agregamos seguridad para todos los elementos DOM
        function asegurarElementoDOM(id, callback) {
            setTimeout(() => {
                const elemento = document.getElementById(id);
                if (elemento) {
                    callback(elemento);
                    console.log(`[ADAPTADOR] Elemento ${id} configurado correctamente`);
                } else {
                    console.log(`[ADAPTADOR] Elemento ${id} no encontrado, reintentando...`);
                    // Reintentar después de un tiempo
                    setTimeout(() => asegurarElementoDOM(id, callback), 500);
                }
            }, 100);
        }
        
        // Arreglar el botón resetHistorialBtn
        asegurarElementoDOM('resetHistorialBtn', (btn) => {
            btn.onclick = function() {
                const confirmacion = confirm("¿Está seguro que desea reiniciar el historial? Esta acción no se puede deshacer.");
                if (confirmacion) {
                    console.log("Reinicio de historial confirmado");
                    // Implementar la lógica de reinicio aquí
                }
            };
        });
        
        // Implementar funciones globales necesarias
        window.cargarNotas = async function() {
            console.log("[ADAPTADOR] Ejecutando cargarNotas()");
            try {
                let notas = [];
                
                // Intentar diferentes formas de obtener las notas
                if (typeof window.electronAPI.listNotas === 'function') {
                    notas = await window.electronAPI.listNotas();
                } else if (typeof window.electronAPI.listarNotas === 'function') {
                    notas = await window.electronAPI.listarNotas();
                }
                
                console.log(`[ADAPTADOR] ${notas.length} notas cargadas`);
                
                // Actualizar la interfaz de usuario de forma segura
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
                            notasContainer.innerHTML = html;
                            console.log('[ADAPTADOR] Interfaz de notas actualizada');
                        }
                    } catch (err) {
                        console.error('[ADAPTADOR] Error actualizando la interfaz de notas:', err);
                    }
                }, 100);
                
                return notas || [];
            } catch (err) {
                console.error("[ADAPTADOR] Error en cargarNotas:", err);
                return [];
            }
        };
        
        window.cargarEntregas = async function(correo) {
            console.log(`[ADAPTADOR] Ejecutando cargarEntregas(${correo})`);
            try {
                const entregas = await window.electronAPI.listHistorial(correo);
                return entregas || [];
            } catch (err) {
                console.error("[ADAPTADOR] Error en cargarEntregas:", err);
                return [];
            }
        };
        
    } catch (err) {
        console.error("[ADAPTADOR] Error arreglando referencias DOM:", err);
    }
}

// Iniciar el proceso de adaptación
esperarElectronAPI();