// Parches específicos para problemas conocidos en index.html
console.log('[INDEX-PATCHES] Iniciando parches para index.html...');

// Lista de parches a aplicar cuando el DOM esté listo
const applyPatches = () => {
    console.log('[INDEX-PATCHES] Aplicando parches...');
    
    // Parche para el problema en la línea 645 (onclick del botón resetHistorialBtn)
    const patchResetHistorialBtn = () => {
        const resetBtn = document.getElementById('resetHistorialBtn');
        if (resetBtn) {
            resetBtn.onclick = function() {
                const confirmacion = confirm("¿Está seguro que desea reiniciar el historial? Esta acción no se puede deshacer.");
                if (confirmacion) {
                    console.log("Reinicio de historial confirmado");
                    // Implementar la lógica de reinicio aquí
                }
            };
            console.log('[INDEX-PATCHES] Botón resetHistorialBtn parcheado');
        } else {
            console.log('[INDEX-PATCHES] No se encontró el botón resetHistorialBtn para parchar');
        }
    };

    // Parche para cargarNotas (problema en línea 629)
    const patchCargarNotas = () => {
        if (typeof window.cargarNotas === 'function') {
            console.log('[INDEX-PATCHES] La función cargarNotas ya existe, no se sobrescribirá');
            return;
        }
        
        window.cargarNotas = async function() {
            console.log('[INDEX-PATCHES] Ejecutando versión parcheada de cargarNotas()');
            try {
                let notas = [];
                
                if (window.electronAPI && typeof window.electronAPI.listNotas === 'function') {
                    notas = await window.electronAPI.listNotas();
                } else if (window.electronAPI && typeof window.electronAPI.listarNotas === 'function') {
                    notas = await window.electronAPI.listarNotas();
                }
                
                console.log(`[INDEX-PATCHES] Notas cargadas: ${notas.length}`);
                
                // Actualizar UI de forma segura
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
                } else {
                    console.log('[INDEX-PATCHES] No se encontró el contenedor de notas');
                }
                
                return notas;
            } catch (err) {
                console.error('[INDEX-PATCHES] Error en cargarNotas:', err);
                return [];
            }
        };
        
        console.log('[INDEX-PATCHES] Función cargarNotas parcheada');
    };
    
    // Aplicar todos los parches
    patchResetHistorialBtn();
    patchCargarNotas();
    
    // Más parches pueden ser añadidos aquí
    
    console.log('[INDEX-PATCHES] Todos los parches aplicados');
};

// Aplicar parches cuando el DOM esté listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(applyPatches, 500);  // Pequeño retraso para asegurar que todo esté cargado
} else {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyPatches, 500);
    });
}

// También intentar aplicar parches después de un tiempo fijo
// para casos donde DOMContentLoaded ya ocurrió
setTimeout(applyPatches, 1500);

console.log('[INDEX-PATCHES] Parches registrados y programados');