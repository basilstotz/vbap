let channels=[];
let noise=[];
let main;

let sounds=[];
let soundsState=-1;
let files=[];
let playState
let play,pause,stop

let azimuth=[]
let radius=[];

let link;

let gui;

let socket;

function dBtoLevel(db){
    return Math.pow(10,db/20);
}

function channel(x,y,w=180,h=180){
    let pan=createSlider2d("Pan 1",x,y,w,h,-5,5,-5,5);
    //console.log(pan);
    let vol=createSliderV("Vol 1", x+w+10,y,w/4,h,-60,24);
    let rot=createCrossfader("Rot 1", x,y+h+10,w,h/4,-5,5);
    let button=createButton("R",x+w+10,y+h+10,20,20);
    let center=createButton("C",x+w+10,y+h+10+25,20,20);
    let noise=createCheckbox("N",x+w+10+25,y+h+10,20,20);
    let mute=createCheckbox("M",x+w+10+25,y+h+10+25,20,20);
    vol.val=0
    rot.val=0;
    noise.val=1;
    mute.val=1;
    return { pan: pan,
	     vol:vol,
	     rot: rot,
	     button:button,
	     noise: noise,
	     center: center,
	     mute: mute
	   }
}

function noiseButtons(x,y){
    let xpos=x;
    noise[0]=createButton("off",xpos,y+10,40,20);
    for(let i=1;i<8;i++){
	noise[i]=createButton(i,xpos+50,y+10,20,20);
	xpos+=30;
    }
    //
}

function makeLink(x,y){
    link=createButton("Speakers",x,y,150,20)
}

console.log(noise);

function oscsend(...args){
    let message = new OSC.Message(...args);
    osc.send(message);
}

function radToDeg(rad){
    return rad*(180/Math.PI)
}

function emitSpeakers(speakers){
    console.log("receved speakers message");
    let radii=[];
    let message = new OSC.Message('/speaker');
    message.add(2);
    for(let i=0;i<speakers.length;i++){
	let sp=speakers[i];
	message.add(Math.round(sp.azimuth));
	radii.push(sp.radius);
    }
    osc.send(message);

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
    osc.send(message);
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    frameRate(10);

    /*
    for(let i=0;i<16;i++){
	azimuth[i]=0;
	radius[i]=1;
    }
    */

    //socket= io();
    //socket.on('speakers',);

    
    gui = createGui();

    // simpleLayout(); // <- uncomment for simple layout
    //gui.mobileLayout(); // <- uncomment for mobile layout  

    // Set style to Blue!
    gui.loadStyle("Blue");
    //gui.loadStyle("TerminalGreen");

    playState=0;
    
    let px=10;
    let py=10
    for(let j=0;j<2;j++){
	for(let i=0;i<4;i++){
	    channels.push(channel(px+i*250,py+j*250));
	}
    }
    let off=py+2*250;
    //noiseButtons(735,off);

    makeLink(850,off+5);
    
    main=createSlider("Rot 1", 10,off,430,35,-90,0);
    main.val=-6;

    //init vbap
    //oscsend("/fader",200);
    //oscsend("/speaker", 2, 0, 45, 90, 135, 180, 225, 270, 315);
    //oscsend("/delay", 0, 0, 0, 0, 0, 0, 0, 0);
    


    
}

function windowResized() {
    w=windowWidth;
    h=windowHeight;
    resizeCanvas(w,h);
}


function setPosOSC(index,x,y){
    const zero=0.00000000001;
    let a=Math.atan2(y,x)*(180/Math.PI);
    let r=Math.sqrt(x*x+y*y);
    if(a%1==0)a+=zero;
    if(r%1==0)r+=zero;
    oscsend('/aed',index+1, a,zero,r);  
}

function rotat(val,r){
    //console.log("3333",x,y,r);
    let f=5*Math.pow(10,Math.abs(r));
    let s=1;
    if(r!==0)s=Math.abs(r)/r;
   
    let rr=r	
    //let rr=f*s;
    //console.log(rr);
    rr=r*(Math.PI/180);
    let x2=val.x*Math.cos(rr)-val.y*Math.sin(rr)
    let y2=val.x*Math.sin(rr)+val.y*Math.cos(rr)
    //console.log("4444",x2,y2,r);
    val.x=x2
    val.y=y2;
    return { x:x2,y:y2}
}

let panText="";

function output(){
    for(i=0;i<channels.length;i++){
	
	let chan=channels[i];
	let pan=chan.pan;
	let vol=chan.vol;
	let rot=chan.rot;
	let button=chan.button;
	let noise=chan.noise;
	let center=chan.center;
	let mute=chan.mute;

	if(button.isPressed)rot.val=0;

	if(center.isPressed){
	    pan.val.x=0;
	    pan.val.y=0;
	}
	if(noise.isChanged){
	    if(noise.val==0){
		oscsend("/noise",i+1)
	    }else{
		oscsend("/noise",0);
	    }
	}
	if(mute.isChanged){
	    if(mute.val==0){
		//on
		oscsend("/volume",i+1,dBtoLevel(-90))
	    }else{
		//off
		oscsend("/volume",i+1,dBtoLevel(vol.val))
	    }
	}
	
	if(vol.isChanged) {
	    //let message = new OSC.Message();
            oscsend('/volume', i+1, dBtoLevel(vol.val));
	}

	//if(rot.isChanged)console.log(rotaaaal)
	if(!pan.isChanged) {
	//if(true){
	    //console.log(pan.val);
	    let rrr=rotat(pan.val,rot.val);
	    //console.log(rrr.x,rrr.y);
	    pan.valX=rrr.x;
	    pan.valY=rrr.y;
	}
	let r=Math.sqrt(pan.valX*pan.valX+pan.valY*pan.valY)
	if(pan.isChanged ||( Math.abs(rot.val)>0.0001 && r>0.1 && frameCount%2==0)){
	    //console.log(i,pan.val.x,pan.val.y);
	    setPosOSC(i,pan.val.x,pan.val.y);	    
	}	
	//ochan=JSON.parse(JSON.stringify(chan));
    }//all channels

    if(main.isChanged){
	oscsend("/main",dBtoLevel(main.val));
    }


	if(link.isPressed){
	    window.location='speaker/index.html'
	}
/*	
    for(let i=0;i<8;i++){
	
	if(noise[i].isPressed){
	    for(let j=0;j<8;j++)noise[j].setStyle( {fillBg: color("#aaaaff")}); 
	    noise[i].setStyle( {fillBg: color("#eeeeee")}); 
	    
	    //noise[i].val=1;
	    oscsend("/locate",i);
	}
	    
    }
*/
}

function draw() {
    background(220);
    drawGui();
    output();
    //text(panText,50,50);

}

/// Add these lines below sketch to prevent scrolling on mobile
function touchMoved() {
  // do some stuff
  return false;
}

/*
     if(pause.isChanged && pause.isPressed){
	//let message = new OSC.Message('/gunnar/pause');
        oscsend('/gunnar/pause');
	playState=-1;
     }
   
    if(play.isChanged && play.isPressed){
	//let message = new OSC.Message('/gunnar/play');
        oscsend('/gunnar/play');//console.log("paly");
	playState=1;
    }
    if(stop.isChanged && stop.isPressed){
	//let message = new OSC.Message('/gunnar/stop');
        osc.send('/gunnar/stop');//console.log("STOP");
	playState=0;
    }
    play.setStyle( {fillBg: color("#aaaaaa")}); 
    pause.setStyle( {fillBg: color("#aaaaaa")}); 
    stop.setStyle( {fillBg: color("#aaaaaa")});
    play.setStyle( {fillBgHover: color("#aaaaaa")}); 
    pause.setStyle( {fillBgHover: color("#aaaaaa")}); 
    stop.setStyle( {fillBgHover: color("#aaaaaa")});
    switch(playState){
    case -1:
	
	pause.setStyle( {fillBg: color("#ffaaaa")});
	pause.setStyle( {fillBgHover: color("#ffaaaa")});

	break;
    case 0:
	stop.setStyle( {fillBg: color("#ffaaaa")});
	stop.setStyle( {fillBgHover: color("#ffaaaa")});
	break;
    case 1:
	play.setStyle( {fillBg: color("#ffaaaa")});
	play.setStyle( {fillBgHover: color("#ffaaaa")});
	break;
    }
    for(let i=0;i<sounds.length;i++){
	let b=sounds[i];
	b.setStyle( { fillBg: color("#aaaaaa")});
	b.setStyle( { fillBgHover: color("#aaaaaa")});
	if(b.isChanged && b.isPressed){
	    soundsState=i;
	    let message = new OSC.Message('/gunnar/file',files[i]);
            osc.send(message);
	}
	if(soundsState!=-1){
		sounds[soundsState].setStyle( { fillBg: color("#ffaaaa")});
		sounds[soundsState].setStyle( { fillBgHover: color("#ffaaaa")});
        }
    }
*/
