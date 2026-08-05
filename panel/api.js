let demoDatos = null;

async function cargarDatosLineas() {
    if (demoDatos) return demoDatos;

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

        return demoDatos;
    } catch (error) {
        console.error('❌ Error al cargar los JSON:', error);
        throw error;
    }
}