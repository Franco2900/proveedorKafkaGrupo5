process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1'; // Para que no muestre el mensaje de advertencia. 
// Esto se debe a un cambio en la versión 2.0.0 de KafkaJS. En esta versión, el particionador predeterminado ha sido cambiado. 
// Anteriormente, se utilizaba el LegacyPartitioner, pero ahora se usa el DefaultPartitioner

const conexionDataBase = require('./conexionDataBase.js');
const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092'],
    logLevel: logLevel.ERROR // Para que kafka solo tire mensajes de tipo ERROR. Los otros tipos de mensajes como INFO no los muestra
})

const consumidorOrdenesDeCompra = kafka.consumer({ groupId: 'consumidorOrdenesDeCompra' }); // Creo un consumidor. Le indico a que grupo de consumidores pertenece.
const productor = kafka.producer(); // Creo un productor

let hayUnConsumidorOrdenesDeCompraCorriendo = false;

async function consumirOrdenesDeCompra() {

    // MEDIDA DE SEGURIDAD PARA ASEGURARME DE QUE SOLO HAYA UN CONSUMIDOR
    if (hayUnConsumidorOrdenesDeCompraCorriendo) {
        console.log("El consumidor ya está corriendo");
        return;
    }

    hayUnConsumidorOrdenesDeCompraCorriendo = true;


    await consumidorOrdenesDeCompra.connect();  // El consumidor se conecta
    await consumidorOrdenesDeCompra.subscribe({ topic: 'orden-de-compra', fromBeginning: false }); // El consumidor se suscribe al topic y se queda esperando por mensajes nuevos. Si no existe el topic, lo crea.

    await consumidorOrdenesDeCompra.run({
        eachMessage: async ({ topic, partition, message }) => { // Indica que acción debe hacer el consumidor para cada mensaje que le llegue al topic
           
            // OBTENCIÓN DE DATOS
            var mensajeParseado = JSON.parse(message.value.toString() ); // Parseo el string JSON que viene del topic
            
            var idOrdenDeCompra  = mensajeParseado.idOrdenDeCompra;
            var tienda_codigo    = mensajeParseado.tienda_codigo;
            var itemsSolicitados = mensajeParseado.itemsSolicitados.slice();  // slice() copia un arreglo
            var fechaSolicitud   = mensajeParseado.fechaSolicitud;

            console.log('***********************************************************');
            console.log("Leyendo orden de compra: " + idOrdenDeCompra);

            // VERIFICACIÓN
            var observaciones = "";

            // Reviso cada uno de los productos del arreglo de items
            for(var i = 0; i < itemsSolicitados.length; i++) 
            {
                var resultadosConsulta = await conexionDataBase.query(`SELECT EXISTS (SELECT codigo FROM producto WHERE codigo = '${itemsSolicitados[i].producto_codigo}') AS existe `, {})
                var existeProducto = resultadosConsulta[0].existe;

                // Verificación para saber si producto_codigo existe en la tabla producto
                if(!existeProducto)
                {
                    console.log(`No existe el producto ${itemsSolicitados[i].producto_codigo}`);
                    observaciones += `No existe el producto ${itemsSolicitados[i].producto_codigo}. `;
                }

                // Verificación para saber si cantidad_solicitada es menor a 1
                var cantidad_solicitada = itemsSolicitados[i].cantidad_solicitada;
                if(cantidad_solicitada < 1)
                {
                    console.log(`La cantidad solicitada para el producto ${itemsSolicitados[i].producto_codigo} es menor a 1`);
                    observaciones += `La cantidad solicitada para el producto ${itemsSolicitados[i].producto_codigo} es menor a 1. `;
                }

            }
            

            // Si hay alguna observación por un producto que no existe o por un error en la cantidad solicitada
            if(observaciones.length > 1) generarSolicitudRechazada(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones);
            else
            {
                // Verificación para saber si la cantidad_solicitada es mayor a mi stock disponible
                for(var i = 0; i < itemsSolicitados.length; i++) 
                {
                    var resultadosConsulta = await conexionDataBase.query(`SELECT stock FROM producto WHERE codigo = '${itemsSolicitados[i].producto_codigo}' `, {})
                    var stockDisponible = resultadosConsulta[0].stock;
                    
                    if(stockDisponible < itemsSolicitados[i].cantidad_solicitada)
                    {
                        console.log(`La cantidad solicitada del producto ${itemsSolicitados[i].producto_codigo} es mayor a la disponible`);
                        observaciones += `La cantidad solicitada del producto ${itemsSolicitados[i].producto_codigo} es mayor a la disponible. `;
                    }
                }

                // Si hay alguna observación por la cantidad faltante de stock 
                if(observaciones.length > 1) generarSolicitudAceptadaSinDespacho(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones); 
                else
                {
                    // Si esta todo bien y hay stock suficiente
                    observaciones = observaciones ? observaciones : 'Sin observaciones'; 
                    generarSolicitudAceptadaConDespacho(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones);
                }
            }

        },
    })

};


// Punto 2.A: GENERAR SOLICITUD RECHAZADA
async function generarSolicitudRechazada(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones) 
{    
    // En caso de error, se envia un mensaje al topic {codigo de tienda}/solicitudes con el estado RECHAZADA y en observaciones con el error/es encontrado/s
    await productor.connect();

    await productor.send({ 
        topic: `${tienda_codigo}-solicitudes`,
        messages: [
            { value: JSON.stringify({ tienda_codigo: tienda_codigo, idOrdenDeCompra: idOrdenDeCompra, itemsSolicitados: itemsSolicitados, fechaSolicitud: fechaSolicitud, estado: 'RECHAZADA', observaciones: observaciones}) }, 
        ],
    });

    await productor.disconnect();
                
    // Ademas se hace un UPDATE a la tabla orden_de_compra con el nuevo estado y observaciones en la base de datos
    await conexionDataBase.query(`UPDATE orden_de_compra 
                                  SET estado = 'RECHAZADA', observaciones = '${observaciones}'
                                  WHERE id = ${idOrdenDeCompra} `, {});

    console.log('Generado solicitud RECHAZADA');
}



// Punto 2.B: GENERAR SOLICITUD ACEPTADA SIN ORDEN DE DESPACHO POR FALTA DE STOCK
async function generarSolicitudAceptadaSinDespacho(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones) 
{    
    // Envio un mensaje al topic {codigo de tienda}/solicitudes con el estado ACEPTADA y en observaciones con el error de que falta stock
    await productor.connect();
    
    await productor.send({ 
        topic: `${tienda_codigo}-solicitudes`,
        messages: [
        { value: JSON.stringify({ tienda_codigo: tienda_codigo, idOrdenDeCompra: idOrdenDeCompra, itemsSolicitados: itemsSolicitados, fechaSolicitud: fechaSolicitud, estado: 'ACEPTADA', observaciones: observaciones}) },
        ],
    });

    await productor.disconnect();

    await conexionDataBase.query(`UPDATE orden_de_compra 
                                  SET estado = 'ACEPTADA', observaciones = '${observaciones}'
                                  WHERE id = ${idOrdenDeCompra} `, {});

    console.log('Generado solicitud ACEPTADA');
}



// Punto 2.C: GENERAR SOLICITUD ACEPTADA CON LA ORDEN DE DESPACHO
async function generarSolicitudAceptadaConDespacho(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones) 
{    
    // Envio un mensaje al topic {codigo de tienda}/despacho y hago un insert en la base de datos
    await productor.connect();

    var fechaActual = new Date();
    fechaActual.setDate(fechaActual.getDate() + 7);
    var fechaDeEnvio = fechaActual.toISOString().split('T')[0];

    await conexionDataBase.query(`INSERT INTO despacho 
                                  SET id_orden_de_compra = ${idOrdenDeCompra},
                                  fecha_de_envio = '${fechaDeEnvio}' `, {});

    var resultadosConsulta = await conexionDataBase.query(`SELECT MAX(id) AS id FROM despacho `, {});
    var IdUltimoDespacho = resultadosConsulta[0].id;


    await productor.send({ 
        topic: `${tienda_codigo}-despacho`,
        messages: [
            { value: JSON.stringify({ idDespacho: IdUltimoDespacho, idOrdenDeCompra: idOrdenDeCompra, fechaDeEnvio: fechaDeEnvio}) }, // Envio el mensaje en json
        ],
    });


    // Envio un mensaje al topic {codigo de tienda}/solicitudes con el estado ACEPTADA, el id de la orden de despacho y en observaciones indico que no hubo problemas
    await productor.send({ 
        topic: `${tienda_codigo}-solicitudes`,
        messages: [
        { value: JSON.stringify({ tienda_codigo: tienda_codigo, idOrdenDeCompra: idOrdenDeCompra, idDespacho: IdUltimoDespacho, itemsSolicitados: itemsSolicitados, fechaSolicitud: fechaSolicitud, fechaDeEnvio: fechaDeEnvio, estado: 'ACEPTADA', observaciones: observaciones}) }, // Envio el mensaje en json
        ],
    });

    await productor.disconnect();

    await conexionDataBase.query(`UPDATE orden_de_compra 
                                 SET estado = 'ACEPTADA', observaciones = '${observaciones}'
                                 WHERE id = ${idOrdenDeCompra} `, {});

    
    // Por último, resto del stock del proveedor la cantidad solicitada
    for(var i = 0; i < itemsSolicitados.length; i++) 
    {
        var cantidad_solicitada = itemsSolicitados[i].cantidad_solicitada;

        var resultadosConsulta = await conexionDataBase.query(`SELECT stock FROM producto WHERE codigo = '${itemsSolicitados[i].producto_codigo}' `, {})
        var stockDisponible = resultadosConsulta[0].stock;

        var auxStock = stockDisponible - cantidad_solicitada;

        await conexionDataBase.query(`UPDATE producto SET stock = ${auxStock} WHERE codigo = '${itemsSolicitados[i].producto_codigo}' `, {});
    }
    

    console.log('Generado solicitud ACEPTADA y orden de DESPACHO');
}




// Punto 7
const consumidorRecepcion = kafka.consumer({ groupId: 'consumidorRecepcion' }); // Creo un consumidor. Le indico a que grupo de consumidores pertenece.
let hayUnConsumidorRecepcionCorriendo = false;

async function consumirRecepcion() 
{
    // MEDIDA DE SEGURIDAD PARA ASEGURARME DE QUE SOLO HAYA UN CONSUMIDOR
    if (hayUnConsumidorRecepcionCorriendo) {
        console.log("El consumidor ya está corriendo");
        return;
    }

    hayUnConsumidorRecepcionCorriendo = true;


    await consumidorRecepcion.connect();  // El consumidor se conecta
    await consumidorRecepcion.subscribe({ topic: 'recepcion', fromBeginning: false }); // El consumidor se suscribe al topic y se queda esperando por mensajes nuevos. Si no existe el topic, lo crea.

    await consumidorRecepcion.run({
        eachMessage: async ({ topic, partition, message }) => {

            // OBTENCIÓN DE DATOS
            var mensajeParseado = JSON.parse(message.value.toString() ); // Parseo el string JSON que viene del topic

            var idOrdenDeCompra    = mensajeParseado.idOrdenDeCompra;
            var idDespacho         = mensajeParseado.idDespacho;
            var fecha_de_recepcion = mensajeParseado.fechaRecepcion;

            // ACTUALIZO LA BASE DE DATOS
            await conexionDataBase.query(`UPDATE orden_de_compra 
                SET estado = 'RECIBIDA',
                fecha_de_recepcion = '${fecha_de_recepcion}'
                WHERE id = ${idOrdenDeCompra} `, {});

            console.log('***********************************************************');
            console.log(`La orden de compra ${idOrdenDeCompra} fue RECIBIDA`);
        },
    })

}

exports.consumirOrdenesDeCompra = consumirOrdenesDeCompra;
exports.consumirRecepcion = consumirRecepcion;