let w,h;


let stage;

let black,grey,mute;

let cx,cy;
let mx,my;

let send;
let uniform;
let locateButton=[];

let socket;

const PIXELPERMETER = 100;

class Speaker{
    constructor(azimuth,radius,label=''){
	this.azimuth=azimuth;
	this.radius=radius;
	this.label=label;
	//this.selected=false;
    }

    
    update(){
	let y=mToPx(Math.sin(degToRad(this.azimuth))*this.radius);
	let x=mToPx(Math.cos(degToRad(this.azimuth))*this.radius);

	//text(x+" "+mouseX+" "+y+" "+mouseY,100,100);
	//text("gaga",100,100);
	
	let dx=mx-x;
	let dy=my-y;

	if(mouseIsPressed){

	    let r=Math.sqrt(dx*dx+dy*dy);
	    if(r<20){
		this.selected=true;
		this.show(gray,x,y);
		
		let a=radToDeg(Math.atan2(my,mx));
		let r=pxToM(Math.sqrt(mx*mx+my*my))
		this.azimuth=a;
		this.radius=r;
		push();
		scale(1,-1);
		translate(cx-80,-cy+10);
		//translate(-100+x,-130+y);
		fill(255);
		rect(0,0,70,110);
		fill(0);
		noStroke();
		textSize(18);
		text(this.label,10,20)
		fill(0);
		textSize(14);
		text("a = "+Math.round(this.azimuth),10,45);
		text("r = "+Math.round(this.radius*10)/10,10,60);
		text("x = "+Math.round(10*pxToM(x))/10,10,85);
		text("y = "+Math.round(10*pxToM(y))/10,10,100);
		pop();
	    }else{
		this.selected=false;
		this.show(black,x,y);
	    }
	}else{
	    this.selected=false;
	    this.show(black,x,y)
	}
	
    }

    show(img,x,y){
	push();
	translate(x,y);
	fill(0);
	push();
	scale(1,-1);
	text(this.label,-20,-20);
	pop();
	push();
	rotate(Math.atan2(y,x)+Math.PI);
	translate(-20,-20);
	image(img,0,0,40,40);
	pop();
	fill(255,0,0);
	ellipse(0,0,10,10);
	pop();
    }	
    
}

class Stage{
    constructor(){
	this.uniform(8)
    }
	
    update(){
	for(let i=0;i<this.num;i++){
	    this.speakers[i].update();
	}
    }

    uniform(num=8){
	this.num=num;
	this.speakers=[];
	let diff=360/num;
	for(let i=0;i<num;i++){
	    let ln=i+1;
	    this.speakers[i]= new Speaker(i*diff,2.0,'ch '+ln);
	}
    }
	    
    get(){
	let out=[];
	for(let i=0;i<this.num;i++){
	    let sp=this.speakers[i];
	    let a=sp.azimuth;
	    let r=sp.radius;
	    let l=sp.label;
	    let o={ azimuth: a, radius: r, label: l }
	    out.push(o);
	}
	return out;
    }


    socketio(){
	socket.emit('speakers',this.get())
    }


/*
    oscsend(){
	let radii=[];
	let message = new OSC.Message('/speaker');
	message.add(2);
	for(let i=0;i<this.speakers.length;i++){
	    let sp=this.speakers[i];
	    message.add(Math.round(radToDeg(sp.azimuth)));
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
*/    
    set(stage){
	this.speakers=[];
	for(let i=0;i<stage.length;i++){
	    let { azimuth, radius, label }=stage[i];
	    this.speakers[i]= new Speaker(azimuth,radius,label);
	}
    }
}

function dBtoLevel(db){
    return Math.pow(10,db/20);
}

function degToRad(deg){
    return  deg*(Math.PI/180)
}

function radToDeg(rad){
    return (rad/Math.PI)*180
}

function pxToM(pixel){
    return pixel/PIXELPERMETER
}

function mToPx(meter){
    return PIXELPERMETER*meter
}
	    
function oscsend(...args){
    let message = new OSC.Message(...args);
    osc.send(message);
}

//Mute_Icon.svg  Speaker_Icon_gray.svg  Speaker_Icon.svg
function preload(){
    black=loadImage('icons/Speaker_Icon.svg');
    gray=loadImage('icons/Speaker_Icon_gray.svg');
    mute=loadImage('icons/Mute_Icon.svg');
}


function locate(num){
    //console.log("locate",num);
    socket.emit('locate',num);
}

function stash(){
    socket.emit('stash');
}

function setup() {
    w=windowWidth;
    h=windowHeight;
    cx=w/2;
    cy=h/2;
    createCanvas(w,h);
    //frameRate(30);

	
    stage=new Stage(8);

    socket = io();
    socket.on('speakers', speakers => {
	console.log(speakers);
	stage.set(speakers)
    })

    for(let i=0;i<9;i++){
	let b=locateButton[i]=createButton(i);
	b.position(10,140+i*20);
	b.mousePressed( () => { locate(i)} );
    }

}


function windowResized() {
    w=windowWidth;
    h=windowHeight;
    resizeCanvas(w,h);
}


function draw() {
    background(220);
    
    mx=mouseX-cx;
    my=-1*(mouseY-cy);
    pmx=pmouseX-cx;
    pmy=-1*(pmouseY-cy);
    
    //text(mx+" "+my,100,100);
    translate(cx,cy);
    scale(1,-1),
    fill(0);
    ellipse(0,0,10,10);
    noFill();
    //scales;
    stroke(160);
    for(let i=1;i<10;i++)ellipse(0,0,200*i,200*i);
    //x-achse
    stroke(0);
    line(-cx,0,cx,0);
    //y-achse
    line(0,-cy,0,cy);
    
    stage.update();
}

/// Add these lines below sketch to prevent scrolling on mobile
function touchMoved() {
  // do some stuff
  return false;
}

