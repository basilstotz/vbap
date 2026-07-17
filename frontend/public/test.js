let v=[];

let w,h;


var fader=0;
let disp=0
let playing=false;

let assets={};



function preload(){
    assets=loadJSON('assets/assets.json');
}


function setup() {
    
    w=windowWidth;
    h=windowHeight;
    
    createCanvas(w,h);
    background(0);

    for (var i = 0; i < assets.videos.length; i++) {
	let file='assets/'+assets.videos[i] + '.' +assets.extension;
	console.log(file);
	v[i] = createVideo(file);
	v[i].hide();
	//v[i].onended(endedVideo);
    }

    socket = io.connect('http://localhost:3000');
    socket.on('osc',
	      function(message) {
		  console.log(JSON.stringify(message));
		  gmessage=JSON.stringify(message);
		  if(config.buttons){console.log(message);}
		  if(frameCount>100){
		      if(message.address=='/video'){
			  console.log("Got: " + message.args[0]);
			  showVideo(assets.videos.indexOf(message.args[0]));
		      }
		  }
	      });

}


function windowResized() {
    w=windowWidth;
    h=windowHeight;
    resizeCanvas(w,h);
    let tw=w/4;
    let th=h/3;
    let dw,dh;
    for (var i = 0; i < assets.videos.length; i++) {
	let dw=(i*tw)%w;
	let dh=floor(i/4)*th;
	v[i].size(tw,th).position(dw,dh);
    }
}

class Display {

    constructor(){

    }

    setDimension(x,y,w,h){
	this.x=x;
	this.y=y;
	this.w=w;
	this.h=h;
    }
    
    endedVideo(){
        this.playing=false;
        this.fader=0;
}

    showVideo(num){
        v[disp].stop();
    disp=num;
    playing=true;
    fader=0;
    v[disp].play();
}


function draw() {
            

    image(v[disp],0,0,w,h);
    //fill(128,128,128,128);
    if(!playing){
	    fader++;   
	    fill(0,0,0,map(fader,0,fframes,0,255,true));
	    rect(0,0,w,h);        
    }else{
            fader++;
	    fill(0,0,0,map(fader,0,20,255,0,true));
	    rect(0,0,w,h);
    }
    
}

