const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092']
});
    
const admin = kafka.admin(); // Creo un admin
const producer = kafka.producer();  // Creo un productor

async function run() {
    
    await admin.connect();
    
    // Crea un topic
    /*await admin.createTopics({
        validateOnly: false,    // Si es true, la solicitud se validará pero no se creará el topic (por defecto esta en false)
        waitForLeaders: false,  // Si es true, va a esperar un tiempo por un lider. Si pasa dicho tiempo y no aparece ningún lider, se convierte en lider (por defecto esta en true)
        timeout: 2000,          // Tiempo que espera en milisegundos (por defecto es 5000)
        topics: [{topic: 'topicAdmin', numPartitions: -1,  replicationFactor: -1, replicaAssignment: [], configEntries: [] }] // Topics a crear
    })*/
        
    /*  Estructura del topic:
        [{
            topic: <String>,
            numPartitions: <Number>,     // default: -1 (uses broker `num.partitions` configuration)
            replicationFactor: <Number>, // default: -1 (uses broker `default.replication.factor` configuration)
            replicaAssignment: <Array>,  // Example: [{ partition: 0, replicas: [0,1,2] }] - default: []
            configEntries: <Array>       // Example: [{ name: 'cleanup.policy', value: 'compact' }] - default: []
        }]
    */
    

    // Cargo el topic con un producer
    /*await producer.connect(); 
    await producer.send({     
        topic: 'topicAdmin',
        messages: [
            { value: JSON.stringify({ nombre: 'Usuario_1', titulo: 'chef', dni: '111111111'}) }, 
            { value: JSON.stringify({ nombre: 'Usuario_2', titulo: 'bombero', dni: '222222222'}) },
            { value: JSON.stringify({ nombre: 'Usuario_3', titulo: 'profesor', dni: '333333333'}) }
        ],
    });
    await producer.disconnect();*/


    // Devuelve una lista de los topics existentes
    //console.log(await admin.listTopics() ); 
    

    // Borra un topic
    /*await admin.deleteTopics({
        topics: ['topicAdmin'],
        timeout: 2000, // por defecto es 5000
    })*/

    
    // Consulta datos de uno o varios topics y sus particiones
    /*console.log(await admin.fetchTopicMetadata({ topics: ['topicAdmin'] }));
    //  La consulta devuelve varios topics
    //  {
    //      topics: <Array<TopicMetadata>>,
    //  }
    let topicsConsulta = await admin.fetchTopicMetadata({ topics: ['topicAdmin'] });
    console.log(topicsConsulta.topics);
    //  De cada topic podemos saber el nombre y datos sobre sus particiones
    //  {
    //      name: <String>,
    //      partitions: <Array<PartitionMetadata>> // default: 1
    //  }
    console.log(topicsConsulta.topics[0].name); // Consulto el nombre de un topic en especifico
    */

    // Consulta el último offset
    let ultimoMensaje = await admin.fetchTopicOffsets('topicAdmin');
    console.log(ultimoMensaje);
    console.log(ultimoMensaje[0].offset);
    //  Estructura de un offset { partition: 3, offset: '28', high: '28', low: '0' },
    

    await admin.disconnect();
}
    
run().catch(console.error)