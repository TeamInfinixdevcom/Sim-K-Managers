// Script de carga forzada de agentes
console.log('[FORZADO] Inicializando carga forzada de agentes...');

async function cargarAgentesForzado() {
    console.log('[FORZADO] Iniciando proceso de carga forzada...');
    
    try {
        // Esperar hasta que la API esté disponible
        let intentos = 0;
        console.log('[FORZADO] Esperando a que window.electronAPI esté disponible...');
        
        while (!window.electronAPI && intentos < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            intentos++;
            console.log(`[FORZADO] Intento ${intentos}/20 - API disponible:`, !!window.electronAPI);
        }
        
        if (!window.electronAPI) {
            console.error('[FORZADO] ❌ No se pudo acceder a window.electronAPI después de 10 segundos');
            return false;
        }
        
        console.log('[FORZADO] ✅ window.electronAPI disponible');
        console.log('[FORZADO] Función listAgents disponible:', typeof window.electronAPI.listAgents);
        
        if (typeof window.electronAPI.listAgents !== 'function') {
            console.error('[FORZADO] ❌ listAgents no es una función');
            return false;
        }
        
        // Intentar obtener agentes
        console.log('[FORZADO] Solicitando agentes...');
        const agentes = await window.electronAPI.listAgents();
        console.log('[FORZADO] Agentes obtenidos:', agentes);
        
        if (!agentes || !Array.isArray(agentes)) {
            console.error('[FORZADO] ❌ Respuesta inválida de listAgents');
            return false;
        }
        
        // Buscar el select
        const select = document.getElementById('selAgente');
        if (!select) {
            console.error('[FORZADO] ❌ No se encontró el elemento selAgente');
            return false;
        }
        
        console.log('[FORZADO] ✅ Elemento select encontrado');
        
        // Limpiar y actualizar el select
        select.innerHTML = '<option value="">— Seleccione —</option>';
        console.log('[FORZADO] Select limpiado');
        
        if (agentes.length === 0) {
            console.warn('[FORZADO] ⚠️ No hay agentes para mostrar');
            const option = document.createElement('option');
            option.textContent = 'No hay agentes disponibles';
            option.disabled = true;
            select.appendChild(option);
            return false;
        }
        
        // Agregar cada agente
        agentes.forEach((agente, index) => {
            if (agente && agente.correo) {
                const option = document.createElement('option');
                option.value = agente.correo;
                option.textContent = `${agente.nombre || 'Sin nombre'} (${agente.correo})`;
                select.appendChild(option);
                console.log(`[FORZADO] Agente ${index + 1} agregado: ${agente.nombre} - ${agente.correo}`);
            } else {
                console.warn(`[FORZADO] ⚠️ Agente inválido en índice ${index}:`, agente);
            }
        });
        
        console.log(`[FORZADO] ✅ ${agentes.length} agentes cargados exitosamente`);
        
        // Verificar que se cargaron correctamente
        console.log(`[FORZADO] Verificación: Select tiene ${select.options.length} opciones`);
        
        return true;
        
    } catch (error) {
        console.error('[FORZADO] ❌ Error en carga forzada:', error);
        return false;
    }
}

// Función de diagnóstico específica
async function diagnosticarCargaAgentes() {
    console.log('[FORZADO-DIAG] === DIAGNÓSTICO DE CARGA ===');
    
    // Verificar elementos DOM
    const elementos = {
        selAgente: document.getElementById('selAgente'),
        agente: document.getElementById('agente'),
        usuario: document.getElementById('usuario'),
        correo: document.getElementById('correo')
    };
    
    console.log('[FORZADO-DIAG] Elementos DOM:');
    Object.entries(elementos).forEach(([nombre, elemento]) => {
        console.log(`[FORZADO-DIAG] ${nombre}:`, !!elemento);
    });
    
    // Verificar API
    console.log('[FORZADO-DIAG] window.electronAPI:', !!window.electronAPI);
    if (window.electronAPI) {
        console.log('[FORZADO-DIAG] Funciones disponibles:', Object.keys(window.electronAPI));
        console.log('[FORZADO-DIAG] listAgents:', typeof window.electronAPI.listAgents);
    }
    
    // Intentar carga forzada
    const exito = await cargarAgentesForzado();
    console.log('[FORZADO-DIAG] Resultado de carga forzada:', exito ? '✅ ÉXITO' : '❌ FALLO');
    
    return exito;
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    console.log('[FORZADO] DOM aún cargando, esperando DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[FORZADO] DOM listo, ejecutando en 2 segundos...');
        setTimeout(cargarAgentesForzado, 2000);
    });
} else {
    console.log('[FORZADO] DOM ya listo, ejecutando en 2 segundos...');
    setTimeout(cargarAgentesForzado, 2000);
}

// Exponer funciones para uso manual
window.cargarAgentesForzado = cargarAgentesForzado;
window.diagnosticarCargaAgentes = diagnosticarCargaAgentes;

console.log('[FORZADO] Script cargado correctamente - Funciones disponibles:');
console.log('[FORZADO] - window.cargarAgentesForzado()');
console.log('[FORZADO] - window.diagnosticarCargaAgentes()');