const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
});


async function ejecutar() {

    const admin    = kafka.admin();                       
    const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); 

    await admin.connect();
    await consumer.connect();

    await consumer.subscribe({ topic: 'TopicDePrueba', fromBeginning: true }); 
    
    let ultimoOffset = await admin.fetchTopicOffsets('TopicDePrueba');
    let ultimoValorOffset = ultimoOffset[0].offset - 1; 
    console.log(ultimoValorOffset)

    await consumer.run({eachMessage: async ({ topic, partition, message }) => { 
        
        console.log({nombreUsuario: JSON.parse(message.value.toString() ).nombreUsuario, tituloReceta: JSON.parse(message.value.toString() ).tituloReceta});

        if(ultimoValorOffset == message.offset) {
            // Borra todos los mensajes desde el primero de todos hasta cierto valor offset (sin incluir el mensaje con dicho valor offset)
            await admin.deleteTopicRecords({
                topic: ['TopicDePrueba'][0],
                partitions: [
                    { partition: 0, offset: '-1' }, // Con -1 borra todos los mensajes del topic, sin borrar el topic en si (si se pone offset: '4' borraría los mensajes con offset 0, 1, 2 y 3)
                ]
            })
            
            await admin.disconnect();
        }

    } });

    consumer.seek({ topic: 'TopicDePrueba', partition: 0, offset: '0' });

    // Por algún motivo que no entiendo, no se puede simplemente borrar así los mensajes
    /*let admin    = kafka.admin(); 
    await admin.connect();

    // Borra todos los mensajes desde el primero de todos hasta cierto valor offset (sin incluir el mensaje con dicho valor offset)
    await admin.deleteTopicRecords({
        topic: 'TopicDePrueba',
        partitions: [
            { partition: 0, offset: '4' }, // Borra los mensajes con offset 0, 1, 2 y 3 (si se pone offset: '-1' borra todos los mensajes del topic, sin borrar el topic en si)
        ]
    })
    
    await admin.disconnect();*/
}

ejecutar().catch(console.error);