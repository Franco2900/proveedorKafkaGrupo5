const express = require('express') 
const { Kafka } = require('kafkajs')
const conexionDataBase = require('./conexionDataBase.js');

const app = express()          

app.use(express.json()); // Middleware para parsear los datos que me llegan de las solicitudes a JSON

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

const producer = kafka.producer(); // Creo un productor

/**************************** RUTAS *****************************/

 // EJEMPLO DE COMO FUNCIONAN LAS RUTAS CON EXPRESS
app.get('/', function(req, res) {  // La ruta '/' ejecutara la función que le pasamos. La función recibe dos objetos 'req' (solicitud) y 'res' (respuesta)
                                  
    res.send(`<!doctype html><html><head></head><body><h1>      
            Mi primer pagina con Express</h1></body></html>`) // Mediante el objeto 'res' respondemos al navegador que hizo la solicitud
})


app.post('/altaOrdenDeCompra', async (req, res) => { 

    // Los datos que me llegan de la solicitud/request
    var observaciones = req.body.observaciones ? req.body.observaciones : 'Sin observaciones';
    var tienda_codigo = req.body.tienda_codigo;
    var items         = req.body.items.slice();


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
    console.log(req.body);

       
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


const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); // Creo un consumidor. Le indico a que grupo de consumidores pertenece.

await consumer.connect();  // El consumidor se conecta
await consumer.subscribe({ topic: 'topic-1', fromBeginning: true }); // El consumidor se suscribe al topic y se queda esperando por mensajes nuevos. Si no existe el topic, lo crea.

await consumer.run({
    eachMessage: async ({ topic, partition, message }) => { // Indica que acción debe hacer el consumidor para cada mensaje que le llegue
      console.log({
        partition,
        offset: message.offset,
        value: JSON.parse(message.value.toString() ), // Leo el json
      })
    },
})

/*************************** ARRANQUE SERVIDOR ********************************/

const server = app.listen(2000, () => { // Creo el servidor y le indico que escuche en el puerto 2000. Ir a localhost:2000 con el navegador para ver los resultados
    console.log('Servidor web iniciado')
})