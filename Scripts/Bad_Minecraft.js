// Created by Grant Keele

var worldWidth = 128;
var worldHeight = 96;

var worldSeed;

var camInitPos = new BABYLON.Vector3(worldWidth/2, worldHeight, worldWidth/2);
var camInitRot = new BABYLON.Vector3(0, 0, 0);

var sunAxis = new BABYLON.Vector3(1, 0, 1);
var sunDefaultDirection = new BABYLON.Vector3(-0.5, 0, 0.8);
var currSunDirection = sunDefaultDirection;
sunAxis.normalize();
sunDefaultDirection.normalize();

var sunDefaultBrightness = 0.75;
var dayLength = 180;
var sunSpeed = Math.PI / dayLength;
var sunAngle = 0;

var sunLight = new SoftEngine.Light("Sun", LightType.Directional, sunny, sunDefaultBrightness);
sunLight.Direction = sunDefaultDirection;
lights.push(sunLight);

//var torchLight = new SoftEngine.Light("torch", LightType.Point, sunriseGold, 2.5);
//lights.push(torchLight);

var renderDistance = 4;
var chunksPerEdge = 2 * renderDistance + 1;
var chunkWidth = 8;
var chunkHeight = 8;
var currChunk;
var prevChunk;
var chunkUpdateIndex = 0;
var chunkUpdateCoords = BABYLON.Vector3.Zero();
//var chunksLoaded = Create2DArray(worldWidth, worldWidth);

var blockData = Create3DArray(worldWidth, worldHeight, worldWidth);
var visibleFaces = {};

var volumetricLightData = {};
var sunlightFaceData = {};
var maxLightLevel = 15;
var lightStepLength = 1;
var maxLightSteps = 40;
var lightUpdatesPerFrame = Math.pow(2 * renderDistance + 1, 2);

var drawFog = true;
var fogIntensity = 1.1;

var skyBoxColor = skyBlue;

var colorID = [null,
    stoneGray,
    topsoilBrown,
    brightGrassGreen,
    waterBlue,
    sandBeige,
    woodBrown,
    leafGreen,
    cactusGreen,
    lavaRed,
    rockRed,
    cobblestoneGrey,
    snowWhite,
    waterTurquoise,
    cloudGrey,
    torchOrange
];

var blockTransparency = [null,
    0,
    0,
    0.2,
    0.8,
    0.2,
    0.2,
    0.5,
    0.4,
    0,
    0,
    0,
    0.2,
    0.6,
    0.7,
    0
];

var liquidID = [4, 9, 13];
var lightSourceID = [9, 15];


var maskColor = new BABYLON.Color3(0, 0, 0);

var seaLevel = 24;

var currBlock = new BABYLON.Vector3(0, 0, 0);
var collisionData = 0;

var biomeAllocationType = 0;
var simplexBiomeCompression = 0.004;

var numBiomeCells = 12;
var worldAmplificationHorizontal = 1;
var worldAmplificationVertical = 1;

var biomeID = [
    BiomeDryDesert,      // 0
    BiomePlains,      // 1
    BiomeForest,      // 2
    BiomeMountains,      // 3
    BiomeHills,      // 4
    BiomeLushDesert,      // 5
    BiomeSwamp,      // 6
    BiomeBadlands,      // 7
    BiomeLavaPit,      // 8
    BiomeDeepOcean,      // 9
    BiomeJungle,      // 10
    BiomeGreenMountains,      // 11
    BiomeIslands      // 12
    ];

var biomeList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
//var biomeList = [11, 3];

var blockInHand = 1;
var interactionDist = 7;

var breakDelay = 0.1;
var placeDelay = 0.1;
var timeSinceBreak = 0;
var timeSincePlace = 0;


var playerHeight = 2.5;
var playerRadius = 0.48;
var playerSpeed = 8;
var jumpSpeed = 5;

var cameraSensitivity = 0.004;
var cameraFOV = 120 * Math.PI / 180;

var gravityAccel = 12;
var terminalVelocity = -30;

var playerVel = new BABYLON.Vector3(0, 0, 0);



function setup() {
    
    worldSeed = Math.floor(Math.random() * 65535);

    setupCamera(cam, camInitPos, camInitRot);

    currChunk = new BABYLON.Vector3(Math.round(cam.Position.x / chunkWidth), Math.round(cam.Position.y / chunkHeight), Math.round(cam.Position.z / chunkWidth));
    prevChunk = currChunk;

    GenerateWorld();
    //convertStringToWorldData(loadFileAsText());
    
    document.getElementById("seedStat").innerHTML = "Seed: " + worldSeed;
    document.getElementById("blockInHandStat").innerHTML = "Block in Hand: " + blockInHand;

    CalculateVolumeLightSources(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(worldWidth-1, worldHeight-1, worldWidth-1));
    //console.log(volumetricLightData);
}

function loop() {

    prevChunk = currChunk;
    firstPersonMovement();

    // Reset player position if they press R or they fall below y = 0
    if (rDown === true || cam.Position.y < 0) {
        setupCamera(cam, camInitPos, camInitRot);
	    playerVel = new BABYLON.Vector3(0, 0, 0);
    }
    
    // Determine which chunk the player is in and reload chunks if they move to a new chunk
    currChunk = new BABYLON.Vector3(Math.round(cam.Position.x / chunkWidth), Math.round(cam.Position.y / chunkHeight), Math.round(cam.Position.z / chunkWidth));
    if (!(currChunk.equals(prevChunk))) {
        ClearChunks();
        LoadChunks(currChunk, renderDistance);
    }

    // Update lighting for a set number of chunks each frame
    for (let u = 0; u < lightUpdatesPerFrame; u++){
        if (chunkUpdateIndex > chunksPerEdge * chunksPerEdge * chunksPerEdge - 1){
            chunkUpdateIndex = 0;
        }

        chunkUpdateCoords = Unflatten3DGrid(chunkUpdateIndex, chunksPerEdge);
        chunkUpdateCoords = chunkUpdateCoords.subtract(new BABYLON.Vector3(renderDistance, renderDistance, renderDistance)).add(currChunk);
        CalculateChunkSunlight(chunkUpdateCoords);

        chunkUpdateIndex += 1;
    }
    

    // Change the angle of the sun throughout the day, and adjust the light color intensity based on time of day
    sunAngle += sunSpeed * deltaTime;
    let sunRotationMatrix = BABYLON.Matrix.RotationAxis(sunAxis, sunAngle);
    currSunDirection = BABYLON.Vector3.TransformNormal(sunDefaultDirection, sunRotationMatrix);
    sunLight.Direction = currSunDirection;

    let newSunBrightness = 0;
    // Sunrise
    if (sunAngle >= 0 && sunAngle < Math.PI / 8){
        let gradient = sunAngle / (Math.PI/8);
        newSunBrightness = 2.54648 * sunAngle * sunDefaultBrightness;
        sunLight.Color = BABYLON.Color3.Interpolate(sunriseGold, sunny, gradient);
        skyBoxColor = BABYLON.Color3.Interpolate(midnightBlue, skyBlue, gradient);
    }
    // Daylight
    else if (sunAngle >= Math.PI / 8 && sunAngle < Math.PI * 7/8){
        newSunBrightness = sunDefaultBrightness;
        sunLight.Color = sunny;
        skyBoxColor = skyBlue
    }
    // Sunset
    else if (sunAngle >= Math.PI * 7/8 && sunAngle < Math.PI){
        let gradient = (sunAngle - (Math.PI * 7/8)) / (Math.PI/8);
        newSunBrightness = ((-2.54648 * sunAngle) + 8) * sunDefaultBrightness;
        sunLight.Color = BABYLON.Color3.Interpolate(sunny, sunsetOrange, gradient);
        skyBoxColor = BABYLON.Color3.Interpolate(skyBlue, midnightBlue, gradient);
    }
    // Night
    else if (sunAngle >= Math.PI && sunAngle < Math.PI * 2){
        newSunBrightness = 0;
        sunLight.Color = midnightBlue;
    }
    else{
        sunAngle = 0;
    }

    sunLight.Intensity = newSunBrightness;
    
    currBlock = new BABYLON.Vector3(Math.round(cam.Position.x), Math.round(cam.Position.y), Math.round(cam.Position.z));

    collisionData = GetBlockData(currBlock.x, currBlock.y, currBlock.z);
    UpdateColorMask();


    // Remove targeted solid block if LMB is clicked
    if (leftMouseDown) {
        let camDirection = cam.Target.subtract(cam.Position);
		
		if(timeSinceBreak > breakDelay){
			timeSinceBreak = 0;
            let step = 0.2;
			for (let currDist = step; currDist <= interactionDist; currDist += step){
				let targetX = Math.round(cam.Position.x + (camDirection.x * currDist));
				let targetY = Math.round(cam.Position.y + (camDirection.y * currDist));
				let targetZ = Math.round(cam.Position.z + (camDirection.z * currDist));
                
                let blockID = GetBlockData(targetX, targetY, targetZ);
				if (blockID !== 0 && !liquidID.includes(blockID)) {
					RemoveBlock(targetX, targetY, targetZ);
					break;
				}
			}    
		}
    }
    // Place a block where the cursor is pointing, if RMB is clicked and a solid block is targeted
    else if (rightMouseDown) {
        // To figure out where to place a block, first march forward from the player.  If a block is hit, begin marching backwards until it gets back to air
        let camDirection = cam.Target.subtract(cam.Position);
		
		if(timeSincePlace > placeDelay){
			timeSincePlace = 0;
            let step = 0.2;

            // March forwards until block is hit
            for (let currDist = 0; currDist <= interactionDist; currDist += step){
				let targetX = Math.round(cam.Position.x + (camDirection.x * currDist));
				let targetY = Math.round(cam.Position.y + (camDirection.y * currDist));
                let targetZ = Math.round(cam.Position.z + (camDirection.z * currDist));

                let blockID = GetBlockData(targetX, targetY, targetZ);
                if (blockID !== 0 && !liquidID.includes(blockID)) {
                    // March backwards one step and place a block
                    currDist -= step;
                    let targetX = Math.round(cam.Position.x + (camDirection.x * currDist));
                    let targetY = Math.round(cam.Position.y + (camDirection.y * currDist));
                    let targetZ = Math.round(cam.Position.z + (camDirection.z * currDist));

                    let hDist = Math.sqrt(Math.pow(targetX - cam.Position.x, 2) + Math.pow(targetZ - cam.Position.z, 2));
                    let vDist = targetY - cam.Position.y;
                    
                    blockID = GetBlockData(targetX, targetY, targetZ);
                    if (blockID === 0 || liquidID.includes(blockID)){
                        if ( !(hDist < playerRadius + 0.707 && (vDist > -playerHeight - 0.5 && vDist < 0.5)) ) {
                            PlaceBlock(targetX, targetY, targetZ, blockInHand);
    
                            let key = Create3DCoordsKey(targetX, targetY, targetZ);
                            let lightData = CalculateBlockSunlight(targetX, targetY, targetZ, visibleFaces[key]);
                            SetBlockLightData(targetX, targetY, targetZ, lightData);
                        }
                    }
                    
                    break;
				}
			}
		}
    }

	timeSinceBreak += deltaTime;
	timeSincePlace += deltaTime;


    // Wall collision, detects intersection between the player's radius and all 24 of the surrounding blocks
    for (let y = -Math.trunc(playerHeight); y <= 0; y++) {

        for (let x = -1; x <= 1; x++) {

            for (let z = -1; z <= 1; z++) {

                // Ignore the block that the player is inside of
                if (x === 0 && z === 0) {
                    continue;
                }
				
				let thisBlock = GetBlockData(x + currBlock.x, y + currBlock.y, z + currBlock.z);

                if (thisBlock !== 0 && !liquidID.includes(thisBlock)) {
                    let circlePos = new BABYLON.Vector2(cam.Position.x, cam.Position.z);
                    let squarePos = new BABYLON.Vector2(x + currBlock.x, z + currBlock.z);

                    let isIntersecting = circleSquareIntersect(circlePos, playerRadius, squarePos, 0.5);
                    if (isIntersecting === true) {
                        // Push player in the opposite direction of the intersecting block, snapping their position to lie on the edge of the block.
                        // Three cases: column (x = 0), row (z = 0), or corners (neither x nor z = 0)
                        let newPos = new BABYLON.Vector3(0, 0, 0);

                        if (x === 0) {
                            newPos = new BABYLON.Vector3(
                                cam.Position.x,
                                cam.Position.y,
                                squarePos.y - (z * (0.5 + playerRadius))
                            );
                        }
                        else if (z === 0) {
                            newPos = new BABYLON.Vector3(
                                squarePos.x - (x * (0.5 + playerRadius)),
                                cam.Position.y,
                                cam.Position.z
                            );
                        }
                        else {
                            newPos = new BABYLON.Vector3(
                                squarePos.x - (x * (0.5 + playerRadius)),
                                cam.Position.y,
                                squarePos.y - (z * (0.5 + playerRadius))
                            );
                        }
                        

                        moveCameraToPosition(cam, newPos);

                    }
                }
            }
        }
    }

    // Increment eighth-steps to check for ground collision within the movement vector
    applyGravity(gravityAccel, deltaTime, terminalVelocity);

    let currPos = new BABYLON.Vector3(cam.Position.x, cam.Position.y - playerHeight, cam.Position.z);
    let eighthStep = getNStep(playerVel.scale(deltaTime), 8);
    for (let s = 1; s <= 8; s++) {
        // s represents the current step we are on.  Each step, we add a quarter step 
        // to the current position being checked and see if it's inside of a block.

        currPos = currPos.add(eighthStep);
        let blockPos = new BABYLON.Vector3(Math.round(currPos.x), Math.round(currPos.y), Math.round(currPos.z));
        let blockBelow = GetBlockData(blockPos.x, blockPos.y, blockPos.z);

        // If block is not air or a liquid, then set y velocity to 0 and snap player to the top of the block
        if (blockBelow !== 0 && !liquidID.includes(blockBelow)) {
            playerVel.y = 0;
            let surfacePos = new BABYLON.Vector3(cam.Position.x, blockPos.y + 0.5 + playerHeight, cam.Position.z);
            moveCameraToPosition(cam, surfacePos);
            break;
        }
    }

    // Increment quarter-steps to check for ceiling collision
    currPos = new BABYLON.Vector3(cam.Position.x, cam.Position.y + 0.5, cam.Position.z);
    let quarterStep = getNStep(playerVel.scale(deltaTime), 4);
    for (let s = 1; s <= 4; s++) {
        // s represents the current step we are on.  Each step, we add a quarter step 
        // to the current position being checked and see if it's inside of a block.

        currPos = currPos.add(quarterStep);
        let blockPos = new BABYLON.Vector3(Math.round(currPos.x), Math.round(currPos.y), Math.round(currPos.z));
        let blockAbove = GetBlockData(blockPos.x, blockPos.y, blockPos.z);

        // If block is not air or a liquid, then set y velocity to 0 and snap player to the top of the block
        if (blockAbove !== 0 && !liquidID.includes(blockAbove)) {
            playerVel.y = 0;
            let surfacePos = new BABYLON.Vector3(cam.Position.x, blockPos.y - 1, cam.Position.z);
            moveCameraToPosition(cam, surfacePos);
            break;
        }
    }

    moveCameraVector(cam, playerVel.scale(deltaTime));

    //document.getElementById("testStat").innerHTML = currBlock.x + ", " + currBlock.y + ", " + currBlock.z;
    document.getElementById("testStat").innerHTML = currChunk.x + ", " + currChunk.y + ", " + currChunk.z;
}




function GenerateWorld() {

    var biomeCellPoints = [];
    var biomeCellID = [];

    // Generate list of random points for biome centers
    for (let i = 0; i < numBiomeCells; i++) {
        // Places random xz coords next to each other in a flat array, and assigns a random biome ID to each point
        biomeCellPoints[2 * i] = Math.round(Math.random() * worldWidth);
        biomeCellPoints[2 * i + 1] = Math.round(Math.random() * worldWidth);

        let biomeIndex = Math.round(Math.random() * (biomeList.length - 1));
        let thisBiome = biomeList[biomeIndex];

        biomeCellID[i] = thisBiome;
    }

    // Biome allocation
    var biomeMap = Create2DArray(worldWidth, worldWidth);
    for (let x = 0; x < worldWidth; x++) {
        for (let z = 0; z < worldWidth; z++) {

            switch (biomeAllocationType) {
                case 0:
                    // *** Voronoi Cells ***
                    // At each xz coordinate, calculates the distance squared to each biome cell
                    // and takes the closest point's biome ID, creating a Voronoi Diagram of biome areas
                    let currClosestDist = 65536;
                    let currClosestIndex = 0;

                    for (let i = 0; i < numBiomeCells; i++) {
                        cellX = biomeCellPoints[2 * i];
                        cellZ = biomeCellPoints[2 * i + 1];

                        dist = Math.pow(cellX - x, 2) + Math.pow(cellZ - z, 2);
                        if (dist < currClosestDist) {
                            currClosestDist = dist;
                            currClosestIndex = i;
                        }
                    }
                    biomeMap[x][z] = biomeCellID[currClosestIndex];

                    break;

                case 1:
                    // *** Simplex noise (naive) ***
                    // Uses simplex noise to smoothly interpolate between biomes.  Makes a "heightmap" where each number represents a biome ID
                    let noiseValueN = (noise.simplex2(x * simplexBiomeCompression, z * simplexBiomeCompression) + 1) / 2;
                    biomeMap[x][z] = Math.round((biomeID.length - 1) * noiseValueN);

                    break;

                case 2:
                    // *** Simplex Noise (evenly distributed) ***
                    // Uses simplex noise to smoothly interpolate between biomes.  Makes a "heightmap" where each number represents a biome ID.
                    // Noise value is biased towards the extremes to account for their lower occurrence rates
                    let range = biomeID.length - 1;
                    let noiseValueD = noise.simplex2(x * simplexBiomeCompression, z * simplexBiomeCompression);
                    noiseValueD = Math.sqrt(Math.abs(noiseValueD)) * Math.sign(noiseValueD) + 1;
                    biomeMap[x][z] = Math.round(range * noiseValueD / 2);

                    break;
					
				case 3:
					// *** White Noise (each tile is a completely random biome)(why would anybody want this) ***
					biomeMap[x][z] = biomeList[Math.round(Math.random() * (biomeList.length - 1))];
					
					break;
            }
            
        }
    }
    
    // Heightmap generation
    var heightMap = Create2DArray(worldWidth, worldWidth);
    noise.seed(worldSeed);
    for (let x = 1; x < worldWidth-1; x++) {
        for (let z = 1; z < worldWidth-1; z++) {
            let currBiome = biomeID[biomeMap[x][z]];
            
            // Generate terrain height based on biomes' course detail
            heightMap[x][z] = 
			    Math.round(worldAmplificationVertical * 
				currBiome.CourseScaleHeight * 
				noise.simplex2(x * currBiome.CourseScaleCompression / worldAmplificationHorizontal, z * currBiome.CourseScaleCompression / worldAmplificationHorizontal)) 
			    + seaLevel + currBiome.Offset;
            
            // Add fine detail
            noise.seed(worldSeed + 1);
            heightMap[x][z] += Math.round(
                worldAmplificationVertical * 
				currBiome.FineScaleHeight
                * noise.simplex2(x * currBiome.FineScaleCompression / worldAmplificationHorizontal, z * currBiome.FineScaleCompression / worldAmplificationHorizontal)
                - (currBiome.FineScaleHeight / 2));
        }
    }
    
    
    
    // Fill area below heightmap with layers and place trees
    for (let x = 1; x < worldWidth-1; x++) {
        for (let z = 1; z < worldWidth-1; z++) {

            let currBiomeID = biomeMap[x][z];
            let currBiome = biomeID[currBiomeID];
            
            // Place top layer based on the biome
            let topLayer = heightMap[x][z];
            SetBlockData(x, topLayer, z, currBiome.SurfaceBlock);
            
            
            // Generate layers of dirt and stone below
            for (let y = topLayer-1; y > topLayer-5; y--){
                SetBlockData(x, y, z, currBiome.SubsurfaceBlock);
            }
            for (let y = topLayer-5; y >= 0; y--){
                SetBlockData(x, y, z, 1);
            }
        }
    }

    
    // Fill sea level with liquid and convert surrounding grass to sand
    for(let y = seaLevel; y > 0; y--){
        for(let x = 1; x < worldWidth-1; x++){
            for (let z = 1; z < worldWidth - 1; z++){

                let currBiome = biomeID[biomeMap[x][z]];

                // Makes a layer of rock at y = 1
                if (y == 1) {
                    SetBlockData(x, y, z, 1);
                    continue;
                }

                if (blockData[x][y][z] === 0) {
                    SetBlockData(x, y, z, currBiome.LiquidBlock);
                    
                    let blockYP = GetBlockData(x, y+1, z);
                    let blockYN = GetBlockData(x, y-1, z);
                    let blockZP = GetBlockData(x, y, z+1);
                    let blockZN = GetBlockData(x, y, z-1);
                    let blockXP = GetBlockData(x+1, y, z);
                    let blockXN = GetBlockData(x-1, y, z);
                    
                    if (blockYP === 3) {
                        SetBlockData(x, y+1, z, 5);
                    }
                    if (blockYN === 3) {
                        SetBlockData(x, y-1, z, 5);
                    }
                    if (blockZP === 3) {
                        SetBlockData(x, y, z+1, 5);
                    }
                    if (blockZN === 3) {
                        SetBlockData(x, y, z-1, 5);
                    }
                    if (blockXP === 3) {
                        SetBlockData(x+1, y, z, 5);
                    }
                    if (blockXN === 3) {
                        SetBlockData(x-1, y, z, 5);
                    }
                }             
            }
        }
    }


    // Recalculate heightmap in areas modified by caving
    let caveMap = GenerateCaves(0.4, 4, heightMap);

    for (let x = 1; x < worldWidth-1; x++) {
        for (let z = 1; z < worldWidth-1; z++) {

            if (caveMap[x][z] == 1) {
                // 'Bubble' down from top to new height
                let currHeight = heightMap[x][z];
                let currBlock = 0;

                while (currBlock === 0 || currBlock === 4) {
                    currHeight -= 1;
                    currBlock = GetBlockData(x, currHeight, z);        
                    if (currHeight < 1) {
                        break;
                    }
                }
                heightMap[x][z] = currHeight;
            }
        }
    }

    // Places surface scatter based on biome and elevation
    for (let x = 1; x < worldWidth-1; x++) {
        for (let z = 1; z < worldWidth-1; z++) {

            let currBiomeID = biomeMap[x][z];

            let topLayer = heightMap[x][z];

            // SURFACE LEVEL ground cover
            if (topLayer >= seaLevel) {
                switch (currBiomeID) {
                    // Dry Desert
                    case 0:
                        if (RandomChance(0.007)) {
                            let height = Math.round(Math.random() * 5 + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 8);
                        }
                        break;
                    // Plains
                    case 1:
                        if (RandomChance(0.0065)) {
                            PlaceGroundCover(x, topLayer + 1, z, 7);
                        }
                        break;
                    // Forest
                    case 2:
                        if (RandomChance(0.04)) {
                            PlaceGroundCover(x, topLayer + 1, z, 7);
                        }
                        if (RandomChance(0.014)) {
                            let height = Math.round(Math.random() * 5 + 5);
                            GrowTreeBox(x, topLayer + 1, z, height, 0.9);
                        }
                        if (RandomChance(0.01)) {
                            let height = Math.round(Math.random() * 7 + 7);
                            GrowTreeBall(x, topLayer + 1, z, height, Math.sqrt(height) * 1.3 + 1, 0.9);
                        }
                        break;
                    // Mountains
                    case 3:
                        if (RandomChance(0.007)) {
                            PlaceGroundCover(x, topLayer + 1, z, 7);
                        }
                        if (RandomChance(0.013)) {
                            PlaceGroundCover(x, topLayer + 1, z, 11);
                        }
                        if (topLayer >= 37) {
                            if (RandomChance(0.7)) {
                                PlaceGroundCover(x, topLayer, z, 12);
                            }
                            if (topLayer >= 52) {
                                PlaceGroundCover(x, topLayer, z, 12);
                            }
                        }
                        break;
                    // Hills
                    case 4:
                        if (RandomChance(0.01)) {
                            PlaceGroundCover(x, topLayer + 1, z, 7);
                        }
                        if (RandomChance(0.002)) {
                            let height = Math.round(Math.random() * 3 + 4);
                            GrowTreeBall(x, topLayer + 1, z, height, Math.sqrt(height));
                        }

                        break;
                    // Lush Desert
                    case 5:
                        if (RandomChance(0.01)) {
                            PlaceGroundCover(x, topLayer, z, 2);
                        }
                        if (RandomChance(0.01)) {
                            PlaceGroundCover(x, topLayer + 1, z, 6);
                        }
                        if (RandomChance(0.015)) {
                            let height = Math.round(Math.random() * 8 + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 8);
                        }
                        break;
                    // Swamp
                    case 6:
                        if (RandomChance(0.05)) {
                            PlaceGroundCover(x, topLayer, z, 3);
                        }
                        if (RandomChance(0.05)) {
                            let height = Math.round(Math.random() * 5 + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 6);
                        }

                        if (RandomChance(0.02)) {
                            let height = Math.round(Math.random() * 6 + 6);
                            GrowTreeBox(x, topLayer + 1, z, height, 0.5);
                        }
                        if (RandomChance(0.02)) {
                            let height = Math.round(Math.random() * 4 + 4);
                            GrowTreePine(x, topLayer + 1, z, height, height / 4, height / 4, 0.9);
                        }
                        break;
                    // Badlands
                    case 7:
                        if (RandomChance(0.05)) {
                            PlaceGroundCover(x, topLayer + 1, z, 1);
                        }
                        if (RandomChance(0.15)) {
                            PlaceGroundCover(x, topLayer, z, 0);
                        }
                        if (RandomChance(0.006)) {
                            let height = Math.round(Math.random() * 4 + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 8);
                        }
                        break;
                    // Lava Pit
                    case 8:
                        if (RandomChance(0.045)) {
                            PlaceGroundCover(x, topLayer + 1, z, 1);
                        }
                        break;

                    // * Skip 9: Deep Ocean

                    // Jungle
                    case 10:
                        if (RandomChance(0.4)) {
                            PlaceGroundCover(x, topLayer, z, 3);
                        }
                        if (RandomChance(0.03)) {
                            PlaceGroundCover(x, topLayer, z, 7);
                        }
                        if (RandomChance(0.03)) {
                            PlaceGroundCover(x, topLayer + 1, z, 8);
                        }
                        if (RandomChance(0.04)) {
                            let height = Math.round(Math.random() * 6 + 10);
                            GrowTreeBox(x, topLayer + 1, z, height, 0.9);
                        }
                        if (RandomChance(0.02)) {
                            let height = Math.round(Math.random() * 10 + 6);
                            GrowTreeBall(x, topLayer + 1, z, height, Math.sqrt(height) * 1.3 + 1, 0.8);
                        }
                        break;

                    // Green Mountains
                    case 11:
                        if (RandomChance(0.008)) {
                            PlaceGroundCover(x, topLayer + 1, z, 7);
                        }
                        if (RandomChance(0.01)) {
                            PlaceGroundCover(x, topLayer + 1, z, 11);
                        }

                        if (topLayer <= 30) {
                            if (RandomChance(0.9)) {
                                PlaceGroundCover(x, topLayer, z, 3);
                                PlaceGroundCover(x, topLayer-1, z, 3);
                            }
                            if (RandomChance(0.025)) {
                                let height = Math.round(Math.random() * 7 + 5);
                                GrowTreePine(x, topLayer + 1, z, height, height / 4, height / 4);
                            }
                        }
                        else if (topLayer <= 38) {
                            if (RandomChance(0.7)) {
                                PlaceGroundCover(x, topLayer, z, 3);
                                PlaceGroundCover(x, topLayer - 1, z, 3);
                            }
                            if (RandomChance(0.2)) {
                                PlaceGroundCover(x, topLayer, z, 12);
                            }
                            if (RandomChance(0.015)) {
                                let height = Math.round(Math.random() * 6 + 4);
                                GrowTreePine(x, topLayer + 1, z, height, height / 5, height / 4);
                            }
                        }           
                        else {
                            if (RandomChance(0.2)) {
                                PlaceGroundCover(x, topLayer, z, 3);
                            }
                            if (RandomChance(0.75)) {
                                PlaceGroundCover(x, topLayer, z, 12);
                            }
                        }
                        break;

                    // Islands
                    case 12:
                        if (RandomChance(0.01)) {
                            PlaceGroundCover(x, topLayer + 1, z, 6);
                        }
                        if (RandomChance(0.007)) {
                            let height = Math.round(Math.random() * 4 + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 8);
                        }                        

                        if (RandomChance(0.012)) {
                            let height = Math.round(Math.random() * 6 + 5);
                            GrowTreePine(x, topLayer + 1, z, height, 1.7 * height, height - 1, 0.7);
                        }
                        break;
                }
            }

            // BELOW SEA LEVEL ground cover
            else {
                switch (currBiomeID) {
                    // Forest
                    case 2:
                        if (RandomChance(0.01)) {
                            PlaceGroundCover(x, topLayer + 1, z, 11);
                        }
                        break;

                    // Mountains
                    case 3:
                        if (RandomChance(0.04)) {
                            PlaceGroundCover(x, topLayer + 1, z, 11);
                        }
                        if (RandomChance(0.02)) {
                            PlaceGroundCover(x, topLayer + 1, z, 1);
                        }
                        break;

                    // Deep Ocean
                    case 9:
                        if (RandomChance(0.015)) {
                            PlaceGroundCover(x, topLayer, z, 2);
                        }
                        if (RandomChance(0.015)) {
                            PlaceGroundCover(x, topLayer + 1, z, 1);
                        }
                        if (RandomChance(0.015)) {
                            let height = Math.round(Math.random() * (seaLevel - topLayer - 1) + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 7);
                        }
                        break;

                    // Islands
                    case 12:
                        if (RandomChance(0.3)) {
                            PlaceGroundCover(x, topLayer, z, 1);
                        }
                        if (RandomChance(0.06)) {
                            PlaceGroundCover(x, topLayer + 1, z, 11);
                        }
                        if (RandomChance(0.0175)) {
                            let height = Math.round(Math.random() * (seaLevel - topLayer - 1) + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 7);
                        }

                        if (RandomChance(0.02)) {
                            let height = Math.round(Math.random() * 2 + 1);
                            PlaceTrunk(x, topLayer + 1, z, height, 8);
                        }
                        break;
                }
            }
        }
    }


    // Place a house in each biome cell point
    for (let i = 0; i < numBiomeCells; i++) {
        let thisX = biomeCellPoints[2 * i];
        let thisZ = biomeCellPoints[2 * i + 1];

        let length = Math.round(Math.random() * 12 + 4);
        let width = Math.round(Math.random() * 12 + 4);
        let height = Math.round(Math.random() * 3 + 5);
        let doorSide = Math.round(Math.random() * 3);

        let midX = thisX + Math.round(length / 2);
        let midZ = thisZ + Math.round(width / 2);

        let floorID = 1; //Math.round(Math.random() * (colorID.length - 1));
        let wallID = 11; //Math.round(Math.random() * (colorID.length - 1));
        let roofID = 6; //Math.round(Math.random() * (colorID.length - 1));

        let thisY = GetMapData(heightMap, midX, midZ);
        if (thisY >= seaLevel) {
            PlaceHouseBasic(thisX, thisY, thisZ, length, height, width, doorSide, floorID, wallID, roofID);
        }
		
		//PlaceCloudEmpty(thisX, 50, thisZ, Math.round(Math.random() * 10 + 1))
    }
    //PlaceHouseBasic(120, heightMap[125][128], 120, 10, 8, 16);


	// Generate lower lava layer
    for (let x = 1; x < worldWidth-1; x++) {
        for (let z = 1; z < worldWidth-1; z++) {           
            SetBlockData(x, 0, z, 9);
        }
    }

    // Generate waterfalls on top of clouds
    let cloudHeight = 80;
    let cloudMap = PlaceCloudLayer(cloudHeight, 5, 0.5, 3.5);
    for (let x = 1; x < worldWidth - 1; x++) {
        for (let z = 1; z < worldWidth - 1; z++) {
            if (cloudMap[x][z] === 1 && RandomChance(0.01)) {
				// Begin a waterfall by placing a water block randomly on a cloud
                SetBlockData(x, cloudHeight, z, 4);
				
                //let waterDirSign = RandomSign();
                //let waterDirAxis = RandomBool();
                let thisBlock = new BABYLON.Vector3(x, cloudHeight, z);
                let blockBelow = GetBlockData(thisBlock.x, thisBlock.y - 1, thisBlock.z);
				
				// Keep marching waterfall down until a terminating condition is met or an iteration limit is reached
				let waterStepCount = 0;
				while (waterStepCount < 120){
					
					blockBelow = GetBlockData(thisBlock.x, thisBlock.y - 1, thisBlock.z);
					
					// If space below is empty, move down one
					if (blockBelow == 0){
						thisBlock.y -= 1;
						SetBlockData(thisBlock.x, thisBlock.y, thisBlock.z, 4);
					}
					// Terminate if liquid has been reached
					else if (liquidID.includes(blockBelow)){
						break;
					}
					
					// If water encounters a solid block below, then check the four blocks on each side of the water and march accordingly.
					// If all four sides are surrounded, terminate. If the water can continue in a straight line, record how many steps
					// it has been moving straight and cut it off after a given amount. If it cannot continue in a straight line and there
					// are one or more surrounding blocks present, pick an empty direction randomly and go that way.
					else{
						// Check all sides and store in a block ID list: [x+, z+, x-, z-]
						let sideBlocks = [];
						sideBlocks[0] = GetBlockData(thisBlock.x + 1, thisBlock.y, thisBlock.z);
						sideBlocks[1] = GetBlockData(thisBlock.x, thisBlock.y, thisBlock.z + 1);
						sideBlocks[2] = GetBlockData(thisBlock.x - 1, thisBlock.y, thisBlock.z);
						sideBlocks[3] = GetBlockData(thisBlock.x, thisBlock.y, thisBlock.z-1);
						
						// All sides surrounded, terminate
						if (!sideBlocks.includes(0)){
							break;
						}
						// Pick a random side from surrounding blocks until it gets an empty side
						else{
							let thisSide = Math.trunc(Math.random() * 4);
							while(sideBlocks[thisSide] !== 0){
								thisSide = Math.trunc(Math.random() * 4);
							}
							// March in the direction chosen
							switch(thisSide){
								case 0:
									thisBlock.x += 1;
									SetBlockData(thisBlock.x, thisBlock.y, thisBlock.z, 4);
									break;
								case 1:
									thisBlock.z += 1;
									SetBlockData(thisBlock.x, thisBlock.y, thisBlock.z, 4);
									break;
								case 2:
									thisBlock.x -= 1;
									SetBlockData(thisBlock.x, thisBlock.y, thisBlock.z, 4);
									break;
								case 3:
									thisBlock.z -= 1;
									SetBlockData(thisBlock.x, thisBlock.y, thisBlock.z, 4);
									break;
							}
						}
					}
					
					waterStepCount += 1;
				}
            }
        }
    }


    ClearChunks();
    LoadChunks(currChunk, renderDistance);

}


function CalculateBlockSunlight(x, y, z, faceVisibility){

    if (x >= worldWidth || x < 0 || y >= worldHeight || y < 0 || z >= worldWidth || z < 0) {
        return;
    }

    var blockID = GetBlockData(x, y, z);
    if (blockID === 0) {
        return [0, 0, 0, 0, 0, 0];
    }

    // March a ray towards the sun, checking if this block is occluded by other blocks
    let rayDir = currSunDirection.scale(-lightStepLength);
    let rayPos = new BABYLON.Vector3(x, y + 0.5, z);
    let lightMultiplier = 1;
    
    for (let i = 0; i < maxLightSteps; i++){
        rayPos = rayPos.add(rayDir);
        let blockPos = BABYLON.Vector3.Copy(rayPos).round();

        let blockID = GetBlockData(blockPos.x, blockPos.y, blockPos.z);

        if (blockID !== 0){           
            lightMultiplier *= blockTransparency[blockID];
            if (lightMultiplier === 0){
                break;
            }
        }
    }

    // Calculate the angle-compensated light level for all six faces   
    let lightValues = [0, 0, 0, 0, 0, 0];
    for (let f = 0; f < 6; f++){
        if (faceVisibility[f] === true){
            let faceNormal = FaceNumberToNormal(f);
            let ndotl = BABYLON.Vector3.Dot(faceNormal, rayDir);
            ndotl = Math.max(ndotl, 0);
        
            lightValues[f] = Math.round(lightMultiplier * sunLight.Intensity * ndotl * maxLightLevel);
        }
    }

    return lightValues;
}


function CalculateChunkSunlight(chunkCoords){
    let xMid = chunkCoords.x * chunkWidth;
    let yMid = chunkCoords.y * chunkHeight;
    let zMid = chunkCoords.z * chunkWidth;

    let renderWidth = (chunkWidth / 2);
    let renderHeight = (chunkHeight / 2);

    for (let x = xMid - renderWidth; x < xMid + renderWidth; x++) {
        if(x < 0) { x = 0; }
        if(x > worldWidth) { x = xMid + renderWidth; }
        
        for (let y = yMid - renderHeight; y < yMid + renderHeight; y++) {
            if(y < 0) { y = 0; }
            if(y > worldHeight) { y = yMid + renderHeight; }
            
            for (let z = zMid - renderWidth; z < zMid + renderWidth; z++) {
                if(z < 0) { z = 0; }
                if(z > worldWidth) { z = zMid + renderWidth; }
                
                let lightData;
                let key = Create3DCoordsKey(x, y, z);
                let values = visibleFaces[key];
                if (values !== undefined){
                    lightData = CalculateBlockSunlight(x, y, z, values);
                }
                else{
                    lightData = [0, 0, 0, 0, 0, 0];
                }
                
                sunlightFaceData[key] = lightData;
            }
        }
    }
}


function Unflatten3DGrid(index, width){
    // Converts a single index into a 3D integer coordinate trio, given the dimensions of a square grid to pick from
    // Coordinates are mapped in the order (x, z, y), but a standard xyz vector is returned
    let maxIndex = width * width * width - 1;
    if (index > maxIndex){
        return; }

    let x = index % width;
    let z = Math.trunc(index / width) % width;
    let y = Math.trunc(index / (width * width));

    let coords = new BABYLON.Vector3(x, y, z);
    return coords;
}


function CreateFaceMeshes(x, y, z) {
    if (x >= worldWidth || x < 0 || y >= worldHeight || y < 0 || z >= worldWidth || z < 0) {
        return;
    }

    let currPos = new BABYLON.Vector3(x, y, z);

    var blockID = GetBlockData(x, y, z);
    var blockColor = colorID[blockID];

    if (blockID === 0) {
        return;
    }
    
    let key = Create3DCoordsKey(x, y, z);
    let faceVisibility = [false, false, false, false, false, false];
    
    if(liquidID.includes(blockID)){
        // Only render liquid faces if they border air or a different liquid
        
        for (let s = 0; s < 6; s++){
            let direction = FaceNumberToNormal(s);
            let adjacentPos = currPos.add(direction);

            let adjacentID = GetBlockData(adjacentPos.x, adjacentPos.y, adjacentPos.z);

            if (adjacentID != blockID && liquidID.includes(adjacentID) || adjacentID === 0) {
                let thisFace = newFace("face", s, blockColor);

                thisFace.Position = currPos;
                thisFace.Direction = s + 1;

                let key = Create3DCoordsKey(adjacentPos.x, adjacentPos.y, adjacentPos.z);
                let lightValue = volumetricLightData[key];
                if (lightValue === undefined) { lightValue = 0 }
                thisFace.VolumetricLightLevel = lightValue;

                faceVisibility[s] = true;
            }
        }
    }
    
    else{
        // Render solid faces if they border air or liquid
        
        for (let s = 0; s < 6; s++){
            let direction = FaceNumberToNormal(s);
            let adjacentPos = currPos.add(direction);

            let adjacentID = GetBlockData(adjacentPos.x, adjacentPos.y, adjacentPos.z);

            if (adjacentID === 0 || liquidID.includes(adjacentID)) {
                let thisFace = newFace("face", s, blockColor);

                thisFace.Position = currPos;
                thisFace.Direction = s + 1;

                let key = Create3DCoordsKey(adjacentPos.x, adjacentPos.y, adjacentPos.z);
                let lightValue = volumetricLightData[key];
                if (lightValue === undefined) { lightValue = 0 }
                thisFace.VolumetricLightLevel = lightValue;

                faceVisibility[s] = true;
            }
        }
    }

    if (faceVisibility.includes(true)){
        visibleFaces[key] = faceVisibility;
    }
}



function RemoveBlock(x, y, z){
    SetBlockData(x, y, z, 0);

    ClearChunks();
    LoadChunks(currChunk, renderDistance);
}


function PlaceBlock(x, y, z, ID){
    SetBlockData(x, y, z, ID);

    ClearChunks();
    LoadChunks(currChunk, renderDistance);
}



/*function UpdateBlockIndexes() {
    for (let i = 1; i < meshes.length; i++) {
        let thisMesh = meshes[i];
        let meshCoords = new BABYLON.Vector3(Math.trunc(thisMesh.Position.x), Math.trunc(thisMesh.Position.y), Math.trunc(thisMesh.Position.z));
        let directionIndex = thisMesh.Direction;

        blockIndexes[meshCoords.x][meshCoords.y][meshCoords.z][directionIndex] = i;
    }
}*/



function LoadChunks(chunkCoords, distance) {
    let xMid = chunkCoords.x * chunkWidth;
    let yMid = chunkCoords.y * chunkHeight;
    let zMid = chunkCoords.z * chunkWidth;

    let renderWidth = (chunkWidth / 2) + (chunkWidth * distance);
    let renderHeight = (chunkHeight / 2) + (chunkHeight * distance);

    //ClearLightData();

    // Load in chunks surrounding the player
    for (let x = xMid - renderWidth; x < xMid + renderWidth; x++) {
        if(x < 0) { x = 0; }
        if(x > worldWidth) { x = xMid + renderWidth; }
        
        for (let y = yMid - renderHeight; y < yMid + renderHeight; y++) {
            if(y < 0) { y = 0; }
            if(y > worldHeight) { y = yMid + renderHeight; }
            
            for (let z = zMid - renderWidth; z < zMid + renderWidth; z++) {
                if(z < 0) { z = 0; }
                if(z > worldWidth) { z = zMid + renderWidth; }
        
                CreateFaceMeshes(x, y, z);
                
                //CalculateBlockSunlight(x, y, z);
            }
        }
    }
}

function ClearChunks() {
    meshes.length = 1;
    visibleFaces = {};

    //var placeholderScene = new SoftEngine.Mesh("Scene Placeholder", 0, 0, black, null, 0);
    //meshes.push(placeholderScene);
}



function GetBlockData(x, y, z){
    if(x < 0 || y < 0 || z < 0 || x > worldWidth-1 || y > worldHeight-1 || z > worldWidth-1){
        return 0;
    }
    else{
        return blockData[x][y][z];
    }
}

function SetBlockData(x, y, z, value){
    if(x < 0 || y < 0 || z < 0 || x > worldWidth-1 || y > worldHeight-1 || z > worldWidth-1){
        return;
    }
    else{
        blockData[x][y][z] = value;
    }
}


function GetMapData(map, x, z) {
    if (x < 0 || z < 0 || x > worldWidth - 1 || z > worldWidth - 1) {
        return 0;
    }
    else {
        return map[x][z];
    }
}

function SetMapData(map, x, z, value) {
    if (x < 0 || z < 0 || x > worldWidth - 1 || z > worldWidth - 1) {
        return;
    }
    else {
        map[x][z] = value;
    }
}


function GetBlockLightData(x, y, z){
    let key = x + "," + y + "," + z;
    let values = [];

    if (sunlightFaceData.hasOwnProperty(key)){
        values = sunlightFaceData[key];

        if (values == undefined){
            values = [0, 0, 0, 0, 0, 0];
        }
    }
    else{
        values = [0, 0, 0, 0, 0, 0];
    }

    return values;
}

function SetBlockLightData(x, y, z, values){
    let key = x + "," + y + "," + z;
    sunlightFaceData[key] = values;
}

function Create3DCoordsKey(x, y, z){
    let key = x + "," + y + "," + z;
    return key;
}

function CalculateLightSource(lightNode){
    
}

function CalculateVolumeLightSources(minCoords, maxCoords){
    // Calculates light values for all transparent blocks affected by light source blocks in a given 3D volume
    // Nodes are used to store the light data at a point, and are put in a queue to be processed (added to the queue at index 0, taken out of queue at end of array)
    minCoords = minCoords.clamp(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(worldWidth-1, worldHeight-1, worldWidth-1));
    maxCoords = maxCoords.clamp(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(worldWidth-1, worldHeight-1, worldWidth-1));

    let lightQueue = [];

    for (let x = minCoords.x; x <= maxCoords.x; x++){
        for (let y = minCoords.y; y <= maxCoords.y; y++){
            for (let z = minCoords.z; z <= maxCoords.z; z++){
                let blockID = GetBlockData(x, y, z);

                if (lightSourceID.includes(blockID)){
                    lightQueue.push(new BABYLON.LightNode(new BABYLON.Vector3(x, y, z), maxLightLevel));
                }
            }
        }
    }

    iterations = 0;
    while (lightQueue.length > 0 && iterations < 2){
        let thisNode = lightQueue.pop();
        let newLightValue = thisNode.lightValue - 1;

        if (newLightValue > 0){

            for (let s = 0; s < 6; s++){
                let direction = FaceNumberToNormal(s);
                let adjacentPos = thisNode.position.add(direction);

                if (adjacentPos.isWithinBounds(new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(worldWidth-1, worldHeight-1, worldWidth-1))){
                    let adjacentID = GetBlockData(adjacentPos.x, adjacentPos.y, adjacentPos.z);
    
                    if (adjacentID === 0){
                        let key = Create3DCoordsKey(adjacentPos.x, adjacentPos.y, adjacentPos.z);
                        let adjacentLightValue = volumetricLightData[key];
        
                        if (adjacentLightValue === undefined || adjacentLightValue < newLightValue){
                            volumetricLightData[key] = newLightValue;
                            lightQueue.unshift(new BABYLON.LightNode(adjacentPos, newLightValue));
                        }
                    }
                }

                else{
                    continue;
                }
            }
        }
        
        
    }
}


function UpdateColorMask(){   
    if(collisionData === 4){
        maskColor = new BABYLON.Color3(-40, -30, 70);
    }
    else if (collisionData === 9) {
        maskColor = colorID[9];
    }
    else if (collisionData === 13) {
        maskColor = new BABYLON.Color3(-50, 30, 20);
    }
    else{
        maskColor = new BABYLON.Color3(0, 0, 0);
    }
}

function CycleSelectedBlock(sign){
	blockInHand = Math.round(blockInHand + sign);
	if(blockInHand > colorID.length - 1){
		blockInHand = 1;
	}
	else if(blockInHand < 1){
		blockInHand = colorID.length - 1;
	}
	
	document.getElementById("blockInHandStat").innerHTML = "Block in Hand: " + blockInHand;
}

// Utility Functions

function Create2DArray(x, y, fill = 0) {
    var arr = new Array(x);

    for (var a = 0; a < x; a++) {
        arr[a] = [];

        for (var b = 0; b < y; b++) {
            arr[a][b] = fill;
        }
    }

    return arr;
}

function Create3DArray(x, y, z, fill = 0) {
    var arr = new Array(x);

    for (var a = 0; a < x; a++) {
        arr[a] = [];

        for (var b = 0; b < y; b++) {
            arr[a][b] = [];

            for (var c = 0; c < z; c++) {
                arr[a][b][c] = fill;
            }
        }
    }

    return arr;
}

function Create4DArray(x, y, z, slots, fill = 0) {
    var arr = new Array(x);

    for (var a = 0; a < x; a++) {
        arr[a] = [];

        for (var b = 0; b < y; b++) {
            arr[a][b] = [];

            for (var c = 0; c < z; c++) {
                arr[a][b][c] = [];

                for (var d = 0; d < slots; d++) {
                    arr[a][b][c][d] = fill;
                }
            }
        }
    }

    return arr;
}


function RandomChance(percent){
    if(Math.random() < percent){
      return true;
    }
    else{
      return false;
    }
}

function RandomSign() {
    if (Math.random() > 0.5) {
        return 1;
    }
    else {
        return -1;
    }
}

function RandomBool() {
    if (Math.random() > 0.5) {
        return true;
    }
    else {
        return false;
    }
}

function DegToRad(deg){
    let rad = deg * Math.PI / 180;
    return rad;
}

function RadToDeg(rad){
    let deg = rad * 180 / Math.PI;
    return deg;
}

function clampValue(value, minimum, maximum) {
    let clampedVal = Math.min(maximum, Math.max(minimum, value));
    return clampedVal;
}

function FaceNumberToNormal(faceNumber){

    switch (faceNumber){
        case 0:
            // x+
            return new BABYLON.Vector3(1, 0, 0);

        case 1:
            // x-
            return new BABYLON.Vector3(-1, 0, 0);

        case 2:
            // y+
            return new BABYLON.Vector3(0, 1, 0);

        case 3:
            // y-
            return new BABYLON.Vector3(0, -1, 0);

        case 4:
            // z+
            return new BABYLON.Vector3(0, 0, 1);

        case 5:
            // z-
            return new BABYLON.Vector3(0, 0, -1);

        default:
            return new BABYLON.Vector3(0, 0, 0);
    }
}

function SetRenderDistance(dist){
    renderDistance = dist;
    chunksPerEdge = 2 * dist + 1;
    ClearChunks();
    LoadChunks(currChunk, dist);
}