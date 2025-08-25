# SIM KManager - Herramientas de Rendimiento

Este proyecto ha sido optimizado con un sistema de caché avanzado (TURBOCACHE) para mejorar significativamente el rendimiento y la fluidez de la aplicación.

## Características principales de las optimizaciones

- **Sistema de caché con indexación**: Acceso ultrarrápido a datos frecuentemente usados
- **Búsquedas indexadas**: Operaciones O(1) en lugar de búsquedas lineales
- **Procesamiento asíncrono**: Evita bloqueos de UI durante operaciones pesadas
- **Workers para archivos grandes**: Escritura y lectura sin bloquear el hilo principal
- **Precarga inteligente**: Anticipa necesidades de datos para mejorar experiencia

## Cómo usar las herramientas de caché desde PowerShell

Se ha incluido un script de PowerShell para facilitar la gestión de la caché desde la línea de comandos.

### Instrucciones

1. Abre PowerShell en el directorio raíz del proyecto
2. Ejecuta los comandos usando el script `cache-tools.ps1`

### Comandos disponibles

```powershell
# Mostrar ayuda
.\cache-tools.ps1 help

# Ver estadísticas de caché
.\cache-tools.ps1 stats

# Limpiar toda la caché
.\cache-tools.ps1 clear-all

# Limpiar solo caché de terminales
.\cache-tools.ps1 clear-terminales

# Limpiar solo caché de agentes
.\cache-tools.ps1 clear-agents

# Limpiar solo caché de historial
.\cache-tools.ps1 clear-historial

# Limpiar solo caché de notas
.\cache-tools.ps1 clear-notas

# Precargar datos en caché
.\cache-tools.ps1 preload
```

## Cómo usar las herramientas desde la consola del navegador

También puedes acceder a estas funciones desde la consola del navegador cuando la aplicación está en ejecución.

1. Abre las herramientas de desarrollador (F12 o Ctrl+Shift+I)
2. Ve a la pestaña "Console"
3. Ejecuta los siguientes comandos:

```javascript
// Ver estadísticas de caché
mostrarEstadisticasCache()

// Limpiar toda la caché
limpiarCache()

// Limpiar solo un tipo específico
limpiarCache('terminales')
limpiarCache('agents')
limpiarCache('historial')
limpiarCache('notas')
```

## Monitoreo de rendimiento

La aplicación incluye un sistema de monitoreo que registra el uso de recursos y rendimiento en un archivo de log. Puedes encontrar este archivo en:

```
./Electron/sistema_monitor.log
```

## Indicador visual de caché

Cuando la aplicación está utilizando datos desde la caché, verás un pequeño indicador "TURBO" en la esquina inferior derecha de la aplicación que aparecerá brevemente.

## Optimizaciones adicionales

- **BrowserWindow en modo offscreen**: Mejora el rendimiento al generar PDFs
- **Base64 caching**: Reduce lectura de imágenes desde disco
- **Procesamiento por lotes**: Manejo eficiente de grandes volúmenes de datos
- **Precarga automática post-login**: Mejor experiencia después de iniciar sesión

---

Para cualquier problema o pregunta, consulta la documentación o contacta al equipo de desarrollo.