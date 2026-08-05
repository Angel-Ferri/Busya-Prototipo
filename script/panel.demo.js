// --- CONFIGURACIÓN & ESTADO DE LA APLICACIÓN ---
const HASH_ACCESO_CHOFER = "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4"; 

let demoDatos = null;

// --- INICIALIZACIÓN DE EVENTOS ---
document.addEventListener("DOMContentLoaded", () => {
    inicializarFormularioLogin();
    inicializarSelectorLineas();
});

// --- CRIPTOGRAFÍA & AUTENTICACIÓN ---
async function generarHash(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function inicializarFormularioLogin() {
    const formLogin = document.getElementById("form-login");
    const inputClave = document.getElementById("clave-legajo");

    if (!formLogin) return;

    formLogin.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        const claveIngresada = inputClave.value.trim();
        if (!claveIngresada) return;

        const hashInput = await generarHash(claveIngresada);

        if (hashInput === HASH_ACCESO_CHOFER) {
            transicionAPanelTrabajo();
        } else {
            alert("⚠️ Clave de legajo incorrecta. Acceso denegado.");
            inputClave.value = "";
            inputClave.focus();
        }
    });
}

function transicionAPanelTrabajo() {
    const seccionLogin = document.getElementById("seccion-login");
    const seccionPanel = document.getElementById("seccion-panel-trabajo");

    if (seccionLogin && seccionPanel) {
        seccionLogin.classList.add("hidden");
        seccionPanel.classList.remove("hidden");
        cargarDatosInicialesDemo();
    }
}

// --- MODO DEMO: GESTIÓN DE DATOS & EDITOR ---
function inicializarSelectorLineas() {
    const selectorLineas = document.getElementById('selector-lineas');
    const contenedorEditor = document.getElementById('contenedor-editor');

    if (!selectorLineas || !contenedorEditor) return;

    selectorLineas.addEventListener('change', (evento) => {
        const lineaSeleccionada = evento.target.value;
        
        if (lineaSeleccionada && demoDatos && demoDatos[lineaSeleccionada]) {
            dibujarEditorDemo(demoDatos[lineaSeleccionada]);
        } else if (lineaSeleccionada) {
            contenedorEditor.innerHTML = `<p class="mensaje-error">Cargando registros de la línea...</p>`;
        } else {
            contenedorEditor.innerHTML = "";
        }
    });
}

async function cargarDatosInicialesDemo() {
    if (demoDatos) return;

    try {
        const [resA, resE, resEste, resOeste] = await Promise.all([
            fetch('data/recorridos_originales/lineaa.json'),
            fetch('data/recorridos_originales/lineae.json'),
            fetch('data/recorridos_originales/lineaeste.json'),
            fetch('data/recorridos_originales/lineaoeste.json')
        ]);

        demoDatos = {
            lineaa: await resA.json(),
            lineae: await resE.json(),
            lineaeste: await resEste.json(),
            lineaoeste: await resOeste.json()
        };

        console.log('✅ Datos cargados en memoria.');
    } catch (error) {
        console.error('❌ Error al cargar los JSON:', error);
        const contenedorEditor = document.getElementById('contenedor-editor');
        if (contenedorEditor) {
            contenedorEditor.innerHTML = `<p class="mensaje-error">Error al cargar datos. Inicia la app desde un servidor web (Live Server).</p>`;
        }
    }
}

// Convierte "HH:MM" a minutos transcurridos en el día para comparaciones precisas
function convertirHoraAMinutos(horaStr) {
    if (!horaStr) return null;
    const [horas, minutos] = horaStr.split(':').map(Number);
    return horas * 60 + minutos;
}

function obtenerMinutosHoraActual() {
    const ahora = new Date();
    return ahora.getHours() * 60 + ahora.getMinutes();
}

function dibujarEditorDemo(datosDeLaLinea) {
    const contenedorEditor = document.getElementById('contenedor-editor');
    if (!contenedorEditor) return;

    contenedorEditor.innerHTML = "";

    if (!datosDeLaLinea?.lineas?.[0]) {
        contenedorEditor.innerHTML = "<p>Error: Estructura de línea no encontrada o incompatible.</p>";
        return;
    }

    const infoLinea = datosDeLaLinea.lineas[0];
    const minutosActuales = obtenerMinutosHoraActual();
    
    // Identificar cuál servicio es el que más se aproxima o está activo ahora
    let servicioActivoIndice = -1;
    let menorDiferencia = Infinity;

    infoLinea.horarios.forEach((servicio, index) => {
        const primeraParada = infoLinea.paradas[0];
        const horaInicio = servicio[primeraParada];
        const minutosInicio = convertirHoraAMinutos(horaInicio);

        if (minutosInicio !== null) {
            const diferencia = Math.abs(minutosActuales - minutosInicio);
            if (diferencia < menorDiferencia) {
                menorDiferencia = diferencia;
                servicioActivoIndice = index;
            }
        }
    });

    infoLinea.horarios.forEach((servicio, indiceViaje) => {
        const esServicioActual = indiceViaje === servicioActivoIndice;
        
        const tarjetaViaje = document.createElement('article');
        tarjetaViaje.className = `tarjeta-servicio ${esServicioActual ? 'servicio-en-curso' : ''}`;

        // Encabezado del Servicio
        const headerViaje = document.createElement('div');
        headerViaje.className = 'header-servicio';

        const tituloViaje = document.createElement('h3');
        tituloViaje.innerHTML = `Servicio N° ${indiceViaje + 1} ${esServicioActual ? '<span class="badge-en-vivo">● EN CURSO</span>' : ''}`;
        headerViaje.appendChild(tituloViaje);

        // Botón para alternar el Historial de Paradas
        const btnHistorial = document.createElement('button');
        btnHistorial.type = "button";
        btnHistorial.className = 'btn-toggle-historial';
        btnHistorial.textContent = '📜 Ver historial de paradas';
        headerViaje.appendChild(btnHistorial);

        tarjetaViaje.appendChild(headerViaje);

        // Contenedor de Paradas
        const contenedorParadas = document.createElement('div');
        contenedorParadas.className = 'lista-paradas';

        infoLinea.paradas.forEach((parada, idxParada) => {
            const contenedorCampo = document.createElement('div');
            // Las paradas anteriores a la última se consideran "historial"
            const esParadaPasada = idxParada < infoLinea.paradas.length - 1;
            
            contenedorCampo.className = `form-group-inline ${esParadaPasada ? 'parada-pasada es-historial hidden' : ''}`;

            const etiqueta = document.createElement('label');
            etiqueta.textContent = `${parada}:`;

            const selectorHora = document.createElement('input');
            selectorHora.type = "time";
            selectorHora.value = servicio[parada] || "";

            selectorHora.addEventListener('input', (e) => {
                const nuevoValor = e.target.value.trim();
                servicio[parada] = nuevoValor === "" ? null : nuevoValor;
            });

            contenedorCampo.appendChild(etiqueta);
            contenedorCampo.appendChild(selectorHora);
            contenedorParadas.appendChild(contenedorCampo);
        });

        tarjetaViaje.appendChild(contenedorParadas);

        // Evento para mostrar/ocultar el historial
        btnHistorial.addEventListener('click', () => {
            const paradasHistorial = contenedorParadas.querySelectorAll('.es-historial');
            const estaDesplegado = paradasHistorial[0]?.classList.contains('hidden');

            paradasHistorial.forEach(el => el.classList.toggle('hidden'));
            btnHistorial.textContent = estaDesplegado ? '🙈 Ocultar historial' : '📜 Ver historial de paradas';
        });

        contenedorEditor.appendChild(tarjetaViaje);
    });
}