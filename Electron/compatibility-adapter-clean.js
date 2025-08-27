// Adaptador de compatibilidad para la API de Electron (versión simple)
console.log("[ADAPTADOR-SIMPLE] Inicializando adaptador de compatibilidad...");

// Función auto-ejecutable para evitar conflictos de variables
(function() {
    // Evitar múltiples inicializaciones
    if (window._adaptadorSimpleYaCargado) {
        console.log("[ADAPTADOR-SIMPLE] Adaptador ya cargado, ignorando inicialización duplicada");
        return;
    }
    
    // Marcar como cargado
    window._adaptadorSimpleYaCargado = true;
    
    // Variable para rastrear si el adaptador ya fue inicializado
    let adaptadorInicializado = false;
    
    // Función principal para inicializar el adaptador
    function inicializarAdaptador() {
        if (adaptadorInicializado) {
            console.log('[ADAPTADOR-SIMPLE] El adaptador ya ha sido inicializado');
            return;
        }
        
        adaptadorInicializado = true;
        console.log("[ADAPTADOR-SIMPLE] Inicializando adaptador...");
        
        // Crear objeto api si no existe
        if (!window.api) {
            window.api = {};
        }
        
        // Esperar a que electronAPI esté disponible
        function esperarAPI() {
            if (window.electronAPI) {
                configurarAPI(window.electronAPI);
            } else {
                console.log("[ADAPTADOR-SIMPLE] Esperando API de Electron...");
                setTimeout(esperarAPI, 500);
            }
        }
        
        // Configurar la API cuando esté disponible
        function configurarAPI(electronAPI) {
            console.log("[ADAPTADOR-SIMPLE] API de Electron detectada, configurando...");
            
            // Implementar funciones globales directas (para compatibilidad con código antiguo)
            const funcionesGlobales = [
                'listTerminales',
                'listAgents', 
                'listNotas',
                'listHistorial'
            ];
            
            funcionesGlobales.forEach(nombre => {
                if (!window[nombre] && electronAPI[nombre]) {
                    window[nombre] = electronAPI[nombre];
                    console.log(`[ADAPTADOR-SIMPLE] Función global ${nombre} registrada`);
                } else if (!window[nombre]) {
                    // Buscar alternativas
                    const alternativas = {
                        'listTerminales': 'listarTerminales',
                        'listAgents': 'listarAgentes',
                        'listNotas': 'listarNotas',
                        'listHistorial': 'listarHistorial'
                    };
                    
                    if (alternativas[nombre] && electronAPI[alternativas[nombre]]) {
                        window[nombre] = electronAPI[alternativas[nombre]];
                        console.log(`[ADAPTADOR-SIMPLE] Función global ${nombre} registrada desde alternativa ${alternativas[nombre]}`);
                    } else {
                        // Crear versión simulada que devuelve array vacío
                        window[nombre] = async function() {
                            console.warn(`[ADAPTADOR-SIMPLE] Usando versión simulada de ${nombre}`);
                            return [];
                        };
                        console.log(`[ADAPTADOR-SIMPLE] Función global ${nombre} simulada creada`);
                    }
                }
            });
            
            // Copiar todas las funciones a window.api
            for (const key in electronAPI) {
                if (typeof electronAPI[key] === 'function' && !window.api[key]) {
                    window.api[key] = electronAPI[key];
                    console.log(`[ADAPTADOR-SIMPLE] API ${key} registrada`);
                }
            }
            
            // Añadir alias comunes
            const alias = {
                'guardarAgente': ['agregarAgente', 'addAgent'],
                'obtenerAgentes': ['listarAgentes', 'listAgents'],
                'eliminarAgente': ['removeAgent'],
                'listarTerminales': ['listTerminales'],
                'listarNotas': ['listNotas'],
                'listarHistorial': ['listHistorial']
            };
            
            for (const original in alias) {
                if (window.api[original]) {
                    alias[original].forEach(aliasNombre => {
                        if (!window.api[aliasNombre]) {
                            window.api[aliasNombre] = window.api[original];
                            console.log(`[ADAPTADOR-SIMPLE] Alias ${aliasNombre} → ${original} registrado`);
                        }
                    });
                }
            }
            
            console.log("[ADAPTADOR-SIMPLE] Configuración de API completada");
            
            // Implementar funciones específicas
            implementarFuncionesEspecificas();
        }
        
        // Implementar funciones específicas para la aplicación
        function implementarFuncionesEspecificas() {
            // cargarNotas - Función utilizada en la aplicación
            window.cargarNotas = async function() {
                console.log("[ADAPTADOR-SIMPLE] Ejecutando cargarNotas()");
                try {
                    let notas = [];
                    
                    if (window.api.listNotas) {
                        notas = await window.api.listNotas();
                    } else if (window.api.listarNotas) {
                        notas = await window.api.listarNotas();
                    } else if (window.listNotas) {
                        notas = await window.listNotas();
                    }
                    
                    console.log(`[ADAPTADOR-SIMPLE] ${notas.length} notas cargadas`);
                    
                    // Actualizar la interfaz después de un momento
                    setTimeout(() => {
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
                            console.log('[ADAPTADOR-SIMPLE] Interfaz de notas actualizada');
                        }
                    }, 100);
                    
                    return notas || [];
                } catch (err) {
                    console.error("[ADAPTADOR-SIMPLE] Error en cargarNotas:", err);
                    return [];
                }
            };
            
            // cargarEntregas - Función utilizada en la aplicación
            window.cargarEntregas = async function(correo) {
                console.log(`[ADAPTADOR-SIMPLE] Ejecutando cargarEntregas(${correo || ''})`);
                try {
                    let entregas = [];
                    
                    if (window.api.listHistorial) {
                        entregas = await window.api.listHistorial(correo);
                    } else if (window.api.listarHistorial) {
                        entregas = await window.api.listarHistorial(correo);
                    } else if (window.listHistorial) {
                        entregas = await window.listHistorial(correo);
                    }
                    
                    return entregas || [];
                } catch (err) {
                    console.error("[ADAPTADOR-SIMPLE] Error en cargarEntregas:", err);
                    return [];
                }
            };
            
            // Función para mostrar notificaciones
            if (!window.notificacion) {
                window.notificacion = (tipo, mensaje) => {
                    console.log(`[NOTIFICACIÓN ${tipo.toUpperCase()}]: ${mensaje}`);
                    
                    const notificacion = document.createElement('div');
                    notificacion.className = `notificacion ${tipo}`;
                    notificacion.textContent = mensaje;
                    notificacion.style.position = 'fixed';
                    notificacion.style.bottom = '10px';
                    notificacion.style.right = '10px';
                    notificacion.style.backgroundColor = tipo === 'error' ? '#f44336' : 
                                                         tipo === 'success' ? '#4CAF50' : '#2196F3';
                    notificacion.style.color = 'white';
                    notificacion.style.padding = '15px';
                    notificacion.style.borderRadius = '4px';
                    notificacion.style.zIndex = '9999';
                    
                    document.body.appendChild(notificacion);
                    
                    // Auto-eliminar después de 3 segundos
                    setTimeout(() => {
                        notificacion.style.opacity = '0';
                        notificacion.style.transition = 'opacity 0.5s';
                        setTimeout(() => {
                            document.body.removeChild(notificacion);
                        }, 500);
                    }, 3000);
                };
                
                console.log('[ADAPTADOR-SIMPLE] Función de notificación registrada');
            }
            
            console.log("[ADAPTADOR-SIMPLE] Funciones específicas implementadas");
        }
        
        // Iniciar el proceso
        esperarAPI();
    }
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarAdaptador);
    } else {
        inicializarAdaptador();
    }
    
    // Exportar para uso desde otros scripts
    window.compatibilityAdapter = {
        inicializar: inicializarAdaptador,
        version: '1.0.0',
        isInitialized: () => adaptadorInicializado
    };
})(); // Auto-ejecución