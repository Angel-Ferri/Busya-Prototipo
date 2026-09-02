// script/app.js

async function seleccionarLinea(idONombreArchivo) {
    try {
        // Normaliza el ID por si se pasa "linea_e_horarios.json" o simplemente "linea_e"
        let idLinea = idONombreArchivo.replace('_horarios.json', '').replace('.json', '');

        // Usamos la función cargadora definida en script/dias.js
        const datosCompletos = await cargarDatosLineaCompleta(idLinea);

        // Guardamos todo el objeto unificado en localStorage
        localStorage.setItem('lineaSeleccionadaData', JSON.stringify(datosCompletos));

        // Redirigimos a la vista de paradas / frecuencias
        window.location.href = 'paradas.html';
    } catch (error) {
        console.error("Error al cargar la línea:", error);
        alert("Ocurrió un error al cargar la información de la línea seleccionada.");
    }
}

// Lógica para el modal del Pase Estudiantil en el Inicio
function abrirModalEstudiante() {
    const estado = resolverDiaDeServicio();
    const modal = document.getElementById('modal-estudiante');
    const titulo = document.getElementById('modal-estudiante-titulo');
    const mensaje = document.getElementById('modal-estudiante-mensaje');

    if (!modal) return;

    if (estado.estudianteActiva) {
        titulo.textContent = "Pase Estudiantil Activo 🎓";
        mensaje.textContent = `Hoy (${estado.etiqueta}) el boleto estudiantil se encuentra habilitado en el horario habitual.`;
    } else {
        titulo.textContent = "Pase Estudiantil Inactivo ⚠️";
        mensaje.textContent = `Hoy (${estado.etiqueta}) no rige el pase estudiantil debido a que ${
            estado.feriado ? 'es un día feriado' : 'es fin de semana'
        }.`;
    }

    modal.classList.remove('hidden');
}

function cerrarModalEstudiante(e) {
    if (e.target.id === 'modal-estudiante') {
        document.getElementById('modal-estudiante').classList.add('hidden');
    }
}