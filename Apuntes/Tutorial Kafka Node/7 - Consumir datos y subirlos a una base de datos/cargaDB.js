const { Kafka } = require('kafkajs');
var mysql = require('mysql');   // Módulo para trabajar con bases de datos SQL

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
})


var conexion = mysql.createConnection({ // Creo una conexión a la base de datos
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'basedeprueba'
})

conexion.connect(function (error) { // Me conecto a la base de datos
    if (error) console.log('Problemas de conexion con mysql')
    else       console.log('Se inicio conexión')
})



async function cargaDB() {

    const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); 
    await consumer.connect(); 
    await consumer.subscribe({ topic: 'TopicDePrueba', fromBeginning: true }); 

    // Consumo todos los mensajes de un topic
    await consumer.run({eachMessage: async ({ topic, partition, message }) => { 

        const registro = {
            nombreUsuario: JSON.parse(message.value.toString() ).nombreUsuario,
            tituloReceta:  JSON.parse(message.value.toString() ).tituloReceta
        }

        console.log(registro);

        // Subo los mensajes a una base de datos
        conexion.query('INSERT INTO tabladeprueba SET ?', registro, function (error, resultado) {
            if (error) 
            {
              console.log(error)
              return
            }
        })

    } })
    
    consumer.seek({ topic: 'TopicDePrueba', partition: 0, offset: 0 });
}

cargaDB().catch(console.error);