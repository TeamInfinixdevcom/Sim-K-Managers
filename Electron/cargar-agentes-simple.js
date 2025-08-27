/**
 * Script simple para cargar agentes - Sin conflictos
 * Este script se ejecuta independientemente para asegurar que los agentes se carguen
 */
console.log("[SIMPLE-AGENTES] Inicializando carga simple de agentes...");

// Función simple para cargar agentes
async function cargarAgentesSimple() {
    console.log("[SIMPLE-AGENTES] Intentando cargar agentes...");
    
    try {
        // Verificar que la API esté disponible
        if (!window.electronAPI) {
            console.error("[SIMPLE-AGENTES] window.electronAPI no disponible");
            return false;
        }
        
        if (typeof window.electronAPI.listAgents !== 'function') {
            console.error("[SIMPLE-AGENTES] window.electronAPI.listAgents no es una función");
            return false;
        }
        
        // Obtener agentes
        const agentes = await window.electronAPI.listAgents();
        console.log("[SIMPLE-AGENTES] Agentes obtenidos:", agentes);
        
        // Buscar el select
        const select = document.getElementById('selAgente');
        if (!select) {
            console.error("[SIMPLE-AGENTES] No se encontró el elemento selAgente");
            return false;
        }
        
        // Limpiar y llenar el select
        select.innerHTML = '<option value="">— Seleccione —</option>';
        
        if (agentes && agentes.length > 0) {
            agentes.forEach(agente => {
                if (agente && agente.correo) {
                    const option = document.createElement('option');
                    option.value = agente.correo;
                    option.textContent = `${agente.nombre || 'Sin nombre'} (${agente.correo})`;
                    select.appendChild(option);
                }
            });
            console.log(`[SIMPLE-AGENTES] ${agentes.length} agentes cargados exitosamente`);
            return true;
        } else {
            console.warn("[SIMPLE-AGENTES] No hay agentes disponibles");
            const option = document.createElement('option');
            option.textContent = "No hay agentes disponibles";
            option.disabled = true;
            select.appendChild(option);
            return false;
        }
        
    } catch (error) {
        console.error("[SIMPLE-AGENTES] Error al cargar agentes:", error);
        return false;
    }
}

// Función para intentar cargar varias veces
async function intentarCargaAgentes() {
    console.log("[SIMPLE-AGENTES] Iniciando intentos de carga...");
    
    for (let intento = 1; intento <= 5; intento++) {
        console.log(`[SIMPLE-AGENTES] Intento ${intento} de 5`);
        
        const exito = await cargarAgentesSimple();
        if (exito) {
            console.log("[SIMPLE-AGENTES] ¡Agentes cargados exitosamente!");
            return true;
        }
        
        // Esperar antes del siguiente intento
        if (intento < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000 * intento));
        }
    }
    
    console.error("[SIMPLE-AGENTES] No se pudieron cargar los agentes después de 5 intentos");
    return false;
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(intentarCargaAgentes, 2000); // Esperar 2 segundos para que todo se inicialice
    });
} else {
    setTimeout(intentarCargaAgentes, 2000);
}

// Exponer función para uso manual
window.recargarAgentesSimple = cargarAgentesSimple;

// REVISIÓN: Verifica cómo se carga agents.json y muestra los agentes
console.log("[SIMPLE-AGENTES] Script cargado correctamente");