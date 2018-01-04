const config =require('./config.json')

let mqtt = require('mqtt')
let http = require('http')
let url = require('url')

let port = 3003

var client  = connect();

function connect() {
    let client = mqtt.connect("mqtt://localhost:8883", {
        will : {
            topic: `${config.aedesDeviceId}/info/status`,
            payload : 'ERROR',
            qos : 2
        },
        clientId : config.aedesDeviceId,
        clean : false
    });

    client.on('connect', function () {
        client.publish(`${config.aedesDeviceId}/info/status`, 'ONLINE');
        console.log(`+-----------------------------------+`);        
        console.log(`| client [${config.aedesDeviceId}] goes online |`);
        console.log(`+-----------------------------------+`);
    })
    client.on('message', function (topic, message) { 
        // message is Buffer
        console.log(topic.toString() + " : " + message.toString());
    })

    client.on('offline', function () {
        // observed that triggered when mqtt server offline
        console.log(`client [${config.aedesDeviceId}] goes offline`);
        client.publish(`${config.aedesDeviceId}/info/status`, 'OFFLINE');
    });

    client.on('close', function () {
        console.log(`=======================================`);
        console.log(`client [${config.aedesDeviceId}] has been shutdown`);
        console.log(`=======================================`);
    });

    client.on('error', function (error) {
        console.log('error:', error);
    });

    return client;
}

http.createServer(function(req,res){
    let q = url.parse(req.url,true).query;
    
    if (q.topic){
        console.log(`client [${config.aedesDeviceId}] publish:`, q);
        client.publish(q.topic, q.payload, { qos: 1 })
    }else if (q.connect){
        let isConnect = q.connect.toLowerCase()==='true';

        if (isConnect && !client.connected) {
            console.log(`starting up the MQTT client [${config.aedesDeviceId}]`);
            client = connect();
        }else if (!isConnect && client.connected) {
            console.log(`shutting down [${config.aedesDeviceId}]... `);
            client.publish(`${config.aedesDeviceId}/info/status`, 'OFFLINE');
            client.end();
        }
    }

    res.end('OK');

}).listen(port, () => {
    console.log(`listening on ${port}`);
});