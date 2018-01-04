const config = require('./config.json')

let aedesPersistenceDB = require('aedes-persistence-mongodb')
let persistence = aedesPersistenceDB({
    url: config.persistence.url
})
let mqmongo = require('mqemitter-mongodb')
let emitter = mqmongo({
    url: config.persistence.url
})
let aedesOpt = {
    mq : emitter,
    concurrency : config.aedesOpt.concurrency,
    heartbeatInterval : config.aedesOpt.heartbeatInterval,
    connectTimeout : config.aedesOpt.connectTimeout,
    persistence : persistence
}
let aedes = require('aedes')(config.aedesOpt)
let server = require('net').createServer(aedes.handle)

let port = 8883


server.listen(port, function () {
    console.log('server listening on port', port)
})

// Handle aedas event
// --------------------------------------------------
aedes.on('client', client => {
    console.log(`Client [${client.id}] connected`);
})

aedes.on('clientDisconnect', client => {
    console.log(`Client [${client.id}] disconnected`);
})

aedes.on('clientError', (client, err) => {
    console.log(`Client [${client.id}] encountered error: ${JSON.stringify(err)}`);
})

aedes.on('publish', (packet, client) => {
    client ? console.log(`Client [${client.id}] published on ${packet.topic}: ${packet.payload}`) 
        : console.log(`aedes published on ${packet.topic}: ${packet.payload}`);
})

aedes.on('subscribe', (subscriptions, client) => {
    var subscriptionArr = subscriptions.map(subscription => {
        return `${subscription['topic']} (${subscription['qos']})`;
    });
    client ? console.log(`Client [${client.id}] subscribed ${subscriptionArr}`)
        : console.log(`aedes subscribed ${packet.topic}: ${packet.payload}`);
})

aedes.on('unsubscribe', (unsubscriptions, client) => {
    client ? console.log(`Client [${client.id}] unsubscribe ${unsubscriptions}`) : '';
})
// --------------------------------------------------

// emitter
// --------------------------------------------------
emitter.on('event/+/+/+', (message, done) => {
    console.log(">>>>>>>", message);
    done();
})
var msg = {
    topic: 'event/1/2/3',
    payload: 'aedes alpha on!'
}
emitter.emit(msg, () =>  {
    console.log("emitted")
})