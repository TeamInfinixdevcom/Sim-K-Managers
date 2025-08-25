// Correcciones específicas para elementos DOM problemáticos
console.log('[DOM-FIX] Iniciando correcciones para elementos DOM problemáticos...');

// Lista de elementos a corregir cuando el DOM esté listo
const elementosProblematicos = [
    {
        id: 'resetHistorialBtn',
        tipo: 'onclick',
        funcion: function() {
            const confirmacion = confirm("¿Está seguro que desea reiniciar el historial? Esta acción no se puede deshacer.");
            if (confirmacion) {
                console.log("Reinicio de historial confirmado");
                // Implementar la lógica de reinicio aquí
            }
        }
    },
    {
        id: 'notasContainer',
        tipo: 'observe',
        funcion: function(elemento) {
            console.log('[DOM-FIX] Observando cambios en notasContainer');
        }
    }
    // Se pueden añadir más elementos aquí
];

// Función para aplicar correcciones
function aplicarCorrecciones() {
    console.log('[DOM-FIX] Aplicando correcciones DOM...');
    
    elementosProblematicos.forEach(item => {
        // Múltiples intentos con retraso
        for (let intento = 0; intento < 5; intento++) {
            setTimeout(() => {
                const elemento = document.getElementById(item.id);
                if (!elemento && intento < 4) {
                    console.log(`[DOM-FIX] Elemento ${item.id} no encontrado, reintento ${intento+1}/5`);
                    return;
                }
                
                if (!elemento) {
                    console.error(`[DOM-FIX] No se pudo encontrar el elemento ${item.id} después de 5 intentos`);
                    return;
                }
                
                if (item.tipo === 'onclick') {
                    console.log(`[DOM-FIX] Configurando onclick para ${item.id}`);
                    elemento.onclick = item.funcion;
                } else if (item.tipo === 'observe') {
                    console.log(`[DOM-FIX] Configurando observer para ${item.id}`);
                    item.funcion(elemento);
                }
                
                console.log(`[DOM-FIX] Elemento ${item.id} corregido correctamente`);
            }, 500 * (intento + 1));  // Retrasos progresivos
        }
    });
}

// Aplicar correcciones cuando el DOM esté completamente cargado
if (document.readyState === 'complete') {
    aplicarCorrecciones();
} else {
    document.addEventListener('DOMContentLoaded', aplicarCorrecciones);
    // También aplicar después de un tiempo fijo para casos donde el evento ya ocurrió
    setTimeout(aplicarCorrecciones, 1000);
}

// Ejecutar también después de 3 segundos como último recurso
setTimeout(aplicarCorrecciones, 3000);

// Específicamente para el problema de cargarNotas
window.fixCargarNotas = function() {
    console.log('[DOM-FIX] Intentando corregir problema en cargarNotas');
    
    const notasContainer = document.getElementById('notasContainer');
    if (notasContainer) {
        // Parchear la función cargarNotas
        window.cargarNotasSeguro = async function() {
            console.log('[DOM-FIX] Ejecutando cargarNotasSeguro');
            try {
                let notas = [];
                
                if (window.electronAPI) {
                    if (typeof window.electronAPI.listNotas === 'function') {
                        notas = await window.electronAPI.listNotas();
                    } else if (typeof window.electronAPI.listarNotas === 'function') {
                        notas = await window.electronAPI.listarNotas();
                    }
                }
                
                console.log(`[DOM-FIX] ${notas.length} notas cargadas`);
                
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
                    console.log('[DOM-FIX] Contenedor de notas actualizado correctamente');
                } else {
                    console.error('[DOM-FIX] notasContainer no encontrado en el DOM');
                }
                
                return notas;
            } catch (err) {
                console.error('[DOM-FIX] Error en cargarNotasSeguro:', err);
                return [];
            }
        };
        
        // Reemplazar la función original
        if (window.cargarNotas) {
            console.log('[DOM-FIX] Reemplazando cargarNotas con versión segura');
            window.cargarNotas_original = window.cargarNotas;
            window.cargarNotas = window.cargarNotasSeguro;
        } else {
            console.log('[DOM-FIX] Instalando cargarNotas seguro');
            window.cargarNotas = window.cargarNotasSeguro;
        }
        
        return true;
    } else {
        console.log('[DOM-FIX] notasContainer no encontrado, no se puede parchearlo todavía');
        return false;
    }
};

// Intentar corregir cargarNotas varias veces
for (let i = 0; i < 3; i++) {
    setTimeout(() => {
        if (window.fixCargarNotas()) {
            console.log('[DOM-FIX] cargarNotas corregido en intento ' + (i+1));
        }
    }, 1000 * (i + 1));
}

console.log('[DOM-FIX] Correcciones registradas y listas para aplicar');