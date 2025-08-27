// Utilidad de diagnóstico para el sistema de agentes
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Ruta al archivo de agentes
const agentesPath = path.join(__dirname, 'agents.json');

// Función para verificar la integridad del archivo agents.json
async function verificarIntegridadAgentes() {
    console.log('Iniciando diagnóstico del sistema de agentes...');
    
    try {
        // Verificar existencia del archivo
        if (!fs.existsSync(agentesPath)) {
            console.log('⚠️ El archivo agents.json no existe. Se creará al guardar el primer agente.');
            return { 
                status: 'warning',
                message: 'El archivo agents.json no existe'
            };
        }
        
        // Medir tiempo de lectura
        const inicioLectura = performance.now();
        const datos = await fs.promises.readFile(agentesPath, 'utf8');
        const tiempoLectura = performance.now() - inicioLectura;
        
        // Verificar si es JSON válido
        let agentes;
        try {
            const inicioParser = performance.now();
            agentes = JSON.parse(datos);
            const tiempoParser = performance.now() - inicioParser;
            
            console.log(`✅ JSON válido. Tiempo de lectura: ${tiempoLectura.toFixed(2)}ms, Parseo: ${tiempoParser.toFixed(2)}ms`);
            
            if (!Array.isArray(agentes)) {
                console.log('⚠️ El archivo agents.json no contiene un array.');
                return {
                    status: 'error',
                    message: 'Formato incorrecto: no es un array'
                };
            }
            
            // Verificar estructura de cada agente
            const agentesInvalidos = agentes.filter(a => !a || !a.correo || !a.nombre);
            
            if (agentesInvalidos.length > 0) {
                console.log(`⚠️ Se encontraron ${agentesInvalidos.length} agentes con estructura inválida.`);
                return {
                    status: 'warning',
                    message: `${agentesInvalidos.length} agentes tienen estructura inválida`
                };
            }
            
            // Verificar correos duplicados
            const correos = {};
            const duplicados = [];
            
            agentes.forEach(agente => {
                if (correos[agente.correo]) {
                    duplicados.push(agente.correo);
                } else {
                    correos[agente.correo] = true;
                }
            });
            
            if (duplicados.length > 0) {
                console.log(`⚠️ Se encontraron ${duplicados.length} correos duplicados.`);
                return {
                    status: 'warning',
                    message: `${duplicados.length} correos duplicados detectados`
                };
            }
            
            // Medir rendimiento de búsqueda
            const inicioRenderizado = performance.now();
            // Simulamos una búsqueda de agentes
            agentes.filter(a => a.nombre && a.nombre.includes('a'));
            const tiempoBusqueda = performance.now() - inicioRenderizado;
            
            console.log(`✅ Rendimiento de búsqueda: ${tiempoBusqueda.toFixed(2)}ms`);
            
            return {
                status: 'success',
                message: `Sistema de agentes OK. ${agentes.length} agentes cargados.`,
                rendimiento: {
                    lectura: tiempoLectura,
                    parseo: tiempoParser,
                    busqueda: tiempoBusqueda
                }
            };
            
        } catch (parseError) {
            console.log('❌ JSON inválido:', parseError.message);
            return {
                status: 'error',
                message: 'JSON inválido: ' + parseError.message
            };
        }
    } catch (error) {
        console.log('❌ Error en diagnóstico:', error.message);
        return {
            status: 'error',
            message: 'Error en diagnóstico: ' + error.message
        };
    }
}

// Función para reparar problemas comunes
async function repararProblemasAgentes() {
    try {
        if (!fs.existsSync(agentesPath)) {
            await fs.promises.writeFile(agentesPath, '[]');
            console.log('✅ Archivo agents.json creado correctamente.');
            return { status: 'success', message: 'Archivo agents.json creado' };
        }
        
        const datos = await fs.promises.readFile(agentesPath, 'utf8');
        let agentes;
        
        try {
            agentes = JSON.parse(datos);
        } catch (error) {
            // Archivo corrupto, crear nuevo
            await fs.promises.writeFile(agentesPath, '[]');
            console.log('✅ Archivo agents.json reparado (estaba corrupto).');
            return { status: 'success', message: 'Archivo agents.json reparado (corrupto)' };
        }
        
        if (!Array.isArray(agentes)) {
            // Formato incorrecto, crear array vacío
            await fs.promises.writeFile(agentesPath, '[]');
            console.log('✅ Archivo agents.json reparado (formato incorrecto).');
            return { status: 'success', message: 'Archivo agents.json reparado (formato)' };
        }
        
        // Filtrar agentes inválidos
        const agentesValidos = agentes.filter(a => a && a.correo && a.nombre);
        
        // Eliminar duplicados
        const agentesUnicos = [];
        const correosVistos = {};
        
        agentesValidos.forEach(agente => {
            if (!correosVistos[agente.correo]) {
                correosVistos[agente.correo] = true;
                agentesUnicos.push(agente);
            }
        });
        
        // Si hubo cambios, guardar
        if (agentesUnicos.length !== agentes.length) {
            await fs.promises.writeFile(
                agentesPath, 
                JSON.stringify(agentesUnicos, null, 2)
            );
            console.log(`✅ Archivo agents.json reparado. ${agentesUnicos.length} agentes válidos.`);
            return { 
                status: 'success', 
                message: `Archivo reparado. ${agentesUnicos.length} agentes válidos` 
            };
        }
        
        console.log('✅ El archivo agents.json no necesita reparación.');
        return { status: 'success', message: 'No se requieren reparaciones' };
        
    } catch (error) {
        console.log('❌ Error al reparar:', error.message);
        return { status: 'error', message: 'Error al reparar: ' + error.message };
    }
}

// Exportar funciones para uso en el sistema
module.exports = {
    verificarIntegridadAgentes,
    repararProblemasAgentes
};

// Si se ejecuta directamente desde línea de comandos
if (require.main === module) {
    verificarIntegridadAgentes()
        .then(resultado => {
            console.log('Resultado diagnóstico:', resultado);
            
            if (resultado.status === 'error' || resultado.status === 'warning') {
                console.log('Intentando reparar problemas...');
                return repararProblemasAgentes();
            }
            
            return { status: 'success', message: 'No se requieren reparaciones' };
        })
        .then(resultado => {
            console.log('Resultado reparación:', resultado);
            process.exit(resultado.status === 'success' ? 0 : 1);
        })
        .catch(error => {
            console.error('Error fatal:', error);
            process.exit(1);
        });
}