// script/como_llegar.js

// Diccionario de Coordenadas Exactas
const COORDENADAS_PARADAS = {
    // Línea A
    "Salida Facultad": [-33.64390876263037, -65.44723506275027],
    "Terminal": [-33.664654538585204, -65.46637611852886],
    "Balcarce y Urquiza": [-33.682595914338776, -65.46645363086301],
    "L.Guillet y G. Paz": [-33.688570628802665, -65.4648887887808],
    "Entrada Ate 2": [-33.69622948843514, -65.43885883819112],
    "Salida F. Sarmiento": [-33.70026332904856, -65.42947925016045],
    "Nelson e Yrigoyen": [-33.69118574582929, -65.44855150532408],
    "G. Paz y Maipú": [-33.67524945292475, -65.46090168452402],
    "Llegada Facultad": [-33.643724917390365, -65.44804418378352],

    // Línea E
    "M. Ernst y Cazorla": [-33.69117261092903, -65.5042015764753],
    "Hospital La Ribera": [-33.69494554209533, -65.50550965774369],
    "Escuela Agraria": [-33.67838542676913, -65.50326099785121],
    "Ayacucho y Belgrano": [-33.6894137897389, -65.46980702327271],
    "Ayacucho y Balcarce": [-33.6894137897389, -65.46980702327271],
    "Policlínico": [-33.67658062395754, -65.45369314983773],
    "Llegada a Terminal": [-33.66523490763702, -65.46697847608702],
    "Salida Terminal": [-33.66551985747486, -65.46725949133338],
    "Hospital de la Villa": [-33.674642040709465, -65.46413540171841],
    "Balcarce y Riobamba": [-33.68705066787971, -65.46780403924167],
    "Entrada B° La Ribera": [-33.68385180881544, -65.50380571596942],

    // Línea Este
    "Pellegrini y Nelson": [-33.66080447604055, -65.43960973366998],
    "Maipú y Ávila": [-33.68326589798833, -65.42540570878745],
    "Tucumán y Tallaferro": [-33.68968132151262, -65.44702458187535],
    "Llegada Terminal": [-33.66523490763702, -65.46697847608702],
    "Salida de Terminal": [-33.66551985747486, -65.46725949133338],
    "Balcarce y Chacabuco": [-33.6745895584232, -65.4640748506616],
    "E. Agüero y L. Guillet": [-33.691821065669245, -65.44996645827501],
    "Gauna y Maipú": [-33.68373901582535, -65.42326928790872],
    "Htal. B° Eva Perón": [-33.65939918403483, -65.42914999838808],

    // Línea Oeste
    "Chacabuco y Güemes": [-33.6714904624286, -65.4780785644177],
    "Llerena y Sallorenzo": [-33.6732021018651, -65.48376362026353],
    "Balcarce y Ayacucho": [-33.6894137897389, -65.46980702327271],
    "Potosí y Belgrano": [-33.68856497177653, -65.46937665411455],
    "Laínez y Sallorenzo": [-33.669591943846996, -65.48269030625158],
    "3 de Febrero y 25 de Mayo": [-33.66915553311603, -65.46709432311245]
};

let mapa = null;
let ubicacionUsuario = null;
let marcadorUsuario = null;
let marcadoresParadas = [];
let routingControl = null;
let datosLineasCargados = null;

document.addEventListener('DOMContentLoaded', async () => {
    inicializarMapa();
    obtenerUbicacionUsuario();
    
    try {
        datosLineasCargados = await cargarDatosLineas();
    } catch (err) {
        console.error("Error al cargar los datos de las líneas:", err);
    }
});

function volverAlInicio() {
    window.location.href = "index.html";
}

function inicializarMapa() {
    // Vista inicial centrada en Villa Mercedes
    mapa = L.map('map-principal').setView([-33.675, -65.46], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapa);
}

function obtenerUbicacionUsuario() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                ubicacionUsuario = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };

                mapa.setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 15);

                marcadorUsuario = L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng])
                    .addTo(mapa)
                    .bindPopup("<b>📍 Estás aquí</b>")
                    .openPopup();
            },
            (error) => {
                alert("No se pudo obtener tu ubicación GPS.");
                console.error(error);
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Distancia en metros entre dos coordenadas GPS (Haversine)
function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Busca la parada con coordenadas exactas más cercana a la posición GPS actual
function obtenerParadaMasCercana(paradasDeEstaLinea) {
    if (!ubicacionUsuario) return { nombre: paradasDeEstaLinea[0], distanciaMetros: 0 };

    let paradaCercana = paradasDeEstaLinea[0];
    let menorDistancia = Infinity;

    paradasDeEstaLinea.forEach(nombreParada => {
        const coords = COORDENADAS_PARADAS[nombreParada];
        if (coords) {
            const dist = calcularDistanciaMetros(
                ubicacionUsuario.lat, 
                ubicacionUsuario.lng, 
                coords[0], 
                coords[1]
            );
            if (dist < menorDistancia) {
                menorDistancia = dist;
                paradaCercana = nombreParada;
            }
        }
    });

    return { nombre: paradaCercana, distanciaMetros: Math.round(menorDistancia) };
}

function alCambiarLinea(claveLinea) {
    const selectDestino = document.getElementById('select-destino');
    selectDestino.innerHTML = '<option value="" disabled selected>-- Selecciona parada de destino --</option>';

    if (!datosLineasCargados || !datosLineasCargados[claveLinea]) return;

    const linea = datosLineasCargados[claveLinea].lineas[0];
    const paradas = linea.paradas;

    paradas.forEach((parada, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = parada;
        selectDestino.appendChild(option);
    });

    selectDestino.disabled = false;
}

function calcularRutaYTiempo() {
    if (!ubicacionUsuario) {
        alert("Esperando señal GPS...");
        return;
    }

    const claveLinea = document.getElementById('select-linea').value;
    const indexDestino = parseInt(document.getElementById('select-destino').value);
    
    const infoLinea = datosLineasCargados[claveLinea].lineas[0];
    const paradasLinea = infoLinea.paradas;

    // 1. Identificar la parada de subida más cercana por GPS
    const paradaOrigen = obtenerParadaMasCercana(paradasLinea);
    const paradaDestinoNombre = paradasLinea[indexDestino];

    const coordsOrigen = COORDENADAS_PARADAS[paradaOrigen.nombre];
    const coordsDestino = COORDENADAS_PARADAS[paradaDestinoNombre];

    if (!coordsOrigen || !coordsDestino) {
        alert("Las coordenadas exactas de una de las paradas no están disponibles.");
        return;
    }

    // 2. Limpiar marcadores antiguos
    marcadoresParadas.forEach(m => mapa.removeLayer(m));
    marcadoresParadas = [];

    // Marcar parada de origen y destino
    const mOrigen = L.marker([coordsOrigen[0], coordsOrigen[1]])
        .addTo(mapa)
        .bindPopup(`<b>Subida:</b> ${paradaOrigen.nombre}`);
    
    const mDestino = L.marker([coordsDestino[0], coordsDestino[1]])
        .addTo(mapa)
        .bindPopup(`<b>Bajada:</b> ${paradaDestinoNombre}`);

    marcadoresParadas.push(mOrigen, mDestino);

    // 3. Trazar ruta caminando hasta la parada de subida
    trazarRutaAPie(ubicacionUsuario, coordsOrigen);

    // 4. Estimación de tiempos
    const tiempoCaminataMins = Math.ceil(paradaOrigen.distanciaMetros / 80); // ~80 m/min
    const indexOrigen = paradasLinea.indexOf(paradaOrigen.nombre);
    const paradasDeDiferencia = Math.abs(indexDestino - indexOrigen);
    const tiempoColectivoMins = paradasDeDiferencia * 3; // Promedio de 3 min entre paradas

    // 5. Presentar resultado
    const contenedorResumen = document.getElementById('resumen-viaje');
    contenedorResumen.innerHTML = `
        <div class="paso-itinerario">
            <p>🚶 <strong>Camina hacia:</strong> ${paradaOrigen.nombre} (${paradaOrigen.distanciaMetros} m - ~${tiempoCaminataMins} min a pie)</p>
            <p>🚌 <strong>Súbete al colectivo:</strong> ${infoLinea.nombre}</p>
            <p>📍 <strong>Bájate en:</strong> ${paradaDestinoNombre}</p>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #e2e8f0;">
            <p class="tiempo-destacado">⏱ <strong>Tiempo estimado en colectivo:</strong> ~${tiempoColectivoMins} min (${paradasDeDiferencia} paradas de tramo)</p>
        </div>
    `;
}

function trazarRutaAPie(origenGps, coordsParada) {
    if (routingControl) {
        mapa.removeControl(routingControl);
    }

    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(origenGps.lat, origenGps.lng),
            L.latLng(coordsParada[0], coordsParada[1])
        ],
        router: L.Routing.osrmv1({
            profile: 'foot'
        }),
        show: false,
        addWaypoints: false,
        lineOptions: {
            styles: [{ color: '#2e7d32', opacity: 0.85, weight: 6 }]
        }
    }).addTo(mapa);
}