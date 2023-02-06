'use strict'

/*
    CONSTANTS AND GLOBAL VARIABLES
*/
const canvas = document.querySelector(".myCanvas"); // canvas object
const width = canvas.width = window.innerWidth;     // width of the window
const height = canvas.height = window.innerHeight;  // height of the window
const ctx = canvas.getContext('2d');                // canvas context

const G = 6.67 * Math.pow(10,-11);
const SUN = 100000000000000;
const PLANET = SUN/1000000;
const MOON = PLANET/10000;
let bodies = [];
let stars = [];
let planets = [];
let moons = [];
let presets = [];

let mouseX = 0;
let mouseY = 0;

let simulationStart = false;

/*
    HELPER FUNCTIONS
*/

/*
Precondition: 
    r, g, b, are integer values between 0 and 255
Postcondition:
    returns a string containing the fillStyle
*/
function getFillStyle(r, g, b) {
    return `rgb(${r},${g},${b})`;
}

/*
Precondition: 
    fillStyle is of type string and is a valid fillStyle
    x, y, and radius are doubles
Postcondition:
    Draws a circle with center (x,y) and radius r with a color specified by the fillStyle on the canvas
*/
function drawCircle(fillStyle, x, y, radius) {
    ctx.beginPath();
    ctx.fillStyle = fillStyle;
    ctx.arc(x, height - y, radius, 0, 2*Math.PI, true);
    ctx.fill();
}

function drawBody(body) {
    drawCircle(body.getFillStyle(), body.getX(), body.getY(), body.getRadius());
}

/*
Precondition:
    parameter is a boolean (true or false)
Postcondition:
    Instruction text is displayed on screen determined by the boolean

    <div id="instructions">
      <h2>Instructions:</h2>
      <p>Pressing keys corresponding to certain bodies will place it at the location of the mouse cursor.</p>
      <p>Planets are assigned uniform orbits around the previously placed star.</p>
      <p>Adjust presets using the selector in the top right corner</p>
      <ul>
        <li>B: blue star</li>
        <li>M: main sequence star</li>
        <li>R: red dwarf</li>
        <li>O: orange star</li>
        <li>Y: yellow star</li>
        <li>2: assigns previous two stars to binary orbits</li>
        <li>r: rocky planet</li>
        <li>g: gas giant</li>
        <li>Enter: start simulation</li>
        <li>Escape: clear simulation</li>
      </ul>
    </div>
*/
function showInstructions() {
    ctx.font = "bold 15px Georgia,serif";
    ctx.fillStyle = getFillStyle(255, 255, 255);
    ctx.fillText("B: blue star | M: main sequence star | R: red dwarf | O: orange star | Y: yellow star | 2: assigns previous two stars to binary orbits | r: rocky planet | g: gas giant | Enter: start simulation | Escape: clear simulation", width*0.01, height*0.01);
}

/*
Precondition: 
    body1 and body2 are two initialized Body objects
Postcondition:
    returns the distance between body1 and body2
*/
function distance(body1, body2) {
    return Math.sqrt(Math.pow(body1.getX() - body2.getX(),2) + Math.pow(body1.getY() - body2.getY(),2));
}

/*
Precondition: 
    body1 and body2 are two initialized Body objects
Postcondition:
    returns the square of the distance between body1 and body2
*/
function sqDistance(body1, body2) {
    return Math.pow(body1.getX() - body2.getX(),2) + Math.pow(body1.getY() - body2.getY(),2);
}

/*
Precondition: 
    body1 is the reference, origin body: the focal point of measurement
    body2 is the target, the edge point
Postcondition:
    returns the angle between body1 and body2
*/
function angle(body1, body2) {
    if(body2.getX() - body1.getX() != 0) {
        if(body2.getX() > body1.getX()) {
            return Math.atan((body2.getY() - body1.getY())/(body2.getX() - body1.getX()));
        } else {
            return Math.PI + Math.atan((body2.getY() - body1.getY())/(body2.getX() - body1.getX()));
        }
        //return Math.atan((body2.getY() - body1.getY())/(body2.getX() - body1.getX()));
    } else {
        if(body2.getY() - body1.getY() > 0) {
            return Math.PI/2;
        } else {
            return 3*Math.PI/2;
        }
    }
}

/*
    CLASSES AND OBJECTS
*/

// A "Body" is a mass that exists in space, with a certain radius, initial position, and initial velocity
class Body {

    // Constructor
    constructor(mass, x, y, speed, angle, radius, r, g, b) {
        this.MASS = mass;
        this.x = x;
        this.y = y;
        this.vx = speed*Math.cos(angle);
        this.vy = speed*Math.sin(angle);
        this.speed = speed;
        this.angle = angle;
        this.RADIUS = radius;

        this.ax = 0;
        this.ay = 0;

        this.fillStyle = getFillStyle(r, g, b);
    }

    // Accessors / Mutators
    getMass() { return this.MASS; }
    setMASS(mass) { this.MASS = mass; }
    getX() { return this.x; }
    setX(x) { this.x = x; }
    getY() { return this.y; }
    setY(y) { this.y = y; }
    setXY(x,y) { this.x = x; this.y = y; }

    getVX() { return this.vx; }
    getVY() { return this.vy; }
    setVX(vx) { this.vx = vx; }
    setVY(vy) { this.vy = vy; }

    getSpeed() { return Math.sqrt(Math.pow(this.vx,2) + Math.pow(this.vy,2)); }
    getAngle() { return angle(0, 0, this.vx, this.vy); }

    getRadius() { return this.RADIUS; }
    setRadius(radius) { this.radius = radius; }

    getAX() { return this.ax; }
    getAY() { return this.ay; }
    setAX(ax) { this.ax = ax; }
    setAY(ay) { this.ay = ay; }

    getFillStyle() { return this.fillStyle; }
    setFillStyle(fillStyle) { this.fillStyle = fillStyle; }
    setFillStyle(r,g,b) { this.fillStyle = getFillStyle(r, g, b); }

    // Helper Methods

    // Updates the acceleration of this body in accordance with other bodies
    updateAcceleration() {
        let gx = 0;
        let gy = 0;
        for(let i = 0; i < bodies.length; i++) {
            if(this != bodies.at(i) && !(this.getX() === bodies.at(i).getX() && this.getY() === bodies.at(i).getY())) {
                gx += (G*bodies.at(i).getMass()/sqDistance(this,bodies.at(i)))*((bodies.at(i).getX()-this.getX())/distance(this,bodies.at(i)));
                gy += (G*bodies.at(i).getMass()/sqDistance(this,bodies.at(i)))*((bodies.at(i).getY()-this.getY())/distance(this,bodies.at(i)));
            }
        }
        this.setAX(gx);
        this.setAY(gy);
    }

    updateVelocity() {
        this.setVX(this.getVX() + this.getAX());
        this.setVY(this.getVY() + this.getAY());
    }

    updatePosition() {
        this.setX(this.getX() + this.getVX());
        this.setY(this.getY() + this.getVY());
    }

    move() {
        drawCircle(this.getFillStyle(), this.getX(), this.getY(), this.getRadius());
    }

    assignParent(body) {
        this.setVX(Math.sqrt(G*body.getMass()/distance(this,body))*Math.cos(angle(this,body)+Math.PI/2) + body.getVX());
        this.setVY(Math.sqrt(G*body.getMass()/distance(this,body))*Math.sin(angle(this,body)+Math.PI/2) + body.getVY());
    }

    assignBinary(body) {
        const r = distance(this,body);
        const v1 = Math.sqrt(G*Math.pow(body.getMass(),2)/(r*(this.getMass()+body.getMass())));
        const v2 = Math.sqrt(G*Math.pow(this.getMass(),2)/(r*(this.getMass()+body.getMass())));
        this.setVX(v1*Math.cos(angle(this,body)+Math.PI/2)); console.log("V1 : " + angle(this,body));
        this.setVY(v1*Math.sin(angle(this,body)+Math.PI/2)); 
        body.setVX(v2*Math.cos(angle(body,this)+Math.PI/2)); console.log("V2 : " + angle(body,this));
        body.setVY(v2*Math.sin(angle(body,this)+Math.PI/2));
    }
}

class Star extends Body {
    constructor(x, y, speed, angle, type) {
        let mass = SUN;
        let r = 255;
        let g = 255;
        let b = 0;
        if(type === "blue") {
            mass = 50*SUN;
            r = 38; g = 97; b = 156;
        } else if(type === "red") {
            mass = 0.1*SUN;
            r = 125; g = 0; b = 0;
        } else if(type === "yellow") {
            mass = 0.85*SUN;
            r = 255; g = 220; b = 0;
        } else if(type === "orange") {
            mass = 0.5*SUN;
            r = 255; g = 102; b = 0;
        } else if(type === "giant") {
            mass = 1000*SUN;
            r = 255; g = 100; b = 0;
        } else {
            mass = SUN;
            r = 255; g = 255; b = 0;
        }
        super(mass, x, y, speed, angle, 25, r, g, b);
    }
}

class Planet extends Body {
    constructor(x, y, speed, angle, type, r, g, b) {
        let mass = PLANET;
        let radius = 7;
        switch(type) {
            case "rocky":
                mass = PLANET;
                break;
            case "gaseous":
                mass = 1000*PLANET;
                radius = 7;
                break;
            default:
                mass = PLANET;
        }
        super(mass, x, y, speed, angle, radius, r, g, b);
    }
}

class Moon extends Body {
    constructor(x, y, speed, angle) {
        super(MOON, x, y, speed, angle, 3, 150, 150, 150);
    }
}

/*
    SETUP
*/

showInstructions();

//constructor(mass, x, y, speed, angle, radius, r, g, b)

// TATOOINE SYSTEM
/*
bodies.push(new Star(width/2+75, height/2, Math.sqrt(G*SUN/300), 3*Math.PI/2, "main"));
bodies.push(new Star(width/2-75, height/2, Math.sqrt(G*SUN/300), Math.PI/2, "main"));
bodies.at(0).assignBinary(bodies.at(1));
//bodies.push(new Planet(width/2 - 550, height/2, Math.sqrt(G*2*SUN/550), 3*Math.PI/2, "rocky", 125, 0, 0));
//bodies.push(new Planet(width/2 + 200, height/2, Math.sqrt(G*2*SUN/200), 3*Math.PI/2, "rocky", 125, 0, 0));

bodies.push(new Planet(width/2 - 550, height/2, 3, 0, "rocky", 125, 0, 0));
bodies.push(new Planet(width/2, height/2 + 550, 5.81, 3*Math.PI/2, "rocky", 125, 0, 0));
bodies.push(new Planet(width/2 + 550, height/2, 3, Math.PI, "rocky", 125, 0, 0));
bodies.push(new Planet(width/2, height/2 - 550, 5.81, Math.PI/2, "rocky", 125, 0, 0));
*/

// DEMO SYSTEM
/*
bodies.push(new Star(width/2, height/2, 0, 0, "red"));
bodies.push((new Planet(width/2 - 500, height/2, 0, 0, "gaseous", 30, 0, 125)));
bodies.at(1).assignParent(bodies.at(0));
bodies.push(new Moon(width/2-450, height/2, 0, 0));
bodies.at(2).assignParent(bodies.at(1));
*/

// GALAXY SYSTEM
/*
bodies.push(new Star(width/2, height/2, 0, 0, "main"));
for(let i = 0; i < 15; i++) {
    bodies.push(new Planet(bodies.at(0).getX() - width/40*i - 100, bodies.at(0).getY(), Math.sqrt(G*bodies.at(0).getMass()/(width/40*i+100)), Math.PI/2, "rocky", 100+5*i, 0, 0));
    bodies.at(2*i+1).assignParent(bodies.at(0));
    bodies.push(new Planet(bodies.at(0).getX() + width/40*i + 100, bodies.at(0).getY(), Math.sqrt(G*bodies.at(0).getMass()/(width/40*i+100)), 3*Math.PI/2, "rocky", 0, 0, 100+5*i));
    bodies.at(2*i+2).assignParent(bodies.at(0));
}
*/

// GALAXY COLLISION SYSTEM
/*
bodies.push(new Star(width*0.6, height*0.8, 2, 0, "main"));
bodies.push(new Star(width*0.4, height*0.2, 2, Math.PI, "main"));
bodies.at(0).assignBinary(bodies.at(1));
for(let i = 0; i < 7; i++) {
    bodies.push(new Planet(bodies.at(0).getX() - 50*i - 100, bodies.at(0).getY(), Math.sqrt(G*bodies.at(0).getMass()/(50*i+100)), Math.PI/2, "rocky", 100+5*i, 0, 0));
    bodies.at(-1).assignParent(bodies.at(0));
    bodies.push(new Planet(bodies.at(0).getX() + 50*i + 100, bodies.at(0).getY(), Math.sqrt(G*bodies.at(0).getMass()/(50*i+100)), 3*Math.PI/2, "rocky", 0, 0, 100+5*i));
    bodies.at(-1).assignParent(bodies.at(0));
}
for(let i = 0; i < 7; i++) {
    bodies.push(new Planet(bodies.at(1).getX() - 50*i - 100, bodies.at(1).getY(), Math.sqrt(G*bodies.at(1).getMass()/(50*i+100)), Math.PI/2, "rocky", 100+5*i, 0, 0));
    bodies.at(-1).assignParent(bodies.at(1));
    bodies.push(new Planet(bodies.at(1).getX() + 50*i + 100, bodies.at(1).getY(), Math.sqrt(G*bodies.at(1).getMass()/(50*i+100)), 3*Math.PI/2, "rocky", 0, 0, 100+5*i));
    bodies.at(-1).assignParent(bodies.at(1));
}
*/

/*
    LOOP
*/

function loop() {

    // Background
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0,0,width,height);

    for(const b of bodies) {
        b.updateAcceleration();
        b.updateVelocity();
    }
    for(const b of bodies) {
        b.updatePosition();
        b.move();
    }

    window.requestAnimationFrame(loop);
}

document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = height - event.clientY + document.getElementById("presets").offsetHeight;
});

document.getElementById("presets").addEventListener("change", () => {
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0,0,width,height);
    showInstructions();
    presets = [];
    switch(document.getElementById("presets").value) {
        case "Twin Galaxy":
            presets.push(new Star(width*0.6, height*0.8, 2, 0, "main"));
            presets.push(new Star(width*0.4, height*0.2, 2, Math.PI, "main"));
            presets.at(0).assignBinary(presets.at(1));
            for(let i = 0; i < 7; i++) {
                presets.push(new Planet(presets.at(0).getX() - 50*i - 100, presets.at(0).getY(), 0, 0, "rocky", 100+5*i, 0, 0));
                presets.at(-1).assignParent(presets.at(0));
                presets.push(new Planet(presets.at(0).getX() + 50*i + 100, presets.at(0).getY(), 0, 0, "rocky", 0, 0, 100+5*i));
                presets.at(-1).assignParent(presets.at(0));
            }
            for(let i = 0; i < 7; i++) {
                presets.push(new Planet(presets.at(1).getX() - 50*i - 100, presets.at(1).getY(), 0, 0, "rocky", 100+5*i, 0, 0));
                presets.at(-1).assignParent(presets.at(1));
                presets.push(new Planet(presets.at(1).getX() + 50*i + 100, presets.at(1).getY(), 0, 0, "rocky", 0, 0, 100+5*i));
                presets.at(-1).assignParent(presets.at(1));
            }
            break;
        case "Tattooine":
            presets.push(new Star(width/2+75, height/2, Math.sqrt(G*SUN/300), 3*Math.PI/2, "main"));
            presets.push(new Star(width/2-75, height/2, Math.sqrt(G*SUN/300), Math.PI/2, "main"));
            presets.at(0).assignBinary(presets.at(1));
            presets.push(new Planet(width/2 - 550, height/2, Math.sqrt(G*2*SUN/550), 3*Math.PI/2, "rocky", 125, 0, 0));
            break;
        case "Simple":
            presets.push(new Star(width/2, height/2, 0, 0, "red"));
            presets.push((new Planet(width/2 - 700, height/2, 0, 0, "gaseous", 30, 0, 125)));
            presets.at(1).assignParent(presets.at(0));
            presets.push(new Moon(width/2-750, height/2, 0, 0));
            presets.at(2).assignParent(presets.at(1));
            break;
        case "Galaxy":
            presets.push(new Star(width/2, height/2, 0, 0, "main"));
            for(let i = 0; i < 15; i++) {
                presets.push(new Planet(presets.at(0).getX() - width/40*i - 100, presets.at(0).getY(), 0, 0, "rocky", 100+5*i, 0, 0));
                presets.at(2*i+1).assignParent(presets.at(0));
                presets.push(new Planet(presets.at(0).getX() + width/40*i + 100, presets.at(0).getY(), 0, 0, "rocky", 0, 0, 100+5*i));
                presets.at(2*i+2).assignParent(presets.at(0));
            }
            break;
        case "Gravity Cannon":
            presets.push(new Star(width/2+75, height/2, Math.sqrt(G*SUN/300), 3*Math.PI/2, "main"));
            presets.push(new Star(width/2-75, height/2, Math.sqrt(G*SUN/300), Math.PI/2, "main"));
            presets.at(0).assignBinary(presets.at(1));
            presets.push(new Planet(width/2 - 550, height/2, 3, 0, "rocky", 125, 0, 0));
            presets.push(new Planet(width/2, height/2 + 550, 5.81, 3*Math.PI/2, "rocky", 125, 0, 0));
            presets.push(new Planet(width/2 + 550, height/2, 3, Math.PI, "rocky", 125, 0, 0));
            presets.push(new Planet(width/2, height/2 - 550, 5.81, Math.PI/2, "rocky", 125, 0, 0));
            break;
        case "Three Body?":
            presets.push(new Star(width/3, height/4, Math.sqrt(G*SUN/1000), 0-Math.PI/3, "yellow"));
            presets.push(new Star(2*width/3, height/4, Math.sqrt(G*SUN/1000), 2*Math.PI/3-Math.PI/3, "yellow"));
            presets.push(new Star(width/2, height/4+Math.sqrt(3)/2*width/3, Math.sqrt(G*SUN/1000), 4*Math.PI/3-Math.PI/3, "yellow"));
            break;
    }
    for(const b of presets) {
        drawBody(b);
    }
    for(const b of stars) {
        drawBody(b);
    }
    for(const b of planets) {
        drawBody(b);
    }
    for(const b of moons) {
        drawBody(b);
    }
});

window.addEventListener("keydown", (event) => {
    if(event.key === "Escape") {
        location.reload();
    }
    if(event.key === "B") {
        stars.push(new Star(mouseX, mouseY, 0, 0, "blue"));
        drawBody(stars.at(-1));
    }
    if(event.key === "M") {
        stars.push(new Star(mouseX, mouseY, 0, 0, "main"));
        drawBody(stars.at(-1));
    }
    if(event.key === "R") {
        stars.push(new Star(mouseX, mouseY, 0, 0, "red"));
        drawBody(stars.at(-1));
    }
    if(event.key === "O") {
        stars.push(new Star(mouseX, mouseY, 0, 0, "orange"));
        drawBody(stars.at(-1));
    }
    if(event.key === "Y") {
        stars.push(new Star(mouseX, mouseY, 0, 0, "yellow"));
        drawBody(stars.at(-1));
    }
    if(event.key === "2" && stars.length >= 2) {
        stars.at(-1).assignBinary(stars.at(-2));
    }
    if(event.key === "r") {
        planets.push(new Planet(mouseX, mouseY, 0, 0, "rocky", 125, 0, 0));
        if(stars.length > 0) {planets.at(-1).assignParent(stars.at(-1));}
        drawBody(planets.at(-1));
    }
    if(event.key === "g") {
        planets.push(new Planet(mouseX, mouseY, 0, 0, "gaseous", 13, 153, 150));
        if(stars.length > 0) {planets.at(-1).assignParent(stars.at(-1))};
        drawBody(planets.at(-1));
    }
    if(!simulationStart && event.key === "Enter") {
        bodies = [...bodies,...presets,...stars,...planets,...moons];
        document.getElementById("presets").hidden = true;
        //document.getElementById("instructions").hidden = true;
        simulationStart = true;
        loop();
    }
});
