// shim layer with setTimeout fallback
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

var canvas;
var device;
var cam;
var meshes = [];
var lights = [];


var showWires = false;
var showFaces = true;
var drawNormals = false;
var wireOffset = 0.000075;

var rotSpeed = 0.1 * Math.PI*2;  // In rotations per second, " * " converts from rad to rot

// r,g,b,a are from 0 to 255
var clear = new BABYLON.Color4(0, 0, 0, 0);
var white = new BABYLON.Color4(255, 255, 255, 255);
var black = new BABYLON.Color4(0, 0, 0, 255);
var red = new BABYLON.Color4(255, 0, 0, 255);
var orange = new BABYLON.Color4(255, 150, 0, 255);
var yellow = new BABYLON.Color4(255, 235, 40, 255);
var green = new BABYLON.Color4(0, 255, 0, 255);
var blue = new BABYLON.Color4(0, 0, 255, 255);
var indigo = new BABYLON.Color4(140, 30, 255, 255);
var synthPink = new BABYLON.Color4(242, 34, 255, 255);
var synthMagenta = new BABYLON.Color4(255, 41, 117, 255);
var sunny = new BABYLON.Color4(255, 252, 211, 255);
var lightGray = new BABYLON.Color4(220, 220, 220, 255);
var alphaGrassGreen = new BABYLON.Color4(40, 255, 80, 255);


var skyBlue = new BABYLON.Color4(133, 216, 237, 255)
var sunsetPurple = new BABYLON.Color4(112, 34, 241, 255);
var hellishRed = new BABYLON.Color4(208, 11, 11, 255);
var twilightBlue = new BABYLON.Color4(12, 34, 99, 255);
var rainyGray = new BABYLON.Color4(93, 98, 120, 255);
var sunriseGold = new BABYLON.Color4(255, 194, 73, 255);
var midnightBlue = new BABYLON.Color4(6, 13, 28, 255);

var stoneGray = new BABYLON.Color4(150, 150, 150, 255);
var topsoilBrown = new BABYLON.Color4(109, 82, 43, 255);
var brightGrassGreen = new BABYLON.Color4(87, 185, 39, 255);
var waterBlue = new BABYLON.Color4(22, 85, 222, 255);
var sandBeige = new BABYLON.Color4(240, 225, 150, 255);
var woodBrown = new BABYLON.Color4(74, 50, 17, 255);
var leafGreen = new BABYLON.Color4(61, 140, 21, 255);
var cactusGreen = new BABYLON.Color4(124, 168, 0, 255);
var lavaRed = new BABYLON.Color4(255, 82, 35, 255);
var rockRed = new BABYLON.Color4(203, 109, 49, 255);
var cobblestoneGrey = new BABYLON.Color4(98, 94, 90, 255);
var snowWhite = new BABYLON.Color4(250, 250, 250, 255);
var waterTurquoise = new BABYLON.Color4(68, 151, 128, 255);
var cloudGrey = new BABYLON.Color4(211, 220, 236, 255);
var torchOrange = new BABYLON.Color4(255, 180, 56, 255);



const LightType = {
    Directional : 0,
    Point : 1,
    Spot : 2
}

const LightingMode = {
    Flat_InverseSquared : 0,
    Flat_Linear : 1,
    Gouraud_Inverse : 2,
    Gouraud_Linear : 3,
    Voxel : 4
}


var ambientLight = 0.1;

var currLightingMode = LightingMode.Voxel;


var deltaTime; // Time, in SECONDS, since last frame.
var lastCalledTime;
var timer = 0;
var fps;
var fpsTimer = 0;

var cycles = 0;
var frameCount = 0;
var smoothFps;
var renderInProgress = false;


document.addEventListener("DOMContentLoaded", init, false);


function init() {
    
    canvas = document.getElementById("frontBuffer");
    cam = new SoftEngine.Camera();
    device = new SoftEngine.Device(canvas);

    var placeholderScene = new SoftEngine.Mesh("Scene Placeholder", 0, 0, black, null, 0);
    meshes.push(placeholderScene);

    cam.Position = new BABYLON.Vector3(0, 0, 0);
    cam.Rotation = new BABYLON.Vector3(0, 0, 0);
    cam.Target = new BABYLON.Vector3(0, 0, -1);


    setup();
    
    //fillHierarchy();
    
    var updateLoop = setInterval(renderLoop, 1);
}

function renderLoop() {

    if (renderInProgress === false) {
        cycles += 1;

        if (!lastCalledTime) {
            lastCalledTime = Date.now();
            fps = 0;
            return;
        }

        deltaTime = (Date.now() - lastCalledTime) * 0.001;

        //fps = 1 / deltaTime;
        //document.getElementById("timerStat").innerHTML = "Time: " + timer.toFixed(3);


        // runs the project-specific loop code
        loop();
		
	
        // MAIN DRAWING CALL
        requestAnimationFrame(drawingLoop);


        lastCalledTime = Date.now();
        timer += deltaTime;
        fpsTimer += deltaTime;

        if (fpsTimer >= 1) {
            document.getElementById("fpsStat").innerHTML = "FPS: " + cycles;
            fpsTimer = 0;
            frameCount = 0;
            cycles = 1;
        }

        //Fill the hierarchy with all objects in the scene
        //fillHierarchy();
    }
}

function drawingLoop() {
    renderInProgress = true;
    device.clear();
    device.render(cam, meshes);
    device.present();
    renderInProgress = false;
}

function fillHierarchy(){
    var objectList = "";
  
    objectList += "Meshes:";
    for (var i = 0; i < meshes.length; i++) {
        objectList += "<li>" + i + ": " + meshes[i].name + "</li>";
    }
  
    objectList += "<br> Lights:";
  
    for (var i = 0; i < lights.length; i++) {
        objectList += "<li>" + i + ": " + lights[i].name + "</li>";
    }
    document.getElementById("hierarchy").innerHTML = objectList;
}