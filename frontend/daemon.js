#!/usr/bin/env node

let port = 47120;
let host = 'localhost';

let speakers;

// Based off of Shawn Van Every's Live Web
// http://itp.nyu.edu/~sve204/liveweb_fall2013/week3.html

var fs = require('fs');

// Using express: http://expressjs.com/
var express = require('express');
var app = express();
var server = app.listen(process.env.PORT || 3000, listen);

app.use(express.static('public'));

function listen() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://' + host + ':' + port);
}

// https://stackoverflow.com/questions/64725626/how-to-fix-400-error-bad-request-in-socket-io
var io = require('socket.io')(server,{
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
         credentials: true
    },
    allowEIO3: true
});

// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
     function (socket) {

	 console.log("We have a new client: " + socket.id);

	 socket.on('speakers', message => {
	     console.log("*"+JSON.stringify(message,null,2)+"*");
	     speakers=message;
	     console.log("write file");
	     fs.writeFile('speakers.json', JSON.stringify(message,null,2), err => {
		 if (err) {
		     console.error(err);
		 } else {
		     // file written successfully
		 }
	     });
	     emitSpeakers(message);
	 })

	 socket.on('locate', num => {
	     osc2.send(new OSC.Message('/locate',num));
	 });

	 socket.on('stash', () => {
	     socket.emit('speakers',speakers)
	 });

	 socket.on('main', (val) => {
	     osc2.send(new OSC.Message('/main',val));
	 });

	 socket.on('disconnect', function() {
	     console.log('Client '+ socket.id + ' has disconnected');
	 });
	 //console.log(speakers);
	 socket.emit('speakers',speakers)
	 //io.sockets.emit('speakers',speakers)
     }
);

/*
io.sockets.on('speakers', (message) => {
    console.log(JSON.stringify(message,null,2));
})
*/


fs.readFile('speakers.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("daemon readfile");
    speakers=JSON.parse(data);
    
});




const OSC = require('osc-js')

const config = {
    udpServer: {
	// get external
	host: '0.0.0.0',    // @param {string} Hostname of udp server to bind to
	port: 9130,          // @param {number} Port of udp server to bind to
	exclusive: false      // @param {boolean} Exclusive flag
    },
    udpClient: {
	// send to aep
	port: port,
	//host: '192.168.1.103'
	host: host
    }
};

const osc = new OSC({ plugin: new OSC.BridgePlugin(config) })


osc.open();

osc.on('error',(err) => { console.log(err);});





const config2 = {
  type: 'udp4',         // @param {string} 'udp4' or 'udp6'
  open: {
    host: 'localhost',    // @param {string} Hostname of udp server to bind to
    port: 41234,          // @param {number} Port of udp server to bind to
    exclusive: false      // @param {boolean} Exclusive flag
  },
  send: {
    host: host,    // @param {string} Hostname of udp client for messaging
    port: port           // @param {number} Port of udp client for messaging
  }
}

const osc2 = new OSC({ plugin: new OSC.DatagramPlugin(config2) })

// no osc2.open() !!!!!!!!!!!!!!
//osc2.send(new OSC.Message("/test",5678,"test"));


function emitSpeakers(speakers){
    console.log("oscsend speakers");
    let radii=[];
    let message = new OSC.Message('/speaker');
    message.add(2);
    for(let i=0;i<speakers.length;i++){
        let sp=speakers[i];
        message.add(Math.round(sp.azimuth));
        radii.push(sp.radius);
    }
    osc2.send(message);

    let min=10000;
    let max=0;
    for(let i=0;i<radii.length;i++){
        let r=radii[i];
        if(r>max)max=r;
        if(r<min)min=r;
    }
    let delay=[]
    for(let i=0;i<radii.length;i++){
        let r=radii[i];
        let t=(max-r)/330
        delay.push(1000*t);
    }
    message = new OSC.Message('/delay');
    for(let i=0;i<delay.length;i++){
        let dl=delay[i];
        message.add(Math.round(dl));
    }
    //console.log(min,max);
    osc2.send(message);
}




//let m=new OSC.Message('/asdfasdfasdfasdfads',3.141459,"test");
//osc.send(m);


/*
// https://stackoverflow.com/questions/64725626/how-to-fix-400-error-bad-request-in-socket-io
var io = require('socket.io')(server,{
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
         credentials: true
    },
    allowEIO3: true
});


// Register a callback function to run when we have an individual connection
// This is run for each individual user that connects
io.sockets.on('connection',
  function (socket) {

        console.log("We have a new client: " + socket.id);
      
        socket.on('disconnect', function() {
          console.log('Client '+ socket.id + ' has disconnected');
        });

  }
);



//https://github.com/adzialocha/osc-js
const OSC = require('osc-js');

const options = {
  type: 'udp4',         // @param {string} 'udp4' or 'udp6'
  open: {
    host: '0.0.0.0',    // @param {string} Hostname of udp server to bind to
    port: 9000,          // @param {number} Port of udp server to bind to
    exclusive: false      // @param {boolean} Exclusive flag
  }
}


const osc = new OSC({ plugin: new OSC.DatagramPlugin(options) });
osc.open();

osc.on('open', message => {
    console.log('OSC-Server listening on port 9000');
});

osc.on('*', message => {
    console.log('recieved osc-message: '+JSON.stringify(message));
    io.sockets.emit('osc',message);
});
*/
