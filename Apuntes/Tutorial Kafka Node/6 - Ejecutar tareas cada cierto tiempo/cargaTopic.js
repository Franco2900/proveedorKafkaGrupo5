// CARGO 6 MENSAJES AL TOPIC

const { Kafka } = require('kafkajs')

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
})


async function cargaTopic() {

    const producer = kafka.producer();  // Creo un productor
    await producer.connect();           // El productor se conecta
  
    await producer.send({     // El productor envia uno o varios mensajes al topic. Si no existe el topic, lo crea.
      topic: 'TopicDePrueba',
      messages: [
        { value: JSON.stringify({ nombreUsuario: 'Usuario_1', tituloReceta: 'receta_1'}) }, // Creo un mensaje json
        { value: JSON.stringify({ nombreUsuario: 'Usuario_2', tituloReceta: 'receta_2'}) },
        { value: JSON.stringify({ nombreUsuario: 'Usuario_3', tituloReceta: 'receta_3'}) },
        { value: JSON.stringify({ nombreUsuario: 'Usuario_4', tituloReceta: 'receta_4'}) },
        { value: JSON.stringify({ nombreUsuario: 'Usuario_5', tituloReceta: 'receta_5'}) },
        { value: JSON.stringify({ nombreUsuario: 'Usuario_6', tituloReceta: 'receta_6'}) }
      ],
    });
  
    await producer.disconnect() // El productor se desconecta
}
  
cargaTopic().catch(console.error);