// Universal API Bridge - Solución para problemas de comunicación entre frontend y backend
console.log('[API-BRIDGE] Inicializando puente API universal...');

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[API-BRIDGE] DOM cargado, configurando puente API...');
    
    // Crear el objeto API global
    window.universalAPI = {};
    
    // Contador de intentos y estado de inicialización
    let intentos = 0;
    let apiInicializada = false;
    const MAXIMO_INTENTOS = 20;
    
    // Detectar cualquier API disponible
    function detectarAPI() {
        intentos++;
        
        // Registrar intento
        console.log(`[API-BRIDGE] Intento ${intentos} de detectar API...`);
        
        // Comprobar si alguna API está disponible
        if (window.electronAPI) {
            console.log('[API-BRIDGE] electronAPI detectada');
            configurarDesdeElectronAPI();
            return true;
        } else if (window.api) {
            console.log('[API-BRIDGE] api detectada');
            configurarDesdeAPI();
            return true;
        }
        
        // Si hemos alcanzado el máximo de intentos, crear una API mock
        if (intentos >= MAXIMO_INTENTOS) {
            console.warn('[API-BRIDGE] Máximo de intentos alcanzado, creando API simulada');
            crearAPIMock();
            return true;
        }
        
        // No se encontró API
        return false;
    }
    
    // Configurar desde electronAPI
    function configurarDesdeElectronAPI() {
        if (apiInicializada) return;
        
        // Copiar todas las funciones de electronAPI a universalAPI
        for (const key in window.electronAPI) {
            if (typeof window.electronAPI[key] === 'function') {
                window.universalAPI[key] = window.electronAPI[key];
            }
        }
        
        // Reemplazar window.api con universalAPI
        window.api = window.universalAPI;
        
        notificarAPIDisponible();
    }
    
    // Configurar desde api
    function configurarDesdeAPI() {
        if (apiInicializada) return;
        
        // Copiar todas las funciones de api a universalAPI
        for (const key in window.api) {
            if (typeof window.api[key] === 'function') {
                window.universalAPI[key] = window.api[key];
            }
        }
        
        // Unificar APIs
        window.api = window.universalAPI;
        window.electronAPI = window.universalAPI;
        
        notificarAPIDisponible();
    }
    
    // Crear una API simulada para desarrollo/depuración
    function crearAPIMock() {
        if (apiInicializada) return;
        
        console.warn('[API-BRIDGE] Creando API simulada para desarrollo');
        
        // Funciones simuladas para desarrollo
        const funcionesSimuladas = {
            login: (email, password) => Promise.resolve({ success: true, user: { email, name: 'Usuario Simulado' } }),
            authSupervisor: (email, password) => Promise.resolve({ success: true, user: { email, name: 'Supervisor Simulado' } }),
            listarTerminales: () => Promise.resolve([{ marca: 'Samsung', modelo: 'A51', imei: '123456789', disponible: 10 }]),
            listTerminales: () => Promise.resolve([{ marca: 'Samsung', modelo: 'A51', imei: '123456789', disponible: 10 }]),
            agregarTerminal: () => Promise.resolve({ ok: true }),
            eliminarTerminal: () => Promise.resolve({ ok: true }),
            bulkAddTerminales: () => Promise.resolve({ ok: true }),
            listarAgentes: () => Promise.resolve([{ nombre: 'Agente Demo', correo: 'demo@example.com', usuario: 'demo' }]),
            listAgents: () => Promise.resolve([{ nombre: 'Agente Demo', correo: 'demo@example.com', usuario: 'demo' }]),
            agregarAgente: () => Promise.resolve({ exito: true, mensaje: 'Simulación: Agente guardado' }),
            addAgent: () => Promise.resolve({ exito: true, mensaje: 'Simulación: Agente guardado' }),
            eliminarAgente: () => Promise.resolve({ exito: true, mensaje: 'Simulación: Agente eliminado' }),
            removeAgent: () => Promise.resolve({ exito: true, mensaje: 'Simulación: Agente eliminado' }),
            obtenerAgentes: () => Promise.resolve([{ nombre: 'Agente Demo', correo: 'demo@example.com', usuario: 'demo' }]),
            generarPDFsim: () => Promise.resolve({ ok: true }),
            generateAndSendSIM: () => Promise.resolve({ ok: true }),
            listarNotas: () => Promise.resolve([{ id: 1, texto: 'Nota de demo', fecha: new Date().toISOString() }]),
            listNotas: () => Promise.resolve([{ id: 1, texto: 'Nota de demo', fecha: new Date().toISOString() }]),
            agregarNota: () => Promise.resolve({ ok: true }),
            addNota: () => Promise.resolve({ ok: true }),
            editarNota: () => Promise.resolve({ ok: true }),
            editNota: () => Promise.resolve({ ok: true }),
            eliminarNota: () => Promise.resolve({ ok: true }),
            removeNota: () => Promise.resolve({ ok: true }),
            listarHistorial: () => Promise.resolve([{ fecha: new Date().toISOString(), correo: 'demo@example.com', modelo: 'A51' }]),
            listHistorial: () => Promise.resolve([{ fecha: new Date().toISOString(), correo: 'demo@example.com', modelo: 'A51' }]),
            generarPDFHistorial: () => Promise.resolve({ ok: true }),
            historialPdf: () => Promise.resolve({ ok: true }),
            resetHistorial: () => Promise.resolve({ ok: true }),
            diagnostico: () => Promise.resolve({ ok: true }),
            guardarAgente: () => Promise.resolve({ exito: true, mensaje: 'Simulación: Agente guardado' })
        };
        
        // Asignar funciones simuladas
        for (const key in funcionesSimuladas) {
            window.universalAPI[key] = funcionesSimuladas[key];
        }
        
        // Unificar APIs
        window.api = window.universalAPI;
        window.electronAPI = window.universalAPI;
        
        console.warn('[API-BRIDGE] API simulada creada y asignada');
        notificarAPIDisponible('simulada');
    }
    
    // Notificar que la API está disponible
    function notificarAPIDisponible(tipo = 'real') {
        apiInicializada = true;
        console.log(`[API-BRIDGE] API ${tipo} inicializada correctamente`);
        
        // Disparar evento personalizado
        const evento = new CustomEvent('apiDisponible', { detail: { tipo } });
        document.dispatchEvent(evento);
        
        // Mostrar notificación visual
        mostrarNotificacion(`API ${tipo} inicializada`);
    }
    
    // Mostrar notificación visual
    function mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.textContent = mensaje;
        notificacion.style.position = 'fixed';
        notificacion.style.bottom = '10px';
        notificacion.style.left = '10px';
        notificacion.style.padding = '10px 20px';
        notificacion.style.borderRadius = '5px';
        notificacion.style.zIndex = '9999';
        notificacion.style.fontSize = '14px';
        
        // Aplicar estilo según el tipo
        switch(tipo) {
            case 'error':
                notificacion.style.backgroundColor = '#ff5252';
                notificacion.style.color = 'white';
                break;
            case 'success':
                notificacion.style.backgroundColor = '#4caf50';
                notificacion.style.color = 'white';
                break;
            default:
                notificacion.style.backgroundColor = '#2196f3';
                notificacion.style.color = 'white';
        }
        
        // Agregar al DOM
        document.body.appendChild(notificacion);
        
        // Eliminar después de la duración especificada
        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 500);
        }, duracion);
    }
    
    // Intentar detectar API inmediatamente
    if (!detectarAPI()) {
        // Si no se detecta, intentar periódicamente
        const intervalo = setInterval(() => {
            if (detectarAPI() || intentos >= MAXIMO_INTENTOS) {
                clearInterval(intervalo);
            }
        }, 500);
    }
});