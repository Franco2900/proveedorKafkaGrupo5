/************************************ CONFIGURACIÓN DE LA BASE DE DATOS **********************************/
const conexionDataBase = require('../Servidor/conexionDataBase.js');

/************************************ FUNCIONES DE BORRADO DE DATOS **********************************/
async function borradoDatosDePrueba()
{
    console.log('Borrando datos');
    var tablasABorrar = ['producto', 'item', 'despacho', 'orden_de_compra'];

    for (const tabla of tablasABorrar) {
        await conexionDataBase.query(`DELETE FROM ${tabla}`, {} );
    }

    var tablasAReiniciarID = ['item', 'despacho', 'orden_de_compra'];
    for(const tabla of tablasAReiniciarID){
        await conexionDataBase.query(`ALTER TABLE ${tabla} AUTO_INCREMENT = 1;`)
    }

    console.log('Datos completamente borrados de la base de datos Stockearte');
}

borradoDatosDePrueba();
