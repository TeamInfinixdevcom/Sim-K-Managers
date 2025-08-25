// Función para mostrar mensaje personalizado después de autenticación
function mostrarMensajeAutenticacion(email) {
    if (email === 'msanabria@ice.go.cr') {
        alert('Bienvenida Supervisora Maria Jose Sanabria');
    } else if (email === 'emonadragon@ice.go.cr') {
        alert('Bienvenido Supervisor Esteban Mondragon');
    } else {
        alert(`Bienvenido ${email}`);
    }
}

// Ejemplo de uso después de autenticación exitosa:
// mostrarMensajeAutenticacion(email);