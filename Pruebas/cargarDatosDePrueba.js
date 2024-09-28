/************************************ CONFIGURACIÓN DE LA BASE DE DATOS **********************************/
const conexionDataBase = require('../Servidor/conexionDataBase.js');

/************************************ FUNCION DE CARGA DE DATOS **********************************/
async function cargarProducto(registro)
{
    var resultadoProducto = await conexionDataBase.query('SELECT EXISTS(SELECT codigo from producto where codigo = ?) AS existe', [registro.codigo]);
    var existeProducto = resultadoProducto[0].existe;

    if (existeProducto) console.log('ERROR: Ya existe el producto ' + registro.codigo);
    else 
    {
        try
        {
            await conexionDataBase.query(
                'INSERT INTO producto (codigo, nombre, talle, foto, color, stock) VALUES (?, ?, ?, ?, ?, ?)',
                [registro.codigo, registro.nombre, registro.talle, registro.foto, registro.color, registro.stock]
            );
            console.log('Se cargo el producto: ' + registro.codigo);
        } 
        catch(error) {console.log(error);}
    };
    
}

/************************** DATOS HARDCODEADOS PARA REALIZAR PRUEBAS ****************************/ 
async function cargaDatosDePrueba()
{
    console.log('Cargando datos de prueba a la base de datos: proveedor');

    const productos = [
        {nombre: 'Camisa Básica',    codigo: 'CB123', talle: 'M',  foto: 'urlFoto', color: 'Rojo',    stock: 10},
        {nombre: 'Pantalones Jeans', codigo: 'PJ456', talle: 'L',  foto: 'urlFoto', color: 'Azul',    stock: 8},
        {nombre: 'Campera',          codigo: 'AAAAA', talle: 'XL', foto: 'urlFoto', color: 'Gris',    stock: 3},
        {nombre: 'Gorra',            codigo: 'BBBBB', talle: 'S',  foto: 'urlFoto', color: 'Naranja', stock:0}  
    ]

    for (const producto of productos) {
        await cargarProducto(producto);
    }
}

cargaDatosDePrueba();