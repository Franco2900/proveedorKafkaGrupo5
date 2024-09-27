const { Kafka } = require('kafkajs')

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

async function mostrarMensajesPeriodicamente() {

    const admin = kafka.admin();
    await admin.connect();

    const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); 
    await consumer.connect(); 
    await consumer.subscribe({ topic: 'TopicDePrueba', fromBeginning: true }); 

    let ultimoOffset = await admin.fetchTopicOffsets('TopicDePrueba'); 
    let ultimoValorOffset = ultimoOffset[0].offset - 1;
    console.log("Ultimo valor offset: " + ultimoValorOffset);
    admin.disconnect();

    let cantidadDeMensajes = 0;

    await consumer.run({eachMessage: async ({ topic, partition, message }) => { 

        console.log({
            nombreUsuario: JSON.parse(message.value.toString() ).nombreUsuario,
            tituloReceta:  JSON.parse(message.value.toString() ).tituloReceta
        });

        cantidadDeMensajes++;
        
        // Si es el último mensaje
        if(message.offset == ultimoValorOffset) 
        {    
            console.log(`Cantidad de mensajes: ${cantidadDeMensajes}`);
            
            cantidadDeMensajes = 0; // Reinicio los valores porque se produce un error si no se los reinicia
            consumer.pause();       // Pauso al consumidor para que no consuma más recursos
        }
    } })
    
    consumer.seek({ topic: 'TopicDePrueba', partition: 0, offset: 0 });

    setTimeout(() => mostrarMensajesPeriodicamente().catch(console.error), 20000); // Ejecuto esta función cada 20 segundos
}

mostrarMensajesPeriodicamente().catch(console.error);

// Solución sacada de: https://stackoverflow.com/questions/49910241/nodejs-how-to-call-a-function-again-when-it-finishes