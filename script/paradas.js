
// ============================================================
// script/paradas.js
// ============================================================

let nombreLineaActiva = "";
let datosParadasProcesados = [];
let datosGeograficos = null;

document.addEventListener("DOMContentLoaded", iniciarParadas);

// ============================================================
// INICIAR
// ============================================================

async function iniciarParadas() {
    const dataStr = localStorage.getItem("lineaSeleccionadaData");

    if (!dataStr) {
        alert("No se encontró información de la línea. Volviendo al inicio.");
        window.location.href = "index.html";
        return;
    }

    try {
        const dataCompleta = JSON.parse(dataStr);
        const datosLinea = dataCompleta.lineas ? dataCompleta.lineas[0] : dataCompleta;

        nombreLineaActiva = datosLinea.nombre || "Línea de Colectivo";

        const servicioHoy = dataCompleta.servicioHoy || {
            tipo: obtenerDiaActual(),
            etiqueta: "Servicio"
        };

        const matrizDias = obtenerServicios(datosLinea);
        if (matrizDias.length === 0) {
            console.error("No se encontró información de servicios/horarios.");
            return;
        }

        const configDia = matrizDias.find(
            s => normalizarTexto(s.dias) === normalizarTexto(servicioHoy.tipo)
        ) || matrizDias[0];

        const cabecerasHoy = configDia.cabeceras || [];
        const horariosHoy = configDia.horarios || [];

        actualizarCabecera(servicioHoy);

        datosGeograficos = await cargarDatosGeograficos(nombreLineaActiva);

        // Procesar horarios oficiales
        datosParadasProcesados = procesarTodosLosHorarios(horariosHoy, cabecerasHoy, datosGeograficos).flat();

        // Detectar paradas oficiales
        const paradasOficiales = new Set(cabecerasHoy.map(c => normalizarTexto(c)));

        // Calcular horarios estimados para cada salida del día
        horariosHoy.forEach(horarioSalida => {
            const estimados = calcularHorariosEstimados(datosGeograficos.paradas, horarioSalida);
            estimados.forEach(h => {
                // Solo agregamos las paradas que no tienen horario oficial
                if (!paradasOficiales.has(normalizarTexto(h.parada))) {
                    datosParadasProcesados.push(h);
                }
            });
        });

        console.log("Paradas procesadas:", datosParadasProcesados);

        renderizarListaParadas(datosParadasProcesados);

    } catch (error) {
        console.error("Error fatal al procesar las paradas:", error);
    }
}


// ============================================================
// CABECERA
// ============================================================

function actualizarCabecera(servicioHoy) {
    const tituloElem = document.getElementById("linea-titulo");
    const subtituloElem = document.getElementById("linea-empresa-dias");
    const estadoEstudianteElem = document.getElementById("estado-estudiantes");

    if (tituloElem) tituloElem.textContent = nombreLineaActiva;
    if (subtituloElem) subtituloElem.textContent = `Servicio: ${servicioHoy.etiqueta || servicioHoy.tipo}`;
    if (estadoEstudianteElem) {
        estadoEstudianteElem.textContent = servicioHoy.feriado ? "⚠️ Feriado" : "🎓 Pase Estudiantil Habilitado";
    }
}

// ============================================================
// NORMALIZAR SERVICIOS
// ============================================================

function obtenerServicios(datosLinea) {
    if (Array.isArray(datosLinea.servicios)) {
        return datosLinea.servicios.map(s => ({
            dias: s.días,
            cabeceras: s.cabeceras,
            horarios: s.horarios
        }));
    }
    if (Array.isArray(datosLinea.horarios_por_dia)) {
        return datosLinea.horarios_por_dia.map(s => ({
            dias: s.días,
            cabeceras: s.paradas,
            horarios: s.horarios
        }));
    }
    return [];
}

// ============================================================
// MAPEAR LÍNEA
// ============================================================

function obtenerNumeroLinea(lineaClave) {
    const clave = String(lineaClave).toLowerCase().trim();
    switch (clave) {
        case "linea a":
        case "línea a":
        case "linea_a": return "A";
        case "linea e":
        case "línea e":
        case "linea_e": return "E";
        case "linea este":
        case "línea este":
        case "este":
        case "linea_este": return "Este";
        case "linea oeste":
        case "línea oeste":
        case "oeste":
        case "linea_oeste": return "Oeste";
        default:
            console.warn("Clave de línea desconocida:", lineaClave);
            return "X";
    }
}

// ============================================================
// CARGAR JSON GEOGRÁFICO
// ============================================================

async function cargarDatosGeograficos(linea) {
    const numeroLinea = obtenerNumeroLinea(linea);
    const archivo = `datos/coordenadas/paradas_secundarias_Linea_${numeroLinea}.json`;

    try {
        console.log("Intentando cargar:", archivo);
        const respuesta = await fetch(archivo);
        if (!respuesta.ok) throw new Error("No encontrado");
        const datos = await respuesta.json();
        console.log("JSON geográfico cargado:", archivo);
        return datos;
    } catch {
        console.error("No se encontró JSON geográfico para:", linea);
        return null;
    }
}

// ============================================================
// PROCESAR HORARIOS
// ============================================================

function procesarTodosLosHorarios(horarios, cabeceras, datosGeo) {
    if (!horarios || !cabeceras) return [];
    return horarios.map(h => {
        return cabeceras.map(c => ({
            parada: c,
            hora: h[c] || null,
            geo: datosGeo ? datosGeo.paradas.find(p => normalizarTexto(p.nombre) === normalizarTexto(c)) : null
        }));
    });
}

// ============================================================
// CALCULAR HORARIOS ESTIMADOS
// ============================================================

function calcularHorariosEstimados(paradas, horariosBase) {
    const velocidadKmH = 25;
    const velocidadKmMin = velocidadKmH / 60;

    let resultados = [];
    let ultimoHorario = null;
    let ultimaParada = null;

    paradas.forEach((p) => {
        if (horariosBase[p.nombre]) {
            ultimoHorario = convertirHoraAMinutos(horariosBase[p.nombre]);
            ultimaParada = p;
            resultados.push({ parada: p.nombre, hora: horariosBase[p.nombre] });
        } else if (ultimoHorario !== null && ultimaParada) {
            const distanciaKm = calcularDistanciaKm(
                ultimaParada.lat, ultimaParada.lng,
                p.lat, p.lng
            );
            const tiempoMin = distanciaKm / velocidadKmMin;
            const horarioEstimado = ultimoHorario + tiempoMin;

            resultados.push({
                parada: p.nombre,
                hora: convertirMinutosAHora(horarioEstimado) + " (estimado)"
            });
            ultimoHorario = horarioEstimado;
            ultimaParada = p;
        }
    });

    return resultados;
}




// ============================================================
// RENDERIZAR PARADAS EN SELECT
// ============================================================

function renderizarListaParadas(lista) {
    const select = document.getElementById("paradas-select");
    if (!select) return;
    select.innerHTML = "";

    const paradasUnicas = new Map();
    lista.forEach(p => {
        const esSecundaria = String(p.hora).includes("(estimado)");
        if (!paradasUnicas.has(p.parada)) {
            paradasUnicas.set(p.parada, esSecundaria);
        }
    });

    paradasUnicas.forEach((esSecundaria, parada) => {
        const option = document.createElement("option");
        option.value = parada;
        option.textContent = parada;
        option.classList.add(esSecundaria ? "parada-secundaria" : "parada-oficial");
        select.appendChild(option);
    });
}




// ============================================================
// SELECCIONAR PARADA
// ============================================================

// ============================================================
// SELECCIONAR PARADA (mostrar TODAS las horas)
// ============================================================

function seleccionarParada() {
    const select = document.getElementById("paradas-select");
    const paradaSeleccionada = select.value;

    const titulo = document.getElementById("parada-seleccionada-titulo");
    const lista = document.getElementById("horarios-lista");
    const section = document.getElementById("horarios-section");

    if (!titulo || !lista || !section) return;

    titulo.textContent = `Horarios para: ${paradaSeleccionada}`;

    const ahora = new Date();
    const horarios = datosParadasProcesados
        .filter(p => normalizarTexto(p.parada) === normalizarTexto(paradaSeleccionada))
        .map(p => p.hora)
        .filter(h => h && h !== "null"); // 🔹 Filtramos los null

    lista.innerHTML = horarios.map(h => {
        const esEstimado = String(h).includes("(estimado)");
        const minutosRestantes = calcularMinutosRestantes(h, ahora);
        const esProximo = minutosRestantes >= 0 && minutosRestantes <= 30;

        return `<div class="horario-tag ${esEstimado ? "estimado" : ""} ${esProximo ? "proximo" : ""}">
                    ${h}
                </div>`;
    }).join("");

    section.classList.remove("hidden");

    // Mostrar cartel de recomendación para el próximo válido
    const proximo = horarios.find(h => calcularMinutosRestantes(h, ahora) >= 0);
    if (proximo) {
        const minutos = calcularMinutosRestantes(proximo, ahora);
        mostrarCartelRecomendacion(paradaSeleccionada, proximo, minutos);
    }
}


function calcularMinutosRestantes(horaStr, ahora) {
    const limpio = horaStr.replace("(estimado)", "").trim();
    const [h, m] = limpio.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    const horaBus = new Date(ahora);
    horaBus.setHours(h, m, 0, 0);
    return Math.round((horaBus - ahora) / 60000);
}


function mostrarCartelRecomendacion(parada, hora, minutos) {
    // Evitar mostrar cartel si la hora es null o inválida
    if (!hora || hora === "null" || minutos < 0) return;

    const cartel = document.createElement("div");
    cartel.className = "cartel-sugerencia";
    cartel.innerHTML = `
        <div class="cartel-contenido">
            <div class="cartel-icono">🚌</div>
            <p id="mensaje-recomendacion">
                El próximo colectivo para <strong>${parada}</strong> llega a las <strong>${hora}</strong>.<br>
                Te conviene salir ahora: faltan <strong>${minutos} min</strong>.
            </p>
            <button class="cerrar-cartel-btn" onclick="this.parentElement.parentElement.remove()">Cerrar</button>
        </div>
    `;
    document.body.appendChild(cartel);

    // Eliminar automáticamente después de 15 segundos
    setTimeout(() => {
        if (cartel && cartel.parentElement) {
            cartel.remove();
        }
    }, 15000);
}





// ============================================================
// FILTRAR PARADAS EN SELECT
// ============================================================

function filtrarParadas() {
    const input = document.getElementById("buscador-paradas");
    const filtro = normalizarTexto(input.value);
    const select = document.getElementById("paradas-select");

    if (!select) return;

    for (let option of select.options) {
        const texto = normalizarTexto(option.textContent);
        option.style.display = texto.includes(filtro) ? "" : "none";
    }
}

// ============================================================
// UTILIDADES
// ============================================================

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function obtenerDiaActual() {
    const dias = [
        "Domingos",
        "Lunes a Viernes",
        "Lunes a Viernes",
        "Lunes a Viernes",
        "Lunes a Viernes",
        "Lunes a Viernes",
        "Sábados"
    ];
    return dias[new Date().getDay()];
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function convertirHoraAMinutos(hora) {
    const [h, m] = hora.split(":").map(Number);
    return h * 60 + m;
}

function convertirMinutosAHora(minutos) {
    const h = Math.floor(minutos / 60) % 24;
    const m = Math.round(minutos % 60);
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
