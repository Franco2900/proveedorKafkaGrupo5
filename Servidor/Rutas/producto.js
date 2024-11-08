process.env.KAFKAJS_NO_PARTITIONER_WARNING = '1'; // Para que no muestre el mensaje de advertencia. 
// Esto se debe a un cambio en la versión 2.0.0 de KafkaJS. En esta versión, el particionador predeterminado ha sido cambiado. 
// Anteriormente, se utilizaba el LegacyPartitioner, pero ahora se usa el DefaultPartitioner

var express = require('express');
var router  = express.Router();

const conexionDataBase = require('../conexionDataBase.js');
const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({ // Conexión con kafka
    clientId: 'my-app',
    brokers: ['localhost:9092'],
    logLevel: logLevel.ERROR // Para que kafka solo tire mensajes de tipo ERROR. Los otros tipos de mensajes como INFO no los muestra
})

const productor = kafka.producer(); // Creo un producto

/************************ RUTAS *****************************/

router.get('/', async (req, res) => {
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

    var resultados = await conexionDataBase.query(
        `SELECT EXISTS(SELECT codigo FROM producto WHERE (nombre = ? and talle = ? and color = ?) OR codigo = ?) AS existe`,
        [nombre, talle, color, codigo]
    );
    var existeProducto = resultados[0].existe;

    if (existeProducto) // SI EXISTE EL PRODUCTO CON MISMO NOMBRE, TALLE Y COLOR..ARROJA ERROR
    { 
        console.log('Ya existe el producto');
        res.send(`<script>alert('Ya existe un producto con el mismo nombre, talle, color y/o codigo.'); window.location.href = '/';</script>`);
        //res.redirect('/');
    } else 
    {
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

        console.log('***********************************************************');
        console.log("Se hizo el alta de un nuevo producto: " + codigo);

        res.redirect('/');
    }
});






router.get('/edit/:codigo', async(req, res) => {

    const codigo = req.params.codigo;

    await conexionDataBase.query(`SELECT * FROM producto WHERE codigo = '${codigo}' `,(error,results)=>{

        if(error) throw error;
        else     res.render('edit',{producto:results[0]});
    })
});


router.post('/update',async(req,res)=>{

    const codigo = req.body.codigo;
    const newstock = req.body.newstock;
    
    // ACTUALIZACION A LA BASE DE DATOS
    await conexionDataBase.query(`UPDATE producto SET stock = ${newstock} WHERE codigo = '${codigo}' `, {} )

    console.log('***********************************************************');
    console.log(`Se actualizo el stock del producto ${codigo} a la cantidad ${newstock}`);


    // Consulto todas las ordenes de compra ACEPTADAS que todavía NO tengan un despacho por la falta de stock y que tengan algun item con el producto_codigo igual al que se acabo de hacer stock
    var ordenesDeCompra = await conexionDataBase.query(`SELECT orden_de_compra.id, orden_de_compra.tienda_codigo, orden_de_compra.fecha_de_solicitud
        FROM orden_de_compra
        INNER JOIN item ON orden_de_compra.id = item.id_orden_de_compra
        WHERE estado = 'ACEPTADA' 
        AND item.producto_codigo = '${codigo}'
        AND orden_de_compra.id NOT IN (SELECT despacho.id_orden_de_compra FROM despacho)
        GROUP BY orden_de_compra.id `, {});

    ordenesDeCompra = JSON.parse(JSON.stringify(ordenesDeCompra)); // Transformo los datos a string JSON para poder subirlo después al topic

    // Obtengo la lista de items de las ordenes de compra
    for(var i = 0; i < ordenesDeCompra.length; i++)
    {
        var itemsSolicitados = await conexionDataBase.query(`SELECT producto_codigo, color, talle, cantidad_solicitada FROM item WHERE id_orden_de_compra = ${ordenesDeCompra[i].id} `, {});
        
        itemsSolicitados = JSON.parse(JSON.stringify(itemsSolicitados));
        ordenesDeCompra[i].itemsSolicitados = itemsSolicitados.slice();

        ordenesDeCompra[i].fecha_de_solicitud = ordenesDeCompra[i].fecha_de_solicitud.split('T')[0]; // Arreglo la fecha
    }


    // Verifico si ya tengo el stock suficiente para cumplir la solicitud
    for(var i = 0; i < ordenesDeCompra.length; i++)
    {
        var stockSuficienteParaTodosLosItems;
        console.log("Revisando stock para la orden de compra: " + ordenesDeCompra[i].id);

        // Recorro todos los items de la orden de compra
        for(var j = 0; j < ordenesDeCompra[i].itemsSolicitados.length; j++) 
        {
            var resultadosConsulta = await conexionDataBase.query(`SELECT stock FROM producto WHERE codigo = '${ordenesDeCompra[i].itemsSolicitados[j].producto_codigo}' `, {})
            var stockDisponible = resultadosConsulta[0].stock;
                    
            if(stockDisponible >= ordenesDeCompra[i].itemsSolicitados[j].cantidad_solicitada)
            {
                stockSuficienteParaTodosLosItems = true;
                console.log("Alcanza el stock para el producto: " + ordenesDeCompra[i].itemsSolicitados[j].producto_codigo);
                console.log("Stock disponible: " + stockDisponible, "Cantidad solicitada: " + ordenesDeCompra[i].itemsSolicitados[j].cantidad_solicitada);
            }
            else
            {
                stockSuficienteParaTodosLosItems = false; // Con que no tenga stock suficiente para uno de los productos, ya se corta la ejecucion
                console.log("Stock insuficiente para el producto: " + ordenesDeCompra[i].itemsSolicitados[j].producto_codigo);
                console.log("Stock disponible: " + stockDisponible, "Cantidad solicitada: " + ordenesDeCompra[i].itemsSolicitados[j].cantidad_solicitada);
                break;
            }

        }

        if(stockSuficienteParaTodosLosItems)
        {
            console.log("Hay stock suficiente para todos los items de la orden de compra");

            var idOrdenDeCompra  = ordenesDeCompra[i].id;
            var tienda_codigo    = ordenesDeCompra[i].tienda_codigo;
            var itemsSolicitados = ordenesDeCompra[i].itemsSolicitados;
            var fechaSolicitud   = ordenesDeCompra[i].fecha_de_solicitud;
            var observaciones    = 'Sin observaciones'; 
            
            await generarSolicitudAceptadaConDespacho(tienda_codigo, idOrdenDeCompra, itemsSolicitados, fechaSolicitud, observaciones)
        }

    }

    res.redirect('/');
})



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
    return;
}


module.exports = router;