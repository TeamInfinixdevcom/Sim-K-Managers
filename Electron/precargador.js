// Precargador para SIM KManager
console.log("[PRECARGADOR] Iniciando...");

// Esperar a que la API de Electron esté disponible
function checkElectronAPI() {
    if (window.electronAPI) {
        iniciarPrecarga();
    } else {
        console.log("[PRECARGADOR] Esperando API de Electron...");
        setTimeout(checkElectronAPI, 500);
    }
}

// Función para precarga inicial
async function iniciarPrecarga() {
    console.log("[PRECARGADOR] API de Electron disponible, iniciando precarga...");
    
    try {
        // Mostrar indicador visual de precarga
        const indicador = document.createElement('div');
        indicador.className = 'turbo-indicator';
        indicador.textContent = 'PRECARGANDO...';
        document.body.appendChild(indicador);
        
        // Hacerlo visible
        setTimeout(() => {
            indicador.classList.add('visible');
        }, 100);
        
        // Verificar que la función existe antes de llamarla
        if (!window.electronAPI.precargar) {
            console.warn("[PRECARGADOR] La función precargar no está disponible, intentando con precargarDatos...");
            
            // Intentar con el nombre alternativo
            if (window.electronAPI.precargarDatos) {
                const resultado = await window.electronAPI.precargarDatos();
                
                if (resultado && resultado.ok) {
                    console.log("[PRECARGADOR] Precarga completada correctamente (usando precargarDatos)");
                    console.log("[PRECARGADOR] Estadísticas:", resultado.stats);
                    
                    // Cambiar el mensaje del indicador
                    indicador.textContent = 'TURBO';
                    
                    // Ocultarlo después de un momento
                    setTimeout(() => {
                        indicador.classList.remove('visible');
                        setTimeout(() => {
                            indicador.remove();
                        }, 300);
                    }, 2000);
                    return;
                }
            }
            
            console.error("[PRECARGADOR] No se encontró ninguna función de precarga válida");
            indicador.textContent = 'ERROR';
            setTimeout(() => {
                indicador.classList.remove('visible');
                setTimeout(() => indicador.remove(), 300);
            }, 2000);
            return;
        }
        
        // Realizar la precarga
        const resultado = await window.electronAPI.precargar();
        
        if (resultado && resultado.ok) {
            console.log("[PRECARGADOR] Precarga completada correctamente");
            console.log("[PRECARGADOR] Estadísticas:", resultado.stats);
            
            // Cambiar el mensaje del indicador
            indicador.textContent = 'TURBO';
            
            // Ocultarlo después de un momento
            setTimeout(() => {
                indicador.classList.remove('visible');
                setTimeout(() => {
                    indicador.remove();
                }, 300);
            }, 2000);
        } else {
            console.error("[PRECARGADOR] Error en precarga:", resultado?.error || "Error desconocido");
            // Ocultar indicador en caso de error
            indicador.classList.remove('visible');
            setTimeout(() => {
                indicador.remove();
            }, 300);
        }
    } catch (err) {
        console.error("[PRECARGADOR] Error durante la precarga:", err);
    }
}

// Iniciar el proceso de verificación
checkElectronAPI();