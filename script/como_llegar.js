// script/como_llegar.js

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
        console.error("Error al cargar las líneas y coordenadas:", err);
    }
});

function volverAlInicio() {
    window.location.href = "index.html";
}

function inicializarMapa() {
    // Centro inicial en Villa Mercedes
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
                alert("No se pudo obtener tu ubicación GPS. Por favor activa los permisos.");
                console.error(error);
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Fórmula de Haversine para calcular distancia exacta en metros entre 2 puntos GPS
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

// Busca la parada más cercana FILTRANDO estrictamente por las paradas de la línea seleccionada
function obtenerParadaMasCercanaDeLinea(paradasDeEstaLinea, mapaCordenadas) {
    if (!ubicacionUsuario) return { nombre: paradasDeEstaLinea[0], distanciaMetros: 0 };

    let paradaCercana = paradasDeEstaLinea[0];
    let menorDistancia = Infinity;

    paradasDeEstaLinea.forEach(nombreParada => {
        const coords = mapaCordenadas[nombreParada];
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

    // Carga únicamente las paradas correspondientes a esta línea
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
        alert("Detectando tu ubicación GPS...");
        return;
    }

    const claveLinea = document.getElementById('select-linea').value;
    const indexDestino = parseInt(document.getElementById('select-destino').value);
    
    const infoLinea = datosLineasCargados[claveLinea].lineas[0];
    const paradasLinea = infoLinea.paradas;
    const mapaCordenadas = datosLineasCargados.cordenadas;

    // 1. Obtener parada de subida más cercana de la línea
    const paradaOrigen = obtenerParadaMasCercanaDeLinea(paradasLinea, mapaCordenadas);
    const paradaDestinoNombre = paradasLinea[indexDestino];

    const coordsOrigen = mapaCordenadas[paradaOrigen.nombre];
    const coordsDestino = mapaCordenadas[paradaDestinoNombre];

    if (!coordsOrigen || !coordsDestino) {
        alert("No se encontraron las coordenadas registradas para una de las paradas.");
        return;
    }

    // 2. Limpiar marcadores antiguos en el mapa
    marcadoresParadas.forEach(m => mapa.removeLayer(m));
    marcadoresParadas = [];

    // Marcar punto de subida y de bajada
    const mOrigen = L.marker([coordsOrigen[0], coordsOrigen[1]])
        .addTo(mapa)
        .bindPopup(`<b>Subes en:</b> ${paradaOrigen.nombre}`);
    
    const mDestino = L.marker([coordsDestino[0], coordsDestino[1]])
        .addTo(mapa)
        .bindPopup(`<b>Bajas en:</b> ${paradaDestinoNombre}`);

    marcadoresParadas.push(mOrigen, mDestino);

    // 3. Trazar recorrido a pie hasta la parada de subida
    trazarRutaAPie(ubicacionUsuario, coordsOrigen);

    // 4. Estimación de tiempos
    const tiempoCaminataMins = Math.ceil(paradaOrigen.distanciaMetros / 80); // ~80m por minuto caminando
    const indexOrigen = paradasLinea.indexOf(paradaOrigen.nombre);
    const paradasDeDiferencia = Math.abs(indexDestino - indexOrigen);
    const tiempoColectivoMins = paradasDeDiferencia * 3; // Promedio ~3 min entre paradas

    // 5. Actualizar la tarjeta de resumen
    const contenedorResumen = document.getElementById('resumen-viaje');
    contenedorResumen.innerHTML = `
        <div class="paso-itinerario">
            <p>🚶 <strong>Camina hacia:</strong> ${paradaOrigen.nombre} (${paradaOrigen.distanciaMetros} m - ~${tiempoCaminataMins} min a pie)</p>
            <p>🚌 <strong>Súbete a:</strong> ${infoLinea.nombre}</p>
            <p>📍 <strong>Bájate en:</strong> ${paradaDestinoNombre}</p>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #e2e8f0;">
            <p class="tiempo-destacado">⏱ <strong>Tiempo estimado en colectivo:</strong> ~${tiempoColectivoMins} min (${paradasDeDiferencia} paradas)</p>
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