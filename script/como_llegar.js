// =====================================================
// Busya - Cómo Llegar (versión sin ofuscar)
// NO SUBIR AL REPO
// =====================================================

let mapa = null;
let ubicacionUsuario = null;
let marcadorUsuario = null;
let routingControlPie = null;
let lineaPolyline = null;
let lineaTramoPolyline = null;
let datosLineasCargados = {};
let horariosLineasCargados = {};
let recorridoActual = null;
let marcadoresParadas = [];
let marcadorOrigenSugerido = null;
let marcadorDestinoSeleccionado = null;

// --- Iconos ---
const iconoUsuarioGPS = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9356/9356230.png',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -38]
});

const iconoParadaSubida = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30]
});

const iconoParadaBajada = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/1483/1483336.png',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -30]
});

// --- Normalizar coordenadas (acepta arrays [lat,lng] u objetos {lat,lng}) ---
function normalizarCoordenadas(arr) {
    if (!arr || !Array.isArray(arr)) return [];
    return arr.map(c => {
        if (Array.isArray(c)) return c;
        if (c.lat !== undefined && c.lng !== undefined) return [c.lat, c.lng];
        return c;
    });
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', async () => {
    inicializarMapa();
    obtenerUbicacionUsuario();
    await cargarRecorridos();
    await cargarHorarios();
});

function volverAlInicio() {
    window.location.href = 'index.html';
}

function inicializarMapa() {
    mapa = L.map('map-principal').setView([-33.675, -65.46], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(mapa);
}

// --- Geolocalización ---
function obtenerUbicacionUsuario() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => {
                ubicacionUsuario = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                console.log('Ubicación GPS activa:', ubicacionUsuario);
                mostrarUsuario();
            },
            err => {
                console.warn('No se pudo obtener ubicación GPS, usando ubicación por defecto:', err.message);
                ubicacionUsuario = { lat: -33.6758, lng: -65.4612 };
                mostrarUsuario();
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        console.warn('Geolocalización no soportada, usando ubicación por defecto');
        ubicacionUsuario = { lat: -33.6758, lng: -65.4612 };
        mostrarUsuario();
    }
}

function mostrarUsuario() {
    mapa.setView([ubicacionUsuario.lat, ubicacionUsuario.lng], 15);
    marcadorUsuario = L.marker([ubicacionUsuario.lat, ubicacionUsuario.lng], { icon: iconoUsuarioGPS })
        .addTo(mapa)
        .bindPopup('Tu posición GPS actual')
        .openPopup();
    L.circle([ubicacionUsuario.lat, ubicacionUsuario.lng], {
        radius: 60,
        color: '#7c3aed',
        fillColor: '#8b5cf6',
        fillOpacity: 0.2
    }).addTo(mapa);
}

// --- Cargar datos ---
async function cargarRecorridos() {
    try {
        const [dataA, dataE, dataEste, dataOeste] = await Promise.all([
            fetch('datos/coordenadas/paradas_secundarias_Linea_A.json').then(r => r.json()).catch(() => null),
            fetch('datos/coordenadas/paradas_secundarias_Linea_E.json').then(r => r.json()).catch(() => null),
            fetch('datos/coordenadas/paradas_secundarias_Linea_Este.json').then(r => r.json()).catch(() => null),
            fetch('datos/coordenadas/paradas_secundarias_Linea_Oeste.json').then(r => r.json()).catch(() => null)
        ]);

        datosLineasCargados = {
            lineaa: dataA ? {
                nombre: 'Línea A',
                key: 'lineaa',
                paradas: dataA.paradas || [],
                recorrido: normalizarCoordenadas(
                    dataA.recorrido && dataA.recorrido.coordenadas
                        ? dataA.recorrido.coordenadas
                        : (dataA.paradas || []).map(p => [p.lat, p.lng])
                )
            } : null,
            lineae: dataE ? {
                nombre: 'Línea E',
                key: 'lineae',
                paradas: dataE.paradas || [],
                recorrido: normalizarCoordenadas(
                    dataE.recorrido && dataE.recorrido.coordenadas
                        ? dataE.recorrido.coordenadas
                        : (dataE.paradas || []).map(p => [p.lat, p.lng])
                )
            } : null,
            lineaeste: dataEste ? {
                nombre: 'Línea Este',
                key: 'lineaeste',
                paradas: dataEste.paradas || [],
                recorrido: normalizarCoordenadas(
                    dataEste.recorrido && dataEste.recorrido.coordenadas
                        ? dataEste.recorrido.coordenadas
                        : dataEste.recorrido || []
                )
            } : null,
            lineaoeste: dataOeste ? {
                nombre: 'Línea Oeste',
                key: 'lineaoeste',
                paradas: dataOeste.paradas || [],
                recorrido: normalizarCoordenadas(
                    dataOeste.recorrido && dataOeste.recorrido.coordenadas
                        ? dataOeste.recorrido.coordenadas
                        : (dataOeste.paradas || []).map(p => [p.lat, p.lng])
                )
            } : null
        };
    } catch (e) {
        console.error('Error al cargar coordenadas:', e);
    }
}

async function cargarHorarios() {
    try {
        const [horA, horE, horEste, horOeste] = await Promise.all([
            fetch('datos/linea_a_horarios.json').then(r => r.json()).catch(() => null),
            fetch('datos/linea_e_horarios.json').then(r => r.json()).catch(() => null),
            fetch('datos/linea_este_horarios.json').then(r => r.json()).catch(() => null),
            fetch('datos/linea_oeste_horarios.json').then(r => r.json()).catch(() => null)
        ]);
        horariosLineasCargados = {
            lineaa: horA,
            lineae: horE,
            lineaeste: horEste,
            lineaoeste: horOeste
        };
    } catch (e) {
        console.error('Error al cargar archivos JSON de horarios:', e);
    }
}

// --- Utilidades de tiempo ---
function obtenerMinutosDesdeCadena(cadena) {
    if (!cadena) return null;
    const [h, m] = cadena.split(':').map(Number);
    return h * 60 + m;
}

function convertirMinutosAHora(minutos) {
    const total = (minutos + 720) % 720;
    const h = Math.floor(total / 60).toString().padStart(2, '0');
    const m = Math.floor(total % 60).toString().padStart(2, '0');
    return h + ':' + m;
}

// --- Calcular horario estimado para una parada ---
function calcularHorarioEstimadoParada(keyLinea, indiceParada, minutosActuales) {
    const horarios = horariosLineasCargados[keyLinea];
    const paradas = recorridoActual.paradas;
    const parada = paradas[indiceParada];
    if (!parada) return null;

    // Si hay horario fijo para esta parada
    if (horarios && horarios.horarios_fijos && horarios.horarios_fijos[parada.nombre]) {
        const horas = horarios.horarios_fijos[parada.nombre]
            .map(obtenerMinutosDesdeCadena)
            .sort((a, b) => a - b);
        const siguiente = horas.find(h => h >= minutosActuales) || horas[0];
        return {
            horaEstimadaStr: convertirMinutosAHora(siguiente),
            minutosLlegada: siguiente,
            esInterpolado: false,
            referenciaAnterior: null,
            referenciaSiguiente: null
        };
    }

    // Interpolar entre paradas con horario fijo
    let idxAnterior = -1;
    let idxSiguiente = -1;

    for (let i = indiceParada - 1; i >= 0; i--) {
        if (horarios && horarios.horarios_fijos && horarios.horarios_fijos[paradas[i].nombre]) {
            idxAnterior = i;
            break;
        }
    }
    for (let i = indiceParada + 1; i < paradas.length; i++) {
        if (horarios && horarios.horarios_fijos && horarios.horarios_fijos[paradas[i].nombre]) {
            idxSiguiente = i;
            break;
        }
    }

    if (idxAnterior === -1 || idxSiguiente === -1) {
        // No hay suficientes referencias, calcular por distancia
        let distancia = 0;
        const inicio = idxAnterior !== -1 ? idxAnterior : 0;
        for (let i = inicio; i < indiceParada; i++) {
            distancia += calcularDistancia(
                [paradas[i].lat, paradas[i].lng],
                [paradas[i + 1].lat, paradas[i + 1].lng]
            );
        }
        const minutosEstimados = Math.round(distancia / 20 * 60);
        const horaEstimada = minutosActuales + minutosEstimados;
        return {
            horaEstimadaStr: convertirMinutosAHora(horaEstimada),
            minutosLlegada: horaEstimada,
            esInterpolado: true,
            referenciaAnterior: paradas[inicio].nombre,
            referenciaSiguiente: 'fin de línea'
        };
    }

    // Interpolar linealmente entre dos referencias
    let distanciaTotal = 0;
    for (let i = idxAnterior; i < idxSiguiente; i++) {
        distanciaTotal += calcularDistancia(
            [paradas[i].lat, paradas[i].lng],
            [paradas[i + 1].lat, paradas[i + 1].lng]
        );
    }
    let distanciaHastaParada = 0;
    for (let i = idxAnterior; i < indiceParada; i++) {
        distanciaHastaParada += calcularDistancia(
            [paradas[i].lat, paradas[i].lng],
            [paradas[i + 1].lat, paradas[i + 1].lng]
        );
    }

    const paradaRefA = paradas[idxAnterior];
    const paradaRefB = paradas[idxSiguiente];
    const horasA = horarios.horarios_fijos[paradaRefA.nombre]
        .map(obtenerMinutosDesdeCadena)
        .sort((a, b) => a - b);
    const horasB = horarios.horarios_fijos[paradaRefB.nombre]
        .map(obtenerMinutosDesdeCadena)
        .sort((a, b) => a - b);

    let horaA = horasA.find(h => h >= minutosActuales) || horasA[0];
    let horaB = horasB.find(h => h > horaA) || horaA + 20;

    const fraccion = distanciaTotal > 0 ? distanciaHastaParada / distanciaTotal : 0;
    const horaEstimada = Math.round(horaA + (horaB - horaA) * fraccion);

    return {
        horaEstimadaStr: convertirMinutosAHora(horaEstimada),
        minutosLlegada: horaEstimada,
        esInterpolado: true,
        referenciaAnterior: paradaRefA.nombre,
        referenciaSiguiente: paradaRefB.nombre
    };
}

// --- Cambiar línea seleccionada ---
function alCambiarLinea(valorLinea) {
    let selDestino = document.getElementById('select-destino');
    let selOrigen = document.getElementById('select-origen');

    selDestino.innerHTML = '<option value="" disabled selected>-- 2. Seleccioná a dónde querés llegar --</option>';
    if (selOrigen) {
        selOrigen.innerHTML = '<option value="" disabled selected>-- 3. Seleccioná la parada de partida --</option>';
        selOrigen.disabled = true;
    }

    limpiarMapa();
    recorridoActual = datosLineasCargados[valorLinea];

    if (!recorridoActual || !recorridoActual.paradas.length) {
        alert('Los datos de esta línea no están disponibles.');
        selDestino.disabled = true;
        return;
    }

    dibujarRecorridoColectivo(recorridoActual.recorrido);

    recorridoActual.paradas.forEach((parada, idx) => {
        let opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = ' ' + parada.nombre;
        selDestino.appendChild(opt);
    });

    selDestino.disabled = false;
    document.getElementById('resumen-viaje').innerHTML =
        '<div class="paso-itinerario"><p>Paso 1: Camina hasta la parada más cercana.</p></div>' +
        '<div class="paso-itinerario"><p>Paso 2: Seleccioná tu parada de destino en el menú.</p></div>';
}

// --- Seleccionar destino ---
function alSeleccionarDestino() {
    let idxDestino = Number(document.getElementById('select-destino').value);
    let selOrigen = document.getElementById('select-origen');
    if (isNaN(idxDestino)) return;

    const confirmar = confirm('¿Querés que te sugiramos la parada de origen más cercana a tu posición actual?');
    const cercana = buscarParadaMasCercana(recorridoActual.paradas);

    if (selOrigen) {
        selOrigen.innerHTML = '<option value="" disabled>-- Seleccioná la parada de partida --</option>';
        recorridoActual.paradas.forEach((parada, idx) => {
            if (idx < idxDestino) {
                let opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = ' ' + parada.nombre;
                if (confirmar && idx === cercana.index) opt.selected = true;
                selOrigen.appendChild(opt);
            }
        });
        selOrigen.disabled = false;
    }

    if (confirmar) {
        recorridoActual.origenIndex = cercana.index;
        recorridoActual.origenParada = cercana.parada;
        recorridoActual.distanciaAPieKm = cercana.distanciaKm;
        trazarRutaAPie(ubicacionUsuario, [recorridoActual.origenParada.lat, recorridoActual.origenParada.lng]);
        calcularRutaYTiempo();
    } else {
        document.getElementById('resumen-viaje').innerHTML =
            '<div class="paso-itinerario"><p>Paso 3: Seleccioná manualmente la parada de partida donde vas a subir al colectivo.</p></div>';
    }
}

// --- Seleccionar origen ---
function alSeleccionarOrigen() {
    let selOrigen = document.getElementById('select-origen');
    if (!selOrigen) return;
    let idx = Number(selOrigen.value);
    if (isNaN(idx)) return;

    recorridoActual.origenIndex = idx;
    recorridoActual.origenParada = recorridoActual.paradas[idx];
    recorridoActual.distanciaAPieKm = calcularDistancia(
        [ubicacionUsuario.lat, ubicacionUsuario.lng],
        [recorridoActual.origenParada.lat, recorridoActual.origenParada.lng]
    );
    trazarRutaAPie(ubicacionUsuario, [recorridoActual.origenParada.lat, recorridoActual.origenParada.lng]);
    calcularRutaYTiempo();
}

// --- Dibujar recorrido del colectivo ---
function dibujarRecorridoColectivo(recorrido) {
    const coords = recorrido.slice(0, -1);
    lineaPolyline = L.polyline(coords, { color: '#2563eb', weight: 5, opacity: 0.7 }).addTo(mapa);

    if (coords.length > 0) mapa.fitBounds(lineaPolyline.getBounds());

    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();

    const paradasConIndice = recorridoActual.paradas.map((parada, index) => ({
        parada,
        index,
        idxRecorrido: obtenerIndiceCoordenadaMasCercana(coords, [parada.lat, parada.lng])
    }));

    paradasConIndice.sort((a, b) => a.idxRecorrido - b.idxRecorrido);

    paradasConIndice.forEach(({ parada, index, idxRecorrido }) => {
        let marker = L.circleMarker(coords[idxRecorrido], {
            radius: 6,
            color: '#1e3a8a',
            fillColor: '#3b82f6',
            fillOpacity: 0.8
        }).addTo(mapa);

        marker.on('click', () => {
            const horario = calcularHorarioEstimadoParada(recorridoActual.key, index, minutosAhora);
            let infoHtml = '';
            if (horario) {
                const tipo = horario.esInterpolado ? 'Horario estimado' : 'Horario programado';
                infoHtml = '<br><small>' + tipo + '</small>';
            } else {
                infoHtml = '<br><i>No hay horarios disponibles.</i>';
            }
            marker.bindPopup(
                '<div style="text-align: center;"><b> Parada:</b> ' + parada.nombre + '<br>' + infoHtml + '</div>'
            ).openPopup();
        });

        marcadoresParadas.push(marker);
    });
}

// --- Calcular ruta y tiempo ---
function calcularRutaYTiempo() {
    if (!ubicacionUsuario || !recorridoActual) return;

    let idxDestino = Number(document.getElementById('select-destino').value);
    let origenParada = recorridoActual.origenParada;
    let destinoParada = recorridoActual.paradas[idxDestino];
    if (!origenParada || !destinoParada) return;

    if (marcadorOrigenSugerido) mapa.removeLayer(marcadorOrigenSugerido);
    if (marcadorDestinoSeleccionado) mapa.removeLayer(marcadorDestinoSeleccionado);
    if (lineaTramoPolyline) { mapa.removeLayer(lineaTramoPolyline); lineaTramoPolyline = null; }

    marcadorOrigenSugerido = L.marker([origenParada.lat, origenParada.lng], { icon: iconoParadaSubida })
        .addTo(mapa).bindPopup('Subida: ' + origenParada.nombre);
    marcadorDestinoSeleccionado = L.marker([destinoParada.lat, destinoParada.lng], { icon: iconoParadaBajada })
        .addTo(mapa).bindPopup('Bajada: ' + destinoParada.nombre);

    let idxRecOrigen = obtenerIndiceCoordenadaMasCercana(recorridoActual.recorrido, [origenParada.lat, origenParada.lng]);
    let idxRecDestino = obtenerIndiceCoordenadaMasCercana(recorridoActual.recorrido, [destinoParada.lat, destinoParada.lng]);

    if (idxRecOrigen > idxRecDestino) {
        let temp = idxRecOrigen;
        idxRecOrigen = idxRecDestino;
        idxRecDestino = temp;
    }

    let tramoCoords = recorridoActual.recorrido.slice(idxRecOrigen, idxRecDestino + 1);
    lineaTramoPolyline = L.polyline(tramoCoords, { color: '#f97316', weight: 7, opacity: 0.95 }).addTo(mapa);
    mapa.fitBounds(lineaTramoPolyline.getBounds(), { padding: [40, 40] });

    // Distancia del tramo en colectivo
    let distanciaTramo = 0;
    for (let i = 0; i < tramoCoords.length - 1; i++) {
        distanciaTramo += calcularDistancia(tramoCoords[i], tramoCoords[i + 1]);
    }

    let minCamina = Math.max(1, Math.round(recorridoActual.distanciaAPieKm / 5 * 60));
    let minColectivo = Math.max(2, Math.round(distanciaTramo / 20 * 60));
    let cantParadas = Math.abs(idxDestino - recorridoActual.origenIndex);

    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    const horarioOrigen = calcularHorarioEstimadoParada(recorridoActual.key, recorridoActual.origenIndex, minutosAhora);

    let minEspera = 0;
    let infoHorario = '';

    if (horarioOrigen) {
        minEspera = Math.max(0, horarioOrigen.minutosLlegada - minutosAhora);
        let fuente = horarioOrigen.esInterpolado
            ? '<small style="color: #f97316; display: block;">Interpolado entre: <i>' + horarioOrigen.referenciaAnterior + '</i> y <i>' + horarioOrigen.referenciaSiguiente + '</i></small>'
            : '<small style="color: #10b981; display: block;">Horario fijo de tabla</small>';
        infoHorario =
            '<div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 8px; margin: 10px 0; border-radius: 4px;">' +
            'Próximo colectivo en subida: ' + horarioOrigen.horaEstimadaStr + ' hs ' +
            '(<b>Faltan ' + minEspera + ' min</b>)' + fuente + '</div>';
    }

    let tiempoTotal = minCamina + minEspera + minColectivo;

    document.getElementById('resumen-viaje').innerHTML =
        '<div class="paso-itinerario"><p>1. Tramo a pie: Camina ~' + minCamina + ' min (' +
        Math.round(recorridoActual.distanciaAPieKm * 1000) + 'm) hacia <b>' + origenParada.nombre + '</b>.</p></div>' +
        infoHorario +
        '<div class="paso-itinerario"><p>2. Tramo en colectivo: Toma la <b>' + recorridoActual.nombre +
        '</b> por ' + cantParadas + ' paradas (~' + minColectivo + ' min).</p></div>' +
        '<div class="paso-itinerario"><p>3. Destino: Bajate en la parada <b>' + destinoParada.nombre +
        '</b>.</p></div>' +
        '<p>Tiempo total estimado de viaje: ~' + tiempoTotal + ' min.</p>';
}

// --- Utilidades ---
function obtenerIndiceCoordenadaMasCercana(coordenadas, punto) {
    let menorDist = Infinity;
    let indice = 0;
    coordenadas.forEach((coord, idx) => {
        let d = calcularDistancia(coord, punto);
        if (d < menorDist) {
            menorDist = d;
            indice = idx;
        }
    });
    return indice;
}

function trazarRutaAPie(desde, hasta) {
    if (routingControlPie) mapa.removeControl(routingControlPie);
    routingControlPie = L.Routing.control({
        waypoints: [
            L.latLng(desde.lat, desde.lng),
            L.latLng(hasta[0], hasta[1])
        ],
        router: L.Routing.osrmv1({
            serviceUrl: 'https://routing.openstreetmap.de/routed-foot/route/v1',
            profile: 'foot'
        }),
        show: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        createMarker: function () { return null; },
        lineOptions: {
            styles: [{ color: '#8b5cf6', weight: 6, dashArray: '8, 8', opacity: 0.9 }]
        }
    }).addTo(mapa);
}

function buscarParadaMasCercana(paradas) {
    let mejorParada = null;
    let mejorIdx = -1;
    let menorDist = Infinity;

    paradas.forEach((parada, idx) => {
        let d = calcularDistancia(
            [ubicacionUsuario.lat, ubicacionUsuario.lng],
            [parada.lat, parada.lng]
        );
        if (d < menorDist) {
            menorDist = d;
            mejorParada = parada;
            mejorIdx = idx;
        }
    });

    return { parada: mejorParada, index: mejorIdx, distanciaKm: menorDist };
}

function calcularDistancia(p1, p2) {
    const R = 6371;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLng = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function limpiarMapa() {
    marcadoresParadas.forEach(m => mapa.removeLayer(m));
    marcadoresParadas = [];
    if (lineaPolyline) { mapa.removeLayer(lineaPolyline); lineaPolyline = null; }
    if (lineaTramoPolyline) { mapa.removeLayer(lineaTramoPolyline); lineaTramoPolyline = null; }
    if (routingControlPie) { mapa.removeControl(routingControlPie); routingControlPie = null; }
    if (marcadorOrigenSugerido) { mapa.removeLayer(marcadorOrigenSugerido); marcadorOrigenSugerido = null; }
    if (marcadorDestinoSeleccionado) { mapa.removeLayer(marcadorDestinoSeleccionado); marcadorDestinoSeleccionado = null; }
}
