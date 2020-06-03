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

// r,g,b,a are from 0 to 255
const color_clear = new BABYLON.Color3(0, 0, 0);
const color_black = new BABYLON.Color3(0, 0, 0);
const color_white = new BABYLON.Color3(255, 255, 255);
const color_red = new BABYLON.Color3(255, 0, 0);
const color_orange = new BABYLON.Color3(255, 150, 0);
const color_yellow = new BABYLON.Color3(255, 235, 40);
const color_green = new BABYLON.Color3(0, 0, 255);
const color_blue = new BABYLON.Color3(0, 0, 255);
const color_indigo = new BABYLON.Color3(140, 30, 255);
const color_pink = new BABYLON.Color3(242, 34, 255);
const color_magenta = new BABYLON.Color3(255, 41, 117);
const color_lightGray = new BABYLON.Color3(220, 220, 220);
const color_oldMinecraftGrass = new BABYLON.Color3(40, 255, 80);

const color_sunny = new BABYLON.Color3(255, 252, 211);
const color_skyBlue = new BABYLON.Color3(133, 216, 237)
const color_hellishRed = new BABYLON.Color3(208, 11, 11);
const color_twilightBlue = new BABYLON.Color3(12, 34, 99);
const color_rainyGray = new BABYLON.Color3(93, 98, 120);
const color_sunriseGold = new BABYLON.Color3(255, 192, 23);
const color_sunsetOrange = new BABYLON.Color3(253, 182, 85);
const color_sunsetPurple = new BABYLON.Color3(112, 34, 241);
const color_midnightBlue = new BABYLON.Color3(4, 7, 25);

const color_stone = new BABYLON.Color3(150, 150, 150);
const color_dirt = new BABYLON.Color3(109, 82, 43);
const color_grass = new BABYLON.Color3(87, 185, 39);
const color_blueWater = new BABYLON.Color3(22, 85, 222);
const color_sand = new BABYLON.Color3(240, 225, 150);
const color_wood = new BABYLON.Color3(74, 50, 17);
const color_leaves = new BABYLON.Color3(61, 140, 21);
const color_bush = new BABYLON.Color3(124, 168, 0);
const color_lava = new BABYLON.Color3(255, 82, 35);
const color_clay = new BABYLON.Color3(203, 109, 49);
const color_cobblestone = new BABYLON.Color3(98, 94, 90);
const color_snow = new BABYLON.Color3(250, 250, 250);
const color_turquoiseWater = new BABYLON.Color3(68, 151, 128);
const color_cloud = new BABYLON.Color3(211, 220, 236);
const color_fire = new BABYLON.Color3(255, 180, 56);
const color_soulfire = new BABYLON.Color3(99, 199, 209);
const color_lightbulb = new BABYLON.Color3(255, 254, 211);
const color_lightfruit =  new BABYLON.Color3(158, 196, 56);
const color_seaLight = new BABYLON.Color3(84, 34, 255);



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

    var placeholderScene = new SoftEngine.Mesh("Scene Placeholder", 0, 0, color_black, null, 0);
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