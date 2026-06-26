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

// --- NUEVAS FUNCIONES PARA CONTROLAR EL MODAL ---

function abrirModalEstudiante() {
    const modal = document.getElementById("modal-estudiante");
    const titulo = document.getElementById("modal-estudiante-titulo");
    const mensaje = document.getElementById("modal-estudiante-mensaje");

    if (estadoEstudianteHoy.activa) {
        titulo.innerHTML = "Pase Estudiantil: <span style='color:#16a34a;'>ACTIVO</span>";
        mensaje.innerHTML = `¡Buenas noticias! Como <strong>${estadoEstudianteHoy.razon}</strong>, el beneficio para estudiantes funciona con normalidad.`;
    } else {
        titulo.innerHTML = "Pase Estudiantil: <span style='color:#dc2626;'>INACTIVO</span>";
        mensaje.innerHTML = `Atención: Como <strong>${estadoEstudianteHoy.razon}</strong>, la tarjeta estudiantil no corre y se te cobrará tarifa plana o normal.`;
    }

    modal.classList.remove("hidden");
}

// Cierra el modal si se hace clic fuera del recuadro blanco
function cerrarModalEstudiante(event) {
    if (event.target.id === "modal-estudiante") {
        document.getElementById("modal-estudiante").classList.add("hidden");
    }
}