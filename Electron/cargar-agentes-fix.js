/**
 * Función mejorada para cargar agentes en el select
 * Versión: 1.0.2 - Corregida para evitar duplicación y mejorar el manejo de errores
 */
console.log("[CARGAR-AGENTES-FIX] Inicializando...");

// Función principal para cargar agentes
async function cargarAgentes() {
    console.log("[UI] === INICIANDO CARGA DE AGENTES ===");
    
    try {
        // Verificar que la API esté disponible
        if (!window.electronAPI) {
            console.error("[UI] Error: window.electronAPI no está disponible");
            mostrarErrorAgentes("API de Electron no disponible");
            return;
        }
        
        console.log("[UI] API de Electron disponible:", !!window.electronAPI);
        console.log("[UI] Funciones disponibles en electronAPI:", Object.keys(window.electronAPI));
        
        // Verificar que la función listAgents esté disponible
        if (typeof window.electronAPI.listAgents !== 'function') {
            console.error("[UI] Error: window.electronAPI.listAgents no es una función");
            console.log("[UI] Tipo de listAgents:", typeof window.electronAPI.listAgents);
            
            // Intentar con alternativas desde el adaptador
            const alternativas = [
                () => window.api?.obtenerAgentes?.(),
                () => window.api?.listarAgentes?.(),
                () => window.listAgents?.(),
                () => window.api?.listAgents?.()
            ];
            
            for (let i = 0; i < alternativas.length; i++) {
                try {
                    const resultado = alternativas[i]();
                    if (resultado) {
                        console.log(`[UI] Usando alternativa ${i + 1}`);
                        const agentes = await resultado;
                        actualizarSelectAgentes(agentes);
                        return;
                    }
                } catch (err) {
                    console.log(`[UI] Alternativa ${i + 1} falló:`, err.message);
                }
            }
            
            mostrarErrorAgentes("Función para listar agentes no disponible");
            return;
        }
        
        // Solicitar agentes usando la API principal
        console.log("[UI] Llamando a window.electronAPI.listAgents()");
        const agentes = await window.electronAPI.listAgents();
        
        if (!agentes) {
            console.error("[UI] Error: listAgents devolvió un valor nulo o indefinido");
            mostrarErrorAgentes("No se recibieron datos de agentes");
            return;
        }
        
        console.log(`[UI] ${agentes.length} agentes recibidos:`, agentes);
        actualizarSelectAgentes(agentes);
        
    } catch (err) {
        console.error("[UI] Error al cargar agentes:", err);
        mostrarErrorAgentes(err.message || "Error desconocido");
    }
}

/**
 * Actualiza el elemento select con los agentes recibidos
 */
function actualizarSelectAgentes(agentes) {
    console.log("[UI] Actualizando select de agentes...");
    
    // Buscar el select en el DOM
    const sel = document.getElementById("selAgente");
    if (!sel) {
        console.error("[UI] Elemento selAgente no encontrado en el DOM");
        console.log("[UI] Elementos disponibles:", document.querySelectorAll('select').length);
        return;
    }
    
    // Limpiar opciones existentes
    sel.innerHTML = '<option value="">— Seleccione —</option>';
    
    // Verificar si hay agentes
    if (!agentes || agentes.length === 0) {
        console.warn("[UI] No hay agentes para mostrar");
        const optEmpty = document.createElement("option");
        optEmpty.textContent = "No hay agentes disponibles";
        optEmpty.disabled = true;
        sel.appendChild(optEmpty);
        return;
    }
    
    // Agregar cada agente como una opción
    agentes.forEach((a, index) => {
        if (!a || !a.correo) {
            console.warn(`[UI] Agente inválido detectado en índice ${index}:`, a);
            return; // Saltar agentes inválidos
        }
        
        const opt = document.createElement("option");
        opt.value = a.correo;
        opt.textContent = `${a.nombre || 'Sin nombre'} (${a.correo})`;
        sel.appendChild(opt);
        console.log(`[UI] Agente agregado: ${a.nombre} - ${a.correo}`);
    });
    
    console.log("[UI] Select de agentes actualizado con éxito");
}

/**
 * Muestra un mensaje de error en la interfaz
 */
function mostrarErrorAgentes(mensaje) {
    console.error("[UI] Mostrando error de agentes:", mensaje);
    
    const sel = document.getElementById("selAgente");
    if (sel) {
        sel.innerHTML = '<option value="" disabled selected>Error: ' + mensaje + '</option>';
    }
    
    // Si existe la función de notificación, usarla
    if (typeof window.notificacion === 'function') {
        window.notificacion('error', 'Error al cargar agentes: ' + mensaje);
    }
}

// Función para diagnosticar el estado
function diagnosticarEstadoAgentes() {
    console.log("[DIAGNÓSTICO] === ESTADO DE AGENTES ===");
    console.log("[DIAGNÓSTICO] window.electronAPI:", !!window.electronAPI);
    console.log("[DIAGNÓSTICO] window.electronAPI.listAgents:", typeof window.electronAPI?.listAgents);
    console.log("[DIAGNÓSTICO] window.api:", !!window.api);
    console.log("[DIAGNÓSTICO] window.listAgents:", typeof window.listAgents);
    console.log("[DIAGNÓSTICO] Elemento selAgente:", !!document.getElementById("selAgente"));
    console.log("[DIAGNÓSTICO] DOM ready:", document.readyState);
}

// Función de inicialización más robusta
function inicializarCargaAgentes() {
    console.log("[CARGAR-AGENTES-FIX] Inicializando carga de agentes...");
    
    // Diagnóstico inicial
    diagnosticarEstadoAgentes();
    
    // Intentar cargar agentes con múltiples estrategias
    const intentarCarga = async () => {
        // Esperar un poco para que todo esté listo
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log("[CARGAR-AGENTES-FIX] Intentando cargar agentes...");
        await cargarAgentes();
    };
    
    // Ejecutar la carga
    intentarCarga().catch(err => {
        console.error("[CARGAR-AGENTES-FIX] Error en inicialización:", err);
    });
}

// Auto-ejecutar según el estado del DOM
if (document.readyState === 'loading') {
    console.log("[CARGAR-AGENTES-FIX] DOM aún cargando, esperando DOMContentLoaded");
    document.addEventListener('DOMContentLoaded', inicializarCargaAgentes);
} else {
    console.log("[CARGAR-AGENTES-FIX] DOM ya listo, ejecutando inmediatamente");
    inicializarCargaAgentes();
}

// Exponer funciones para uso desde la consola para diagnóstico
window.recargarAgentes = cargarAgentes;
window.diagnosticarAgentes = diagnosticarEstadoAgentes;

console.log("[CARGAR-AGENTES-FIX] Script cargado correctamente");