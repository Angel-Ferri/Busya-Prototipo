// script/como_llegar.js

let mapa = null;
let ubicacionUsuario = null;
let marcadorUsuario = null;
let routingControl = null;

let datosLineasCargados = {};
let recorridoActual = null;
let marcadoresParadas = [];


// ICONO USUARIO

const iconoUsuario = L.icon({

    iconUrl:
    "https://cdn-icons-png.flaticon.com/512/64/64113.png",

    iconSize:[40,40],

    iconAnchor:[20,40],

    popupAnchor:[0,-35]

});




// INICIO

document.addEventListener(
"DOMContentLoaded",
async()=>{


    inicializarMapa();

    obtenerUbicacionUsuario();

    await cargarRecorridos();


});




// VOLVER

function volverAlInicio(){

    window.location.href="index.html";

}





// =============================
// MAPA
// =============================


function inicializarMapa(){


    mapa =
    L.map("map-principal")
    .setView(
        [-33.675,-65.460],
        14
    );


    L.tileLayer(

        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

        {
            attribution:
            "&copy; OpenStreetMap"
        }

    )
    .addTo(mapa);


}







// =============================
// UBICACION SIMULADA
// =============================


function obtenerUbicacionUsuario(){


    ubicacionUsuario={

        lat:-33.675000,

        lng:-65.460000

    };


    mostrarUsuario();


}





function mostrarUsuario(){


    mapa.setView(

        [
            ubicacionUsuario.lat,
            ubicacionUsuario.lng
        ],

        15

    );



    marcadorUsuario =
    L.marker(

        [
            ubicacionUsuario.lat,
            ubicacionUsuario.lng
        ],

        {
            icon:iconoUsuario
        }

    )
    .addTo(mapa)
    .bindPopup(
        "📍 Tu ubicación"
    )
    .openPopup();




    L.circle(

        [
            ubicacionUsuario.lat,
            ubicacionUsuario.lng
        ],

        {

            radius:50,

            color:"red",

            fillOpacity:0.25

        }

    )
    .addTo(mapa);


}







// =============================
// CARGAR LINEAS
// =============================


async function cargarRecorridos(){


try{


    let lineaA =
    await fetch(

    "data/recorridos_originales/cordenadas/paradas_secundarias_Linea_A.json"

    )
    .then(r=>r.json());



    let lineaE =
    await fetch(

    "data/recorridos_originales/cordenadas/paradas_secundarias_Linea_E.json"

    )
    .then(r=>r.json());






    datosLineasCargados={



        lineaa:{


            nombre:"Línea A",

            paradas:
            lineaA.paradas,


            recorrido:
            lineaA.paradas.map(

                p=>[
                    p.lat,
                    p.lng
                ]

            )


        },




        lineae:{


            nombre:"Línea E",

            paradas:
            lineaE.paradas,


            recorrido:
            lineaE.paradas.map(

                p=>[
                    p.lat,
                    p.lng
                ]

            )


        }



    };




    console.log(
        "LINEAS:",
        datosLineasCargados
    );



}
catch(error){


    console.error(
        "Error cargando líneas:",
        error
    );


}


}









// =============================
// CAMBIAR LINEA
// =============================


function alCambiarLinea(linea){



    let select =
    document.getElementById(
        "select-destino"
    );



    select.innerHTML=
    `
    <option disabled selected>
    -- Selecciona parada --
    </option>
    `;



    limpiarMarcadores();



    recorridoActual =
    datosLineasCargados[linea];



    if(!recorridoActual)
    return;





    dibujarRecorrido(
        recorridoActual.recorrido
    );





    recorridoActual.paradas.forEach(

        (parada,index)=>{


            let option =
            document.createElement(
                "option"
            );


            option.value=index;


            option.textContent =
            parada.nombre;



            select.appendChild(option);


        }


    );



    select.disabled=false;



}









// =============================
// DIBUJAR RECORRIDO
// =============================


function dibujarRecorrido(coords){



    L.polyline(

        coords,

        {

            color:"orange",

            weight:5

        }

    )
    .addTo(mapa);





    coords.forEach(

        (c,index)=>{


            let marker =
            L.marker(c)
            .addTo(mapa);



            marker.bindPopup(

                recorridoActual
                .paradas[index]
                .nombre

            );



            marcadoresParadas.push(marker);



        }

    );


}









function limpiarMarcadores(){


    marcadoresParadas.forEach(

        m=>mapa.removeLayer(m)

    );


    marcadoresParadas=[];


}









// =============================
// CALCULAR RUTA
// =============================


function calcularRutaYTiempo(){



    let index =
    Number(

        document.getElementById(
            "select-destino"
        )
        .value

    );




    let origen =
    buscarParadaMasCercana(
        recorridoActual.paradas
    );



    let destino =
    recorridoActual.paradas[index];





    let distancia =
    calcularDistancia(

        [
            origen.lat,
            origen.lng
        ],

        [
            destino.lat,
            destino.lng
        ]

    );



    let tiempo =
    Math.round(
        (distancia / 20)*60
    );





    document.getElementById(
        "resumen-viaje"
    )
    .innerHTML=


    `

    <div class="paso-itinerario">


    🚶 Camina hacia:
    <b>${origen.nombre}</b>


    <br><br>


    🚌 Línea:

    <b>${recorridoActual.nombre}</b>


    <br><br>


    📍 Baja en:

    <b>${destino.nombre}</b>


    <hr>


    ⏱ Tiempo aproximado:

    <b>${tiempo} minutos</b>


    </div>

    `;




    trazarRutaAPie(

        ubicacionUsuario,

        [
            origen.lat,
            origen.lng
        ]

    );


}









// =============================
// DISTANCIA
// =============================


function calcularDistancia(a,b){


    let R=6371;


    let dLat =
    (b[0]-a[0])
    *
    Math.PI/180;


    let dLon =
    (b[1]-a[1])
    *
    Math.PI/180;



    let x =
    Math.sin(dLat/2)**2+

    Math.cos(
        a[0]*Math.PI/180
    )
    *
    Math.cos(
        b[0]*Math.PI/180
    )
    *
    Math.sin(dLon/2)**2;



    return R *
    2 *
    Math.atan2(
        Math.sqrt(x),
        Math.sqrt(1-x)
    );


}









// =============================
// CAMINO A PIE
// =============================


function trazarRutaAPie(origen,destino){



    if(routingControl){

        mapa.removeControl(
            routingControl
        );

    }





    routingControl =

    L.Routing.control({

        waypoints:[


            L.latLng(
                origen.lat,
                origen.lng
            ),


            L.latLng(
                destino[0],
                destino[1]
            )


        ],


        router:
        L.Routing.osrmv1({

            profile:"foot"

        }),


        show:false,

        addWaypoints:false,


        lineOptions:{

            styles:[

                {
                    color:"#993131",
                    weight:6
                }

            ]

        }


    })
    .addTo(mapa);


}

// =============================
// BUSCAR PARADA MÁS CERCANA
// =============================

function buscarParadaMasCercana(paradas){


    let paradaCercana = null;

    let menorDistancia = Infinity;



    paradas.forEach(

        parada=>{


            let distancia =
            calcularDistancia(

                [
                    ubicacionUsuario.lat,
                    ubicacionUsuario.lng
                ],

                [
                    parada.lat,
                    parada.lng
                ]

            );



            if(distancia < menorDistancia){

                menorDistancia = distancia;

                paradaCercana = parada;

            }


        }

    );



    console.log(
        "Parada más cercana:",
        paradaCercana.nombre,
        "Distancia:",
        menorDistancia*1000,
        "metros"
    );



    return paradaCercana;


}