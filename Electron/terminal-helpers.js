// Helpers para manejo de terminales
console.log("Inicializando helpers de terminales...");

// Variables globales
let terminalesCache = [];
let agentesCache = [];

// Función para inicializar cuando la API esté disponible
function initTerminalHelpers() {
    if (!window.electronAPI) {
        console.log("Esperando API de Electron...");
        setTimeout(initTerminalHelpers, 500);
        return;
    }
    
    console.log("Helpers de terminales instalados correctamente");
    
    // Exponer funciones globales
    window.cargarTerminales = async function() {
        try {
            // Intentar con listTerminales primero (para compatibilidad con el HTML existente)
            if (typeof window.electronAPI.listTerminales === 'function') {
                const terminales = await window.electronAPI.listTerminales();
                terminalesCache = terminales || [];
                return terminalesCache;
            } else {
                const terminales = await window.electronAPI.listarTerminales();
                terminalesCache = terminales || [];
                return terminalesCache;
            }
        } catch (err) {
            console.error("Error cargando terminales:", err);
            return [];
        }
    };
    
    window.cargarAgentes = async function() {
        try {
            // Intentar con listAgents primero (para compatibilidad con el HTML existente)
            if (typeof window.electronAPI.listAgents === 'function') {
                const agentes = await window.electronAPI.listAgents();
                agentesCache = agentes || [];
                return agentesCache;
            } else {
                const agentes = await window.electronAPI.listarAgentes();
                agentesCache = agentes || [];
                return agentesCache;
            }
        } catch (err) {
            console.error("Error cargando agentes:", err);
            return [];
        }
    };
    
    window.buscarTerminal = function(texto) {
        if (!texto || !terminalesCache.length) return [];
        
        const termLower = texto.toLowerCase();
        return terminalesCache.filter(t => 
            (t.marca && t.marca.toLowerCase().includes(termLower)) ||
            (t.terminal && t.terminal.toLowerCase().includes(termLower)) ||
            (t.agencia && t.agencia.toLowerCase().includes(termLower))
        );
    };
    
    window.formatoNumero = function(num) {
        return Number(num).toLocaleString();
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === "complete" || document.readyState === "interactive") {
        console.log("DOM ya cargado, inicializando...");
    } else {
        window.addEventListener('DOMContentLoaded', () => {
            console.log("DOM cargado, inicializando helpers...");
        });
    }
}

// Iniciar
initTerminalHelpers();