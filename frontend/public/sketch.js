let channels=[];
let sounds=[];
let soundsState=-1;
let files=[];
let playState
let play,pause,stop

let azimuth=[]
let radius=[];

let gui;

function channel(x,y,w=180,h=180){
    let pan=createSlider2d("Pan 1",x,y,w,h,-5,5,-5,5);
    let vol=createSliderV("Vol 1", x+w+10,y,w/4,h,-60,24);
    let rot=createSlider("Rot 1", x,y+h+10,w,h/4,-5,5);
    let button=createButton("0",x+w+10,y+h+10,25,25);
    vol.val=0
    rot.val=0;
    return { pan: pan, vol:vol, rot: rot, button:button }
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
    play=createButton("Play",px,off,80,30);
    pause=createButton("Pause",px+90,off,80,30);
    stop=createButton("Stop",px+2*90,off,80,30);

    files=['sounds/110319-master.ogg',
	   'sounds/100319-master.ogg',
	   'sounds/200119-long.ogg',
	   'sounds/150119-master.ogg',
	   'sounds/orgeltamtam-short.ogg'];
    
    for(let i=0;i<files.length;i++){
	sounds.push(createButton(i+1+"",px+270+i*40,off,30,30));
    }
    
    //createSlider("EEE",490,off,130,30);
}

function windowResized() {
    w=windowWidth;
    h=windowHeight;
    resizeCanvas(w,h);
}


function setPosOSC(x,y){
    const zero=0.00000000001;
    let a=Math.atan2(y,x)*(180/Math.PI);
    let r=Math.sqrt(x*x+y*y);
    if(a%1==0)a+=zero;
    if(r%1==0)r+=zero;                    //war "set"
    let message = new OSC.Message('/gunnar/set', i+1, a,zero,r);
    osc.send(message);  
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

	if(button.isPressed)rot.val=0;
	
	//if(rot.isChanged)console.log(rot.val)
	if(!pan.isChanged) {
	//if(true){
	    //console.log(pan.val);
	    let rrr=rotat(pan.val,rot.val);
	    //console.log(rrr.x,rrr.y);
	    pan.valX=rrr.x;
	    pan.valY=rrr.y;
	}
	//console.log(pan.val.x,pan.val.y);
        setPosOSC(pan.val.x,pan.val.y);	    
	
	if(vol.isChanged) {
	    let message = new OSC.Message('/gunnar/vol', i+1, vol.val);
            osc.send(message);  
	}   
    }
   
    if(pause.isChanged && pause.isPressed){
	let message = new OSC.Message('/gunnar/pause');
        osc.send(message);//console.log("PAUSE");
	playState=-1;
     }
   
    if(play.isChanged && play.isPressed){
	let message = new OSC.Message('/gunnar/play');
        osc.send(message);//console.log("paly");
	playState=1;
    }
    if(stop.isChanged && stop.isPressed){
	let message = new OSC.Message('/gunnar/stop');
        osc.send(message);//console.log("STOP");
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

