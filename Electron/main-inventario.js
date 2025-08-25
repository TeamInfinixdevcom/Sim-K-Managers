const { ipcMain, BrowserWindow, app, dialog } = require('electron');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { Worker } = require('worker_threads');
const crypto = require('crypto');

// Rutas a los JSON junto al ejecutable
const AGENTS_PATH = path.join(__dirname, 'agents.json');
const TERMINALES_PATH = path.join(__dirname, 'terminales.json');
const KOLBI_LOGO_PATH = path.join(__dirname, 'kolbi.png');
const FIRMA_SUPERVISOR_PATH = path.join(__dirname, 'firmasupervisor.jpg');
const FIRMA_SUPERVISORA_PATH = path.join(__dirname, 'fima_supervisora.jpg');
const HISTORIAL_PATH = path.join(__dirname, 'historial_entregas.json');
const NOTAS_PATH = path.join(__dirname, 'notas.json');

// Sistema de caché con indexación para rendimiento extremo
const TURBOCACHE = {
    // Datos en memoria
    data: {
        terminales: null,
        agents: null,
        historial: null,
        notas: null,
        firmas: {},
        logos: {}
    },
    // Índices para búsquedas ultrarrápidas
    indexes: {
        terminales: {},
        agents: {},
        historial: {},
        notas: {}
    },
    // Control de frescura de datos
    meta: {
        timestamp: {
            terminales: 0,
            agents: 0,
            historial: 0,
            notas: 0
        },
        hashes: {
            terminales: '',
            agents: '',
            historial: '',
            notas: ''
        }
    },
    // Estadísticas para optimización
    stats: {
        hits: 0,
        misses: 0,
        reads: 0,
        writes: 0
    },
    // Tiempo de vida en caché (3 minutos)
    TTL: 180000
};

// -------- helpers JSON --------
function safeReadJsonSync(p, fallback) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch { return fallback; }
}

// Función de lectura JSON optimizada con caché
async function readJSON(p, fallback) {
    // Determinar qué tipo de archivo estamos leyendo
    let cacheKey = null;
    if (p === TERMINALES_PATH) cacheKey = 'terminales';
    else if (p === AGENTS_PATH) cacheKey = 'agents';
    else if (p === HISTORIAL_PATH) cacheKey = 'historial';
    else if (p === NOTAS_PATH) cacheKey = 'notas';
    
    // Si no tenemos un tipo reconocido, leer directamente
    if (!cacheKey) {
        try {
            return JSON.parse(await fsPromises.readFile(p, 'utf8'));
        } catch (err) {
            console.error(`[ERROR] Error leyendo ${p}:`, err);
            return fallback;
        }
    }
    
    // Verificar la caché
    const now = Date.now();
    if (TURBOCACHE.data[cacheKey] !== null) {
        const lastUpdate = TURBOCACHE.meta.timestamp[cacheKey] || 0;
        if (now - lastUpdate < TURBOCACHE.TTL) {
            TURBOCACHE.stats.hits++;
            console.log(`[CACHE HIT] Usando datos en caché para ${cacheKey} (${TURBOCACHE.stats.hits} hits, ${TURBOCACHE.stats.misses} misses)`);
            return TURBOCACHE.data[cacheKey];
        }
    }
    
    // Si no está en caché o expiró, leer del disco
    TURBOCACHE.stats.misses++;
    TURBOCACHE.stats.reads++;
    console.log(`[CACHE MISS] Leyendo ${p} del disco (${TURBOCACHE.stats.hits} hits, ${TURBOCACHE.stats.misses} misses)`);
    
    try {
        const startTime = Date.now();
        const data = JSON.parse(await fsPromises.readFile(p, 'utf8'));
        const endTime = Date.now();
        console.log(`[PERF] Lectura de ${p} tomó ${endTime - startTime}ms`);
        
        // Actualizar caché
        TURBOCACHE.data[cacheKey] = data;
        TURBOCACHE.meta.timestamp[cacheKey] = now;
        
        // Generar hash para detectar cambios
        const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
        TURBOCACHE.meta.hashes[cacheKey] = hash;
        
        // Construir índices para búsquedas rápidas
        updateCacheIndexes(cacheKey, data);
        
        return data;
    } catch (err) {
        console.error(`[ERROR] Error leyendo ${p}:`, err);
        return fallback;
    }
}

// Función para actualizar índices de caché
function updateCacheIndexes(cacheKey, data) {
    if (cacheKey === 'terminales') {
        TURBOCACHE.indexes.terminales = {};
        if (Array.isArray(data)) {
            data.forEach((t, idx) => {
                if (t.agencia && t.marca && t.terminal) {
                    const key = `${t.agencia}__${t.marca}__${t.terminal}`.toLowerCase();
                    TURBOCACHE.indexes.terminales[key] = idx;
                }
            });
        }
        console.log(`[INDEX] Creados ${Object.keys(TURBOCACHE.indexes.terminales).length} índices para terminales`);
    } 
    else if (cacheKey === 'agents') {
        TURBOCACHE.indexes.agents = {};
        if (data.agents && Array.isArray(data.agents)) {
            data.agents.forEach((a, idx) => {
                if (a.correo) {
                    TURBOCACHE.indexes.agents[a.correo.toLowerCase()] = idx;
                }
            });
        }
        console.log(`[INDEX] Creados ${Object.keys(TURBOCACHE.indexes.agents).length} índices para agentes`);
    } 
    else if (cacheKey === 'historial') {
        TURBOCACHE.indexes.historial = {};
        if (Array.isArray(data)) {
            data.forEach((h, idx) => {
                if (h.correo) {
                    if (!TURBOCACHE.indexes.historial[h.correo]) {
                        TURBOCACHE.indexes.historial[h.correo] = [];
                    }
                    TURBOCACHE.indexes.historial[h.correo].push(idx);
                }
                if (h.id) {
                    TURBOCACHE.indexes.historial[`id_${h.id}`] = idx;
                }
            });
        }
        console.log(`[INDEX] Creados índices para ${Object.keys(TURBOCACHE.indexes.historial).length} correos en historial`);
    }
    else if (cacheKey === 'notas') {
        TURBOCACHE.indexes.notas = {};
        if (Array.isArray(data)) {
            data.forEach((n, idx) => {
                if (n.id) {
                    TURBOCACHE.indexes.notas[n.id] = idx;
                }
            });
        }
        console.log(`[INDEX] Creados ${Object.keys(TURBOCACHE.indexes.notas).length} índices para notas`);
    }
}

// Función de escritura JSON optimizada
async function writeJSONAsync(p, data) {
    let cacheKey = null;
    if (p === TERMINALES_PATH) cacheKey = 'terminales';
    else if (p === AGENTS_PATH) cacheKey = 'agents';
    else if (p === HISTORIAL_PATH) cacheKey = 'historial';
    else if (p === NOTAS_PATH) cacheKey = 'notas';
    
    // Actualizar caché si es un tipo conocido
    if (cacheKey) {
        TURBOCACHE.data[cacheKey] = data;
        TURBOCACHE.meta.timestamp[cacheKey] = Date.now();
        updateCacheIndexes(cacheKey, data); // Actualizar índices
        
        // Actualizar hash
        const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
        TURBOCACHE.meta.hashes[cacheKey] = hash;
        
        TURBOCACHE.stats.writes++;
    }
    
    // Crear directorio si no existe
    await fsPromises.mkdir(path.dirname(p), { recursive: true });
    
    // Usar worker para archivos grandes para evitar bloqueo
    const isLargeFile = JSON.stringify(data).length > 300000;
    
    console.log(`[DISK WRITE] Guardando ${cacheKey || 'archivo'} (${JSON.stringify(data).length} bytes) ${isLargeFile ? 'con worker' : 'directamente'}`);
    
    if (isLargeFile) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const worker = new Worker(`
                const { parentPort, workerData } = require('worker_threads');
                const fs = require('fs');
                try {
                    fs.writeFileSync(workerData.p, JSON.stringify(workerData.data, null, 2), 'utf8');
                    parentPort.postMessage({ ok: true, time: Date.now() - workerData.startTime });
                } catch (err) {
                    parentPort.postMessage({ error: err.toString() });
                }
            `, { eval: true, workerData: { p, data, startTime } });
            
            worker.on('message', msg => {
                if (msg.ok) {
                    console.log(`[PERF] Escritura de ${p} tomó ${msg.time}ms (en worker)`);
                    resolve(true);
                } else {
                    reject(msg.error);
                }
            });
            worker.on('error', reject);
        });
    } else {
        // Para archivos pequeños, escribir directamente
        const startTime = Date.now();
        try {
            await fsPromises.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
            const endTime = Date.now();
            console.log(`[PERF] Escritura de ${p} tomó ${endTime - startTime}ms`);
            return true;
        } catch (err) {
            console.error(`[ERROR] Error escribiendo ${p}:`, err);
            throw err;
        }
    }
}

// Método para invalidar caché
ipcMain.handle('sistema:invalidarCache', async (_evt, tipo) => {
    if (tipo && TURBOCACHE.data[tipo]) {
        TURBOCACHE.data[tipo] = null;
        TURBOCACHE.meta.timestamp[tipo] = 0;
        TURBOCACHE.meta.hashes[tipo] = '';
        TURBOCACHE.indexes[tipo] = {};
        console.log(`[CACHE] Invalidada caché de ${tipo}`);
    } else {
        // Invalidar toda la caché
        for (const key in TURBOCACHE.data) {
            TURBOCACHE.data[key] = null;
            TURBOCACHE.meta.timestamp[key] = 0;
            TURBOCACHE.meta.hashes[key] = '';
            TURBOCACHE.indexes[key] = {};
        }
        console.log('[CACHE] Caché completamente invalidada');
    }
    return { ok: true };
});

// Método para precargar datos
ipcMain.handle('sistema:precargar', async () => {
    console.log('[SISTEMA] Precargando datos en segundo plano...');
    
    try {
        await Promise.all([
            readJSON(TERMINALES_PATH, []),
            readJSON(AGENTS_PATH, { defaultAgent: null, agents: [] }),
            readJSON(HISTORIAL_PATH, []),
            readJSON(NOTAS_PATH, [])
        ]);
        console.log('[SISTEMA] Datos precargados con éxito');
        return { ok: true, stats: TURBOCACHE.stats };
    } catch (err) {
        console.error('[SISTEMA] Error en precarga:', err);
        return { ok: false, error: String(err) };
    }
});

// Inicializar el monitor de caché
let cacheMonitor;
try {
    cacheMonitor = require('./cache-monitor');
    if (cacheMonitor && typeof cacheMonitor.iniciarMonitor === 'function') {
        cacheMonitor.iniciarMonitor(TURBOCACHE);
        console.log('[SISTEMA] Monitor de caché iniciado');
    } else {
        console.log('[SISTEMA] Monitor de caché no disponible o no tiene la función iniciarMonitor');
    }
} catch (err) {
    console.error('[SISTEMA] Error al inicializar monitor de caché:', err);
}

// Exponer funciones de monitor para preload (solo si no existe ya un manejador)
if (!ipcMain.listenerCount('sistema:monitorSnapshot')) {
    ipcMain.handle('sistema:monitorSnapshot', async () => {
        if (cacheMonitor && typeof cacheMonitor.tomarSnapshotAhora === 'function') {
            return cacheMonitor.tomarSnapshotAhora();
        } else {
            console.error('[SISTEMA] Función tomarSnapshotAhora no disponible');
            return { error: 'Monitor no disponible' };
        }
    });
}

// Método para obtener estadísticas de caché
ipcMain.handle('sistema:estadisticasCache', async () => {
    return {
        ok: true,
        stats: TURBOCACHE.stats,
        meta: TURBOCACHE.meta,
        sizes: {
            terminales: TURBOCACHE.data.terminales ? 
                JSON.stringify(TURBOCACHE.data.terminales).length : 0,
            agents: TURBOCACHE.data.agents ? 
                JSON.stringify(TURBOCACHE.data.agents).length : 0,
            historial: TURBOCACHE.data.historial ? 
                JSON.stringify(TURBOCACHE.data.historial).length : 0,
            notas: TURBOCACHE.data.notas ? 
                JSON.stringify(TURBOCACHE.data.notas).length : 0
        }
    };
});

// ===== Supervisor (optimizado) =====
ipcMain.handle('supervisor:auth', async (_evt, { email, password }) => {
    const ok = typeof email === 'string' && email.includes('@') && !!password;
    
    // Precargar datos en segundo plano si la autenticación fue exitosa
    if (ok) {
        console.log(`[AUTH] Usuario autenticado: ${email}`);
        
        // Iniciar precarga de datos asíncrona para mejorar la experiencia post-login
        setTimeout(() => {
            Promise.all([
                readJSON(TERMINALES_PATH, []),
                readJSON(AGENTS_PATH, { defaultAgent: null, agents: [] }),
                readJSON(HISTORIAL_PATH, []),
                readJSON(NOTAS_PATH, [])
            ]).then(() => {
                console.log('[AUTH] Precarga de datos completada después de inicio de sesión');
            }).catch(err => {
                console.error('[AUTH] Error en precarga post-login:', err);
            });
            
            // Precargar logos y firmas
            try {
                if (fs.existsSync(KOLBI_LOGO_PATH)) {
                    TURBOCACHE.data.logos['kolbi'] = fs.readFileSync(KOLBI_LOGO_PATH).toString('base64');
                    console.log('[CACHE] Logo Kolbi precargado en caché');
                }
                
                if (fs.existsSync(FIRMA_SUPERVISOR_PATH)) {
                    TURBOCACHE.data.firmas['default'] = fs.readFileSync(FIRMA_SUPERVISOR_PATH).toString('base64');
                    console.log('[CACHE] Firma supervisor predeterminada precargada en caché');
                }
                
                if (fs.existsSync(FIRMA_SUPERVISORA_PATH)) {
                    TURBOCACHE.data.firmas['msanabria'] = fs.readFileSync(FIRMA_SUPERVISORA_PATH).toString('base64');
                    console.log('[CACHE] Firma supervisora MSanabria precargada en caché');
                }
            } catch (err) {
                console.error('[CACHE] Error precargando imágenes:', err);
            }
        }, 500); // Ligero retraso para no bloquear la respuesta de login
    }
    
    return { ok, email, ts: Date.now() };
});

// ===== Agentes =====
ipcMain.handle('agents:list', async () => {
    const cfg = await readJSON(AGENTS_PATH, { defaultAgent: null, agents: [] });
    const list = [];
    if (cfg.defaultAgent) list.push(cfg.defaultAgent);
    if (Array.isArray(cfg.agents)) list.push(...cfg.agents);
    return list;
});

ipcMain.handle('agents:add', async (_evt, agent) => {
    if (!agent?.correo) return { ok: false, error: 'Correo requerido' };
    const cfg = await readJSON(AGENTS_PATH, { defaultAgent: null, agents: [] });
    cfg.agents = Array.isArray(cfg.agents) ? cfg.agents : [];
    const i = cfg.agents.findIndex(a => a.correo === agent.correo);
    if (i >= 0) cfg.agents[i] = { ...cfg.agents[i], ...agent };
    else cfg.agents.push(agent);
    await writeJSONAsync(AGENTS_PATH, cfg);
    return { ok: true };
});

ipcMain.handle('agents:remove', async (_evt, correo) => {
    const cfg = await readJSON(AGENTS_PATH, { defaultAgent: null, agents: [] });
    cfg.agents = (cfg.agents || []).filter(a => a.correo !== correo);
    if (cfg.defaultAgent?.correo === correo) cfg.defaultAgent = null;
    await writeJSONAsync(AGENTS_PATH, cfg);
    return { ok: true };
});

// ===== Terminales (optimizado) =====
ipcMain.handle('terminales:list', async () => {
    console.log('[TERMINALES] Solicitando lista de terminales...');
    try {
        const startTime = Date.now();
        const terminales = await readJSON(TERMINALES_PATH, []);
        const endTime = Date.now();
        console.log(`[TERMINALES] ${terminales.length} terminales cargadas correctamente en ${endTime - startTime}ms`);
        return terminales;
    } catch (err) {
        console.error('[TERMINALES] Error al leer terminales:', err);
        return [];
    }
});

ipcMain.handle('terminales:add', async (_e, t) => {
    console.log(`[TERMINALES] Añadiendo terminal: ${t.marca} ${t.terminal} para ${t.agencia}`);
    try {
        const list = await readJSON(TERMINALES_PATH, []);
        const key = `${t.agencia}__${t.marca}__${t.terminal}`.toLowerCase();
        
        // Usar índice si está disponible
        let idx = -1;
        if (TURBOCACHE.indexes.terminales && TURBOCACHE.indexes.terminales[key] !== undefined) {
            idx = TURBOCACHE.indexes.terminales[key];
            console.log(`[TERMINALES] Terminal encontrada usando índice: ${idx}`);
        } else {
            idx = list.findIndex(x => `${x.agencia}__${x.marca}__${x.terminal}`.toLowerCase() === key);
            console.log(`[TERMINALES] Terminal encontrada usando búsqueda: ${idx}`);
        }
        
        if (idx >= 0) {
            console.log(`[TERMINALES] Actualizando terminal existente en índice ${idx}`);
            list[idx] = { ...list[idx], ...t, disponible: Number(t.disponible) || 0 };
        } else {
            console.log('[TERMINALES] Agregando nueva terminal');
            list.push({ ...t, disponible: Number(t.disponible) || 0 });
        }
        
        await writeJSONAsync(TERMINALES_PATH, list);
        console.log('[TERMINALES] Terminal guardada correctamente');
        return { ok: true };
    } catch (err) {
        console.error('[TERMINALES] Error al añadir terminal:', err);
        return { ok: false, error: String(err) };
    }
});

ipcMain.handle('terminales:remove', async (_e, t) => {
    console.log(`[TERMINALES] Eliminando terminal: ${t.marca} ${t.terminal} para ${t.agencia}`);
    try {
        const list = await readJSON(TERMINALES_PATH, []);
        const key = `${t.agencia}__${t.marca}__${t.terminal}`.toLowerCase();
        
        // Usar índice si está disponible
        let idx = -1;
        if (TURBOCACHE.indexes.terminales && TURBOCACHE.indexes.terminales[key] !== undefined) {
            idx = TURBOCACHE.indexes.terminales[key];
            console.log(`[TERMINALES] Terminal encontrada para eliminar usando índice: ${idx}`);
            
            // Si encontramos usando el índice, eliminar directamente
            if (idx >= 0) {
                list.splice(idx, 1);
                await writeJSONAsync(TERMINALES_PATH, list);
                console.log(`[TERMINALES] Terminal eliminada. Quedan ${list.length} terminales`);
                return { ok: true };
            }
        }
        
        // Si no hay índice o no se encontró, usar método tradicional
        const initialCount = list.length;
        const out = list.filter(x => `${x.agencia}__${x.marca}__${x.terminal}`.toLowerCase() !== key);
        
        if (out.length === initialCount) {
            console.log('[TERMINALES] No se encontró la terminal para eliminar');
            return { ok: false, error: 'Terminal no encontrada' };
        }
        
        await writeJSONAsync(TERMINALES_PATH, out);
        console.log(`[TERMINALES] Terminal eliminada. Quedan ${out.length} terminales`);
        return { ok: true };
    } catch (err) {
        console.error('[TERMINALES] Error al eliminar terminal:', err);
        return { ok: false, error: String(err) };
    }
});

ipcMain.handle('terminales:bulkAdd', async (_e, bulk) => {
    if (!Array.isArray(bulk)) {
        console.error('[TERMINALES] Formato inválido para carga masiva');
        return { ok: false, error: 'Formato inválido' };
    }
    
    console.log(`[TERMINALES] Procesando carga masiva de ${bulk.length} terminales...`);
    try {
        const startTime = Date.now();
        
        // Normalizar datos
        const norm = bulk.map(t => ({ ...t, disponible: Number(t.disponible) || 0 }));
        
        // Verificar datos para prevenir problemas
        let validos = 0;
        let incompletos = 0;
        for (const terminal of norm) {
            if (!terminal.marca || !terminal.terminal || !terminal.agencia) {
                console.warn('[TERMINALES] Terminal con datos incompletos:', terminal);
                incompletos++;
            } else {
                validos++;
            }
        }
        
        console.log(`[TERMINALES] Estadísticas: ${validos} terminales válidas, ${incompletos} incompletas`);
        
        // Estrategia de guardado según tamaño
        if (norm.length > 5000) {
            // Para archivos muy grandes, usar enfoque por lotes
            console.log('[TERMINALES] Usando estrategia de carga por lotes para mejorar rendimiento');
            const BATCH_SIZE = 2000;
            let processed = 0;
            let terminales = [];
            
            // Obtener los terminales existentes para el primer lote
            if (TURBOCACHE.data.terminales) {
                terminales = [...TURBOCACHE.data.terminales];
                console.log(`[TERMINALES] Usando ${terminales.length} terminales de caché como base`);
            } else {
                terminales = [];
                console.log('[TERMINALES] Iniciando con lista vacía');
            }
            
            // Guardar en lotes
            for (let i = 0; i < norm.length; i += BATCH_SIZE) {
                const batch = norm.slice(i, Math.min(i + BATCH_SIZE, norm.length));
                if (i === 0) {
                    // Primer lote
                    terminales = batch;
                } else {
                    terminales.push(...batch);
                }
                processed += batch.length;
                console.log(`[TERMINALES] Procesado lote ${Math.floor(i/BATCH_SIZE) + 1}: ${processed}/${norm.length}`);
            }
            
            // Guardar el resultado final
            await writeJSONAsync(TERMINALES_PATH, terminales);
        } else {
            // Para archivos más pequeños, guardar directamente
            await writeJSONAsync(TERMINALES_PATH, norm);
        }
        
        const endTime = Date.now();
        console.log(`[TERMINALES] Carga masiva completada: ${norm.length} terminales guardadas en ${endTime - startTime}ms`);
        return { ok: true, count: norm.length, tiempoMs: endTime - startTime };
    } catch (err) {
        console.error('[TERMINALES] Error en carga masiva:', err);
        return { ok: false, error: String(err) };
    }
});

// ===== Notas del supervisor =====
ipcMain.handle('notas:list', async () => {
    return await readJSON(NOTAS_PATH, []);
});
ipcMain.handle('notas:add', async (_e, nota) => {
    const notas = await readJSON(NOTAS_PATH, []);
    nota.id = Date.now().toString();
    notas.push(nota);
    await writeJSONAsync(NOTAS_PATH, notas);
    return { ok: true, id: nota.id };
});
ipcMain.handle('notas:edit', async (_e, nota) => {
    const notas = await readJSON(NOTAS_PATH, []);
    const idx = notas.findIndex(n => n.id === nota.id);
    if (idx >= 0) notas[idx] = nota;
    await writeJSONAsync(NOTAS_PATH, notas);
    return { ok: idx >= 0 };
});
ipcMain.handle('notas:remove', async (_e, id) => {
    const notas = await readJSON(NOTAS_PATH, []);
    const out = notas.filter(n => n.id !== id);
    await writeJSONAsync(NOTAS_PATH, out);
    return { ok: true };
});

// ===== SIM -> Generar PDF y guardar historial (optimizado) =====
ipcMain.handle('sims:generateSend', async (_evt, payload) => {
    try {
        console.log(`[SIM PDF] Generando PDF para usuario: ${payload.usuario}, correo: ${payload.correo}`);
        
        // Obtener el path de la firma según el correo del SUPERVISOR
        const { supervisorCorreo } = payload;
        console.log(`[SIM PDF] Correo del supervisor: ${supervisorCorreo}`);
        
        // Precargar historial en segundo plano mientras se genera el PDF
        setTimeout(() => {
            readJSON(HISTORIAL_PATH, []).catch(err => 
                console.error('[PRECARGA] Error en historial:', err)
            );
        }, 100);
        
        const firmaPath = getFirmaPath(supervisorCorreo);
        console.log(`[SIM PDF] Usando firma: ${firmaPath}`);
        
        // Usar firma de caché si está disponible
        let firmaSupervisorBase64 = null;
        if (supervisorCorreo && supervisorCorreo.toLowerCase() === "msanabria@ice.go.cr" && 
            TURBOCACHE.data.firmas['msanabria']) {
            firmaSupervisorBase64 = TURBOCACHE.data.firmas['msanabria'];
            console.log('[SIM PDF] Usando firma MSanabria desde caché');
        } else if (TURBOCACHE.data.firmas['default']) {
            firmaSupervisorBase64 = TURBOCACHE.data.firmas['default'];
            console.log('[SIM PDF] Usando firma predeterminada desde caché');
        }
        
        // Si no está en caché, cargar desde disco
        if (!firmaSupervisorBase64 && fs.existsSync(firmaPath)) {
            firmaSupervisorBase64 = fs.readFileSync(firmaPath).toString('base64');
            
            // Guardar en caché para próximos usos
            if (supervisorCorreo && supervisorCorreo.toLowerCase() === "msanabria@ice.go.cr") {
                TURBOCACHE.data.firmas['msanabria'] = firmaSupervisorBase64;
            } else {
                TURBOCACHE.data.firmas['default'] = firmaSupervisorBase64;
            }
        }
        
        // Usar logo de caché si está disponible
        let logoKolbiBase64 = null;
        if (TURBOCACHE.data.logos['kolbi']) {
            logoKolbiBase64 = TURBOCACHE.data.logos['kolbi'];
            console.log('[SIM PDF] Usando logo Kolbi desde caché');
        } else if (fs.existsSync(KOLBI_LOGO_PATH)) {
            logoKolbiBase64 = fs.readFileSync(KOLBI_LOGO_PATH).toString('base64');
            TURBOCACHE.data.logos['kolbi'] = logoKolbiBase64;
        }
        
        // Pasar firmaPath a buildSIMHtmlKolbi con optimizaciones
        const startTime = Date.now();
        const html = await buildOptimizedSIMHtmlKolbi({ 
            ...payload, 
            logoBase64: logoKolbiBase64,
            firmaBase64: firmaSupervisorBase64
        });
        
        // Crear ventana offscreen para mejor rendimiento
        const pdfWin = new BrowserWindow({ 
            show: false,
            webPreferences: {
                offscreen: true // Usar modo offscreen para mejor rendimiento
            }
        });
        
        await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

        const pdfBuffer = await pdfWin.webContents.printToPDF({
            marginsType: 1, 
            printBackground: true, 
            landscape: false, 
            pageSize: 'A4'
        });

        // Mostrar cuadro de diálogo para elegir ubicación
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Guardar PDF de SIM Kolbi',
            defaultPath: `SIM-Kolbi-${(payload.usuario || 'usuario')}-${(payload.fecha || 'fecha')}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
        });

        pdfWin.destroy();

        if (canceled || !filePath) {
            return { ok: false, error: 'Guardado cancelado por el usuario.' };
        }

        // Escribir archivo sin bloquear UI
        await new Promise((resolve, reject) => {
            fs.writeFile(filePath, pdfBuffer, err => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Agregar al historial en segundo plano
        agregarHistorialEntregaAsync({
            agente: payload.agente,
            usuario: payload.usuario,
            correo: payload.correo,
            fecha: payload.fecha,
            hora: new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            contenido: payload.contenido,
            pdf: filePath
        }).catch(err => console.error('[HISTORIAL] Error al guardar entrada:', err));

        const endTime = Date.now();
        console.log(`[PERF] Generación de PDF completada en ${endTime - startTime}ms`);
        return { ok: true, path: filePath, sent: false, tiempoMs: endTime - startTime };
    } catch (err) {
        console.error('[SIM PDF] Error al generar PDF:', err);
        return { ok: false, error: String(err) };
    }
});

// ===== Historial de entregas (optimizado) =====
async function agregarHistorialEntregaAsync(entrega) {
    try {
        const historial = await readJSON(HISTORIAL_PATH, []);
        const nuevaEntrada = { ...entrega, id: Date.now().toString() };
        historial.push(nuevaEntrada);
        await writeJSONAsync(HISTORIAL_PATH, historial);
        console.log(`[HISTORIAL] Entrada agregada para ${entrega.correo}`);
        return true;
    } catch (err) {
        console.error('[HISTORIAL] Error al agregar entrada:', err);
        throw err;
    }
}

// Función para resetear el historial de entregas
async function resetearHistorialAsync() {
    try {
        console.log('[HISTORIAL] Reseteando historial de entregas...');
        // Guardar un array vacío en el archivo de historial
        await writeJSONAsync(HISTORIAL_PATH, []);
        console.log('[HISTORIAL] Historial reseteado correctamente');
        return { ok: true };
    } catch (err) {
        console.error('[HISTORIAL] Error al resetear historial:', err);
        return { ok: false, error: String(err) };
    }
}

// Manejador para resetear historial
ipcMain.handle('historial:reset', async () => {
    console.log('[HISTORIAL] Solicitud de reseteo de historial recibida');
    return await resetearHistorialAsync();
});

// Filtrar historial por correo (optimizado con índices)
ipcMain.handle('historial:list', async (_e, filtroCorreo) => {
    console.log(`[HISTORIAL] Solicitando historial ${filtroCorreo ? `para ${filtroCorreo}` : 'completo'}`);
    const startTime = Date.now();
    
    try {
        const historial = await readJSON(HISTORIAL_PATH, []);
        
        if (filtroCorreo) {
            // Usar índices si están disponibles para búsqueda ultrarrápida
            if (TURBOCACHE.indexes.historial && TURBOCACHE.indexes.historial[filtroCorreo]) {
                const indices = TURBOCACHE.indexes.historial[filtroCorreo];
                const resultado = indices.map(idx => historial[idx]).filter(Boolean);
                
                const endTime = Date.now();
                console.log(`[HISTORIAL] Filtrado por índice: ${resultado.length} entradas en ${endTime - startTime}ms`);
                return resultado;
            }
            
            // Búsqueda convencional si no hay índice
            const resultado = historial.filter(h => h.correo === filtroCorreo);
            const endTime = Date.now();
            console.log(`[HISTORIAL] Filtrado manual: ${resultado.length} entradas en ${endTime - startTime}ms`);
            return resultado;
        }
        
        const endTime = Date.now();
        console.log(`[HISTORIAL] Lista completa: ${historial.length} entradas en ${endTime - startTime}ms`);
        return historial;
    } catch (err) {
        console.error('[HISTORIAL] Error al listar historial:', err);
        return [];
    }
});

// ===== Generar PDF de historial por correo (optimizado) =====
ipcMain.handle('historial:pdf', async (_e, correo) => {
    try {
        console.log(`[HISTORIAL PDF] Generando PDF para correo: ${correo}`);
        const startTime = Date.now();
        
        const historial = await readJSON(HISTORIAL_PATH, []);
        
        // Usar índices si están disponibles
        let entregas;
        if (TURBOCACHE.indexes.historial && TURBOCACHE.indexes.historial[correo]) {
            entregas = TURBOCACHE.indexes.historial[correo]
                .map(idx => historial[idx])
                .filter(Boolean);
            console.log(`[HISTORIAL PDF] Usando índice: ${entregas.length} entradas`);
        } else {
            entregas = historial.filter(h => h.correo === correo);
            console.log(`[HISTORIAL PDF] Filtrado manual: ${entregas.length} entradas`);
        }

        // Usar logo de caché si está disponible
        let logoKolbiBase64 = null;
        if (TURBOCACHE.data.logos['kolbi']) {
            logoKolbiBase64 = TURBOCACHE.data.logos['kolbi'];
            console.log('[HISTORIAL PDF] Usando logo Kolbi desde caché');
        } else if (fs.existsSync(KOLBI_LOGO_PATH)) {
            logoKolbiBase64 = fs.readFileSync(KOLBI_LOGO_PATH).toString('base64');
            TURBOCACHE.data.logos['kolbi'] = logoKolbiBase64;
        }

        const html = await buildOptimizedHistorialPdfHtmlKolbi(correo, entregas, logoKolbiBase64);

        // Usar BrowserWindow en modo offscreen para mejor rendimiento
        const pdfWin = new BrowserWindow({ 
            show: false,
            webPreferences: {
                offscreen: true
            }
        });
        await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

        const pdfBuffer = await pdfWin.webContents.printToPDF({
            marginsType: 1, printBackground: true, landscape: false, pageSize: 'A4'
        });

        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Guardar PDF de historial',
            defaultPath: `Historial-Entregas-${correo}.pdf`,
            filters: [{ name: 'PDF', extensions: ['pdf'] }]
        });

        pdfWin.destroy();

        if (canceled || !filePath) {
            return { ok: false, error: 'Guardado cancelado por el usuario.' };
        }

        // Escribir archivo sin bloquear
        await new Promise((resolve, reject) => {
            fs.writeFile(filePath, pdfBuffer, err => {
                if (err) reject(err);
                else resolve();
            });
        });

        const endTime = Date.now();
        console.log(`[PERF] Generación de PDF de historial completada en ${endTime - startTime}ms`);
        return { ok: true, path: filePath, tiempoMs: endTime - startTime };
    } catch (err) {
        console.error('[HISTORIAL PDF] Error al generar PDF:', err);
        return { ok: false, error: String(err) };
    }
});

// ===== HTML para PDF Kolbi (optimizado) =====
async function buildOptimizedSIMHtmlKolbi({ agente, usuario, correo, fecha, contenido, logoBase64, firmaBase64 }) {
    const hora = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logoHtml = logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Kolbi" />` : '';
    const firmaHtml = firmaBase64 ? `<img class="firma-img" src="data:image/jpeg;base64,${firmaBase64}" alt="firma" />` : '';
    
    return `<!doctype html>
<html lang="es"><meta charset="utf-8"><title>Entrega de SIMs Físicas Kolbi</title>
<style>
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: #43b02a;
    color: #fff;
}
.header-kolbi {
    display: flex;
    align-items: center;
    gap: 18px;
    background: #43b02a;
    padding: 32px 32px 12px 32px;
}
.header-kolbi img {
    height: 70px;
}
.header-kolbi .title {
    font-size: 2rem;
    font-weight: bold;
    color: #fff;
}
.eslogan {
    font-size: 1.1em;
    color: #0c59cc;
    font-weight: bold;
    margin-left: 120px;
    margin-top: -18px;
    margin-bottom: 18px;
}
.leyenda {
    background: rgba(255,255,255,0.13);
    color: #fff;
    font-size: 1.15em;
    padding: 18px 32px 10px 32px;
    border-radius: 12px;
    margin: 0 32px 18px 32px;
}
.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0 32px;
}
.box {
    background: rgba(255,255,255,0.18);
    color: #fff;
    border-radius: 8px;
    padding: 12px;
    font-size: 1em;
    border: none;
}
pre {
    white-space: pre-wrap;
    background: rgba(255,255,255,0.10);
    color: #fff;
    border-radius: 8px;
    padding: 12px;
    margin: 0 32px 0 32px;
    font-size: 1em;
}
.sign {
    margin-top: 32px;
    margin-left: 32px;
}
.line {
    color: #fff;
    margin-top: 8px;
    margin-bottom: 4px;
}
.firma-img {
    height: 60px;
    margin-bottom: 6px;
}
.footer {
    margin-top: 48px;
    text-align: center;
    color: #0c59cc;
    font-size: 1.2em;
    font-weight: bold;
}
</style>
<body>
    <div class="header-kolbi">
        ${logoHtml}
        <div class="title">Entrega de SIMs Físicas Kolbi</div>
    </div>
    <div class="eslogan">#somos de los mismos</div>
    <div class="leyenda">
        Se hace constar que el supervisor <b>${esc(agente)}</b> entrega las siguientes SIMs físicas el <b>${esc(fecha)}</b> a las <b>${hora}</b>.
    </div>
    <div class="grid">
        <div class="box"><b>Agente:</b> ${esc(agente)}</div>
        <div class="box"><b>Usuario:</b> ${esc(usuario)}</div>
        <div class="box"><b>Correo:</b> ${esc(correo)}</div>
        <div class="box"><b>Fecha:</b> ${esc(fecha)}</div>
    </div>
    <pre>${esc(contenido)}</pre>
    <div class="sign">
        ${firmaHtml}
        <div class="line">______________________________</div>
        <div>Firma del supervisor</div>
    </div>
    <div class="footer">#somos de los mismos</div>
</body>
</html>`;
}

// ===== HTML para PDF de historial por correo (optimizado) =====
async function buildOptimizedHistorialPdfHtmlKolbi(correo, entregas, logoBase64) {
    const logoHtml = logoBase64 ? `<img src="data:image/png;base64,${logoBase64}" alt="Kolbi" />` : '';
    return `<!doctype html>
<html lang="es"><meta charset="utf-8"><title>Historial de Entregas Kolbi</title>
<style>
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: #43b02a;
    color: #fff;
}
.header-kolbi {
    display: flex;
    align-items: center;
    gap: 18px;
    background: #43b02a;
    padding: 32px 32px 12px 32px;
}
.header-kolbi img {
    height: 70px;
}
.header-kolbi .title {
    font-size: 2rem;
    font-weight: bold;
    color: #fff;
}
.eslogan {
    font-size: 1.1em;
    color: #0c59cc;
    font-weight: bold;
    margin-left: 120px;
    margin-top: -18px;
    margin-bottom: 18px;
}
.historial-table {
    width: 90%;
    margin: 0 auto;
    border-collapse: collapse;
    background: rgba(255,255,255,0.10);
    color: #fff;
    border-radius: 12px;
    overflow: hidden;
}
.historial-table th, .historial-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #fff;
    font-size: 1em;
}
.historial-table th {
    background: rgba(255,255,255,0.18);
    color: #fff;
}
.footer {
    margin-top: 48px;
    text-align: center;
    color: #0c59cc;
    font-size: 1.2em;
    font-weight: bold;
}
</style>
<body>
    <div class="header-kolbi">
        ${logoHtml}
        <div class="title">Historial de Entregas Kolbi</div>
    </div>
    <div class="eslogan">#somos de los mismos</div>
    <h2 style="text-align:center;">Correo: ${esc(correo)}</h2>
    <table class="historial-table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Usuario</th>
                <th>Agente</th>
                <th>SIMs Entregadas</th>
            </tr>
        </thead>
        <tbody>
            ${entregas.map(e => `
                <tr>
                    <td>${esc(e.fecha)}</td>
                    <td>${esc(e.hora)}</td>
                    <td>${esc(e.usuario)}</td>
                    <td>${esc(e.agente)}</td>
                    <td><pre style="background:none;color:#fff;">${esc(e.contenido)}</pre></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="footer">#somos de los mismos</div>
</body>
</html>`;
}

// Versiones originales mantenidas por compatibilidad
async function buildSIMHtmlKolbi({ agente, usuario, correo, fecha, contenido, firmaPath }) {
    // Usar versión optimizada si está disponible
    if (typeof buildOptimizedSIMHtmlKolbi === 'function') {
        // Cargar imágenes
        let logoBase64 = null;
        let firmaBase64 = null;
        
        try {
            if (fs.existsSync(KOLBI_LOGO_PATH)) {
                logoBase64 = fs.readFileSync(KOLBI_LOGO_PATH).toString('base64');
            }
            
            if (fs.existsSync(firmaPath)) {
                firmaBase64 = fs.readFileSync(firmaPath).toString('base64');
            }
        } catch (err) {
            console.error('[FALLBACK] Error cargando imágenes, usando método clásico:', err);
        }
        
        if (logoBase64 || firmaBase64) {
            return buildOptimizedSIMHtmlKolbi({
                agente, usuario, correo, fecha, contenido, 
                logoBase64, firmaBase64
            });
        }
    }
    
    // Fallback al método original
    const logoKolbi = fs.existsSync(KOLBI_LOGO_PATH)
        ? 'data:image/png;base64,' + fs.readFileSync(KOLBI_LOGO_PATH).toString('base64')
        : '';
    const firmaSupervisor = fs.existsSync(firmaPath)
        ? 'data:image/jpeg;base64,' + fs.readFileSync(firmaPath).toString('base64')
        : '';
    const hora = new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `<!doctype html>
<html lang="es"><meta charset="utf-8"><title>Entrega de SIMs Físicas Kolbi</title>
<style>
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: #43b02a;
    color: #fff;
}
.header-kolbi {
    display: flex;
    align-items: center;
    gap: 18px;
    background: #43b02a;
    padding: 32px 32px 12px 32px;
}
.header-kolbi img {
    height: 70px;
}
.header-kolbi .title {
    font-size: 2rem;
    font-weight: bold;
    color: #fff;
}
.eslogan {
    font-size: 1.1em;
    color: #0c59cc;
    font-weight: bold;
    margin-left: 120px;
    margin-top: -18px;
    margin-bottom: 18px;
}
.leyenda {
    background: rgba(255,255,255,0.13);
    color: #fff;
    font-size: 1.15em;
    padding: 18px 32px 10px 32px;
    border-radius: 12px;
    margin: 0 32px 18px 32px;
}
.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin: 0 32px;
}
.box {
    background: rgba(255,255,255,0.18);
    color: #fff;
    border-radius: 8px;
    padding: 12px;
    font-size: 1em;
    border: none;
}
pre {
    white-space: pre-wrap;
    background: rgba(255,255,255,0.10);
    color: #fff;
    border-radius: 8px;
    padding: 12px;
    margin: 0 32px 0 32px;
    font-size: 1em;
}
.sign {
    margin-top: 32px;
    margin-left: 32px;
}
.line {
    color: #fff;
    margin-top: 8px;
    margin-bottom: 4px;
}
.firma-img {
    height: 60px;
    margin-bottom: 6px;
}
.footer {
    margin-top: 48px;
    text-align: center;
    color: #0c59cc;
    font-size: 1.2em;
    font-weight: bold;
}
</style>
<body>
    <div class="header-kolbi">
        ${logoKolbi ? `<img src="${logoKolbi}" alt="Kolbi" />` : ''}
        <div class="title">Entrega de SIMs Físicas Kolbi</div>
    </div>
    <div class="eslogan">#somos de los mismos</div>
    <div class="leyenda">
        Se hace constar que el supervisor <b>${esc(agente)}</b> entrega las siguientes SIMs físicas el <b>${esc(fecha)}</b> a las <b>${hora}</b>.
    </div>
    <div class="grid">
        <div class="box"><b>Agente:</b> ${esc(agente)}</div>
        <div class="box"><b>Usuario:</b> ${esc(usuario)}</div>
        <div class="box"><b>Correo:</b> ${esc(correo)}</div>
        <div class="box"><b>Fecha:</b> ${esc(fecha)}</div>
    </div>
    <pre>${esc(contenido)}</pre>
    <div class="sign">
        ${firmaSupervisor ? `<img class="firma-img" src="${firmaSupervisor}" alt="firma" />` : ''}
        <div class="line">______________________________</div>
        <div>Firma del supervisor</div>
    </div>
    <div class="footer">#somos de los mismos</div>
</body>
</html>`;
}

// Versión original de buildHistorialPdfHtmlKolbi mantenida por compatibilidad
async function buildHistorialPdfHtmlKolbi(correo, entregas) {
    // Usar versión optimizada si está disponible
    if (typeof buildOptimizedHistorialPdfHtmlKolbi === 'function') {
        // Cargar logo
        let logoBase64 = null;
        try {
            if (fs.existsSync(KOLBI_LOGO_PATH)) {
                logoBase64 = fs.readFileSync(KOLBI_LOGO_PATH).toString('base64');
                return buildOptimizedHistorialPdfHtmlKolbi(correo, entregas, logoBase64);
            }
        } catch (err) {
            console.error('[FALLBACK] Error cargando logo, usando método clásico:', err);
        }
    }
    
    // Fallback al método original
    const logoKolbi = fs.existsSync(KOLBI_LOGO_PATH)
        ? 'data:image/png;base64,' + fs.readFileSync(KOLBI_LOGO_PATH).toString('base64')
        : '';
    return `<!doctype html>
<html lang="es"><meta charset="utf-8"><title>Historial de Entregas Kolbi</title>
<style>
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: #43b02a;
    color: #fff;
}
.header-kolbi {
    display: flex;
    align-items: center;
    gap: 18px;
    background: #43b02a;
    padding: 32px 32px 12px 32px;
}
.header-kolbi img {
    height: 70px;
}
.header-kolbi .title {
    font-size: 2rem;
    font-weight: bold;
    color: #fff;
}
.eslogan {
    font-size: 1.1em;
    color: #0c59cc;
    font-weight: bold;
    margin-left: 120px;
    margin-top: -18px;
    margin-bottom: 18px;
}
.historial-table {
    width: 90%;
    margin: 0 auto;
    border-collapse: collapse;
    background: rgba(255,255,255,0.10);
    color: #fff;
    border-radius: 12px;
    overflow: hidden;
}
.historial-table th, .historial-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #fff;
    font-size: 1em;
}
.historial-table th {
    background: rgba(255,255,255,0.18);
    color: #fff;
}
.footer {
    margin-top: 48px;
    text-align: center;
    color: #0c59cc;
    font-size: 1.2em;
    font-weight: bold;
}
</style>
<body>
    <div class="header-kolbi">
        ${logoKolbi ? `<img src="${logoKolbi}" alt="Kolbi" />` : ''}
        <div class="title">Historial de Entregas Kolbi</div>
    </div>
    <div class="eslogan">#somos de los mismos</div>
    <h2 style="text-align:center;">Correo: ${esc(correo)}</h2>
    <table class="historial-table">
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Usuario</th>
                <th>Agente</th>
                <th>SIMs Entregadas</th>
            </tr>
        </thead>
        <tbody>
            ${entregas.map(e => `
                <tr>
                    <td>${esc(e.fecha)}</td>
                    <td>${esc(e.hora)}</td>
                    <td>${esc(e.usuario)}</td>
                    <td>${esc(e.agente)}</td>
                    <td><pre style="background:none;color:#fff;">${esc(e.contenido)}</pre></td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    <div class="footer">#somos de los mismos</div>
</body>
</html>`;
}

function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ 
        '&': '&amp;', 
        '<': '&lt;', 
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function getFirmaPath(correo) {
    console.log(`[FIRMA] Seleccionando firma para correo: ${correo}`);
    
    if (!correo || typeof correo !== 'string') {
        console.warn('[FIRMA] Correo no válido, usando firma por defecto');
        return FIRMA_SUPERVISOR_PATH;
    }
    
    if (correo.toLowerCase() === "msanabria@ice.go.cr") {
        console.log('[FIRMA] Usando firma de supervisora (MSanabria)');
        const firmaPath = FIRMA_SUPERVISORA_PATH;
        
        // Verificar que el archivo exista
        if (!fs.existsSync(firmaPath)) {
            console.warn(`[FIRMA] ¡Archivo de firma no encontrado en: ${firmaPath}!`);
            return FIRMA_SUPERVISOR_PATH; // Usar firma por defecto si no existe
        }
        
        return firmaPath;
    } else if (correo.toLowerCase() === "emondragon@ice.go.cr") {
        console.log('[FIRMA] Usando firma de supervisor (EMondragon)');
        return FIRMA_SUPERVISOR_PATH;
    } else {
        console.log(`[FIRMA] Usando firma por defecto para: ${correo}`);
        return FIRMA_SUPERVISOR_PATH; // Firma por defecto
    }
}

// Registrar todos los manejadores IPC
function registrarManejadoresIPC() {
    // Evitar registros duplicados
    if (process.env._IPC_HANDLERS_REGISTERED === 'true') {
        console.log('[SISTEMA] Los manejadores IPC ya fueron registrados, omitiendo...');
        return;
    }
    
    console.log('[SISTEMA] Registrando manejadores IPC...');
    
    // Sistema y caché
    ipcMain.handle('sistema:estadisticasCache', async () => {
        try {
            if (!TURBOCACHE || !TURBOCACHE.stats) {
                console.error('[SISTEMA] TURBOCACHE no inicializado en sistema:estadisticasCache');
                return {
                    ok: false,
                    error: 'TURBOCACHE no inicializado',
                    stats: { hits: 0, misses: 0, reads: 0, writes: 0 },
                    meta: { timestamp: { terminales: null, agents: null, historial: null, notas: null } },
                    sizes: { terminales: 0, agents: 0, historial: 0, notas: 0 }
                };
            }
            
            return {
                ok: true,
                stats: TURBOCACHE.stats || { hits: 0, misses: 0, reads: 0, writes: 0 },
                meta: TURBOCACHE.meta || { timestamp: {} },
                sizes: {
                    terminales: TURBOCACHE.data && TURBOCACHE.data.terminales ? 
                        JSON.stringify(TURBOCACHE.data.terminales).length : 0,
                    agents: TURBOCACHE.data && TURBOCACHE.data.agents ? 
                        JSON.stringify(TURBOCACHE.data.agents).length : 0,
                    historial: TURBOCACHE.data && TURBOCACHE.data.historial ? 
                        JSON.stringify(TURBOCACHE.data.historial).length : 0,
                    notas: TURBOCACHE.data && TURBOCACHE.data.notas ? 
                        JSON.stringify(TURBOCACHE.data.notas).length : 0
                }
            };
        } catch (err) {
            console.error('[SISTEMA] Error en sistema:estadisticasCache:', err);
            return {
                ok: false,
                error: String(err),
                stats: { hits: 0, misses: 0, reads: 0, writes: 0 },
                meta: { timestamp: {} },
                sizes: { terminales: 0, agents: 0, historial: 0, notas: 0 }
            };
        }
    });
    
    ipcMain.handle('sistema:invalidarCache', async (event, tipo) => {
        try {
            if (!TURBOCACHE) {
                console.error('[SISTEMA] TURBOCACHE no inicializado en sistema:invalidarCache');
                return { ok: false, error: 'TURBOCACHE no inicializado' };
            }
            
            if (tipo) {
                TURBOCACHE.invalidar(tipo);
                return { ok: true, message: `Caché de ${tipo} invalidada` };
            } else {
                TURBOCACHE.invalidarTodo();
                return { ok: true, message: 'Toda la caché invalidada' };
            }
        } catch (err) {
            console.error('[SISTEMA] Error en sistema:invalidarCache:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    ipcMain.handle('sistema:precargar', async () => {
        try {
            if (!precargarDatos) {
                console.error('[SISTEMA] Función precargarDatos no disponible');
                return { ok: false, error: 'Función precargarDatos no disponible' };
            }
            
            await precargarDatos();
            return { ok: true, stats: TURBOCACHE ? TURBOCACHE.stats : null };
        } catch (err) {
            console.error('[SISTEMA] Error en sistema:precargar:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    // Terminales
    ipcMain.handle('terminales:list', async () => {
        try {
            if (!obtenerTerminales) {
                console.error('[SISTEMA] Función obtenerTerminales no disponible');
                return [];
            }
            return await obtenerTerminales();
        } catch (err) {
            console.error('[SISTEMA] Error en terminales:list:', err);
            return [];
        }
    });
    
    ipcMain.handle('terminales:add', async (event, terminal) => {
        try {
            if (!agregarTerminal) {
                console.error('[SISTEMA] Función agregarTerminal no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await agregarTerminal(terminal);
        } catch (err) {
            console.error('[SISTEMA] Error en terminales:add:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    ipcMain.handle('terminales:remove', async (event, terminal) => {
        try {
            if (!eliminarTerminal) {
                console.error('[SISTEMA] Función eliminarTerminal no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await eliminarTerminal(terminal);
        } catch (err) {
            console.error('[SISTEMA] Error en terminales:remove:', err);
            return { ok: false, error: String(err) };
        }
    });
    
        // Verificar si ya existe un manejador para terminales:bulkAdd
    // Asegurar que solo existe un manejador para terminales:bulkAdd
    const existingBulkAddHandler = ipcMain.listenerCount('terminales:bulkAdd');
    console.log(`[TERMINALES] Manejadores existentes para terminales:bulkAdd: ${existingBulkAddHandler}`);
    
    // Eliminar manejador si ya existe (para evitar duplicados)
    if (ipcMain._events && ipcMain._events['terminales:bulkAdd']) {
        console.log('[TERMINALES] Eliminando manejadores existentes para terminales:bulkAdd');
        delete ipcMain._events['terminales:bulkAdd'];
    }
    
    // Registrar manejador correcto
    ipcMain.handle('terminales:bulkAdd', async (event, datos) => {
        console.log(`[TERMINALES] Recibida solicitud de carga masiva con ${datos?.length || 0} terminales`);
        try {
            if (!Array.isArray(datos) || datos.length === 0) {
                console.error('[SISTEMA] Datos inválidos para terminales:bulkAdd');
                return { ok: false, error: 'Datos inválidos para carga masiva' };
            }
            
            // Llamar directamente a la implementación original
            const startTime = Date.now();
            
            // Normalizar datos
            const norm = datos.map(t => ({ ...t, disponible: Number(t.disponible) || 0 }));
            
            // Verificar datos para prevenir problemas
            let validos = 0;
            let incompletos = 0;
            for (const terminal of norm) {
                if (!terminal.marca || !terminal.terminal || !terminal.agencia) {
                    console.warn('[TERMINALES] Terminal con datos incompletos:', terminal);
                    incompletos++;
                } else {
                    validos++;
                }
            }
            
            console.log(`[TERMINALES] Estadísticas: ${validos} terminales válidas, ${incompletos} incompletas`);
            
            // Para archivos pequeños, guardar directamente
            await writeJSONAsync(TERMINALES_PATH, norm);
            
            const endTime = Date.now();
            console.log(`[TERMINALES] Carga masiva completada: ${norm.length} terminales guardadas en ${endTime - startTime}ms`);
            return { ok: true, count: norm.length, tiempoMs: endTime - startTime };
        } catch (err) {
            console.error('[SISTEMA] Error en terminales:bulkAdd:', err);
            return { ok: false, error: String(err) };
        }
    });
    console.log('[TERMINALES] Manejador terminales:bulkAdd registrado correctamente');
    
    // Agentes
    ipcMain.handle('agents:list', async () => {
        try {
            if (!obtenerAgentes) {
                console.error('[SISTEMA] Función obtenerAgentes no disponible');
                return [];
            }
            return await obtenerAgentes();
        } catch (err) {
            console.error('[SISTEMA] Error en agents:list:', err);
            return [];
        }
    });
    
    ipcMain.handle('agents:add', async (event, agente) => {
        try {
            if (!agregarAgente) {
                console.error('[SISTEMA] Función agregarAgente no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await agregarAgente(agente);
        } catch (err) {
            console.error('[SISTEMA] Error en agents:add:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    ipcMain.handle('agents:remove', async (event, correo) => {
        try {
            if (!eliminarAgente) {
                console.error('[SISTEMA] Función eliminarAgente no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await eliminarAgente(correo);
        } catch (err) {
            console.error('[SISTEMA] Error en agents:remove:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    // Notas
    ipcMain.handle('notas:list', async () => {
        try {
            if (!obtenerNotas) {
                console.error('[SISTEMA] Función obtenerNotas no disponible');
                return [];
            }
            return await obtenerNotas();
        } catch (err) {
            console.error('[SISTEMA] Error en notas:list:', err);
            return [];
        }
    });
    
    ipcMain.handle('notas:add', async (event, nota) => {
        try {
            if (!agregarNota) {
                console.error('[SISTEMA] Función agregarNota no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await agregarNota(nota);
        } catch (err) {
            console.error('[SISTEMA] Error en notas:add:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    ipcMain.handle('notas:edit', async (event, nota) => {
        try {
            if (!editarNota) {
                console.error('[SISTEMA] Función editarNota no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await editarNota(nota);
        } catch (err) {
            console.error('[SISTEMA] Error en notas:edit:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    ipcMain.handle('notas:remove', async (event, id) => {
        try {
            if (!eliminarNota) {
                console.error('[SISTEMA] Función eliminarNota no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await eliminarNota(id);
        } catch (err) {
            console.error('[SISTEMA] Error en notas:remove:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    // Historial
    ipcMain.handle('historial:list', async (event, correo) => {
        try {
            if (!obtenerHistorial) {
                console.error('[SISTEMA] Función obtenerHistorial no disponible');
                return [];
            }
            return await obtenerHistorial(correo);
        } catch (err) {
            console.error('[SISTEMA] Error en historial:list:', err);
            return [];
        }
    });
    
    ipcMain.handle('historial:pdf', async (event, correo) => {
        try {
            if (!generarPDFHistorial) {
                console.error('[SISTEMA] Función generarPDFHistorial no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await generarPDFHistorial(correo);
        } catch (err) {
            console.error('[SISTEMA] Error en historial:pdf:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    ipcMain.handle('historial:reset', async () => {
        console.log('[SISTEMA] Manejador historial:reset llamado desde registro general');
        return await resetearHistorialAsync();
    });
    
    // Supervisor
    ipcMain.handle('supervisor:auth', async (event, credenciales) => {
        try {
            if (!autenticarSupervisor) {
                console.error('[SISTEMA] Función autenticarSupervisor no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await autenticarSupervisor(credenciales);
        } catch (err) {
            console.error('[SISTEMA] Error en supervisor:auth:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    // SIMs
    ipcMain.handle('sims:generateSend', async (event, datos) => {
        try {
            if (!generarEnvioPDF) {
                console.error('[SISTEMA] Función generarEnvioPDF no disponible');
                return { ok: false, error: 'Función no disponible' };
            }
            return await generarEnvioPDF(datos);
        } catch (err) {
            console.error('[SISTEMA] Error en sims:generateSend:', err);
            return { ok: false, error: String(err) };
        }
    });
    
    // Marcar que los manejadores ya han sido registrados
    process.env._IPC_HANDLERS_REGISTERED = 'true';
    console.log('[SISTEMA] Manejadores IPC registrados correctamente');
    
    console.log('[SISTEMA] Manejadores IPC registrados');
}

// Registrar manejadores solo si no se indica lo contrario
if (!process.env.NO_AUTO_REGISTER) {
    registrarManejadoresIPC();
}

// Exportar la función para que pueda ser llamada desde main.js
module.exports.registrarManejadoresIPC = registrarManejadoresIPC;

// La generación de PDF ya está implementada en sims:generateSend
// que utiliza la función getFirmaPath para seleccionar la firma adecuada

// Exportar variables y funciones para uso en cli-tools.js
module.exports = {
    TURBOCACHE,
    readJSON,
    writeJSONAsync,
    TERMINALES_PATH,
    AGENTS_PATH,
    HISTORIAL_PATH,
    NOTAS_PATH
};