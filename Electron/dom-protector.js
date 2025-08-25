// Protector para operaciones DOM - evitar errores de nulos
console.log('[DOM-PROTECTOR] Iniciando protección DOM...');

// Mapeo de elementos pendientes
const pendingElements = {};
const pendingTimers = {};
const MAX_RETRIES = 10;

// Función para obtener un elemento de forma segura
function getElementSafely(id, callback, retries = 0) {
    const elemento = document.getElementById(id);
    
    if (elemento) {
        // Si el elemento existe, ejecutar el callback
        callback(elemento);
        return true;
    } else if (retries < MAX_RETRIES) {
        // Si no existe y no hemos superado los reintentos, programar otro intento
        console.log(`[DOM-PROTECTOR] Elemento #${id} no encontrado, reintentando... (${retries+1}/${MAX_RETRIES})`);
        
        // Cancelar cualquier timer pendiente para este elemento
        if (pendingTimers[id]) {
            clearTimeout(pendingTimers[id]);
        }
        
        // Programar un nuevo intento
        pendingTimers[id] = setTimeout(() => {
            getElementSafely(id, callback, retries + 1);
        }, 200 * (retries + 1)); // Tiempo progresivo para reintentos
        
        return false;
    } else {
        // Si superamos los reintentos, almacenar la operación para ejecutarla 
        // cuando el elemento esté disponible
        console.warn(`[DOM-PROTECTOR] Elemento #${id} no encontrado después de ${MAX_RETRIES} intentos. Guardando operación para cuando esté disponible.`);
        
        if (!pendingElements[id]) {
            pendingElements[id] = [];
        }
        
        pendingElements[id].push(callback);
        return false;
    }
}

// Observer para detectar cuando se añaden elementos al DOM
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Verificar si alguno de los elementos añadidos tiene operaciones pendientes
            mutation.addedNodes.forEach((node) => {
                if (node.id && pendingElements[node.id] && pendingElements[node.id].length > 0) {
                    const callbacks = pendingElements[node.id];
                    console.log(`[DOM-PROTECTOR] Elemento #${node.id} añadido al DOM. Ejecutando ${callbacks.length} operaciones pendientes.`);
                    
                    // Ejecutar todos los callbacks pendientes
                    callbacks.forEach(callback => callback(node));
                    
                    // Limpiar los callbacks
                    pendingElements[node.id] = [];
                }
            });
        }
    });
});

// Iniciar el observer
observer.observe(document.body, { childList: true, subtree: true });

// Protector para establecer innerHTML
window.setInnerHTML = function(id, html) {
    return getElementSafely(id, (elemento) => {
        elemento.innerHTML = html;
    });
};

// Protector para añadir clase
window.addClass = function(id, className) {
    return getElementSafely(id, (elemento) => {
        elemento.classList.add(className);
    });
};

// Protector para quitar clase
window.removeClass = function(id, className) {
    return getElementSafely(id, (elemento) => {
        elemento.classList.remove(className);
    });
};

// Protector para establecer atributo
window.setAttribute = function(id, attr, value) {
    return getElementSafely(id, (elemento) => {
        elemento.setAttribute(attr, value);
    });
};

// Protector para establecer onclick
window.setOnClick = function(id, handler) {
    return getElementSafely(id, (elemento) => {
        elemento.onclick = handler;
    });
};

// Sobrescribir getElementById para mayor seguridad
const originalGetElementById = document.getElementById;
document.getElementById = function(id) {
    const element = originalGetElementById.call(document, id);
    if (!element) {
        console.warn(`[DOM-PROTECTOR] Aviso: getElementById('${id}') devolvió null`);
    }
    return element;
};

// No parchamos los prototipos nativos ya que puede causar "Illegal invocation"
// En su lugar, proporcionamos funciones de utilidad seguras

// Crear versiones seguras de métodos comunes
window.safeInnerHTML = function(element, html) {
    if (!element) return false;
    try {
        element.innerHTML = html;
        return true;
    } catch (err) {
        console.error('[DOM-PROTECTOR] Error al establecer innerHTML:', err);
        return false;
    }
};

window.safeAppendChild = function(parent, child) {
    if (!parent || !child) return false;
    try {
        parent.appendChild(child);
        return true;
    } catch (err) {
        console.error('[DOM-PROTECTOR] Error al añadir hijo:', err);
        return false;
    }
};

window.safeRemoveChild = function(parent, child) {
    if (!parent || !child) return false;
    try {
        parent.removeChild(child);
        return true;
    } catch (err) {
        console.error('[DOM-PROTECTOR] Error al eliminar hijo:', err);
        return false;
    }
};

window.safeSetAttribute = function(element, attr, value) {
    if (!element) return false;
    try {
        element.setAttribute(attr, value);
        return true;
    } catch (err) {
        console.error('[DOM-PROTECTOR] Error al establecer atributo:', err);
        return false;
    }
};

window.safeAddEventListener = function(element, event, handler) {
    if (!element) return false;
    try {
        element.addEventListener(event, handler);
        return true;
    } catch (err) {
        console.error('[DOM-PROTECTOR] Error al añadir event listener:', err);
        return false;
    }
};

console.log('[DOM-PROTECTOR] Protección DOM cargada correctamente');

// Parche para index.html:645
setTimeout(() => {
    const resetHistorialBtn = document.getElementById('resetHistorialBtn');
    if (resetHistorialBtn) {
        resetHistorialBtn.onclick = function() {
            const confirmacion = confirm("¿Está seguro que desea reiniciar el historial? Esta acción no se puede deshacer.");
            if (confirmacion) {
                console.log("Reinicio de historial confirmado");
                // Implementar la lógica de reinicio aquí
                if (window.electronAPI && window.electronAPI.resetHistorial) {
                    window.electronAPI.resetHistorial()
                        .then(result => {
                            if (result.ok) {
                                alert("Historial reiniciado correctamente");
                                // Recargar la lista si existe la función
                                if (typeof window.cargarEntregas === 'function') {
                                    window.cargarEntregas();
                                }
                            } else {
                                alert("Error al reiniciar historial: " + (result.error || "desconocido"));
                            }
                        })
                        .catch(err => {
                            console.error("Error en resetHistorial:", err);
                            alert("Error: " + err.message);
                        });
                } else {
                    console.warn("API resetHistorial no está disponible");
                }
            }
        };
        console.log('[DOM-PROTECTOR] Botón resetHistorialBtn configurado correctamente');
    } else {
        window.setOnClick('resetHistorialBtn', function() {
            const confirmacion = confirm("¿Está seguro que desea reiniciar el historial? Esta acción no se puede deshacer.");
            if (confirmacion) {
                console.log("Reinicio de historial confirmado");
                // Implementar la lógica de reinicio aquí
            }
        });
    }
}, 1000);