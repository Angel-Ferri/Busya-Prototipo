// --- MÓDULO COMÚN DE DÍAS DE SERVICIO ---
// Decide qué planilla de horarios corresponde a hoy (semana / sábado / domingo)
// y la carga. Lo usan index, paradas, mapa y chofer.
// Debe incluirse ANTES que el resto de los scripts.

const RUTA_DATA = 'data/recorridos_originales';

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

// Determina qué planilla rige hoy.
// Devuelve { tipo: "semana"|"sabado"|"domingo", etiqueta, feriado, estudianteActiva }
function resolverDiaDeServicio(fecha = new Date()) {
    const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const numeroDia = fecha.getDay();
    const feriado = esFeriado(fecha);

    // Los feriados se manejan con la planilla de domingo
    if (feriado) {
        return {
            tipo: "domingo",
            etiqueta: "Feriado (horarios de domingo)",
            feriado: true,
            estudianteActiva: false
        };
    }

    if (numeroDia === 0) {
        return { tipo: "domingo", etiqueta: "Domingo", feriado: false, estudianteActiva: false };
    }

    if (numeroDia === 6) {
        return { tipo: "sabado", etiqueta: "Sábado", feriado: false, estudianteActiva: false };
    }

    return {
        tipo: "semana",
        etiqueta: diasSemana[numeroDia],
        feriado: false,
        estudianteActiva: true
    };
}

// Arma la ruta al JSON según el tipo de día.
// "lineaa.json" + "sabado" -> "data/recorridos_originales/findes/sabado/lineaa_sabado.json"
function rutaHorarios(archivoBase, tipo) {
    const base = archivoBase.replace(/\.json$/, "");

    if (tipo === "sabado")  return `${RUTA_DATA}/findes/sabado/${base}_sabado.json`;
    if (tipo === "domingo") return `${RUTA_DATA}/findes/domingo/${base}_domingo.json`;

    return `${RUTA_DATA}/${base}.json`;
}

// Carga la planilla que corresponde a hoy para una línea.
// Si el archivo del fin de semana no existe, cae a la planilla de semana
// y lo deja marcado en servicioHoy.fallback para poder avisarlo en pantalla.
async function cargarHorariosDeHoy(archivoBase, fecha = new Date()) {
    const dia = resolverDiaDeServicio(fecha);

    let respuesta = await fetch(rutaHorarios(archivoBase, dia.tipo));
    let fallback = false;

    if (!respuesta.ok && dia.tipo !== "semana") {
        console.warn(`Sin planilla de ${dia.tipo} para ${archivoBase}. Usando la de lunes a viernes.`);
        respuesta = await fetch(rutaHorarios(archivoBase, "semana"));
        fallback = true;
    }

    if (!respuesta.ok) {
        throw new Error(`No se pudo cargar el archivo: ${archivoBase}`);
    }

    const data = await respuesta.json();

    data.servicioHoy = {
        tipo: dia.tipo,
        etiqueta: fallback ? `${dia.etiqueta} (mostrando horarios de lunes a viernes)` : dia.etiqueta,
        feriado: dia.feriado,
        fallback: fallback
    };

    // El pase estudiantil no corre los fines de semana ni los feriados
    data.estadoEstudianteHoy = dia.estudianteActiva
        ? { activa: true, razon: "es un día de semana hábil" }
        : { activa: false, razon: dia.feriado ? "hoy es día feriado" : "es fin de semana" };

    return data;
}
