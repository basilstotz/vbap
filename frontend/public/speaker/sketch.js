let w,h;


let stage;

let black,grey,mute;

let form=false;

let cx,cy;
let mx,my;

let send;
let uniform;
let locateButton=[];

let main;
let oldmain=0;

let socket;

const PIXELPERMETER = 100;

class Speaker{
    constructor(azimuth, radius, label=''){
	this.setPosPolar(azimuth,radius);
	this.label = label;
	this.volume = 1.0;
    }

    setPosPolar(azimuth, radius){
	this.azimuth=azimuth;
	this.radius=radius;
	let a=degToRad(this.azimuth);
	this.x = Math.cos(a)*this.radius;
	this.y = Math.sin(a)*this.radius;
    }
    
    setPosCartesian(x, y){
	this.x = x
	this.y = y
	this.azimuth = radToDeg(atan2(y,x));
	this.radius = Math.sqrt(x*x+y*y)
    }
    
    update(selected){
	if(selected){
	    this.show(black,this.x,this.y);
	    this.hud(cx-80,-cy+10);
	}else{
	    this.show(gray,this.x,this.y);
	}
    }

    show(img,mx,my){
	let x=mToPx(mx);
	let y=mToPx(my);
	push();
	   //scale(1,-1);
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

    
    hud(x,y){
	push();
	scale(1,-1);
	translate(x,y);
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
	text("r = "+Math.round(this.radius*100)/100,10,60);
	text("x = "+Math.round(100*this.x)/100,10,85);
	text("y = "+Math.round(100*this.y)/100,10,100);
	pop();
    }

    
}

class Stage{
    constructor(){
	this.speakers=[];
    }
	
    update(){
	let selected = this.select();
	
	if(selected>-1){
	    if(mouseIsPressed)this.speakers[selected].setPosCartesian(mx,my);
	}
	
 	for(let i=0;i<this.speakers.length;i++){
	    let s = ( i == selected ) 
	    this.speakers[i].update(s);	   
	}
    }

    select(){
	let sel = -1;
 	for(let i=0;i<this.speakers.length;i++){
	    let sp = this.speakers[i];
	    let dx = sp.x - mx;
	    let dy = sp.y - my;
	    let r = Math.sqrt(dx*dx+dy*dy);
	    if(r<0.15){
		sel = i;
		break;
	    }
	}
	return sel
    }
    
    uniform(num=8){
	this.speakers=[];
	let diff=360/num;
	for(let i=0;i<num;i++){
	    let ln=i+1;
	    this.speakers[i]= new Speaker(i*diff,2.0,'ch '+ln);
	}
	//console.log("uni",this.speakers);
    }
	    
    get(){
	let out=[];
	for(let i=0;i<this.speakers.length;i++){
	    let sp=this.speakers[i];
	    let a=sp.azimuth;
	    let r=sp.radius;
	    let l=sp.label;
	    let o={ azimuth: a, radius: r, label: l }
	    out.push(o);
	}
	return out;
    }

    set(speakers){
	//console.log("set",speakers);
	this.speakers=[];
	for(let i=0;i<speakers.length;i++){
	    let { azimuth, radius, label }=speakers[i];
	    this.speakers[i]= new Speaker(azimuth,radius,label);
	}
    }

    save(){
	//console.log("get",this.get());
	socket.emit('speakers',this.get())
    }

    load(){
	socket.emit('stash');
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


//Mute_Icon.svg  Speaker_Icon_gray.svg  Speaker_Icon.svg
function preload(){
    black=loadImage('icons/Speaker_Icon.svg');
    gray=loadImage('icons/Speaker_Icon_gray.svg');
    mute=loadImage('icons/Mute_Icon.svg');
}

/*
function locate(num){
    //console.log("locate",num);
    socket.emit('locate',num);
}


function mainvol(){
    socket.emit('main',main.val);
}
*/



function setup() {
    w=windowWidth;
    h=windowHeight;
    cx=w/2;
    cy=h/2;
    createCanvas(w,h);
    //frameRate(30);

    stage = new Stage();
    
    socket = io();
    socket.on('speakers', speakers => {
	//console.log(speakers);
	stage.set(speakers)
    })
    
 
    for(let i=0;i<9;i++){
	let b=locateButton[i]=createButton(i);
	b.position(10,140+i*20);
	b.mousePressed( () => { socket.emit('locate',i)} );
    }

    main=createSlider(0,1,0.2,0);
    main.position(10,h-35);
    ////main.changed(mainvol);
}



function draw() {
    background(220);
    
    mx=pxToM(mouseX-cx);
    my=pxToM(-1*(mouseY-cy));

    text(mx+" "+my,120,60)
    //pmx=pmouseX-cx;
    //pmy=-1*(pmouseY-cy);

    if(main.value()!=oldmain){
	socket.emit('main',main.value());
	oldmain=main.value();
    }
    
    //text(mx+" "+my,100,100);
    translate(cx,cy);
    scale(1,-1),
    fill(0);
    ellipse(0,0,10,10);
    noFill();
    //scales;
    stroke(150);
    for(let i=1;i<10;i++)ellipse(0,0,200*i,200*i);
    //x-achse
    stroke(0);
    line(-cx,0,cx,0);
    //y-achse
    line(0,-cy,0,cy);
    
    stage.update();
}

function windowResized() {
    w=windowWidth;
    h=windowHeight;
    cx=w/2;
    cy=h/2;
    main.position(10,h-35);
    resizeCanvas(w,h);
}



/// Add these lines below sketch to prevent scrolling on mobile
function touchMoved() {
  // do some stuff
  return false;
}

