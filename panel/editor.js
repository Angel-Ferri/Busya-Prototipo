// panel/editor.js

function sumarMinutosAHora(horaStr, minutosAgregar) {
    if (!horaStr || minutosAgregar === null) return "--:--";
    const minOriginales = convertirHoraAMinutos(horaStr);
    if (minOriginales === null) return "--:--";
    
    let totalMin = (minOriginales + minutosAgregar) % (24 * 60);
    if (totalMin < 0) totalMin += 24 * 60;

    const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const m = (totalMin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function calcularHoraPromedio(horaA, horaB) {
    const minA = convertirHoraAMinutos(horaA);
    const minB = convertirHoraAMinutos(horaB);

    if (minA === null && minB === null) return "--:--";
    if (minA === null) return horaB;
    if (minB === null) return horaA;

    const promedioMin = Math.round((minA + minB) / 2);
    const h = Math.floor(promedioMin / 60).toString().padStart(2, '0');
    const m = (promedioMin % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
}

function renderizarBloqueTiempos(horaApi, horaGMaps, coordDestino) {
    // 1. Hora API (Teórica / Programada)
    const hApi = horaApi || "--:--";

    // 2. Hora Google Maps (Tráfico estimado / simulado o via API)
    const hGmaps = horaGMaps || horaApi || "--:--";

    // 3. Hora Estimada por GPS Chofer (Basada en prox. parada y velocidad actual)
    const minsGps = estimarMinutosGPS(coordDestino);
    const ahora = new Date();
    const horaGpsActual = `${ahora.getHours().toString().padStart(2,'0')}:${ahora.getMinutes().toString().padStart(2,'0')}`;
    const hGps = minsGps !== null ? sumarMinutosAHora(horaGpsActual, minsGps) : "--:--";

    // 4. Hora Promedio (Mezcla de API + Google Maps)
    const hPromedio = calcularHoraPromedio(hApi, hGmaps);

    const container = document.createElement('div');
    container.className = 'grid-tiempos';

    container.innerHTML = `
        <div class="tarjeta-tiempo">
            <span class="tag">📱 API Teórica</span>
            <span class="valor">${hApi}</span>
        </div>
        <div class="tarjeta-tiempo">
            <span class="tag">🗺️ Google Maps</span>
            <span class="valor">${hGmaps}</span>
        </div>
        <div class="tarjeta-tiempo">
            <span class="tag">📍 GPS Chofer</span>
            <span class="valor">${hGps}</span>
        </div>
        <div class="tarjeta-tiempo promedio">
            <span class="tag">⚖️ Promedio (API+GM)</span>
            <span class="valor">${hPromedio}</span>
        </div>
    `;

    return container;
}