
// panel/main.js

let demoDatos = null;

/**
 * Carga de forma paralela todos los archivos JSON de horarios ubicados en /datos/
 */
async function cargarDatosLineas() {
    if (demoDatos) return demoDatos;

    try {
        const [resA, resE, resEste, resOeste] = await Promise.all([
            fetch("datos/linea_a_horarios.json"),
            fetch("datos/linea_e_horarios.json"),
            fetch("datos/linea_este_horarios.json"),
            fetch("datos/linea_oeste_horarios.json")
        ]);

        demoDatos = {
            lineaa: await resA.json(),
            lineae: await resE.json(),
            lineaeste: await resEste.json(),
            lineaoeste: await resOeste.json()
        };

        console.log("✅ Horarios cargados correctamente:", demoDatos);
        return demoDatos;
    } catch (error) {
        console.error("❌ Error al cargar los JSON de líneas:", error);
        throw error;
    }
}

// Inicialización básica al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosLineas();
});
