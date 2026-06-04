let datosLinea = null;
let nombreLineaId = ""; // Guardará el identificador para contar vueltas individualmente

document.addEventListener("DOMContentLoaded", () => {
    const jsonLocal = localStorage.getItem('lineaSeleccionada');

    if (!jsonLocal) {
        alert("No se seleccionó ninguna línea. Volviendo al inicio.");
        volverAlInicio();
        return;
    }

    const dataCompleta = JSON.parse(jsonLocal);
    datosLinea = dataCompleta.lineas[0];
    
    // Identificador único para el LocalStorage de recorridos (Ej: "Línea A")
    nombreLineaId = datosLinea.nombre;

    document.getElementById("linea-titulo").textContent = datosLinea.nombre;
    document.getElementById("linea-empresa-dias").textContent = `${dataCompleta.empresa} • ${datosLinea.días}`;

    // Cargar los recorridos guardados del chofer desde LocalStorage
    recuperarContadorChofer();
    
    cargarParadas(datosLinea.paradas);
});

// // Muestra/Oculta el panel del chofer en la cabecera
// function togglePanelChofer() {
//     const panel = document.getElementById("panel-chofer");
//     panel.classList.toggle("hidden");
// }

// Suma o resta los recorridos diarios del chofer
function modificarContador(valor) {
    const elContador = document.getElementById("contador-vueltas");
    let actual = parseInt(elContador.textContent) || 0;
    actual += valor;
    if (actual < 0) actual = 0; // No permitir vueltas negativas
    
    elContador.textContent = actual;
    // Guardar el progreso para que no se borre al recargar
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

    seccionHorarios.classList.remove("hidden");
    tituloParada.textContent = `Horarios para: ${nombreParada}`;
    contenedorHorarios.innerHTML = ""; 

    const listaHorariosFiltrados = [];

    // Limpieza de nulos
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

    // --- CÁLCULO DINÁMICO DE FRECUENCIA ---
    let sumaDiferencias = 0;
    let conteoIntervalos = 0;

    for (let i = 0; i < listaHorariosFiltrados.length - 1; i++) {
        const minActual = horaAMinutos(listaHorariosFiltrados[i]);
        const minSiguiente = horaAMinutos(listaHorariosFiltrados[i + 1]);
        
        // Manejar cambio de día si el colectivo pasa después de medianoche
        let diferencia = minSiguiente - minActual;
        if (diferencia < 0) {
            diferencia += 1440; // Añadir los minutos de un día completo
        }

        sumaDiferencias += diferencia;
        conteoIntervalos++;
    }

    const frecuenciaPromedio = conteoIntervalos > 0 ? Math.round(sumaDiferencias / conteoIntervalos) : 0;
    
    // Inyectar el resultado en el panel superior de choferes
    document.getElementById("frecuencia-calculada").textContent = frecuenciaPromedio > 0 ? `Cada ${frecuenciaPromedio} min aprox.` : "Única salida";
    // --------------------------------------

    // --- ENCONTRAR PRÓXIMO COLECTIVO ---
    const ahora = new Date();
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();
    let indiceMasCercano = -1;
    let menorDiferencia = Infinity;

    listaHorariosFiltrados.forEach((hora, indice) => {
        const minutosColectivo = horaAMinutos(hora);
        const diferencia = minutosColectivo - minutosActuales;
        if (diferencia >= 0 && diferencia < menorDiferencia) {
            menorDiferencia = diferencia;
            indiceMasCercano = indice;
        }
    });

    if (indiceMasCercano === -1) indiceMasCercano = 0;

    // Renderizado en la grilla
    listaHorariosFiltrados.forEach((hora, indice) => {
        const divHora = document.createElement("div");
        divHora.classList.add("horario-tag");
        divHora.textContent = hora;
        if (indice === indiceMasCercano) divHora.classList.add("proximo");
        contenedorHorarios.appendChild(divHora);
    });
}

function volverAlInicio() {
    window.location.href = 'index.html';
}