const express = require('express') 
const { Kafka } = require('kafkajs');
const conexionDataBase = require('./conexionDataBase.js');

const app = express()    

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

/**************************** MIDDLEWARE *********************************/
app.use(express.json()); // Middleware para parsear los datos que me llegan de las solicitudes a JSON

app.use('/ordenesDeCompra', require('./Rutas/ordenesDeCompra') );

/**************************** RUTAS *****************************/

 // EJEMPLO DE COMO FUNCIONAN LAS RUTAS CON EXPRESS
app.get('/', function(req, res) {  // La ruta '/' ejecutara la función que le pasamos. La función recibe dos objetos 'req' (solicitud) y 'res' (respuesta)
                                  
    res.send(`<!doctype html><html><head></head><body><h1>      
            Mi primer pagina con Express</h1></body></html>`) // Mediante el objeto 'res' respondemos al navegador que hizo la solicitud
})



const consumidorOrdenesDeCompra = kafka.consumer({ groupId: 'consumidorOrdenesDeCompra' }); // Creo un consumidor. Le indico a que grupo de consumidores pertenece.

(async function() {
    
    await consumidorOrdenesDeCompra.connect();  // El consumidor se conecta
    await consumidorOrdenesDeCompra.subscribe({ topic: 'orden-de-compra', fromBeginning: false }); // El consumidor se suscribe al topic y se queda esperando por mensajes nuevos. Si no existe el topic, lo crea.

    await consumidorOrdenesDeCompra.run({
        eachMessage: async ({ topic, partition, message }) => { // Indica que acción debe hacer el consumidor para cada mensaje que le llegue
           
            var mensajeParseado = JSON.parse(message.value.toString() ); // Parseo el string JSON que viene del topic
            
            var idOrdenDeCompra = mensajeParseado.idOrdenDeCompra;
            console.log("Leyendo orden de compra: " + idOrdenDeCompra);
           
            // VERIFICACIÓN PARA SABER SI producto_codigo EXISTE EN LA TABLA producto
            var itemsSolicitados = mensajeParseado.itemsSolicitados.slice();  // slice() copia un arreglo
            console.log(itemsSolicitados);

            for(var i = 0; i < itemsSolicitados.length; i++) // Reviso el codigo de cada uno de los productos del arreglo de items
            {
                var resultadosConsulta = await conexionDataBase.query(`SELECT EXISTS (SELECT codigo FROM producto WHERE codigo = '${itemsSolicitados[i].producto_codigo}') AS existe `, {})
                var existeProducto = resultadosConsulta[0].existe;

                if(!existeProducto)
                {
                    console.log(`No existe el producto ${itemsSolicitados[i].producto_codigo}`);
                }

                // VERIFICACIÓN PARA SABER SI cantidad_solicitada ES MENOR A 1
                var cantidad_solicitada = itemsSolicitados[i].cantidad_solicitada;
                if(cantidad_solicitada < 1)
                {
                    console.log(`La cantidad solicitada para el producto ${itemsSolicitados[i].producto_codigo} es menor a 1`);
                }

                /*
                // EN CASO DE ERROR, SE ENVIA UN MENSAJE AL TOPIC {codigo de tienda}/solicitudes con el estado RECHAZADA y en observaciones con el error/es encontrado
                if(!existeProducto || cantidad_solicitada < 1)
                {

                }
                */
            }
            
            
            

            

            
        },
    })

})();

/*************************** ARRANQUE SERVIDOR ********************************/

const server = app.listen(2000, () => { // Creo el servidor y le indico que escuche en el puerto 2000. Ir a localhost:2000 con el navegador para ver los resultados
    console.log('Servidor web iniciado')
})