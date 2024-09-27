const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'],
});


async function modificarMensajes() {

    // Configuración de los participantes
    const producer = kafka.producer();    
    const admin    = kafka.admin();                       
    const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); 

    await producer.connect();
    await admin.connect();
    await consumer.connect();

    await consumer.subscribe({ topic: 'TopicDePrueba', fromBeginning: true }); 
    
    // Variables a usar
    let ultimoOffset = await admin.fetchTopicOffsets('TopicDePrueba');
    let ultimoValorOffset = ultimoOffset[0].offset - 1; 

    let datos = []; // Todos los mensajes del topic se guardan acá

    let usuarioAModificar = 'Usuario_5';
    let recetaAModificar  = 'receta_20';

    // Ejecución de los participantes
    await consumer.run({eachMessage: async ({ topic, partition, message }) => { 
        
        console.log({nombreUsuario: JSON.parse(message.value.toString() ).nombreUsuario, tituloReceta: JSON.parse(message.value.toString() ).tituloReceta});
        
        // Guardo los mensajes
        let dato = { nombreUsuario: JSON.parse(message.value.toString() ).nombreUsuario, tituloReceta: JSON.parse(message.value.toString() ).tituloReceta };
        datos.push(dato);

        // Si llego al último mensaje 
        if(ultimoValorOffset == message.offset) {
            
            // Borra todos los mensajes
            await admin.deleteTopicRecords({
                topic: ['TopicDePrueba'][0],
                partitions: [
                    { partition: 0, offset: '-1' },
                ]
            })
            
            await admin.disconnect();

            // Vuelvo a añadir los datos originales más el que quiero modificar
            for(let i = 0; i < datos.length; i++)
            {
                if(datos[i].nombreUsuario != usuarioAModificar) // Si no es el usuario que quiero modificar, dejo los datos intactos
                {
                    await producer.send({  
                        topic: 'TopicDePrueba',
                        messages: [
                            { value: JSON.stringify({ nombreUsuario: `${datos[i].nombreUsuario}`, tituloReceta: `${datos[i].tituloReceta}`}) },   
                        ],
                    });
                }
                else    // Si es el usuario que quiero modificar, modifico los datos
                {
                    await producer.send({  
                        topic: 'TopicDePrueba',
                        messages: [
                            { value: JSON.stringify({ nombreUsuario: `${datos[i].nombreUsuario}`, tituloReceta: `${recetaAModificar}`}) },   
                        ],
                    });
                }

            }
            
            await producer.disconnect();
        }


    
    } });

    consumer.seek({ topic: 'TopicDePrueba', partition: 0, offset: '0' });
}

modificarMensajes().catch(console.error);