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
        const seccionLogin = document.getElementById("seccion-login");
        const seccionPanel = document.getElementById("seccion-panel-trabajo");
        if (seccionLogin) {
            seccionLogin.classList.add("hidden");
            seccionLogin.style.display = "none";
        }
        if (seccionPanel) {
            seccionPanel.classList.remove("hidden");
            seccionPanel.style.display = "block";
        }
    } else {
        alert("Clave incorrecta. Acceso denegado.");
    }
}

// Modo demo: emula el comportamiento de panel.js sin guardar cambios en LocalStorage
let selectorLineas = null;
let contenedorEditor = null;
let demoDatos = null;

function inicializarDemo() {
    selectorLineas = document.getElementById('selector-lineas');
    contenedorEditor = document.getElementById('contenedor-editor');
    if (selectorLineas) {
        selectorLineas.addEventListener('change', (evento) => {
            const lineaSeleccionada = evento.target.value;
            if (lineaSeleccionada) {
                if (demoDatos && demoDatos[lineaSeleccionada]) {
                    dibujarEditorDemo(demoDatos[lineaSeleccionada], lineaSeleccionada);
                } else {
                    contenedorEditor.innerHTML = "<p>Línea seleccionada no encontrada en los registros de demo.</p>";
                }
            } else {
                contenedorEditor.innerHTML = "";
            }
        });
    }
    cargarDatosInicialesDemo();
}

// carga de datos en memoria (no guarda en localStorage)
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

        console.log('Datos cargados en memoria (modo demo).');
    } catch (error) {
        console.error('Error cargando JSON en modo demo:', error);
    }
}

function dibujarEditorDemo(datosDeLaLinea, idLinea) {
    contenedorEditor.innerHTML = "";

    if (!datosDeLaLinea || !datosDeLaLinea.lineas || !datosDeLaLinea.lineas[0]) {
        contenedorEditor.innerHTML = "<p>Error: Estructura de línea no encontrada o formato incompatible.</p>";
        return;
    }

    const infoLinea = datosDeLaLinea.lineas[0];

    // aviso visible en demo
    const aviso = document.createElement('p');
    aviso.style.color = '#b33';
    aviso.textContent = 'Modo Muestra: los cambios son temporales y NO se guardan.';
    contenedorEditor.appendChild(aviso);

    infoLinea.horarios.forEach((servicio, indiceViaje) => {
        const tarjetaViaje = document.createElement('div');
        tarjetaViaje.style.border = "1px solid #ccc";
        tarjetaViaje.style.padding = "15px";
        tarjetaViaje.style.marginBottom = "15px";
        tarjetaViaje.style.borderRadius = "8px";
        tarjetaViaje.style.backgroundColor = "#fff";
        tarjetaViaje.style.color = "#000";

        const tituloViaje = document.createElement('h3');
        tituloViaje.textContent = `Servicio N° ${indiceViaje + 1}`;
        tarjetaViaje.appendChild(tituloViaje);

        infoLinea.paradas.forEach(parada => {
            const contenedorCampo = document.createElement('div');
            contenedorCampo.style.marginBottom = "10px";

            const etiqueta = document.createElement('label');
            etiqueta.textContent = `${parada}: `;
            etiqueta.style.display = "inline-block";
            etiqueta.style.width = "150px";

            const selectorHora = document.createElement('input');
            selectorHora.type = "text";
            selectorHora.value = servicio[parada] || "";
            selectorHora.style.width = "100px";

            selectorHora.addEventListener('input', (e) => {
                const nuevoValor = e.target.value.trim();
                servicio[parada] = nuevoValor === "" ? null : nuevoValor;
            });

            contenedorCampo.appendChild(etiqueta);
            contenedorCampo.appendChild(selectorHora);
            tarjetaViaje.appendChild(contenedorCampo);
        });

        contenedorEditor.appendChild(tarjetaViaje);
    });
}

// inicializa el manejador de select y datos demo
inicializarDemo();
