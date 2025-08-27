// Detector de cargas duplicadas
console.log('[DETECTOR] Inicializando detector de cargas duplicadas...');

// Almacenar información sobre los scripts
window._scriptsLoaded = window._scriptsLoaded || {};

// Función para registrar la carga de un script
function registerScriptLoad(scriptName) {
    window._scriptsLoaded[scriptName] = window._scriptsLoaded[scriptName] || {
        count: 0,
        loadTimes: []
    };
    
    window._scriptsLoaded[scriptName].count++;
    window._scriptsLoaded[scriptName].loadTimes.push(new Date().toISOString());
    
    console.log(`[DETECTOR] Script "${scriptName}" cargado ${window._scriptsLoaded[scriptName].count} veces`);
    
    if (window._scriptsLoaded[scriptName].count > 1) {
        console.warn(`[DETECTOR] ¡ADVERTENCIA! Script "${scriptName}" cargado múltiples veces`);
        
        // Registrar información en el DOM para depuración
        setTimeout(() => {
            const infoDiv = document.createElement('div');
            infoDiv.style.position = 'fixed';
            infoDiv.style.top = '0';
            infoDiv.style.left = '0';
            infoDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
            infoDiv.style.color = 'white';
            infoDiv.style.padding = '10px';
            infoDiv.style.zIndex = '9999';
            infoDiv.style.fontSize = '12px';
            infoDiv.style.maxWidth = '100%';
            infoDiv.style.maxHeight = '50vh';
            infoDiv.style.overflow = 'auto';
            
            infoDiv.innerHTML = `
                <h3>¡Error de carga duplicada!</h3>
                <p>El script "${scriptName}" se ha cargado ${window._scriptsLoaded[scriptName].count} veces</p>
                <p>Tiempos de carga:</p>
                <ul>
                    ${window._scriptsLoaded[scriptName].loadTimes.map(time => `<li>${time}</li>`).join('')}
                </ul>
                <button onclick="this.parentNode.style.display='none'">Cerrar</button>
            `;
            
            document.body.appendChild(infoDiv);
        }, 1000);
    }
}

// Registrar carga de este script
registerScriptLoad('duplicate-detector.js');

// Parchear document.createElement para detectar creación de scripts
const originalCreateElement = document.createElement;
document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'script') {
        // Interceptar la asignación de src
        const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
        Object.defineProperty(element, 'src', {
            set: function(value) {
                console.log(`[DETECTOR] Detectada carga de script: ${value}`);
                originalSrcDescriptor.set.call(this, value);
                
                // Extraer nombre del script de la URL
                const scriptName = value.split('/').pop();
                
                // Registrar la carga después de un tiempo
                setTimeout(() => {
                    registerScriptLoad(scriptName);
                }, 100);
            },
            get: function() {
                return originalSrcDescriptor.get.call(this);
            }
        });
    }
    
    return element;
};

// Parchear appendChild para detectar cuándo se añaden scripts al DOM
const originalAppendChild = Node.prototype.appendChild;
Node.prototype.appendChild = function(child) {
    if (child.nodeName === 'SCRIPT' && child.src) {
        console.log(`[DETECTOR] Script añadido al DOM: ${child.src}`);
    }
    return originalAppendChild.call(this, child);
};

// Exportar funciones útiles
window.scriptDetector = {
    getLoadedScripts: function() {
        return window._scriptsLoaded;
    },
    getDuplicatedScripts: function() {
        const duplicated = {};
        for (const scriptName in window._scriptsLoaded) {
            if (window._scriptsLoaded[scriptName].count > 1) {
                duplicated[scriptName] = window._scriptsLoaded[scriptName];
            }
        }
        return duplicated;
    }
};

console.log('[DETECTOR] Detector de cargas duplicadas inicializado correctamente');