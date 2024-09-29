var express = require('express');
var router  = express.Router();

const conexionDataBase = require('../conexionDataBase.js');
const { Kafka } = require('kafkajs');

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

const productor = kafka.producer(); // Creo un productor


/*router.get('/', async (req, res) => {

})*/


router.post('/', async (req, res) => {

    // Los datos que me llegan de la solicitud/request
    var codigo = req.body.codigo;
    var nombre = req.body.nombre;
    var talle  = req.body.talle;
    var foto   = req.body.foto;
    var color  = req.body.color;
    // El stock por defecto esta en 0


    // CARGA A LA BASE DE DATOS
    await conexionDataBase.query(`INSERT INTO producto 
        SET codigo = '${codigo}', 
        nombre = '${nombre}', 
        talle = '${talle}',
        foto = '${foto}',
        color = '${color}' `, {});


    // CARGA AL TOPIC
    await productor.connect(); // El productor se conecta

    await productor.send({  // El productor envia uno o varios mensajes al topic indicado. Si no existe el topic, lo crea.
        topic: 'novedades',
        messages: [
          { value: JSON.stringify({ producto_codigo: codigo, nombre: nombre, talle: talle, foto: foto, color: color}) }, // Envio el mensaje en json
        ],
    });

    await productor.disconnect();  // El productor se desconecta

    res.sendStatus(200);
})

module.exports = router;