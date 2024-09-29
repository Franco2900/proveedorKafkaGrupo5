var express = require('express');
var router  = express.Router();

const conexionDataBase = require('../conexionDataBase.js');

/*router.get('/', async (req, res) => {

})*/


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
    const codigo = req.body.codigo;
    const nombre = req.body.nombre; 
    const talle = req.body.talle;
    const foto = req.body.foto;
    const color = req.body.color;
    const stock = req.body.stock;


    await conexionDataBase.query(`INSERT INTO producto 
    SET codigo='${codigo}',nombre='${nombre}',talle='${talle}',
    foto ='${foto}',color='${color}',stock=${stock} `,(error,results)=>{

        if(error){
            throw error;
        }else{
            res.redirect('/producto/lista')
        }
    })

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