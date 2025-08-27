// Script para optimizar la interfaz de usuario de gestión de agentes
document.addEventListener('DOMContentLoaded', function() {
    console.log('[AGENTES-UI] Inicializando interfaz de agentes');
    
    // Referencias a elementos DOM con verificación de existencia
    const nombreInput = document.getElementById('nombre');
    const usuarioInput = document.getElementById('usuario2'); // Cambiado a usuario2
    const correoInput = document.getElementById('correo2'); // Cambiado a correo2
    const guardarBtn = document.getElementById('guardarAgente');
    const eliminarBtn = document.getElementById('eliminarAgente');
    const selectorAgente = document.getElementById('selectorAgente');
    
    // Verificar si los elementos existen antes de continuar
    if (!nombreInput || !correoInput || !guardarBtn) {
        console.warn('[AGENTES-UI] No se encontraron todos los elementos del formulario de agentes');
        return; // Salir si faltan elementos esenciales
    }
    
    console.log('[AGENTES-UI] Elementos del DOM encontrados correctamente');
    
    // Cargar agentes al iniciar
    cargarAgentes();
    
    // Aplicar debounce a las validaciones
    let validacionTimeout;
    
    // Event listeners con debounce para validación
    nombreInput.addEventListener('input', () => {
        clearTimeout(validacionTimeout);
        validacionTimeout = setTimeout(() => validarCampos(), 300);
    });
    
    if (usuarioInput) {
        usuarioInput.addEventListener('input', () => {
            clearTimeout(validacionTimeout);
            validacionTimeout = setTimeout(() => validarCampos(), 300);
        });
    }
    
    correoInput.addEventListener('input', () => {
        clearTimeout(validacionTimeout);
        validacionTimeout = setTimeout(() => validarCampos(), 300);
    });
    
    // Botón guardar
    guardarBtn.addEventListener('click', guardarAgente);
    
    // Botón eliminar
    if (eliminarBtn) {
        eliminarBtn.addEventListener('click', eliminarAgente);
    }
    
    // Función para validar campos (solo cuando se intenta guardar)
    function validarCampos() {
        // Verificar que los elementos existen
        if (!nombreInput || !correoInput || !guardarBtn) {
            console.warn('[AGENTES-UI] No se pueden validar campos: elementos no encontrados');
            return;
        }
        
        // No mostrar errores mientras el usuario escribe
        // Solo cambia estado del botón
        const nombre = nombreInput.value.trim();
        const correo = correoInput.value.trim();
        
        // Validación básica
        const nombreValido = nombre.length >= 3;
        const correoValido = correo.includes('@');
        
        // Actualizar estado del botón
        guardarBtn.disabled = !(nombreValido && correoValido);
        
        // Feedback visual adicional
        if (nombre) {
            nombreInput.classList.toggle('campo-invalido', !nombreValido);
            nombreInput.classList.toggle('campo-valido', nombreValido);
        } else {
            nombreInput.classList.remove('campo-invalido', 'campo-valido');
        }
        
        if (correo) {
            correoInput.classList.toggle('campo-invalido', !correoValido);
            correoInput.classList.toggle('campo-valido', correoValido);
        } else {
            correoInput.classList.remove('campo-invalido', 'campo-valido');
        }
    }
    
    // Función para guardar agente
    async function guardarAgente() {
        try {
            // Mostrar indicador de carga
            guardarBtn.disabled = true;
            const textoOriginal = guardarBtn.textContent;
            guardarBtn.textContent = 'Guardando...';
            
            // Recoger datos
            const datos = {
                nombre: nombreInput.value.trim(),
                usuario: usuarioInput ? usuarioInput.value.trim() : '',
                correo: correoInput.value.trim()
            };
            
            // Validar antes de enviar
            if (!datos.nombre) {
                mostrarNotificacion('error', 'El nombre es requerido');
                guardarBtn.disabled = false;
                guardarBtn.textContent = textoOriginal;
                return;
            }
            
            if (!datos.correo || !datos.correo.includes('@')) {
                mostrarNotificacion('error', 'El correo es inválido');
                guardarBtn.disabled = false;
                guardarBtn.textContent = textoOriginal;
                return;
            }
            
            console.log('[AGENTES-UI] Intentando guardar agente:', datos);
            
            // Guardar usando la API optimizada con fallback
            let resultado;
            
            if (window.api && typeof window.api.guardarAgente === 'function') {
                resultado = await window.api.guardarAgente(datos);
            } else if (window.api && typeof window.api.agregarAgente === 'function') {
                console.log('[AGENTES-UI] Usando agregarAgente como fallback');
                resultado = await window.api.agregarAgente(datos);
                // Adaptar resultado al formato esperado
                if (resultado && !resultado.hasOwnProperty('exito')) {
                    resultado = { 
                        exito: resultado.ok === true, 
                        mensaje: resultado.ok ? 'Agente guardado correctamente' : (resultado.error || 'Error al guardar') 
                    };
                }
            } else {
                throw new Error('No hay API disponible para guardar agentes');
            }
            
            if (resultado.exito) {
                mostrarNotificacion('success', resultado.mensaje);
                limpiarFormulario();
                cargarAgentes(); // Recargar lista
            } else {
                mostrarNotificacion('error', resultado.mensaje);
            }
            
            // Restaurar botón
            guardarBtn.disabled = false;
            guardarBtn.textContent = textoOriginal;
            
        } catch (error) {
            console.error('[AGENTES-UI] Error al guardar:', error);
            mostrarNotificacion('error', 'Error al procesar la solicitud');
            guardarBtn.disabled = false;
            guardarBtn.textContent = 'Guardar agente';
        }
    }
    
    // Función para eliminar agente
    async function eliminarAgente() {
        if (!eliminarBtn) return;
        
        try {
            const correo = correoInput.value.trim();
            
            if (!correo) {
                mostrarNotificacion('error', 'Seleccione un agente para eliminar');
                return;
            }
            
            if (confirm('¿Está seguro de eliminar este agente?')) {
                eliminarBtn.disabled = true;
                const textoOriginal = eliminarBtn.textContent;
                eliminarBtn.textContent = 'Eliminando...';
                
                console.log('[AGENTES-UI] Intentando eliminar agente:', correo);
                
                let resultado;
                // Intentar con diferentes APIs disponibles
                if (window.api && typeof window.api.eliminarAgente === 'function') {
                    resultado = await window.api.eliminarAgente(correo);
                } else if (window.api && typeof window.api.removeAgent === 'function') {
                    console.log('[AGENTES-UI] Usando removeAgent como fallback');
                    resultado = await window.api.removeAgent(correo);
                    // Adaptar resultado al formato esperado
                    if (resultado && !resultado.hasOwnProperty('exito')) {
                        resultado = { 
                            exito: resultado.ok === true, 
                            mensaje: resultado.ok ? 'Agente eliminado correctamente' : (resultado.error || 'Error al eliminar') 
                        };
                    }
                } else {
                    throw new Error('No hay API disponible para eliminar agentes');
                }
                
                if (resultado && resultado.exito) {
                    mostrarNotificacion('success', resultado.mensaje || 'Agente eliminado correctamente');
                    limpiarFormulario();
                    cargarAgentes(); // Recargar lista
                } else {
                    mostrarNotificacion('error', (resultado && resultado.mensaje) || 'No se pudo eliminar el agente');
                }
                
                eliminarBtn.disabled = false;
                eliminarBtn.textContent = textoOriginal;
            }
        } catch (error) {
            console.error('[AGENTES-UI] Error al eliminar:', error);
            mostrarNotificacion('error', 'Error al procesar la solicitud de eliminación');
            
            if (eliminarBtn) {
                eliminarBtn.disabled = false;
                eliminarBtn.textContent = 'Eliminar por correo';
            }
        }
    }
    
    // Función para cargar agentes
    async function cargarAgentes() {
        try {
            console.log('[AGENTES-UI] Intentando cargar agentes...');
            
            // Verificar que la API esté disponible
            if (!window.api || typeof window.api.obtenerAgentes !== 'function') {
                console.error('[AGENTES-UI] La API de agentes no está disponible');
                // Intentar fallback a otras funciones disponibles
                if (window.api && typeof window.api.listarAgentes === 'function') {
                    console.log('[AGENTES-UI] Usando listarAgentes como fallback');
                    return cargarAgentesLegacy();
                }
                return;
            }
            
            const agentes = await window.api.obtenerAgentes();
            console.log(`[AGENTES-UI] ${agentes.length} agentes cargados`);
            
            // Limpiar selector
            if (selectorAgente) {
                selectorAgente.innerHTML = '<option value="">— Seleccione —</option>';
                
                // Añadir agentes al selector
                agentes.forEach(agente => {
                    const option = document.createElement('option');
                    option.value = agente.correo;
                    option.textContent = agente.nombre;
                    option.dataset.usuario = agente.usuario;
                    option.dataset.correo = agente.correo;
                    selectorAgente.appendChild(option);
                });
                
                // Event listener para selector
                selectorAgente.addEventListener('change', () => {
                    const selectedOption = selectorAgente.options[selectorAgente.selectedIndex];
                    
                    if (selectedOption && selectedOption.value) {
                        nombreInput.value = selectedOption.textContent;
                        if (usuarioInput) {
                            usuarioInput.value = selectedOption.dataset.usuario || '';
                        }
                        correoInput.value = selectedOption.dataset.correo;
                        validarCampos();
                    } else {
                        limpiarFormulario();
                    }
                });
            }
        } catch (error) {
            console.error('[AGENTES-UI] Error al cargar agentes:', error);
            cargarAgentesLegacy(); // Intentar método legacy
        }
    }
    
    // Función de fallback para cargar agentes con API legacy
    async function cargarAgentesLegacy() {
        try {
            console.log('[AGENTES-UI] Intentando cargar agentes con API legacy...');
            let agentes = [];
            
            if (window.api && typeof window.api.listarAgentes === 'function') {
                agentes = await window.api.listarAgentes();
            } else if (window.electronAPI && typeof window.electronAPI.listarAgentes === 'function') {
                agentes = await window.electronAPI.listarAgentes();
            } else {
                console.error('[AGENTES-UI] No se encontró ninguna API para cargar agentes');
                return;
            }
            
            console.log(`[AGENTES-UI] ${agentes.length} agentes cargados mediante API legacy`);
            
            if (selectorAgente) {
                selectorAgente.innerHTML = '<option value="">— Seleccione —</option>';
                
                agentes.forEach(agente => {
                    const option = document.createElement('option');
                    option.value = agente.correo;
                    option.textContent = agente.nombre;
                    option.dataset.usuario = agente.usuario;
                    option.dataset.correo = agente.correo;
                    selectorAgente.appendChild(option);
                });
                
                selectorAgente.addEventListener('change', () => {
                    const selectedOption = selectorAgente.options[selectorAgente.selectedIndex];
                    
                    if (selectedOption && selectedOption.value) {
                        nombreInput.value = selectedOption.textContent;
                        if (usuarioInput) {
                            usuarioInput.value = selectedOption.dataset.usuario || '';
                        }
                        correoInput.value = selectedOption.dataset.correo;
                        validarCampos();
                    } else {
                        limpiarFormulario();
                    }
                });
            }
        } catch (error) {
            console.error('[AGENTES-UI] Error en método legacy:', error);
            mostrarNotificacion('error', 'No se pudieron cargar los agentes');
        }
    }
    
    // Función para limpiar formulario
    function limpiarFormulario() {
        if (nombreInput) {
            nombreInput.value = '';
            nombreInput.classList.remove('campo-invalido', 'campo-valido');
        }
        
        if (usuarioInput) {
            usuarioInput.value = '';
        }
        
        if (correoInput) {
            correoInput.value = '';
            correoInput.classList.remove('campo-invalido', 'campo-valido');
        }
        
        if (selectorAgente) {
            selectorAgente.selectedIndex = 0;
        }
        
        if (guardarBtn) {
            guardarBtn.disabled = true;
        }
        
        // Actualizar validación
        validarCampos();
        
        console.log('[AGENTES-UI] Formulario limpiado');
    }
    
    // Función para mostrar notificaciones
    function mostrarNotificacion(tipo, mensaje) {
        // Si existe un sistema de notificaciones, usarlo
        if (window.notificacion) {
            window.notificacion(tipo, mensaje);
            return;
        }
        
        // Caso contrario, crear una notificación simple
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.textContent = mensaje;
        
        document.body.appendChild(notificacion);
        
        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            notificacion.classList.add('fadeOut');
            setTimeout(() => {
                document.body.removeChild(notificacion);
            }, 500);
        }, 3000);
    }
});

// Estilos para notificaciones
const style = document.createElement('style');
style.textContent = `
.notificacion {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    z-index: 9999;
    opacity: 1;
    transition: opacity 0.5s;
}
.notificacion.success {
    background-color: #4CAF50;
}
.notificacion.error {
    background-color: #F44336;
}
.notificacion.fadeOut {
    opacity: 0;
}
`;
document.head.appendChild(style);

// REVISIÓN: Verifica cómo se carga agents.json y muestra los agentes
// 1. Asegúrate de que el archivo agents.json esté en la ubicación correcta y accesible desde la aplicación.
// 2. Verifica la consola del navegador para detectar errores de carga o de red relacionados con agents.json.
// 3. Si hay errores, corrígelos asegurándote de que la ruta al archivo sea correcta y de que el servidor esté configurado para servir archivos JSON.
// 4. Una vez resueltos los problemas de carga, los agentes deberían mostrarse correctamente en la interfaz.

// REVISIÓN: Eliminadas referencias a notas y notasContainer