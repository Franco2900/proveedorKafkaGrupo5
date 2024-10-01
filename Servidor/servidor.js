const express = require('express') 
const app = express()    

const consumo = require('./consumo');
consumo.consumirOrdenesDeCompra();
/**************************** MIDDLEWARE *********************************/
app.use(express.json()); // Middleware para parsear los datos que me llegan de las solicitudes a JSON
app.set('view engine','ejs');
app.use(express.urlencoded({extended:false}));
/**************************** RUTAS *****************************/

app.use('/ordenesDeCompra', require('./Rutas/ordenesDeCompra') );
app.use('/',require('./Rutas/producto'))
/*************************** ARRANQUE SERVIDOR ********************************/

const server = app.listen(2000, () => { // Creo el servidor y le indico que escuche en el puerto 2000. Ir a localhost:2000 con el navegador para ver los resultados
    console.log('Servidor proveedor iniciado')
})