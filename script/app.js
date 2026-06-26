// --- FUNCIÓN PARA DETECTAR FERIADOS (Nacionales, San Luis y Villa Mercedes) ---
function esFeriado(fecha) {
    const ano = fecha.getFullYear();
    const mes = fecha.getMonth() + 1; // Enero es 0
    const dia = fecha.getDate();
    const fechaClave = `${dia}/${mes}`;

    // Listado de feriados fijos (Nacionales, Provinciales y Locales)
    const feriadosFijos = [
        "1/1",   // Año Nuevo
        "24/3",  // Día de la Memoria
        "2/4",   // Malvinas
        "1/5",   // Día del Trabajador
        "25/5",  // Revolución de Mayo
        "20/6",  // Paso a la Inmortalidad del Belgrano
        "9/7",   // Día de la Independencia
        "17/8",  // San Luis - Paso a la Inmortalidad de San Martín
        "25/8",  // San Luis - Día de San Luis Rey (Provincial)
        "24/9",  // Villa Mercedes - Día de la Virgen de la Merced (Patronal Local)
        "12/10", // Día de la Diversidad Cultural
        "20/11", // Día de la Soberanía Nacional
        "1/12",  // Villa Mercedes - Aniversario de la Ciudad (Feriado Local)
        "8/12",  // Inmaculada Concepción
        "25/12"  // Navidad
    ];

    if (feriadosFijos.includes(fechaClave)) return true;

    // Feriados Variables / Trasladables y puentes del año en curso
    const feriadosVariables = {
        2026: ["2/3", "3/3", "23/3", "2/4", "3/4", "7/12"] 
    };

    if (feriadosVariables[ano] && feriadosVariables[ano].includes(fechaClave)) {
        return true;
    }

    return false;
}

// Función que se ejecuta al seleccionar una línea
function seleccionarLinea(nombreArchivoJson) {
    // Ruta exacta a tu carpeta de datos
    const rutaData = `data/recorridos_originales/${nombreArchivoJson}`;

    console.log(`Cargando datos desde: ${rutaData}`);

    // Usamos fetch nativo para leer el JSON
    fetch(rutaData)
        .then(response => {
            if (!response.ok) {
                throw new Error(`No se pudo cargar el archivo: ${nombreArchivoJson}`);
            }
            return response.json();
        })
        .then(data => {
            // --- CÁLCULO DEL BOLETÍN ESTUDIANTIL ---
            const ahora = new Date();
            const esDiaFeriado = esFeriado(ahora);
            const esFinDeSemana = (ahora.getDay() === 0 || ahora.getDay() === 6);
            
            let estadoEstudiante = { activa: true, razon: "" };

            if (esDiaFeriado) {
                estadoEstudiante = { activa: false, razon: "hoy es día feriado" };
            } else if (esFinDeSemana) {
                estadoEstudiante = { activa: false, razon: "es fin de semana" };
            } else {
                estadoEstudiante = { activa: true, razon: "es un día de semana hábil" };
            }

            // Inyectamos el estado calculado directamente dentro del objeto que guardaremos
            data.estadoEstudianteHoy = estadoEstudiante;
            // ---------------------------------------

            // Guardamos la información en el LocalStorage para usarla en la pantalla de paradas
            localStorage.setItem('lineaSeleccionada', JSON.stringify(data));
            
            // Redirigimos a la pantalla donde se mostrarán las paradas y horarios de esa línea
            window.location.href = 'paradas.html'; 
        })
        .catch(error => {
            console.error('Error al obtener el recorrido:', error);
            alert('Hubo un problema al cargar los recorridos de esta línea.');
        });
}

function abrirModalEstudiante() {
    const modal = document.getElementById("modal-estudiante");
    const titulo = document.getElementById("modal-estudiante-titulo");
    const mensaje = document.getElementById("modal-estudiante-mensaje");

    let estadoEstudianteHoy = null;
    const jsonLocal = localStorage.getItem('lineaSeleccionada');

    // 1. Si hay una línea seleccionada, intentamos usar el estado guardado
    if (jsonLocal) {
        const dataCompleta = JSON.parse(jsonLocal);
        estadoEstudianteHoy = dataCompleta.estadoEstudianteHoy;
    }

    // 2. Si no hay línea seleccionada (ej: estás en index.html antes de elegir), 
    // calculamos el estado en tiempo real para no tirar error.
    if (!estadoEstudianteHoy) {
        const ahora = new Date();
        const esDiaFeriado = esFeriado(ahora);
        const esFinDeSemana = (ahora.getDay() === 0 || ahora.getDay() === 6);
        
        if (esDiaFeriado) {
            estadoEstudianteHoy = { activa: false, razon: "hoy es día feriado" };
        } else if (esFinDeSemana) {
            estadoEstudianteHoy = { activa: false, razon: "es fin de semana" };
        } else {
            estadoEstudianteHoy = { activa: true, razon: "es un día de semana hábil" };
        }
    }

    // 3. Renderizamos el cartel con total seguridad de que 'estadoEstudianteHoy' existe
    if (estadoEstudianteHoy.activa) {
        titulo.innerHTML = "Pase Estudiantil: <span style='color:#16a34a;'>ACTIVO</span>";
        mensaje.innerHTML = `¡Buenas noticias! Como <strong>${estadoEstudianteHoy.razon}</strong>, el beneficio para estudiantes funciona con normalidad.`;
    } else {
        titulo.innerHTML = "Pase Estudiantil: <span style='color:#dc2626;'>INACTIVO</span>";
        mensaje.innerHTML = `Atención: Como <strong>${estadoEstudianteHoy.razon}</strong>, la tarjeta estudiantil no corre y se te cobrará tarifa plana o normal.`;
    }

    modal.classList.remove("hidden");
}
// Cierra el modal si se hace clic fuera del recuadro blanco
function cerrarModalEstudiante(event) {
    if (event.target.id === "modal-estudiante") {
        document.getElementById("modal-estudiante").classList.add("hidden");
    }
}