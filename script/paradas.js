let datosLinea = null;
let nombreLineaId = ""; // Guardará el identificador para contar vueltas individualmente
let temporizadorCartel = null; // Controlador global para el temporizador de los 5 segundos

// esFeriado() y resolverDiaDeServicio() viven en script/dias.js

document.addEventListener("DOMContentLoaded", () => {
    const jsonLocal = localStorage.getItem('lineaSeleccionada');

    if (!jsonLocal) {
        alert("No se seleccionó ninguna línea. Volviendo al inicio.");
        volverAlInicio();
        return;
    }

    const dataCompleta = JSON.parse(jsonLocal);
    datosLinea = dataCompleta.lineas[0];
    
    // --- DÍA DE SERVICIO ---
    // La planilla correcta (semana / sábado / domingo) ya la eligió cargarHorariosDeHoy()
    // al seleccionar la línea. Acá solo mostramos cuál quedó cargada.
    const servicioHoy = dataCompleta.servicioHoy || resolverDiaDeServicio();
    const tarjetaEstudiantesActiva = dataCompleta.estadoEstudianteHoy
        ? dataCompleta.estadoEstudianteHoy.activa
        : resolverDiaDeServicio().estudianteActiva;

    // Identificador único para el LocalStorage de recorridos
    // Incluye el tipo de día para no mezclar las vueltas de semana con las del finde
    nombreLineaId = `${datosLinea.nombre}_${servicioHoy.tipo}`;

    document.getElementById("linea-titulo").textContent = datosLinea.nombre;

    // Mostramos la info del día
    document.getElementById("linea-empresa-dias").textContent =
        `${dataCompleta.empresa} • ${servicioHoy.etiqueta}`;

    // --- INTERFAZ: AVISO DE TARJETA ESTUDIANTIL ---
    // Si tienes un elemento en tu HTML para esto (ej: <span id="estado-estudiantes"></span>) lo puedes pintar así:
    const elEstudiantes = document.getElementById("estado-estudiantes");
    if (elEstudiantes) {
        if (tarjetaEstudiantesActiva) {
            elEstudiantes.textContent = "Tarjeta Estudiante: ACTIVA";
            elEstudiantes.className = "estado-estudiante-ok"; // Clase CSS verde
        } else {
            elEstudiantes.textContent = "Tarjeta Estudiante: INACTIVA (Tarifa Plana)";
            elEstudiantes.className = "estado-estudiante-no"; // Clase CSS roja/gris
        }
    }

    // Cargar los recorridos guardados del chofer desde LocalStorage
    recuperarContadorChofer();
    
    cargarParadas(datosLinea.paradas);
});

// Suma o resta los recorridos diarios del chofer
function modificarContador(valor) {
    const elContador = document.getElementById("contador-vueltas");
    let actual = parseInt(elContador.textContent) || 0;
    actual += valor;
    if (actual < 0) actual = 0; 
    
    elContador.textContent = actual;
    localStorage.setItem(`vueltas_${nombreLineaId}`, actual);
}

function recuperarContadorChofer() {
    const guardado = localStorage.getItem(`vueltas_${nombreLineaId}`);
    document.getElementById("contador-vueltas").textContent = guardado ? guardado : "0";
}

// Convierte un string "HH:MM" a minutos totales
function horaAMinutos(horaStr) {
    const [horas, minutos] = horaStr.split(':').map(Number);
    return (horas * 60) + minutos;
}

// Genera botones de paradas
function cargarParadas(paradas) {
    const contenedorParadas = document.getElementById("paradas-lista");
    contenedorParadas.innerHTML = ""; 

    paradas.forEach(parada => {
        const boton = document.createElement("button");
        boton.classList.add("parada-btn");
        boton.textContent = parada;
        
        boton.addEventListener("click", () => {
            document.querySelectorAll(".parada-btn").forEach(btn => btn.classList.remove("active"));
            boton.classList.add("active");
            
            mostrarHorariosDeParada(parada);
        });
        contenedorParadas.appendChild(boton);
    });
}

// Muestra horarios y calcula la frecuencia del servicio en esa parada
function mostrarHorariosDeParada(nombreParada) {
    const seccionHorarios = document.getElementById("horarios-section");
    const tituloParada = document.getElementById("parada-seleccionada-titulo");
    const contenedorHorarios = document.getElementById("horarios-lista");

    cerrarCartel();

    seccionHorarios.classList.remove("hidden");
    tituloParada.textContent = `Horarios para: ${nombreParada}`;
    contenedorHorarios.innerHTML = ""; 

    const listaHorariosFiltrados = [];

    datosLinea.horarios.forEach(bloqueHora => {
        if (bloqueHora[nombreParada] !== null && bloqueHora[nombreParada] !== undefined) {
            listaHorariosFiltrados.push(bloqueHora[nombreParada]);
        }
    });

    if (listaHorariosFiltrados.length === 0) {
        contenedorHorarios.innerHTML = "<p style='grid-column: 1/-1; color: #777;'>Sin horarios registrados.</p>";
        document.getElementById("frecuencia-calculada").textContent = "Sin datos";
        return;
    }

    let sumaDiferencias = 0;
    let conteoIntervalos = 0;

    for (let i = 0; i < listaHorariosFiltrados.length - 1; i++) {
        const minActual = horaAMinutos(listaHorariosFiltrados[i]);
        const minSiguiente = horaAMinutos(listaHorariosFiltrados[i + 1]);
        
        let diferencia = minSiguiente - minActual;
        if (diferencia < 0) {
            diferencia += 1440; 
        }

        sumaDiferencias += diferencia;
        conteoIntervalos++;
    }

    const frecuenciaPromedio = conteoIntervalos > 0 ? Math.round(sumaDiferencias / conteoIntervalos) : 0;
    document.getElementById("frecuencia-calculada").textContent = frecuenciaPromedio > 0 ? `Cada ${frecuenciaPromedio} min aprox.` : "Única salida";

    const ahora = new Date();
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();
    let indiceMasCercano = -1;
    let menorDiferencia = Infinity;

    listaHorariosFiltrados.forEach((hora, indice) => {
        const minutosColectivo = horaAMinutos(hora);
        let diferencia = minutosColectivo - minutosActuales;
        
        if (diferencia < 0) {
            diferencia += 1440; 
        }

        if (diferencia < menorDiferencia) {
            menorDiferencia = diferencia;
            indiceMasCercano = indice;
        }
    });

    listaHorariosFiltrados.forEach((hora, indice) => {
        const divHora = document.createElement("div");
        divHora.classList.add("horario-tag");
        divHora.textContent = hora;
        if (indice === indiceMasCercano) divHora.classList.add("proximo");
        contenedorHorarios.appendChild(divHora);
    });

    if (indiceMasCercano !== -1) {
        programarCartelSugerencia(menorDiferencia);
    }
}

function programarCartelSugerencia(minutosRestantes) {
    if (temporizadorCartel) {
        clearTimeout(temporizadorCartel);
    }

    temporizadorCartel = setTimeout(() => {
        const cartel = document.getElementById("cartel-recomendacion");
        const mensajeText = document.getElementById("mensaje-recomendacion");

        if (minutosRestantes <= 10) {
            mensajeText.innerHTML = `El colectivo está a solo <strong>${minutosRestantes} min</strong>. Te recomendamos esperar el próximo servicio para ir seguro.`;
        } else {
            mensajeText.innerHTML = `El próximo colectivo pasa en <strong>${minutosRestantes} min</strong>. Te sugerimos salir 15 minutos antes a esperarlo.`;
        }

        cartel.classList.remove("hidden");
    }, 5000); 
}

function cerrarCartel() {
    const cartel = document.getElementById("cartel-recomendacion");
    if (cartel) {
        cartel.classList.add("hidden");
    }
    if (temporizadorCartel) {
        clearTimeout(temporizadorCartel);
    }
}

function volverAlInicio() {
    window.location.href = 'index.html';
}

// Variable global para almacenar el estado y usarlo en el modal
const diaEstudiante = resolverDiaDeServicio();
let estadoEstudianteHoy = diaEstudiante.estudianteActiva
    ? { activa: true, razon: "es un día de semana hábil" }
    : { activa: false, razon: diaEstudiante.feriado ? "hoy es día feriado" : "es fin de semana" };


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