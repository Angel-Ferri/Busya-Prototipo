// esFeriado(), resolverDiaDeServicio() y cargarHorariosDeHoy() viven en script/dias.js

// Muestra en el inicio qué planilla de horarios rige hoy
document.addEventListener("DOMContentLoaded", () => {
    const avisoDia = document.getElementById("aviso-dia");
    if (!avisoDia) return;

    const dia = resolverDiaDeServicio();
    avisoDia.textContent = `Mostrando horarios de: ${dia.etiqueta}`;
});

// Función que se ejecuta al seleccionar una línea
function seleccionarLinea(nombreArchivoJson) {
    // cargarHorariosDeHoy elige solo entre la planilla de semana, sábado o domingo
    cargarHorariosDeHoy(nombreArchivoJson)
        .then(data => {
            // Guardamos la información en el LocalStorage para usarla en la pantalla de paradas
            localStorage.setItem('lineaSeleccionada', JSON.stringify(data));
            // El mapa usa esta clave para preseleccionar la línea
            localStorage.setItem('archivoLineaSeleccionada', nombreArchivoJson);

            // Redirigimos a la pantalla donde se mostrarán las paradas y horarios de esa línea
            window.location.href = 'paradas.html';
        })
        .catch(error => {
            console.error('Error al obtener el recorrido:', error);
            alert('Hubo un problema al cargar los recorridos de esta línea.');
        });
}

function abrirModalEstudiante() {
    const modal = document.getElementById("modal-estudiante");
    const titulo = document.getElementById("modal-estudiante-titulo");
    const mensaje = document.getElementById("modal-estudiante-mensaje");

    let estadoEstudianteHoy = null;
    const jsonLocal = localStorage.getItem('lineaSeleccionada');

    // 1. Si hay una línea seleccionada, intentamos usar el estado guardado
    if (jsonLocal) {
        const dataCompleta = JSON.parse(jsonLocal);
        estadoEstudianteHoy = dataCompleta.estadoEstudianteHoy;
    }

    // 2. Si no hay línea seleccionada (ej: estás en index.html antes de elegir),
    // calculamos el estado en tiempo real para no tirar error.
    if (!estadoEstudianteHoy) {
        const dia = resolverDiaDeServicio();

        estadoEstudianteHoy = dia.estudianteActiva
            ? { activa: true, razon: "es un día de semana hábil" }
            : { activa: false, razon: dia.feriado ? "hoy es día feriado" : "es fin de semana" };
    }

    // 3. Renderizamos el cartel con total seguridad de que 'estadoEstudianteHoy' existe
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