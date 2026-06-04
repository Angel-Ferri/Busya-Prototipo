// Función que se ejecuta al seleccionar una línea
function seleccionarLinea(nombreArchivoJson) {
    // Ruta exacta a tu carpeta de datos
    const rutaData = `data/recorridos_originales/${nombreArchivoJson}`;

    console.log(`Cargando datos desde: ${rutaData}`);

    // Usamos fetch nativo para leer el JSON
    fetch(rutaData)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo: ${nombreArchivoJson}`);
            }
            return response.json();
        })
        .then(data => {
            // Guardamos la información en el LocalStorage para usarla en la pantalla de paradas
            localStorage.setItem('lineaSeleccionada', JSON.stringify(data));
            
            // Redirigimos a la pantalla donde se mostrarán las paradas y horarios de esa línea
            // Nota: Asegúrate de crear este archivo html (ej: paradas.html) posteriormente.
            window.location.href = 'paradas.html'; 
        })
        .catch(error => {
            console.error('Error al obtener el recorrido:', error);
            alert('Hubo un problema al cargar los recorridos de esta línea.');
        });
}