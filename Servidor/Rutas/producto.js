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

const productor = kafka.producer(); // Creo un producto

/************************ RUTAS *****************************/

router.get('/lista', async (req, res) => {
    await conexionDataBase.query('SELECT * FROM producto',(error,results)=>{

        if(error){
            throw error;
        }else{
            res.render('index',{results:results});
        }
    })

});


router.get('/alta', (req, res) => {
    res.render('alta');
})


router.post('/alta',async(req,res)=>{

    // Los datos que me llegan de la solicitud/request
    const codigo = req.body.codigo;
    const nombre = req.body.nombre; 
    const talle  = req.body.talle;
    const foto   = req.body.foto;
    const color  = req.body.color;
    const stock  = req.body.stock;

    // CARGA A LA BASE DE DATOS
    await conexionDataBase.query(`INSERT INTO producto 
                                  SET codigo ='${codigo}', nombre ='${nombre}', 
                                  talle = '${talle}', foto = '${foto}', 
                                  color='${color}', stock=${stock} `, {})

    
    // CARGA AL TOPIC
    await productor.connect(); // El productor se conecta

    await productor.send({  // El productor envia uno o varios mensajes al topic indicado. Si no existe el topic, lo crea.
        topic: 'novedades',
        messages: [
            { value: JSON.stringify({ codigo: codigo, nombre: nombre, talle: talle, foto: foto, color: color}) }, // Envio el mensaje en json
        ],
    });

    await productor.disconnect();  // El productor se desconecta


    res.redirect('/producto/lista');
});






router.get('/edit/:codigo', async(req, res) => {
    const codigo = req.params.codigo;
    await conexionDataBase.query(`SELECT * FROM producto WHERE codigo = '${codigo}'`,(error,results)=>{

        if(error){
            throw error;
        }else{
            res.render('edit',{producto:results[0]});
        }
    })
});

router.post('/update',async(req,res)=>{
    const codigo = req.body.codigo;
    const newstock = req.body.newstock;
    
    await conexionDataBase.query(`UPDATE producto SET stock = ${newstock} WHERE codigo = '${codigo}'`,(error,results)=>{

        if(error){
            throw error;
        }else{
            res.redirect('/producto/lista');
        }
    })

})


module.exports = router;