// script/como_llegar.js

let mapa = null;
let ubicacionUsuario = null;
let marcadorUsuario = null;
let routingControl = null;
let datosLineasCargados = null;

// Inicialización del Mapa y Geolocalización
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
    // Coordenadas por defecto (se centrará al obtener el GPS del usuario)
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

                // Icono para la ubicación del usuario
                marcadorUsuario = L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng])
                    .addTo(mapa)
                    .bindPopup("<b>Tu ubicación actual</b>")
                    .openPopup();
            },
            (error) => {
                alert("No se pudo obtener tu ubicación. Por favor, habilita el GPS.");
                console.error(error);
            }
        );
    } else {
        alert("Tu navegador no soporta geolocalización.");
    }
}

// Cargar las paradas en el selector de destino según la línea elegida
function alCambiarLinea(claveLinea) {
    const selectDestino = document.getElementById('select-destino');
    selectDestino.innerHTML = '<option value="" disabled selected>-- Selecciona parada de destino --</option>';

    if (!datosLineasCargados || !datosLineasCargados[claveLinea]) return;

    const linea = datosLineasCargados[claveLinea].lineas[0];
    const paradas = linea.paradas;

    paradas.forEach((parada, index) => {
        const option = document.createElement('option');
        option.value = index; // Guardamos el índice de la parada
        option.textContent = parada;
        selectDestino.appendChild(option);
    });

    selectDestino.disabled = false;
}

// Cálculo de paradas, rutas en mapa y estimación de tiempo
function calcularRutaYTiempo() {
    if (!ubicacionUsuario) {
        alert("Aún no hemos detectado tu ubicación GPS.");
        return;
    }

    const claveLinea = document.getElementById('select-linea').value;
    const indexDestino = parseInt(document.getElementById('select-destino').value);
    
    const infoLinea = datosLineasCargados[claveLinea].lineas[0];
    const paradas = infoLinea.paradas;

    // Nota: Si tus JSON no contienen un objeto de coordenadas específicas por parada,
    // se asume que las coordenadas están en la estructura o en coordenadas.json.
    // Aquí tomamos un origen estimado (parada 0) y un destino según el índice seleccionado.
    
    const paradaOrigenNombre = paradas[0]; // Parada más cercana de subida
    const paradaDestinoNombre = paradas[indexDestino];

    // Ejemplo de estimación de tiempo en minutos según la cantidad de paradas intermedias
    const paradasDeDiferencia = Math.abs(indexDestino - 0);
    const tiempoEstimadoColectivo = paradasDeDiferencia * 3; // Promedio de 3 min por parada[cite: 1]

    // Dibujar ruta a pie en el mapa hacia la parada de subida
    trazarRutaAPie(ubicacionUsuario);

    // Actualizar resumen en HTML
    const contenedorResumen = document.getElementById('resumen-viaje');
    contenedorResumen.innerHTML = `
        <div class="paso-itinerario">
            <p>🚶 <strong>Camina hacia:</strong> ${paradaOrigenNombre}</p>
            <p>🚌 <strong>Súbete al colectivo:</strong> ${infoLinea.nombre}</p>
            <p>📍 <strong>Bájate en:</strong> ${paradaDestinoNombre}</p>
            <hr>
            <p class="tiempo-destacado">⏱ <strong>Tiempo en colectivo:</strong> ~${tiempoEstimadoColectivo} minutos</p>
        </div>
    `;
}

function trazarRutaAPie(origen) {
    // Si ya había una ruta dibujada, la eliminamos
    if (routingControl) {
        mapa.removeControl(routingControl);
    }

    // Dibujar el camino hacia el punto de subida usando Leaflet Routing Machine
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(origen.lat, origen.lng),
            // Reemplazar con la coordenada real de la parada de subida
            L.latLng(origen.lat + 0.003, origen.lng + 0.003) 
        ],
        router: L.Routing.osrmv1({
            profile: 'foot' // Perfil para caminar
        }),
        show: false, // Ocultar cuadro de texto con instrucciones de giro
        addWaypoints: false,
        lineOptions: {
            styles: [{ color: '#315e99', opacity: 0.8, weight: 6 }]
        }
    }).addTo(mapa);
}