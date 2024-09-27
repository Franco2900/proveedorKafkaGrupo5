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
      { value: 'Mensaje de prueba 1' },
      { value: 'Mensaje de prueba 2' }
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
        value: message.value.toString(),
      })
    },
  })

  // Una vez que se ejecuta el consumidor no se lo puede desconectar, a lo sumo se lo puede poner a dormir para que siga funcionando más adelante (esto se ve en otro tema más adelante)
}

run().catch(console.error)