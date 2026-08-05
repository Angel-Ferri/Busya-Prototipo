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
        console.error("Error al cargar los JSON de líneas:", err);
    }
});

function volverAlInicio() {
    window.location.href = "index.html";
}

function inicializarMapa() {
    // Coordenadas por defecto (Villa Mercedes)
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
                alert("No se pudo obtener tu ubicación GPS. Revisa los permisos.");
                console.error(error);
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Calcula la distancia en metros entre dos coordenadas GPS (Fórmula de Haversine)
function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Radio de la Tierra en metros
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

// Busca cuál de las paradas de la línea está más cerca de la ubicación del usuario
function obtenerParadaMasCercana(paradasLinea, mapaCordenadas) {
    if (!ubicacionUsuario) return paradasLinea[0];

    let paradaCercana = paradasLinea[0];
    let menorDistancia = Infinity;

    paradasLinea.forEach(nombreParada => {
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
        alert("Aún no detectamos tu ubicación GPS.");
        return;
    }

    const claveLinea = document.getElementById('select-linea').value;
    const indexDestino = parseInt(document.getElementById('select-destino').value);
    
    const infoLinea = datosLineasCargados[claveLinea].lineas[0];
    const paradasLinea = infoLinea.paradas;
    const mapaCordenadas = datosLineasCargados.cordenadas;

    // 1. Determinar la parada de subida más cercana por GPS
    const paradaOrigen = obtenerParadaMasCercana(paradasLinea, mapaCordenadas);
    const paradaDestinoNombre = paradasLinea[indexDestino];

    const coordsOrigen = mapaCordenadas[paradaOrigen.nombre];
    const coordsDestino = mapaCordenadas[paradaDestinoNombre];

    if (!coordsOrigen || !coordsDestino) {
        alert("No se encontraron coordenadas registradas para estas paradas.");
        return;
    }

    // 2. Limpiar marcadores anteriores
    marcadoresParadas.forEach(m => mapa.removeLayer(m));
    marcadoresParadas = [];

    // Marcar parada de origen
    const mOrigen = L.marker([coordsOrigen[0], coordsOrigen[1]])
        .addTo(mapa)
        .bindPopup(`<b>Subida:</b> ${paradaOrigen.nombre}`);
    
    // Marcar parada de destino
    const mDestino = L.marker([coordsDestino[0], coordsDestino[1]])
        .addTo(mapa)
        .bindPopup(`<b>Bajada:</b> ${paradaDestinoNombre}`);

    marcadoresParadas.push(mOrigen, mDestino);

    // 3. Trazar ruta a pie hasta la parada de subida
    trazarRutaAPie(ubicacionUsuario, coordsOrigen);

    // 4. Cálculos de tiempo
    const tiempoCaminataMins = Math.ceil(paradaOrigen.distanciaMetros / 80); // Velocidad promedio ~80 m/min
    const indexOrigen = paradasLinea.indexOf(paradaOrigen.nombre);
    const paradasDeDiferencia = Math.abs(indexDestino - indexOrigen);
    const tiempoColectivoMins = paradasDeDiferencia * 3; // ~3 min por tramo de parada

    // 5. Mostrar desglose en la tarjeta HTML
    const contenedorResumen = document.getElementById('resumen-viaje');
    contenedorResumen.innerHTML = `
        <div class="paso-itinerario">
            <p>🚶 <strong>Camina hacia:</strong> ${paradaOrigen.nombre} (${paradaOrigen.distanciaMetros}m / ~${tiempoCaminataMins} min a pie)</p>
            <p>🚌 <strong>Súbete al colectivo:</strong> ${infoLinea.nombre}</p>
            <p>📍 <strong>Bájate en:</strong> ${paradaDestinoNombre}</p>
            <hr style="margin: 10px 0; border: 0; border-top: 1px solid #ccc;">
            <p class="tiempo-destacado">⏱ <strong>Tiempo estimado en viaje:</strong> ~${tiempoColectivoMins} minutos (${paradasDeDiferencia} paradas)</p>
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
            styles: [{ color: '#2e7d32', opacity: 0.8, weight: 6 }]
        }
    }).addTo(mapa);
}