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
var clear = new BABYLON.Color3(0, 0, 0);
var white = new BABYLON.Color3(255, 255, 255);
var black = new BABYLON.Color3(0, 0, 0);
var red = new BABYLON.Color3(255, 0, 0);
var orange = new BABYLON.Color3(255, 150, 0);
var yellow = new BABYLON.Color3(255, 235, 40);
var green = new BABYLON.Color3(0, 0, 255);
var blue = new BABYLON.Color3(0, 0, 255);
var indigo = new BABYLON.Color3(140, 30, 255);
var synthPink = new BABYLON.Color3(242, 34, 255);
var synthMagenta = new BABYLON.Color3(255, 41, 117);
var lightGray = new BABYLON.Color3(220, 220, 220);
var alphaGrassGreen = new BABYLON.Color3(40, 255, 80);

var sunny = new BABYLON.Color3(255, 252, 211);
var skyBlue = new BABYLON.Color3(133, 216, 237)
var hellishRed = new BABYLON.Color3(208, 11, 11);
var twilightBlue = new BABYLON.Color3(12, 34, 99);
var rainyGray = new BABYLON.Color3(93, 98, 120);
var sunriseGold = new BABYLON.Color3(255, 192, 23);
var sunsetOrange = new BABYLON.Color3(253, 182, 85);
var sunsetPurple = new BABYLON.Color3(112, 34, 241);
var midnightBlue = new BABYLON.Color3(6, 13, 28);

var stoneGray = new BABYLON.Color3(150, 150, 150);
var topsoilBrown = new BABYLON.Color3(109, 82, 43);
var brightGrassGreen = new BABYLON.Color3(87, 185, 39);
var waterBlue = new BABYLON.Color3(22, 85, 222);
var sandBeige = new BABYLON.Color3(240, 225, 150);
var woodBrown = new BABYLON.Color3(74, 50, 17);
var leafGreen = new BABYLON.Color3(61, 140, 21);
var cactusGreen = new BABYLON.Color3(124, 168, 0);
var lavaRed = new BABYLON.Color3(255, 82, 35);
var rockRed = new BABYLON.Color3(203, 109, 49);
var cobblestoneGrey = new BABYLON.Color3(98, 94, 90);
var snowWhite = new BABYLON.Color3(250, 250, 250);
var waterTurquoise = new BABYLON.Color3(68, 151, 128);
var cloudGrey = new BABYLON.Color3(211, 220, 236);
var torchOrange = new BABYLON.Color3(255, 180, 56);



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


var ambientLight = 0.075;

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