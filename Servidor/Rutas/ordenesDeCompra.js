var express = require('express');
var router  = express.Router();

const conexionDataBase = require('../conexionDataBase.js');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

const producer = kafka.producer(); // Creo un productor

router.post('/alta', async (req, res) => { 

    // Los datos que me llegan de la solicitud/request
    var observaciones = req.body.observaciones ? req.body.observaciones : 'Sin observaciones';
    var tienda_codigo = req.body.tienda_codigo;
    var items         = req.body.items.slice(); // slice() copia un arreglo


    // Obtener la fecha actual
    var fechaActual = new Date();
    
    var anio = fechaActual.getFullYear();
    var mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    var dia = String(fechaActual.getDate() ).padStart(2, '0');     // padStart() rellena un string con otro hasta que alcance cierta longitud (sirve para cuando el dia o el mes es de un solo digito)
    
    var fechaFormateada = `${anio}-${mes}-${dia}`;


    // Carga a la base de datos
    await conexionDataBase.query(`INSERT INTO orden_de_compra 
        SET estado = 'SOLICITADA', 
        observaciones = '${observaciones}', 
        fecha_de_solicitud = '${fechaFormateada}',
        tienda_codigo = '${tienda_codigo}' `, {});

    
    var resultadosConsulta = await conexionDataBase.query(`SELECT MAX(id) AS id FROM orden_de_compra `, {}); 
    // Otra forma de obtener el último id: SELECT LAST_INSERT_ID()
    var IdUltimaOrdenDeCompra = resultadosConsulta[0].id;

    for (let item of items) 
    {
        await conexionDataBase.query(`INSERT INTO item 
            SET producto_codigo = '${item.producto_codigo}', 
            color = '${item.color}', 
            talle = '${item.talle}', 
            cantidad_solicitada = ${item.cantidad_solicitada}, 
            id_orden_de_compra = ${IdUltimaOrdenDeCompra} `, {});
    }

    console.log("Se hizo el alta de la orden de compra con los siguientes datos: ");
    //console.log(req.body);

       
    // Carga al topic
    
    await producer.connect(); // El productor se conecta

    await producer.send({  // El productor envia uno o varios mensajes al topic indicado. Si no existe el topic, lo crea.
        topic: 'orden-de-compra',
        messages: [
          { value: JSON.stringify({ tienda_codigo: `${tienda_codigo}`, idOrdenDeCompra: IdUltimaOrdenDeCompra, itemsSolicitados: items, fechaSolicitud: fechaFormateada}) }, // Envio el mensaje en json
        ],
    });

    await producer.disconnect() // El productor se desconecta
    

    res.sendStatus(200);
})


module.exports = router;