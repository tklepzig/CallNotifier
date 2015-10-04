/*

// send to current request socket client
 socket.emit('message', 'this is a test');

 // sending to all clients, include sender
 io.sockets.emit('message', 'this is a test');

 // sending to all clients except sender
 socket.broadcast.emit('message', 'this is a test');

 // sending to all clients in 'game' room(channel) except sender
 socket.broadcast.to('game').emit('message', 'nice game');

  // sending to all clients in 'game' room(channel), include sender
 io.sockets.in('game').emit('message', 'cool game');

 // sending to individual socketid
 io.sockets.socket(socketid).emit('message', 'for your eyes only');

*/

'use strict';

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var net = require('net');
var mqtt = require('mqtt');
var options = {
    host: 'zetaone',
    port: 1883,
    protocolId: 'MQIsdp',
    protocolVersion: 3
};
var mqttClient = mqtt.connect(options);

mqttClient.on('error', function(e) {
    console.log('Error: ' + e);

});

mqttClient.on('connect', function() {
    console.log('Connected to MQTT Broker');
    mqttClient.subscribe('ws-test');
});

mqttClient.on('message', function(topic, message) {
    if (topic === 'ws-test') {
        io.sockets.emit('ws-test', message.toString());
    }
});


//Ausgehende Anrufe: datum;CALL;ConnectionID;Nebenstelle;GenutzteNummer;AngerufeneNummer;
//Eingehende Anrufe: datum;RING;ConnectionID;Anrufer-Nr;Angerufene-Nummer;
//Zustandegekommene Verbindung: datum;CONNECT;ConnectionID;Nebenstelle;Nummer;
//Ende der Verbindung: datum;DISCONNECT;ConnectionID;dauerInSekunden;


var HOST = '192.168.178.1';
var PORT = 1012;
var client = new net.Socket();
client.connect(PORT, HOST, function() {
    console.log('Connected to TCP Socket: ' + HOST + ':' + PORT);
});

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

client.on('data', function(data) {

    var callInfo = ab2str(data).split(';');

    var result = {};

    switch (callInfo[1]) {
        case 'CALL':
            result.type = 'outgoing';
            result.from = callInfo[4];
            result.to = callInfo[5];
            break;
        case 'RING':
            result.type = 'incoming';
            result.from = callInfo[3];
            result.to = callInfo[4];
            break;
        case 'CONNECT':
            result.type = 'connect';
            break;
        case 'DISCONNECT':
            result.type = 'disconnect';
            result.duration = callInfo[3];
            break;
        default:

    }

    // switch (items[1])
    // {
    //     case 'CALL':
    //         {
    //             OnNewCall(this, new CallEventArgs
    //             {
    //                 DateTime = DateTime.Parse(items[0]),
    //                 Type = CallType.Outgoing,
    //                 ConnectionId = items[2],
    //                 From = items[4],
    //                 To = items[5]
    //             });
    //             break;
    //         }
    //     case 'RING':
    //         {
    //             OnNewCall(this, new CallEventArgs
    //             {
    //                 DateTime = DateTime.Parse(items[0]),
    //                 Type = CallType.Incoming,
    //                 ConnectionId = items[2],
    //                 From = items[3],
    //                 To = items[4]
    //             });
    //             break;
    //         }
    //     case 'CONNECT':
    //         {
    //             OnConnected(this, new ConnectedEventArgs
    //             {
    //                 DateTime = DateTime.Parse(items[0]),
    //                 ConnectionId = items[2],
    //                 Number = items[4]
    //             });
    //             break;
    //         }
    //     case 'DISCONNECT':
    //         {
    //             OnDisconnected(this, new DisconnectedEventArgs
    //             {
    //                 DateTime = DateTime.Parse(items[0]),
    //                 ConnectionId = items[2],
    //                 Duration = Int32.Parse(items[3])
    //             });
    //             break;
    //         }
    // }


    mqttClient.publish('phone', JSON.stringify(result));
    io.sockets.emit('phone', result);
});

client.on('close', function() {
    console.log('Connection closed');
});

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(52003, function() {
    console.log('listening on *:52003');
});
