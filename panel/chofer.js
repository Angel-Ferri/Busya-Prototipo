// panel/chofer.js

let datosCargados = null;

/**
 * Convierte una cadena de hora "HH:MM" a minutos desde las 00:00.
 * Si la hora cruza la medianoche (ej: 00:15 o 00:30), suma 1440 min (24h) 
 * para mantener la coherencia cronológica en el servicio nocturno.
 */
function horaAMinutos(horaStr, esServicioNocturno = false) {
    if (!horaStr) return null;
    const [h, m] = horaStr.split(':').map(Number);
    let total = h * 60 + m;

    // Manejo de horas pasadas la medianoche en la misma corrida
    if (esServicioNocturno && h < 4) {
        total += 1440;
    }
    return total;
}

/**
 * Formatea minutos a un formato legible en pantalla.
 */
function minutosATexto(minutos) {
    if (minutos === null || isNaN(minutos)) return '--';
    if (minutos < 0) return 'En parada';
    if (minutos < 60) return `${minutos} min`;
    const hrs = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${hrs} h ${mins} min`;
}

/**
 * Obtiene los minutos transcurridos en el día actual desde medianoche.
 */
function getMinutosActuales() {
    const ahora = new Date();
    return ahora.getHours() * 60 + ahora.getMinutes();
}

/**
 * Función principal para iniciar el panel una vez autenticado.
 */
async function iniciarPanelChofer() {
    try {
        // Carga los JSON ejecutando la función definida en main.js
        datosCargados = await cargarDatosLineas();
        
        const selector = document.getElementById('select-linea');
        if (!selector) return;

        const procesar = () => procesarLinea(selector.value);
        
        // Escucha el cambio de línea en el selector
        selector.addEventListener('change', procesar);
        
        // Ejecuta la primera evaluación de horarios
        procesar();

        // Actualiza automáticamente la pantalla cada 30 segundos
        setInterval(procesar, 30000);

    } catch (err) {
        console.error('❌ Error al inicializar la pantalla del chofer:', err);
    }
}

/**
 * Procesa la línea seleccionada y calcula tiempos/paradas.
 */
function procesarLinea(claveLinea) {
    if (!datosCargados || !datosCargados[claveLinea]) return;

    const jsonCompleto = datosCargados[claveLinea];
    if (!jsonCompleto.lineas || jsonCompleto.lineas.length === 0) return;

    const infoLinea = jsonCompleto.lineas[0];
    const paradas = infoLinea.paradas;
    const horarios = infoLinea.horarios;
    const minsActuales = getMinutosActuales();

    // 1. Mostrar información general de la línea
    const elInfoLinea = document.getElementById('info-linea');
    if (elInfoLinea) {
        elInfoLinea.textContent = `${infoLinea.nombre} (${infoLinea.días})`;
    }

    // 2. Determinar la próxima parada y tiempo restante
    let indiceServicioActual = -1;
    let proximaParadaNombre = 'Fin de servicio';
    let minutosFaltantesParada = null;

    for (let i = 0; i < horarios.length; i++) {
        const corrida = horarios[i];
        
        for (const parada of paradas) {
            const horaParada = corrida[parada];
            if (horaParada) {
                // Evalúa si la hora de la parada supera los minutos actuales
                const esMadrugada = horaParada.startsWith('00:');
                const minsParada = horaAMinutos(horaParada, esMadrugada);
                
                if (minsParada >= minsActuales) {
                    indiceServicioActual = i;
                    proximaParadaNombre = parada;
                    minutosFaltantesParada = minsParada - minsActuales;
                    break;
                }
            }
        }
        if (indiceServicioActual !== -1) break;
    }

    // Actualizar la interfaz para "Siguiente Parada"
    const elParada = document.getElementById('proxima-parada');
    const elTiempo = document.getElementById('tiempo-parada');

    if (elParada && elTiempo) {
        if (indiceServicioActual !== -1) {
            elParada.textContent = proximaParadaNombre;
            elTiempo.textContent = minutosATexto(minutosFaltantesParada);
        } else {
            elParada.textContent = 'Servicios finalizados por hoy';
            elTiempo.textContent = '--';
        }
    }

    // 3. Calcular la frecuencia con las unidades anterior y posterior
    calcularFrecuencia(horarios, paradas, indiceServicioActual);
}

/**
 * Calcula la distancia en minutos con el colectivo de adelante y el de atrás.
 */
function calcularFrecuencia(horarios, paradas, idxActual) {
    const labelAdelante = document.getElementById('tiempo-unidad-adelante');
    const labelAtras = document.getElementById('tiempo-unidad-atras');

    if (!labelAdelante || !labelAtras) return;

    if (idxActual === -1) {
        labelAdelante.textContent = '--';
        labelAtras.textContent = '--';
        return;
    }

    // Busca la primera parada válida del servicio actual para usar como referencia
    const primeraParada = paradas.find(p => horarios[idxActual][p] !== null) || paradas[0];
    const horaActualStr = horarios[idxActual][primeraParada];
    const minsServicioActual = horaAMinutos(horaActualStr);

    // --- Colectivo de Adelante (Servicio previo: idxActual - 1) ---
    if (idxActual > 0) {
        const horaAdelanteStr = horarios[idxActual - 1][primeraParada];
        if (horaAdelanteStr) {
            const minsAdelante = horaAMinutos(horaAdelanteStr);
            const dif = minsServicioActual - minsAdelante;
            labelAdelante.textContent = `A ${dif} min de distancia`;
        } else {
            labelAdelante.textContent = 'En cabecera';
        }
    } else {
        labelAdelante.textContent = 'Primera unidad';
    }

    // --- Colectivo de Atrás (Servicio posterior: idxActual + 1) ---
    if (idxActual < horarios.length - 1) {
        const horaAtrasStr = horarios[idxActual + 1][primeraParada];
        if (horaAtrasStr) {
            const minsAtras = horaAMinutos(horaAtrasStr);
            const dif = minsAtras - minsServicioActual;
            labelAtras.textContent = `A ${dif} min de distancia`;
        } else {
            labelAtras.textContent = '--';
        }
    } else {
        labelAtras.textContent = 'Última unidad';
    }
}

// --------------------------------------------------------------------------
// CONTROL DE INICIALIZACIÓN Y AUTENTICACIÓN
// --------------------------------------------------------------------------

// Escuchar el evento que dispara `panel/auth.js` tras ingresar la clave 1234
document.addEventListener('loginExitoso', () => {
    iniciarPanelChofer();
});

// En caso de que la página se refresque y la sesión siga activa en sessionStorage
if (sessionStorage.getItem('chofer_autenticado') === 'true') {
    document.addEventListener('DOMContentLoaded', () => {
        iniciarPanelChofer();
    });
}