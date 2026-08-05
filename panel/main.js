let demoDatos = null;

/**
 * Retorna un objeto con la ruta base y el sufijo según el día de la semana
 */
function getConfiguracionRuta() {
    const diaSemana = new Date().getDay(); // 0 = Domingo, 6 = Sábado
    
    if (diaSemana === 6) {
        return {
            base: 'data/recorridos_originales/findes/sabado/',
            sufijo: '_sabado.json'
        };
    } else if (diaSemana === 0) {
        return {
            base: 'data/recorridos_originales/findes/domingo/',
            sufijo: '_domingo.json'
        };
    } else {
        return {
            base: 'data/recorridos_originales/',
            sufijo: '.json'
        };
    }
}

async function cargarDatosLineas() {
    if (demoDatos) return demoDatos;

    const { base, sufijo } = getConfiguracionRuta();

    try {
        const [resA, resE, resEste, resOeste] = await Promise.all([
            fetch(`${base}lineaa${sufijo}`),
            fetch(`${base}lineae${sufijo}`),
            fetch(`${base}lineaeste${sufijo}`),
            fetch(`${base}lineaoeste${sufijo}`)
        ]);

        demoDatos = {
            lineaa: await resA.json(),
            lineae: await resE.json(),
            lineaeste: await resEste.json(),
            lineaoeste: await resOeste.json()
        };

        return demoDatos;
    } catch (error) {
        console.error('❌ Error al cargar los JSON de líneas:', error);
        throw error;
    }
}