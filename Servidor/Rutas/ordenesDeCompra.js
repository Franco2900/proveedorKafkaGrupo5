process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1'; // Para que no muestre el mensaje de advertencia. 
// Esto se debe a un cambio en la versión 2.0.0 de KafkaJS. En esta versión, el particionador predeterminado ha sido cambiado. 
// Anteriormente, se utilizaba el LegacyPartitioner, pero ahora se usa el DefaultPartitioner

var express = require('express');
var router  = express.Router();

const conexionDataBase = require('../conexionDataBase.js');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

const productor = kafka.producer(); // Creo un productor

router.post('/alta', async (req, res) => { 

    // Los datos que me llegan de la solicitud/request
    var tienda_codigo = req.body.tienda_codigo;
    var items         = req.body.items.slice(); // slice() copia un arreglo


    // Obtener la fecha actual
    var fechaActual = new Date();
    
    var anio = fechaActual.getFullYear();
    var mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // Los meses empiezan en 0
    var dia = String(fechaActual.getDate() ).padStart(2, '0');     // padStart() rellena un string con otro hasta que alcance cierta longitud (sirve para cuando el dia o el mes es de un solo digito)
    
    var fechaFormateada = `${anio}-${mes}-${dia}`;


    // CARGA A LA BASE DE DATOS
    await conexionDataBase.query(`INSERT INTO orden_de_compra 
        SET estado = 'SOLICITADA', 
        observaciones = 'Sin observaciones', 
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

 
    // CARGA AL TOPIC
    await productor.connect(); // El productor se conecta

    await productor.send({  // El productor envia uno o varios mensajes al topic indicado. Si no existe el topic, lo crea.
        topic: 'orden-de-compra',
        messages: [
          { value: JSON.stringify({ tienda_codigo: `${tienda_codigo}`, idOrdenDeCompra: IdUltimaOrdenDeCompra, itemsSolicitados: items, fechaSolicitud: fechaFormateada, estado: 'SOLICITADA'}) }, // Envio el mensaje en json
        ],
    });

    await productor.disconnect();  // El productor se desconecta
    
    console.log('***********************************************************');
    console.log("Se hizo el alta de la orden de compra " + IdUltimaOrdenDeCompra);
    res.sendStatus(200);
})


module.exports = router;