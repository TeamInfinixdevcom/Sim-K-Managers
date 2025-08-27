// Función de diagnóstico en vivo para agentes
console.log('[DIAGNÓSTICO-VIVO] Inicializando diagnóstico de agentes...');

window.diagnosticarAgentesEnVivo = function() {
    console.log('[DIAGNÓSTICO] === ESTADO ACTUAL ===');
    console.log('[DIAGNÓSTICO] window.electronAPI:', !!window.electronAPI);
    console.log('[DIAGNÓSTICO] window.electronAPI.listAgents:', typeof window.electronAPI?.listAgents);
    console.log('[DIAGNÓSTICO] Elemento selAgente:', !!document.getElementById('selAgente'));
    console.log('[DIAGNÓSTICO] DOM readyState:', document.readyState);
    
    if (window.electronAPI && typeof window.electronAPI.listAgents === 'function') {
        const agentes = window.electronAPI.listAgents();
        console.log('[SIMPLE-AGENTES] Agentes obtenidos:', agentes);
        if (!agentes || agentes.length === 0) {
            console.warn('[SIMPLE-AGENTES] No hay agentes disponibles');
        } else {
            console.log('[SIMPLE-AGENTES] Agentes disponibles:', agentes.length);
        }
    } else {
        console.log('[DIAGNÓSTICO] ❌ Función listAgents no disponible');
    }
    
    // Verificar estado del select
    const select = document.getElementById('selAgente');
    if (select) {
        console.log('[DIAGNÓSTICO] Select encontrado, opciones actuales:', select.options.length);
        for (let i = 0; i < select.options.length; i++) {
            console.log(`[DIAGNÓSTICO] Opción ${i}: ${select.options[i].text} (valor: ${select.options[i].value})`);
        }
    } else {
        console.log('[DIAGNÓSTICO] ❌ Select selAgente no encontrado');
    }
};

// Auto-ejecutar diagnóstico después de 3 segundos
setTimeout(() => {
    console.log('[DIAGNÓSTICO-VIVO] Ejecutando diagnóstico automático...');
    window.diagnosticarAgentesEnVivo();
}, 3000);

console.log('[DIAGNÓSTICO-VIVO] Script cargado correctamente');