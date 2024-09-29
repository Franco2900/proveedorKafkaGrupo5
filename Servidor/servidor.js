const express = require('express') 
const app = express()    

const consumo = require('./consumo');
consumo.consumirOrdenesDeCompra();
/**************************** MIDDLEWARE *********************************/
app.use(express.json()); // Middleware para parsear los datos que me llegan de las solicitudes a JSON

/**************************** RUTAS *****************************/

 // EJEMPLO DE COMO FUNCIONAN LAS RUTAS CON EXPRESS
app.get('/', function(req, res) {  // La ruta '/' ejecutara la función que le pasamos. La función recibe dos objetos 'req' (solicitud) y 'res' (respuesta)
                                  
    res.send(`<!doctype html><html><head></head><body><h1>      
            Mi primer pagina con Express</h1></body></html>`) // Mediante el objeto 'res' respondemos al navegador que hizo la solicitud
})

app.use('/ordenesDeCompra', require('./Rutas/ordenesDeCompra') );
app.use('/novedades', require('./Rutas/novedades') );

/*************************** ARRANQUE SERVIDOR ********************************/

const server = app.listen(2000, () => { // Creo el servidor y le indico que escuche en el puerto 2000. Ir a localhost:2000 con el navegador para ver los resultados
    console.log('Servidor web iniciado')
})