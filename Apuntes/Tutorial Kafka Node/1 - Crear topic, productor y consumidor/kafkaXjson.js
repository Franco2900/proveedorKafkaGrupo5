const { Kafka } = require('kafkajs')

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
})

const producer = kafka.producer();                                 // Creo un productor
const consumer = kafka.consumer({ groupId: 'grupoConsumidor-1' }); // Creo un consumidor. Le indico a que grupo de consumidores pertenece.

async function run() {

  // Produciendo
  await producer.connect(); // El productor se conecta

  await producer.send({     // El productor envia uno o varios mensajes al topic. Si no existe el topic, lo crea.
    topic: 'topic-1',
    messages: [
      { value: JSON.stringify({ nombre: 'Usuario_1', titulo: 'chef', dni: '111111111'}) }, // Creo el json
      { value: JSON.stringify({ nombre: 'Usuario_2', titulo: 'bombero', dni: '222222222'}) }
    ],
  });

  await producer.disconnect() // El productor se desconecta

  // Consumiendo
  await consumer.connect();  // El consumidor se conecta
  await consumer.subscribe({ topic: 'topic-1', fromBeginning: true }); // El consumidor se suscribe al topic y se queda esperando por mensajes nuevos. Si no existe el topic, lo crea.

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => { // Indica que acción debe hacer el consumidor para cada mensaje que le llegue
      console.log({
        partition,
        offset: message.offset,
        value: JSON.parse(message.value.toString() ), // Leo el json
      })
    },
  })

}

run().catch(console.error)