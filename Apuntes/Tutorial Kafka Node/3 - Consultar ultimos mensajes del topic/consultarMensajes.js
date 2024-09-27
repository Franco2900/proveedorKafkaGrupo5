// VEO LOS ÚLTIMOS 3 MENSAJES DEL TOPIC

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});



async function consultarMensajes() {

    const admin = kafka.admin(); // Creo un admin
    const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); 

    await admin.connect();
    await consumer.connect();

    await consumer.subscribe({ topic: 'TopicDePrueba', fromBeginning: true }); 

    await consumer.run({ // Indico que hacer con cada mensaje recibido
        eachMessage: async ({ topic, partition, message }) => { 
            console.log({
                nombreUsuario: JSON.parse(message.value.toString() ).nombreUsuario,
                tituloReceta:  JSON.parse(message.value.toString() ).tituloReceta
            })
        },
    })

    // Consulto el último valor offset
    let ultimoOffset = await admin.fetchTopicOffsets('TopicDePrueba'); //  Estructura de un offset  { partition: 3, offset: '28', high: '28', low: '0' },
    let ultimoValorOffset = ultimoOffset[0].offset;
    console.log("Ultimo valor offset: " + ultimoValorOffset);
    await admin.disconnect();

    // Trae todos los mensajes desde un valor offset en adelante 
    // Esta función se ejecuta si o si después de ejecutar la función consumer.run() (https://kafka.js.org/docs/consuming#seek)
    // consumer.seek() solo busca los mensajes y no devuelve nada. consumer.run() define que se hace con cada mensaje encontrado
    consumer.seek({ topic: 'TopicDePrueba', partition: 0, offset: `${(parseInt(ultimoValorOffset))-3}` });
}

consultarMensajes().catch(console.error)
