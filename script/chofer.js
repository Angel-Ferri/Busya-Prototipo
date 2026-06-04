// Seguridad: Hash SHA-256 de la contraseña "1234"
const HASH_ACCESO_CHOFER = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; 

let datosLineaActiva = null;
let archivoActual = "";
let paradaSeleccionadaActual = "";

// Base de datos simulada en memoria para registrar las pasadas reales de los choferes
// Estructura: { "Nombre de Parada": [minutos_del_dia_1, minutos_del_dia_2] }
let historialMarcajesReales = {};

// --- FUNCIONES DE CONTROL DE ACCESO ---
async function generarHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verificarIdentidad() {
    const inputClave = document.getElementById("clave-legajo").value;
    const hashInput = await generarHash(inputClave);

    if (hashInput === HASH_ACCESO_CHOFER) {
        document.getElementById("seccion-login").classList.add("hidden");
        document.getElementById("seccion-panel-trabajo").classList.remove("hidden");
    } else {
        alert("Clave incorrecta. Acceso denegado.");
    }
}

// --- CONTROL DE LÍNEA DE TRABAJO ---
function cambiarLineaDeTrabajo() {
    archivoActual = document.getElementById("select-linea").value;

    if (!archivoActual) {
        document.getElementById("control-recorridos-box").classList.add("hidden");
        document.getElementById("selector-paradas-box").classList.add("hidden");
        document.getElementById("frecuencias-box").classList.add("hidden");
        document.getElementById("horario-simulado-box").classList.add("hidden");
        return;
    }

    const rutaJson = `data/recorridos_originales/${archivoActual}`;

    fetch(rutaJson)
        .then(response => {
            if (!response.ok) throw new Error("Error cargando base de datos.");
            return response.json();
        })
        .then(data => {
            datosLineaActiva = data.lineas[0];
            
            document.getElementById("control-recorridos-box").classList.remove("hidden");
            document.getElementById("selector-paradas-box").classList.remove("hidden");
            document.getElementById("frecuencias-box").classList.add("hidden");
            document.getElementById("horario-simulado-box").classList.add("hidden");

            const vueltasGuardadas = localStorage.getItem(`vueltas_chofer_${archivoActual}`) || "0";
            document.getElementById("contador-vueltas-chofer").textContent = vueltasGuardadas;

            cargarParadasChofer(datosLineaActiva.paradas);
        })
        .catch(err => {
            console.error(err);
            alert("No se pudieron obtener los datos de la línea.");
        });
}

function modificarContadorChofer(valor) {
    if (!archivoActual) return;
    const elContador = document.getElementById("contador-vueltas-chofer");
    let actual = parseInt(elContador.textContent) || 0;
    
    actual += valor;
    if (actual < 0) actual = 0;

    elContador.textContent = actual;
    localStorage.setItem(`vueltas_chofer_${archivoActual}`, actual);
}

// --- CONVERSORES DE TIEMPO ---
function horaAMinutos(horaStr) {
    const [horas, minutos] = horaStr.split(':').map(Number);
    return (horas * 60) + minutos;
}

function minutosAHora(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60) % 24;
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

// --- INTERFAZ: BOTONES DE PARADAS ---
function cargarParadasChofer(paradas) {
    const contenedor = document.getElementById("paradas-lista-chofer");
    contenedor.innerHTML = "";

    paradas.forEach(parada => {
        const boton = document.createElement("button");
        boton.classList.add("parada-btn");
        boton.textContent = parada;
        
        boton.addEventListener("click", () => {
            document.querySelectorAll("#paradas-lista-chofer .parada-btn").forEach(btn => btn.classList.remove("active"));
            boton.classList.add("active");
            
            paradaSeleccionadaActual = parada;
            calcularFrecuenciaDeParada(parada);
            calcularHorarioSimuladoPredicho(); // Actualiza el cartel predictivo nuevo
        });
        contenedor.appendChild(boton);
    });
}

// --- CÁLCULO ESTÁTICO TRADICIONAL ---
function calcularFrecuenciaDeParada(nombreParada) {
    const panelFrecuencia = document.getElementById("frecuencias-box");
    const tituloParada = document.getElementById("titulo-parada-frecuencia");
    const valorFrecuencia = document.getElementById("frecuencia-calculada-valor");
    const detalleFrecuencia = document.getElementById("frecuencia-calculada-detalle");

    panelFrecuencia.classList.remove("hidden");
    tituloParada.textContent = `⏱️ Frecuencia en: ${nombreParada}`;

    const listaHorariosParada = [];
    datosLineaActiva.horarios.forEach(bloque => {
        if (bloque[nombreParada] !== null && bloque[nombreParada] !== undefined) {
            listaHorariosParada.push(bloque[nombreParada]);
        }
    });

    if (listaHorariosParada.length <= 1) {
        valorFrecuencia.textContent = "--";
        detalleFrecuencia.textContent = "Esta parada cuenta con un único horario de salida en todo el día.";
        return;
    }

    let sumaDiferencias = 0;
    let conteoIntervalos = 0;

    for (let i = 0; i < listaHorariosParada.length - 1; i++) {
        const minActual = horaAMinutos(listaHorariosParada[i]);
        const minSiguiente = horaAMinutos(listaHorariosParada[i + 1]);
        let diferencia = minSiguiente - minActual;
        if (diferencia < 0) diferencia += 1440; 

        sumaDiferencias += diferencia;
        conteoIntervalos++;
    }

    const frecuenciaPromedio = Math.round(sumaDiferencias / conteoIntervalos);
    valorFrecuencia.textContent = `${frecuenciaPromedio} min`;
    detalleFrecuencia.textContent = `Calculado sobre un total de ${listaHorariosParada.length} pasadas teóricas de la planilla.`;
}

// --- 📍 NUEVO: ACCIÓN DEL CHOFER EN TIEMPO REAL ---
function registrarPasoRealActual() {
    if (!paradaSeleccionadaActual) return;

    // Obtener la hora real de la computadora/móvil en formato HH:MM
    const ahora = new Date();
    const horaStr = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    const minutosActuales = horaAMinutos(horaStr);

    // Inicializar el arreglo de la parada si no existe
    if (!historialMarcajesReales[paradaSeleccionadaActual]) {
        historialMarcajesReales[paradaSeleccionadaActual] = [];
    }

    // Guardar el minuto del día de la pasada del chofer
    historialMarcajesReales[paradaSeleccionadaActual].push(minutosActuales);
    historialMarcajesReales[paradaSeleccionadaActual].sort((a, b) => a - b);

    alert(`¡Paso registrado exitosamente a las ${horaStr} en la parada seleccionada!`);
    
    // Forzar el recálculo dinámico automático del cartel
    calcularHorarioSimuladoPredicho();
}

// --- 🔮 NUEVO: ALGORITMO Y CARTEL DEL HORARIO SIMULADO ---
function calcularHorarioSimuladoPredicho() {
    const cartelSimulado = document.getElementById("horario-simulado-box");
    const valorSimulado = document.getElementById("horario-simulado-valor");
    const detalleSimulado = document.getElementById("horario-simulado-detalle");

    cartelSimulado.classList.remove("hidden");

    // Hora de consulta actual de la simulación
    const ahora = new Date();
    const minutosAhora = (ahora.getHours() * 60) + ahora.getMinutes();
    const unHoraAtras = minutosAhora - 60;

    const registrosParada = historialMarcajesReales[paradaSeleccionadaActual] || [];

    // Filtrar marcas de los choferes en los últimos 60 minutos
    const marcasUltimaHora = registrosParada.filter(minutos => minutos >= unHoraAtras && minutos <= minutosAhora);

    // Caso A: Insuficientes datos reales en la última hora (menos de 2 registros) -> Usamos el promedio teórico
    if (marcasUltimaHora.length < 2) {
        // Obtenemos el intervalo teórico que calculamos en la función de arriba
        const textoTeorico = document.getElementById("frecuencia-calculada-valor").textContent;
        const frecuenciaTeorica = parseInt(textoTeorico) || 15; // Por defecto 15 si falla

        const proximoMinutoEst = minutosAhora + frecuenciaTeorica;
        valorSimulado.textContent = minutosAHora(proximoMinutoEst);
        detalleSimulado.textContent = `Faltan datos de choferes en esta hora. Estimando usando el promedio de la planilla teórica (+${frecuenciaTeorica} min).`;
    } 
    // Caso B: ¡Tenemos tráfico real detectado en la última hora por los choferes!
    else {
        let sumaDiferenciasReales = 0;
        for (let i = 0; i < marcasUltimaHora.length - 1; i++) {
            sumaDiferenciasReales += (marcasUltimaHora[i + 1] - marcasUltimaHora[i]);
        }

        // Promedio real exacto en minutos de la última hora
        const frecuenciaRealPromedio = Math.round(sumaDiferenciasReales / (marcasUltimaHora.length - 1));

        // El próximo colectivo debería llegar partiendo desde la hora del último reporte más la frecuencia real
        const ultimoReporteChofer = marcasUltimaHora[marcasUltimaHora.length - 1];
        const proximoMinutoEst = ultimoReporteChofer + frecuenciaRealPromedio;

        valorSimulado.textContent = minutosAHora(proximoMinutoEst);
        detalleSimulado.style.color = "#28a745";
        detalleSimulado.innerHTML = `<strong>¡Optimizado con tráfico real!</strong> Promedio de paso actual: ${frecuenciaRealPromedio} min. Basado en ${marcasUltimaHora.length} colectivos recientes.`;
    }
}