let datosLinea = null;
let mapaPrincipal = null;
let capaCalorMarcadores = null;
let coordenadasGlobales = {}; // Se llenará con el JSON externo

// Las planillas de sábado y domingo escriben algunas paradas distinto que las de
// semana. Acá traducimos esas variantes al nombre que usa cordenadas.json.
const ALIAS_PARADAS = {
    "Entrada Ate II": "Entrada Ate 2",
    "Nelson e Irigoyen": "Nelson e Yrigoyen",
    "Gral. Paz y Maipú": "G. Paz y Maipú",
    "Salida B° F.Sarmiento": "Salida F. Sarmiento",
    "Maipú y Avila": "Maipú y Ávila",
    "Lainez y Sallorenzo": "Laínez y Sallorenzo",
    "Ayacucho y Balcarce": "Balcarce y Ayacucho"
};

// Busca la coordenada de una parada resolviendo el alias si hace falta
function buscarCoordenada(nombreParada) {
    const coordenada = coordenadasGlobales[nombreParada];
    if (coordenada) return coordenada;

    const alias = ALIAS_PARADAS[nombreParada];
    if (alias && coordenadasGlobales[alias]) return coordenadasGlobales[alias];

    console.warn(`Sin coordenada para la parada: ${nombreParada}`);
    return null;
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarMapaPrincipal();
    cargarArchivoCoordenadas();
});

function inicializarMapaPrincipal() {
    // Centrado neutro en Villa Mercedes
    mapaPrincipal = L.map('map-principal').setView([-33.6756, -65.4577], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapaPrincipal);

    capaCalorMarcadores = L.layerGroup().addTo(mapaPrincipal);
}

// 1. CARGAR COORDENADAS CENTRALIZADAS
function cargarArchivoCoordenadas() {
    fetch('data/recorridos_originales/cordenadas/cordenadas.json')
        .then(response => {
            if (!response.ok) throw new Error("No se pudo leer el archivo de coordenadas.");
            return response.json();
        })
        .then(data => {
            coordenadasGlobales = data;
            console.log("Coordenadas de paradas cargadas correctamente.");

            // Si ya venía una línea preseleccionada desde el index, la carga automáticamente
            const jsonPreseleccionado = localStorage.getItem('archivoLineaSeleccionada');
            if (jsonPreseleccionado) {
                document.getElementById("select-linea-json").value = jsonPreseleccionado;
                cambiarLineaMap(jsonPreseleccionado);
            }
        })
        .catch(error => {
            console.error("Error cargando cordenadas.json:", error);
            alert("Error al cargar el mapa base de paradas. Verificá la ruta del archivo.");
        });
}

// 2. CAMBIAR DE LÍNEA DINÁMICAMENTE
function cambiarLineaMap(archivoJson) {
    if (!archivoJson) return;

    // Carga la planilla de hoy: semana, sábado o domingo
    cargarHorariosDeHoy(archivoJson)
        .then(dataCompleta => {
            datosLinea = dataCompleta.lineas[0];
            document.getElementById("mapa-titulo").textContent =
                `Mapa: ${datosLinea.nombre} • ${dataCompleta.servicioHoy.etiqueta}`;
            calcularYProyectarCalor();
        })
        .catch(error => {
            console.error("Error al cargar la línea:", error);
            alert("No se pudo encontrar el archivo de la línea seleccionada.");
        });
}

// 3. AUXILIAR DE TIEMPO
function horaAMinutos(horaStr) {
    if (!horaStr) return null;
    const [horas, minutos] = horaStr.split(':').map(Number);
    return (horas * 60) + minutos;
}

// 4. REGLAS TÉRMICAS SOLICITADAS
function obtenerEscalaTermica(minutos) {
    if (minutos === 0) return { color: "#00aa00", bg: "#e6f7e6", texto: "El colectivo está acá", radio: 220 };
    if (minutos <= 4) return { color: "#7cfc00", bg: "#f2fbe6", texto: "Por llegar", radio: 180 };
    if (minutos <= 10) return { color: "#ffcc00", bg: "#fffbe6", texto: "Cerca", radio: 140 };
    if (minutos <= 20) return { color: "#ff6600", bg: "#fff0e6", texto: "Falta", radio: 110 };
    return { color: "#ff0000", bg: "#ffe6e6", texto: "Lejos", radio: 80 };
}

// 5. PROYECTAR PUNTOS DE CALOR EN EL MAPA
function calcularYProyectarCalor() {
    capaCalorMarcadores.clearLayers();
    const contenedorLista = document.getElementById("lista-estados-paradas");
    contenedorLista.innerHTML = "";

    const ahora = new Date();
    const minutosActuales = (ahora.getHours() * 60) + ahora.getMinutes();

    let primeraCoordenadaValida = null;

    datosLinea.paradas.forEach((nombreParada) => {
        const listaHorarios = [];
        
        datosLinea.horarios.forEach(bloque => {
            if (bloque[nombreParada] !== null && bloque[nombreParada] !== undefined) {
                listaHorarios.push(bloque[nombreParada]);
            }
        });

        if (listaHorarios.length === 0) return;

        let menorDiferencia = Infinity;
        let horaMasCercanaStr = "--:--"; // Variable para almacenar el formato hora hh:mm

        listaHorarios.forEach(hora => {
            const minutesColectivo = horaAMinutos(hora);
            if (minutesColectivo !== null) {
                let diferencia = minutesColectivo - minutosActuales;
                if (diferencia < 0) diferencia += 1440; 
                
                if (diferencia < menorDiferencia) {
                    menorDiferencia = diferencia;
                    horaMasCercanaStr = hora; // Guardamos el texto de la hora (ej: "21:35")
                }
            }
        });

        const termica = obtenerEscalaTermica(menorDiferencia);
        const coordenadaReal = buscarCoordenada(nombreParada);

        if (coordenadaReal) {
            if (!primeraCoordenadaValida) primeraCoordenadaValida = coordenadaReal;

            // Dibujar círculo de calor
            const circuloCalor = L.circle(coordenadaReal, {
                color: termica.color,
                fillColor: termica.color,
                fillOpacity: 0.6,
                radius: termica.radio
            }).addTo(capaCalorMarcadores);

            // Modificado el popup para mostrar el formato de hora (ej: 21:35 hs)
            circuloCalor.bindPopup(`
                <strong>${nombreParada}</strong><br>
                Estado: <b>${termica.texto}</b><br>
                Horario: <b>${horaMasCercanaStr} hs</b> (${menorDiferencia} min)
            `);

            // Añadir fila a la lista interactiva inferior con formato hora
            const fila = document.createElement("div");
            fila.classList.add("estado-parada-item");
            fila.innerHTML = `
                <span class="parada-lbl-nombre">${nombreParada}</span>
                <span class="parada-lbl-tiempo" style="background-color: ${termica.bg}; color: ${termica.color};">
                    ${horaMasCercanaStr} hs • ${termica.texto}
                </span>
            `;

            fila.addEventListener("click", () => {
                mapaPrincipal.panTo(coordenadaReal);
                circuloCalor.openPopup();
            });

            contenedorLista.appendChild(fila);
        }
    });

    if (primeraCoordenadaValida) {
        mapaPrincipal.setView(primeraCoordenadaValida, 13);
    }
}

function volverAlInicio() {
    window.location.href = 'index.html';
}