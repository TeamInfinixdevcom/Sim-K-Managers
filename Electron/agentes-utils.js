// Utilidades para optimizar el manejo de agentes
const fs = require('fs');
const path = require('path');
// Archivo de agentes en la misma carpeta de este módulo
const AGENTS_FILE = path.join(__dirname, 'agents.json');

/**
 * Obtener lista de agentes desde JSON
 */
async function obtenerAgentes() {
  try {
    const datos = await fs.promises.readFile(AGENTS_FILE, 'utf-8');
    return JSON.parse(datos || '[]');
  } catch (err) {
    console.error('[AGENTES-UTILS] Error al leer agents.json:', err);
    return [];
  }
}

/**
 * Guardar o actualizar un agente
 */
async function guardarAgente(datos) {
  const agentes = await obtenerAgentes();
  const index = agentes.findIndex(a => a.correo === datos.correo);
  if (index >= 0) agentes[index] = datos; else agentes.push(datos);
  try {
    await fs.promises.writeFile(AGENTS_FILE, JSON.stringify(agentes, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('[AGENTES-UTILS] Error al guardar agente:', err);
    return { ok: false, error: err.message };
  }
}

/**
 * Eliminar agente por correo
 */
async function eliminarAgentePorCorreo(correo) {
  let agentes = await obtenerAgentes();
  const countAntes = agentes.length;
  agentes = agentes.filter(a => a.correo !== correo);
  if (agentes.length === countAntes) return { ok: false, error: 'Correo no encontrado' };
  try {
    await fs.promises.writeFile(AGENTS_FILE, JSON.stringify(agentes, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    console.error('[AGENTES-UTILS] Error al eliminar agente:', err);
    return { ok: false, error: err.message };
  }
}

module.exports = { obtenerAgentes, guardarAgente, eliminarAgentePorCorreo };