// panel/gps.js
let posicionChofer = null;

/**
 * Inicia el rastreo en tiempo real de la ubicación del chofer.
 * @param {Function} onLocationUpdate - Callback que recibe la nueva posición ({lat, lng, timestamp})
 */
function iniciarSeguimientoGPS(onLocationUpdate) {
    if (!("geolocation" in navigator)) {
        console.warn("⚠️ Geolocalización no soportada por el navegador.");
        return;
    }

    const opcionesGPS = {
        enableHighAccuracy: false, // Desactivado para evitar timeouts en laptops/desktops sin chip GPS dedicado
        timeout: 30000,            // Se amplía a 30 segundos de margen de respuesta
        maximumAge: 10000          // Utiliza coordenadas en caché si tienen menos de 10 segundos
    };

    navigator.geolocation.watchPosition(
        (pos) => {
            posicionChofer = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                timestamp: pos.timestamp
            };

            if (typeof onLocationUpdate === "function") {
                onLocationUpdate(posicionChofer);
            }
        },
        (error) => {
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    console.warn("⚠️ Permiso de ubicación denegado por el usuario. Actívalo en el icono del candado junto a la URL.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.warn("⚠️ La señal de ubicación no está disponible actualmente.");
                    break;
                case error.TIMEOUT:
                    console.warn("⚠️ Tiempo de espera agotado al consultar el GPS.");
                    break;
                default:
                    console.warn("⚠️ Error desconocido en GPS:", error.message);
                    break;
            }
        },
        opcionesGPS
    );
}

/**
 * Calcula la distancia en kilómetros entre dos puntos geográficos (Fórmula de Haversine).
 */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en Kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Estima los minutos necesarios para llegar a un punto basándose en la velocidad promedio urbana (~25 km/h).
 * @param {Object} coordenadasDestino - Objeto con formato {lat, lng}
 * @returns {number|null} Minutos estimados o null si no hay señal GPS disponible
 */
function estimarMinutosGPS(coordenadasDestino) {
    if (!posicionChofer || !coordenadasDestino || !coordenadasDestino.lat || !coordenadasDestino.lng) {
        return null;
    }

    const distKm = calcularDistanciaKm(
        posicionChofer.lat, 
        posicionChofer.lng, 
        coordenadasDestino.lat, 
        coordenadasDestino.lng
    );

    const velocidadUrbanaKmH = 25; 
    const horas = distKm / velocidadUrbanaKmH;
    return Math.round(horas * 60);
}