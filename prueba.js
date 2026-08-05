// Script de referencia para la API de arribos en tiempo real.
// Lee los colectivos de Sol Bus en Villa Mercedes desde colectivoya.com.
//
// Verificado funcionando el 04/08/2026 18:52 (martes, hora pico).
// Requiere: npm install axios axios-cookiejar-support tough-cookie
//
// IMPORTANTE: el orden de los pedidos no es opcional. El servidor guarda la
// empresa y la localidad en la sesión PHP; si se llama a mostrarparadas.php
// sin haber pasado antes por mostrarempresas.php y mostrarlocalidad.php,
// devuelve una lista vacía sin ningún error.
//
// PENDIENTE antes de llevarlo a producción: este script consulta las 362
// paradas una atrás de otra y sin pausa. Sirve para probar, pero la API real
// tiene que cachear el resultado y no repetir el barrido por cada usuario.

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

async function obtenerColectivosSolBus() {
  const jar = new CookieJar();
  const client = wrapper(axios.create({ jar }));

  try {
    console.log('⏳ Obteniendo colectivos de Sol Bus en Villa Mercedes...\n');

    // Primero visitar la página para establecer cookies
    console.log('🔐 Estableciendo sesión...');
    await client.get('http://www.colectivoya.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      }
    });
    console.log('✅ Sesión establecida\n');

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'http://www.colectivoya.com/',
      'X-Requested-With': 'XMLHttpRequest',
    };

    // 1. Obtener empresas
    console.log('🔍 Buscando empresas...');
    const empresasRes = await client.get('http://www.colectivoya.com/php/mostrarempresas.php', { headers });
    const empresas = empresasRes.data;
    console.log(`✅ ${empresas.length} empresas encontradas`);

    const solBus = empresas.find(e => e.descripcion.toUpperCase().includes('SOL BUS'));

    if (!solBus) {
      console.log('❌ Sol Bus no encontrada');
      return;
    }
    console.log(`✅ Empresa: ${solBus.descripcion} (ID: ${solBus.id})\n`);

    // 2. Obtener localidades
    console.log('🔍 Buscando localidades...');
    const localidadesRes = await client.get(`http://www.colectivoya.com/php/mostrarlocalidad.php?idempresa=${solBus.id}`, { headers });
    const localidades = localidadesRes.data;
    console.log(`✅ ${localidades.length} localidades encontradas`);

    const villaMercedes = localidades.find(l => l.descripcion.toUpperCase().includes('VILLA MERCEDES'));

    if (!villaMercedes) {
      console.log('❌ Villa Mercedes no encontrada');
      return;
    }
    console.log(`✅ Localidad: ${villaMercedes.descripcion} (ID: ${villaMercedes.id})\n`);

    // 3. Obtener paradas
    console.log('🔍 Buscando paradas...');
    const paradasRes = await client.get(`http://www.colectivoya.com/php/mostrarparadas.php?localidad=${villaMercedes.id}&i=-1`, { headers });
    const paradas = paradasRes.data;
    console.log(`✅ ${paradas.length} paradas encontradas\n`);

    if (paradas.length > 0) {
      console.log('📋 Estructura de primera parada:');
      console.log(paradas[0]);
      console.log('\n');
    }

    // 4. Obtener colectivos
    const colectivos = [];
    let paradasConColectivos = 0;
    let paradasSinColectivos = 0;

    console.log('🔍 Consultando colectivos en cada parada...\n');

    for (let i = 0; i < paradas.length; i++) {
      const parada = paradas[i];
      const idParada = parada.id_parada || parada.id || parada.ID;

      if (!idParada) {
        console.log(`⚠️ Parada ${i+1} sin ID`);
        continue;
      }

      try {
        const arribosRes = await client.get(`http://www.colectivoya.com/php/arribos.php?idparada=${idParada}`, { headers });
        const arribos = arribosRes.data;

        if (Array.isArray(arribos) && arribos.length > 0 && !arribos.ERROR) {
          console.log(`✅ Parada ${i+1}/${paradas.length} - ${parada.descripcion}: ${arribos.length} colectivos`);
          paradasConColectivos++;

          arribos.forEach(col => {
            colectivos.push({
              parada: parada.descripcion,
              interno: col.interno,
              tiempo: col.tiempo,
              ramal: col.descripcion,
              latitud: col.latitud,
              longitud: col.longitud,
              teorico: col.teorico ? '(T)' : ''
            });
          });
        } else {
          paradasSinColectivos++;
        }
      } catch (err) {
        paradasSinColectivos++;
      }
    }

    // Mostrar resultados
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(60));
    console.log(`Total colectivos: ${colectivos.length}`);
    console.log(`Paradas con colectivos: ${paradasConColectivos}`);
    console.log(`Paradas sin colectivos: ${paradasSinColectivos}`);

    if (colectivos.length > 0) {
      // Agrupar por interno
      const porInterno = {};
      colectivos.forEach(col => {
        const key = `${col.interno}${col.teorico}`;
        if (!porInterno[key]) {
          porInterno[key] = [];
        }
        porInterno[key].push(col);
      });

      // Mostrar cada interno por separado
      console.log('\n🚌 COLECTIVOS EN MOVIMIENTO:\n');

      Object.keys(porInterno).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''));
        const numB = parseInt(b.replace(/\D/g, ''));
        return numA - numB;
      }).forEach(key => {
        const arribos = porInterno[key];
        arribos.sort((a, b) => parseInt(a.tiempo) - parseInt(b.tiempo));

        console.log('─'.repeat(60));
        console.log(`🚍 Interno ${key} - ${arribos[0].ramal} (${arribos.length} arribos)`);
        console.log('─'.repeat(60));
        console.table(arribos);
        console.log('');
      });

      // Guardar en JSON
      const fs = require('fs');
      fs.writeFileSync('colectivos.json', JSON.stringify(colectivos, null, 2));
      console.log('\n✅ Datos guardados en colectivos.json');
    } else {
      console.log('❌ No se encontraron colectivos');
    }

    return colectivos;

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

// Ejecutar
obtenerColectivosSolBus();
