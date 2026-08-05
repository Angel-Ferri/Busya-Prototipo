# Busya — Cómo queremos que quede

Documento de producto. Define **qué es Busya y qué no**, para que cualquiera del equipo
pueda decidir por su cuenta si una idea nueva entra o no entra.

No es un plan de tareas ni un cronograma. Es el destino.

---

## En una frase

> **La grilla dice cuándo debería pasar el colectivo. Busya te dice si hoy se está cumpliendo.**

El horario ya existe y es confiable como plan: la planilla refleja el servicio que Solbus
presta. Eso no hay que reinventarlo.

Lo que hoy no te dice nadie es si **el de hoy, a esta hora, viene atrasado o adelantado**.
Esa es la información que falta y la que hace que valga la pena abrir la app.

No competimos con Google Maps ni con una app de la empresa. Ocupamos un lugar mucho más
chico y mucho más defendible: ser los únicos que responden esa pregunta.

---

## El problema: atrasos y adelantos

Un horario de papel te dice que el colectivo pasa 19:14. Lo que no te dice es que hoy hay
tráfico y viene 19:22. O peor: que viene 19:11 y si llegás a horario lo perdés.

**El adelanto es el caso más caro para el usuario y el que nadie mira.** Un colectivo
atrasado te hace esperar; uno adelantado te lo hace perder, y con una frecuencia de 23
minutos eso es media hora de tu vida. Un aviso de "viene 3 minutos antes" puede ser lo más
útil que haga la app en todo el día.

Entonces la unidad de información de Busya no es la hora de paso. Es **el desvío**:

```
        Línea A            19:20
        🔴 atrasado 6 min
        grilla 19:14 · en vivo · interno 181
```

Todo lo demás del producto existe para calcular bien ese número, o para ser honesto cuando
no lo podemos calcular.

### Cómo se mide

1. **Se cruza el colectivo con su vuelta en la grilla.** Cada interno que reporta se
   corresponde con una fila de la planilla; comparando la hora estimada de paso contra la
   programada sale el desvío.
2. **Se calcula en los puntos que podemos.** Verificado: **30 de nuestras 34 paradas cruzan
   con una parada de colectivoya**, la mayoría a menos de 10 metros. En Línea E, 9 de 10.
   O sea que el cruce es posible hoy, sin datos nuevos.
3. **Se propaga al resto del recorrido** con los tiempos entre paradas (ver más abajo). Si la
   vuelta viene 6 minutos atrasada en Terminal, viene 6 minutos atrasada en tu esquina.

> **Cuidado al emparejar vueltas.** En hora pico la Línea A sale cada 5 minutos; un atraso de
> 10 minutos puede hacer que confundamos un colectivo con el de la vuelta siguiente y que el
> desvío dé casi cero. La forma de evitarlo es **enganchar el interno con su vuelta cuando
> sale de la cabecera**, que es cuando no hay ambigüedad, y mantener esa asociación mientras
> circula usando `distancia`.

---

## Los tres principios

Todo lo que construyamos tiene que pasar estos tres filtros. Si una idea rompe alguno,
no va, por buena que suene.

### 1. Nunca mentir sobre lo que sabemos

Tenemos dos fuentes de calidad muy distinta: el GPS real de algunos colectivos y las
planillas de papel del resto. En la pantalla se tienen que ver distinto, siempre.

Son cuatro estados, nunca uno solo:

| Estado | Cuándo | Cómo se muestra |
|---|---|---|
| **Atrasado / adelantado** | Sabemos el desvío de esa vuelta | `19:20` · atrasado 6 min · grilla 19:14 |
| **En horario** | Reporta y coincide con la grilla | `19:14` · en horario |
| **Según grilla** | Esa vuelta no reporta | `19:14` · según grilla, sin confirmar |
| **Sin dato** | Fuera de servicio o no pudimos consultar | "No sabemos. La grilla dice 19:40" |

La diferencia entre las filas 3 y 4 es la que más cuesta y la que más importa: **"no reporta"
no es lo mismo que "no viene"**.

Si decimos "7 minutos" con la seguridad de un GPS que no tenemos y el colectivo no aparece,
el usuario no vuelve nunca más. Y tiene razón en no volver. Preferimos decir "no sabemos"
antes que inventar precisión.

### 2. Contestar en la esquina donde está el usuario

Las planillas tienen 9 o 10 paradas por línea. El colectivo pasa por muchas más esquinas
que esas, y el usuario está parado donde está, no en una de nuestras diez paradas con nombre.

Decirle "el colectivo pasa por Terminal a las 19:14" cuando él está seis cuadras después
no le sirve: le falta el dato de cuánto tarda en llegar desde ahí hasta donde él está.

La app tiene que poder estimar el paso **en cualquier punto del recorrido**, no solo en los
puntos que quedaron escritos en la grilla.

### 3. Cero toques

La pregunta del usuario es *"estoy acá, ¿cuándo pasa algo que me sirva?"*.

Hoy le pedimos que sepa la línea, la parada, y cómo se escribe esa parada, antes de
contestarle. Está al revés. La app tiene que abrir ya contestada, y que elegir a mano sea
la excepción, no el camino obligatorio.

---

## Para quién

| Quién | Qué necesita | Prioridad |
|---|---|---|
| El que espera en la parada | Cuánto falta, ahora, sin tocar nada | **Principal** |
| El que planifica desde casa | A qué hora salir para llegar | Alta |
| El que no conoce las líneas | Qué colectivo lo lleva a un lugar | Alta |
| Estudiantes | Si corre el pase hoy, dónde recargar | Media |
| Choferes y empresa | Frecuencia real, datos de servicio | Secundaria |

El usuario principal es **el que ya está en la parada**. Cuando haya que decidir entre dos
diseños, gana el que sirve parado en la esquina, con una mano, apurado y con sol en la
pantalla.

---

## Cómo se ve la app terminada

### Inicio — la parada más cercana

Abrís y ya está resuelto:

```
        Estás en Balcarce y Urquiza
        ─────────────────────────────
        Línea A     19:20  (en 6 min)
        🔴 atrasado 6 min · grilla 19:14
        en vivo · interno 181 · a 3 cuadras

        Línea E     19:31  (en 17 min)
        ⚪ según grilla, sin confirmar
        a 5 cuadras
```

La hora de paso y el desvío juntos. La hora sola no alcanza —no sabés si confiar— y el
desvío solo tampoco —no sabés a qué hora salir—.

- Ubica la parada más cercana con el GPS y muestra la cuenta regresiva.
- **Cuenta regresiva, no lista de horarios.** "En 7 min" se entiende de un vistazo;
  "07:14, 07:29, 07:44" te obliga a hacer la cuenta.
- Dice a cuántas cuadras está la parada, para que sepas si llegás.
- Si no hay GPS o no diste permiso, cae al selector de líneas de siempre. Nunca se rompe.
- Si estás fuera de Villa Mercedes, lo dice y ofrece elegir a mano.

### Parada — el detalle

- Todos los horarios del día, con el próximo destacado.
- Qué planilla rige hoy: semana, sábado, domingo o feriado.
- Botón para reportar (ver abajo).
- Se puede guardar como favorita y aparece primera la próxima vez.

### Destinos — buscar al revés

Nadie quiere "la Línea E". Quiere llegar al hospital.

Buscás un lugar (hospital, terminal, facultad, un barrio) y te dice qué línea tomar, desde
qué parada, y cuánto falta para la próxima. Es la puerta de entrada para el que no conoce
el sistema.

### Recarga — dónde cargar la tarjeta

Mapa y lista de puntos de recarga, ordenados por cercanía, con dirección y horario de
atención. Simple y completo.

### Mapa — el recorrido

El mapa de calor que ya existe, mostrando por dónde anda el servicio según la planilla.

### Panel interno — choferes y empresa

Lo que ya hay: contador de vueltas y frecuencia por parada. Se mantiene, pero no es la cara
del producto y no compite por espacio en la pantalla del usuario.

---

## Entre paradas: estimar en cualquier esquina

La grilla dice que el colectivo pasa por Terminal a las 19:14 y por Balcarce y Urquiza a las
19:28. Entre esos dos puntos hay catorce minutos y un montón de esquinas sobre las que no
decimos nada. Si estás en una de esas esquinas, la app hoy no te sirve.

**La idea:** calcular cuánto tarda en auto el recorrido calle por calle, y usar ese tiempo
para repartir los minutos entre parada y parada. Si Terminal → Balcarce son 14 minutos y tu
esquina está al 40% del camino, el colectivo pasa por vos alrededor de las 19:20.

### Qué hace falta para eso

**Las 362 paradas reales.** Colectivoya ya nos las dio, con coordenadas. Nuestra grilla tiene
9 o 10 por línea; el sistema real tiene 362 en la ciudad. Eso solo ya multiplica por mucho
los puntos sobre los que podemos contestar.

**El trazado calle por calle de cada línea.** Un motor de ruteo devuelve el camino real por
las calles entre dos puntos, con el tiempo de cada tramo.

**Se calcula una sola vez.** Esto es lo importante: el recorrido de la Línea A no cambia de
un día para el otro. Se calcula una vez, se guarda como JSON en el repo, y de ahí en más la
estimación es una cuenta local que no le pide nada a nadie. No hay costo por consulta ni
dependencia en caliente.

> **Cuidado con Google Maps para esto.** La Directions API se factura por consulta y sus
> términos limitan guardar los resultados. Para un cálculo que hacemos una vez y guardamos
> para siempre, conviene un motor abierto: **OSRM**, **OpenRouteService** o **Valhalla**
> dan lo mismo, gratis y sin restricción de almacenamiento. El dato que queremos —tiempo de
> viaje entre dos puntos por calle— lo dan los tres.

### Y después, lo mejor: medirlo de verdad

El tiempo en auto es una aproximación: el colectivo para, sube gente, espera semáforos.
Siempre va a tardar más.

Pero una vez que el GPS esté conectado, cada colectivo que circula nos está diciendo cuánto
tarda **realmente** entre dos puntos. Después de unas semanas guardando eso, la estimación
deja de salir de un motor de ruteo y pasa a salir de lo que hacen los colectivos de verdad,
a esa hora y ese día de la semana.

Ahí la app sabe algo que no sabe nadie más, ni Google: cuánto tarda **este** colectivo entre
**estas** dos esquinas un martes a las siete de la tarde.

---

## Tiempo real

Sí tenemos GPS de los colectivos. Sale de `colectivoya.com`, que publica los arribos de
Sol Bus en Villa Mercedes. **Verificado el martes 04/08/2026 a las 18:52**, en hora pico,
con el script de [prueba.js](prueba.js).

Lo que da, por cada colectivo:

- **Interno** (150, 181, 195…), **ramal** ("LINEA A", "LINEA E Vuelta", "Zona Este IDA").
- **Posición GPS** real y **segundos que faltan** para que llegue a cada parada.
- **362 paradas de Villa Mercedes con coordenadas** — nosotros teníamos 34 relevadas a mano.
- El campo `teorico`, que distingue el dato medido del estimado. Todos los que vimos
  vinieron con `teorico: false`, o sea GPS real.

Confirmamos que está vivo y no es un valor congelado: consultando dos veces con 75 segundos
de diferencia, el interno 181 pasó de 457 a 217 segundos y el 150 se atrasó de 1150 a 1246.
Sus posiciones cambiaron.

### Lo que hay que tener en cuenta

Ninguna de estas cosas es un defecto de la fuente. Son propiedades del servicio que la app
tiene que reflejar bien:

**La cobertura sigue la frecuencia de cada línea, no un agujero en los datos.** En la sonda
apareció el 41% de las paradas con arribo, y las líneas se comportan muy distinto:

| Línea | Servicio | Salidas por día | Frecuencia |
|---|---|---|---|
| A | 00:02 – 23:48 | 52 | ~23 min |
| E | 00:03 – 23:59 | 69 | ~22 min |
| Zona Este | 05:10 – 23:14 | 27 | ~42 min |
| **Zona Oeste** | **05:15 – 20:20** | **10** | **~92 min** |

Zona Oeste no apareció en la sonda y la explicación está en la grilla: la novena vuelta
llegó a Terminal **18:48** y la última salió **19:03**. La sonda corrió entre 18:52 y 19:05,
justo en el hueco. No es que no tenga GPS — no estaba circulando.

Esto tiene una consecuencia de diseño directa: **"sin colectivos en vivo" no es un error**.
Con Zona Oeste cada 92 minutos, lo normal es no tener nada en vivo, y ahí la planilla no es
el plan B sino la respuesta correcta.

**Los colectivos que no arrancaron informan tiempos teóricos.** El interno 195 mantuvo el
mismo arribo durante 75 segundos, y el motivo está en los datos: venía con `orden: 0` y
`distancia: 0`, o sea parado en la cabecera sin haber empezado la vuelta. Sus tiempos eran
proyecciones desde el papel, no GPS en movimiento.

Se filtra fácil: **`distancia > 0` significa colectivo circulando**. Lo que tiene `distancia: 0`
se muestra como planilla, no como "en vivo". Los campos `orden` y `distancia` miden el avance
del colectivo sobre su propio recorrido, y sirven además para detectar el que quedó frenado.

**Hay colectivos circulando que el GPS no muestra.** Comparando lo que la grilla dice que
debería estar en la calle contra lo que la fuente reporta:

| Hora | La grilla dice | El GPS reporta | Muestra |
|---|---|---|---|
| 19:00 (martes) | 20 vueltas en curso | 6 internos | 70 de 362 paradas |
| 23:00 (martes) | 9 vueltas en curso | 1 interno | 25 de 362 paradas |

El hueco es grande y sostenido. **La grilla no es el problema: refleja el servicio que Solbus
realmente presta.** Entonces la explicación es que buena parte de la flota circula sin
reportar — sin equipo de GPS, o con el equipo apagado. El muestreo tampoco fue completo, así
que el número observado es un piso, pero no alcanza para explicar una diferencia así.

La consecuencia es fuerte y hay que asumirla de entrada: **vamos a poder medir el desvío de
una parte de las vueltas, no de todas.** De ahí sale la regla más importante de esta sección:

> ### La ausencia en el GPS no es ausencia en la calle
>
> Que un colectivo no aparezca **nunca** puede mostrarse como "no viene ningún colectivo".
> Si le decimos a alguien que no hay servicio y el colectivo pasa, es la peor falla posible:
> lo dejamos parado en la esquina por confiar en nosotros.

En la práctica esto significa **cruzar siempre el GPS con la grilla**. Por cada vuelta que la
planilla dice que está en curso, buscamos si hay un interno que le corresponda. Las que
tienen interno se muestran con su desvío; **las que no, se muestran igual, con el horario de
grilla y sin confirmar**. El GPS suma sobre las vueltas que puede confirmar; no borra las otras.

### Con que reporten algunos, alcanza para bastante

La cobertura parcial duele menos de lo que parece, y la razón es que **el atraso casi nunca
es de un colectivo solo**. Lo que genera desvíos —tráfico, lluvia, un corte, un evento— le
pega a toda la línea al mismo tiempo. Si de siete vueltas de la Línea A hay dos que reportan
y las dos vienen 7 minutos atrasadas, es razonable avisar que **la línea viene atrasada**,
aunque de la tuya no tengamos dato directo.

Eso sí, dicho como lo que es: *"la Línea A viene ~7 min atrasada según 2 colectivos"*, y no
como si hubiésemos medido el tuyo.

**IDA y Vuelta hay que verificarlos, no creerles.** Los ramales vienen separados
("LINEA E" y "LINEA E Vuelta", "Zona Este IDA") y la etiqueta puede estar mal cargada del
lado de ellos. Tres formas de comprobarlo con lo que ya tenemos, de la más barata a la más
sólida:

1. **Match de horario:** a qué hora está pasando y contra qué fila de nuestra grilla coincide.
2. **Orden de los arribos:** si el ETA sube o baja a lo largo de las paradas que ya sabemos
   ordenadas, el sentido queda determinado.
3. **Avance de `distancia`:** consultando el mismo interno dos veces, hacia dónde se movió
   sobre el recorrido.

Ninguna depende de que la etiqueta del ramal esté bien.

### La regla de diseño

El tiempo real es **una capa arriba de la planilla, nunca un reemplazo**. La planilla es el
piso: no depende de nadie y siempre tiene una respuesta. Si hay GPS, la respuesta mejora y
se marca como en vivo. Si no lo hay —Zona Oeste a cualquier hora, un domingo a la noche, o
el día que colectivoya se caiga— la app sigue contestando igual que hoy.

Dicho de otra forma: **el GPS mejora la respuesta, no la habilita.** Ninguna pantalla puede
quedar vacía porque no haya colectivos reportando.

---

## Los reportes de los pasajeros

Un botón en la parada: **"¿Ya pasó?"** → Sí / Todavía no.

Con el GPS funcionando, los reportes dejan de ser el plan principal y pasan a ser algo mejor:
**cubren exactamente donde el GPS no llega**. Zona Oeste, las paradas sin arribo informado,
los internos que quedan pegados. Ahí donde solo tenemos planilla, el que está parado en la
esquina es la única fuente de verdad disponible.

Y son **la misma medición que el GPS, con otro sensor**. Si la grilla dice 19:14 y tres
personas confirman que pasó 19:22, eso es un atraso de 8 minutos medido igual de bien. Para
las vueltas que circulan sin reportar, el que está parado en la esquina es la única fuente
de desvío que existe:

- *"3 personas confirmaron que pasó a las 07:16"* — el horario se está cumpliendo.
- *"2 personas dicen que todavía no pasó"* — hoy viene atrasado, y lo avisamos.

Es el principio de honestidad convertido en función: en vez de tapar la incertidumbre de la
planilla, la medimos y la mostramos.

**Lo que se gana con el tiempo:** después de unos meses tenemos algo que hoy no tiene nadie,
ni la empresa ni el municipio. *"Los sábados a la tarde la Línea E se atrasa 12 minutos
promedio."* Eso es un activo real y es material para llevarle a Solbus.

**Cómo evitar que se rompa:** los reportes se muestran solo si hay más de uno y son
recientes. Un reporte suelto no cambia lo que ve el usuario. Sin reportes, la app funciona
exactamente igual que hoy — se apoya en la planilla y listo.

---

## Accesibilidad

No es decoración en una app de transporte público. Es parte del producto.

- **Datos de rampa verificados o borrados.** Hoy las cuatro líneas dicen "♿ Con Rampa (Demo)".
  Es el peor tipo de dato falso: alguien en silla de ruedas puede quedarse esperando un
  colectivo que no lo puede levantar. O se confirma con Solbus, o se saca hasta poder
  confirmarlo.
- Modo de texto grande, pensando en usuarios mayores.
- Que funcione con lector de pantalla y con navegación por teclado.
- Contraste suficiente para leerse a pleno sol.

---

## Qué NO es Busya

Decidido, para no volver a discutirlo cada vez que aparezca la idea:

**No vende boletos.** Es lo primero que todos proponen y lo peor para arrancar: pasarela de
pago, acuerdo comercial, datos sensibles y responsabilidad legal si falla un cobro. Además
compite con la tarjeta que ya existe. *Dónde recargar*, sí. *Vender el boleto*, no.

**No es una app nativa.** La web instalable cubre el caso de uso a una fracción del costo.

**No inventa posiciones.** Tenemos GPS de una parte de la flota y lo usamos, pero lo que no
sabemos se dice, no se estima con cara de certeza.

**No depende de colectivoya.** Es una mejora sobre la planilla, no un cimiento. Si mañana
cambian los endpoints o cierran el acceso, Busya sigue funcionando.

**No es una red social del transporte.** Los reportes son un dato, no un feed. Sin perfiles,
sin comentarios, sin moderar contenido.

**No sale de Villa Mercedes** hasta que ande bien en Villa Mercedes.

---

## Consecuencias técnicas

- **El front sigue siendo estático.** HTML, CSS y JS como ahora. Si los horarios viven en el
  teléfono, la función principal no necesita framework ni servidor.
- **Los horarios y los tiempos entre paradas viven en el repo como JSON.** Se calculan una
  vez y no se recalculan en cada consulta.
- **Nada necesita una base de datos de usuarios.** No hay cuentas, no hay login, no hay datos
  personales. La ubicación se usa en el teléfono y no se guarda.

### Hace falta un servidor chico, y no es opcional

El navegador no puede llamar a colectivoya.com directamente. Hay dos bloqueos, y cada uno
alcanza por sí solo:

1. **Contenido mixto.** Colectivoya es `http://`, sin cifrar. Nuestra app tiene que ser
   `https://` porque el GPS del navegador no funciona sin eso. Un sitio `https` tiene
   prohibido pedirle datos a uno `http`: el navegador lo bloquea y no hay forma de evitarlo
   desde el código.
2. **CORS.** Aunque fuese `https`, el sitio no autoriza que lo llamen desde otro dominio.

Entonces el scraper corre **del lado del servidor**, en una función serverless, y nuestra app
le habla a esa función. Sumado a los reportes, son las dos únicas piezas con servidor del
proyecto, y las dos son chicas.

### Cómo se comporta esa función

- **Cachea, y el barrido es más caro de lo que parece.** Medido: las 362 paradas de a una
  tardan **más de 7 minutos** (cada pedido ronda el segundo). Con 8 pedidos en paralelo baja
  a **26 segundos**. O sea que el barrido completo se hace una vez cada tanto para todos, y
  jamás una vez por usuario.
- **Es amable con el origen.** Concurrencia acotada y sin barridos de madrugada, cuando no
  hay servicio. No queremos hacerle daño a un sitio del que dependemos.
- **La fuente es frágil.** Durante las pruebas colectivoya pasó de responder en 0,14s a no
  responder en 25s, y volvió solo unos minutos después. Hay que asumir que se cae seguido.
- **Se puede caer sin drama.** Si no responde, la app usa la planilla y no muestra ningún
  error grave. El usuario ve "según planilla" en vez de "en vivo", y nada más.

> **Un error que ya cometimos, para no repetirlo en producción.** Un barrido nuestro devolvió
> "0 colectivos en 362 paradas", y dos minutos después una muestra chica encontró uno. Lo que
> había pasado es que el código se tragaba las excepciones en silencio: la fuente estaba
> fallando y el resultado se veía **idéntico** a "no hay ningún colectivo".
>
> La función tiene que distinguir siempre **"consulté y no hay"** de **"no pude consultar"**.
> Si se confunden, la app termina diciéndole al usuario que no viene nada cuando en realidad
> no sabe. Eso es exactamente lo que prohíbe el principio 1.
- **Vale la pena preguntar.** Antes de depender de esto en serio, corresponde consultarle a
  Solbus o a colectivoya si están de acuerdo. Puede terminar en un permiso explícito o
  directamente en que nos pasen los datos mejor, que sería el mejor resultado posible.

---

## Cómo sabemos si está funcionando

Sin analítica complicada. Tres preguntas:

1. **¿La gente vuelve?** Una app de colectivos se usa varias veces por semana o no sirve.
2. **¿Se abre en la calle?** Si se usa parado en la parada, le acertamos al momento de uso.
3. **¿Los horarios están bien?** Los reportes nos lo dicen solos. Si una línea acumula
   "todavía no pasó", o la planilla está vieja o el servicio no se cumple. Las dos cosas
   son información valiosa.

---

## Estado actual

Lo que ya está en pie hacia esta visión:

- Horarios de las 4 líneas para semana, sábado, domingo y feriados.
- Coordenadas de las paradas — la base del "cero toques".
- Pantalla de paradas con próximo horario destacado y sugerencia de salida.
- Mapa de recorrido con estado por parada.
- Panel de chofer con frecuencia por parada.
- Estado del pase estudiantil según el día.
- **Fuente de tiempo real verificada y funcionando** ([prueba.js](prueba.js)), todavía sin
  conectar a la app.

Lo más cercano a la visión que todavía falta: usar el GPS del usuario para abrir la app ya
contestada, y poner la función serverless que sirva los arribos en vivo.
