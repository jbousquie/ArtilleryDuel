/// <reference path='./babylon.d.ts' />
"use strict";

var ARTILLERY = ARTILLERY || {};

// Artillery properties
ARTILLERY.scenes = ARTILLERY.scenes || {};
ARTILLERY.gravity = 9.81;
ARTILLERY.controls = [
    {up: false, down: false, left: false, right: false, fire: false}, 
    {up: false, down: false, left: false, right: false, fire: false}
];

// Artillery functions
ARTILLERY.generateLandscape = function(groundSize, sub, scene) {
    var groundTex = new BABYLON.Texture("images/ground.jpg", scene);
    groundTex.uScale = 4;
    groundTex.vScale = 4;

    // ground
    var ground = BABYLON.MeshBuilder.CreateGround("gd",{width: groundSize, height: groundSize, subdivisions: sub, updatable: true}, scene);
    var groundMat = new BABYLON.StandardMaterial("gm", scene);
    //groundMat.wireframe = true;
    groundMat.diffuseTexture = groundTex;
    groundMat.specularColor = BABYLON.Color3.Black();
    //groundMat.backFaceCulling = false;
    groundMat.freeze();
    ground.material = groundMat;
    
    var perlinSize = (sub + 1) * (sub + 1);
    var perlinOptions = {octaveCount: 4, amplitude: 0.6, persistence: 0.3};
    var perlin = generatePerlinNoise(perlinSize, perlinSize, perlinOptions);

    // the following parameters might change each level
    // might also something else than sinus curves : x², etc
    var amp = 2;                    // hill amplitude
    var wave = perlinSize / 1.5;    // wave number
    var waveHeight = 2.5;           // wave amplitude
    var start = -Math.PI / 2;       // start angle (sin)
    var edgeHeights = [];           // edge heights storage
    var borderHeights = [];         // front and back border heights storage
    var perlinGround = function(positions) {
        var last = positions.length / 3 - 1;
        for (var idx = 0; idx < positions.length; idx +=3) {
            var e = idx / 3;
            var y = perlin[idx] * amp + Math.sin(idx / wave + start) * waveHeight;
            positions[idx + 1] = y
            var mod = e % (sub + 1);
            if (mod == 0 || mod == sub) {
                edgeHeights.push(y);
            }
            if (e <= sub || e >= last - sub) {
                borderHeights.push(y);
            }
        }  
    };

    ground.updateMeshPositions(perlinGround);
    ground.updateCoordinateHeights();

    /*
    // add a ribbon around the ground
    var paths = [];
    var subSize = groundSize / sub;
    var x = 0.0;
    var y = -10.0;
    var z = groundSize / 2;
    var e = 0;          // side edge index
    var p = 0;          // front/back border index
    var path;
    // ribbon front band
    path = [];
    path.push(new BABYLON.Vector3(-groundSize / 2, y, z)); // first extra point to match with the edge band
    for (p = 0; p <= sub; p++) {
        x = subSize * p - groundSize / 2;
        path.push(new BABYLON.Vector3(x, borderHeights[p], z));
    }
    path.push(new BABYLON.Vector3(x, y, z)); // last extra point to match with the edge band
    paths.push(path);
    path = [];
    path.push(new BABYLON.Vector3(-groundSize / 2, y, z)); // first extra point to match with the edge band
    for (p = 0; p <= sub; p++) {
        x = subSize * p - groundSize / 2;
        path.push(new BABYLON.Vector3(x, y, z));
    }
    path.push(new BABYLON.Vector3(x, y, z)); // last extra point to match with the edge band
    paths.push(path);
    // ribbon side edges and bottom
    for (e = 0; e <= sub; e++) {
        path = []
        z = -e * subSize + groundSize / 2;
        path.push(new BABYLON.Vector3(-groundSize / 2, edgeHeights[e * 2], z));
        path.push(new BABYLON.Vector3(-groundSize / 2, y, z));
        for (p = 0; p < sub; p ++) {
            x = subSize * p - groundSize / 2;
            path.push(new BABYLON.Vector3(x, y, z));
        }
        path.push(new BABYLON.Vector3(groundSize / 2, y, z));
        path.push(new BABYLON.Vector3(groundSize / 2, edgeHeights[e * 2 + 1], z));

        paths.push(path);
    }
    // ribbon back band
    z = -groundSize / 2;
    path = [];
    path.push(new BABYLON.Vector3(-groundSize / 2, y, z)); // first extra point to match with the edge band
    for (p = 0; p <= sub; p++) {
        x = subSize * p - groundSize / 2;
        path.push(new BABYLON.Vector3(x, y, z));
    }
    path.push(new BABYLON.Vector3(x, y, z)); // last extra point to match with the edge band
    paths.push(path);
    path = [];
    path.push(new BABYLON.Vector3(-groundSize / 2, y, z)); // first extra point to match with the edge band
    for (p = 0; p <= sub; p++) {
        x = subSize * p - groundSize / 2;
        path.push(new BABYLON.Vector3(x, borderHeights[p + sub + 1], z));
    }
    path.push(new BABYLON.Vector3(x, y, z)); // last extra point to match with the edge band
    paths.push(path);
    
    
    var groundRibbon = BABYLON.MeshBuilder.CreateRibbon("gr", {pathArray: paths, sideOrientation: BABYLON.Mesh.BACKSIDE, updatable: true}, scene);
    var groundRibbonMat = new BABYLON.StandardMaterial('grm', scene);
    groundRibbonMat.diffuseColor = BABYLON.Color3.Green();
    //groundRibbonMat.wireframe = true;
    groundRibbonMat.alpha = 0.4;
    groundRibbonMat.backFaceCulling = false;
    groundRibbonMat.freeze();
    groundRibbon.material = groundRibbonMat;
    */  
    var groundRibbon;
    var landscape = {ground: ground, ribbon: groundRibbon};
    return landscape;
};

ARTILLERY.generateCannon = function(id, size, color, position, angle, rotY,  scene) {
    var path = [new BABYLON.Vector3(0, 0, -size /2), new BABYLON.Vector3(0, 0, size / 2)];
    var caliber = size / 8;
    var cannon = BABYLON.MeshBuilder.CreateTube(id, {path: path, radius: caliber, tessellation: 16, cap: BABYLON.Mesh._CAP_START}, scene);
    cannon.position = position;
    cannon.rotation.x = angle;
    cannon.rotation.y = rotY;
    var cannonMat = new BABYLON.StandardMaterial("mat-"+id, scene);
    cannonMat.diffuseColor = color;
    cannonMat.backFaceCulling = false;
    cannonMat.freeze();
    cannon.material = cannonMat;
    // artillery properties
    cannon.size = size;                         // cannon size
    cannon.end = path[1];                       // cannon end point
    cannon.muzzle = BABYLON.Vector3.Zero();     // muzzzle world coordinates
    cannon.caliber = caliber;                   // cannon caliber
    cannon.capacity = 3;                        // max load of bullets
    cannon.nextBullet = 0;                      // index of next (un-fired) bullet
    cannon.bullets = [];                        // bullet array
    cannon.temperature = 0;                     // cannon temperature
    cannon.limitTemperature = 100;
    return cannon;
};

ARTILLERY.generateBullet = function(id, cannon, scene) {
    var bullet = BABYLON.MeshBuilder.CreateSphere(id, {segments: 4, diameter: cannon.caliber}, scene);
    bullet.material = cannon.material;
    bullet.position.copyFrom(cannon.muzzle);
    // artillery properties
    bullet.cannon = cannon;                 // reference to the cannon it belongs to
    bullet.fired = false;                   // if the bullet is fired
    bullet.heating = 50;                    // how much the bullets warms the cannon when fired
    bullet.speed = 30;                       // bullet speed
    bullet.dateFired = 0.0;                 // timestamp on fire
    bullet.velocity = BABYLON.Vector3.Zero(); // initial velocity vector 
    cannon.bullets.push(bullet);            // load the bullet into the cannon
    return bullet;
};


ARTILLERY.bulletBallistics = function(bullet, ground) {
    
    var k = (Date.now() - bullet.dateFired) / 1000;

    bullet.position.x = k * bullet.velocity.x + bullet.cannon.muzzle.x;        //  x = vx * t + x0
    bullet.position.z = k * bullet.velocity.z + bullet.cannon.muzzle.z;        //  z = vz * t + z0
    bullet.position.y = -k * k * ARTILLERY.gravity * 0.5 + k * bullet.velocity.y + bullet.cannon.muzzle.y;     // y = -g * t² / 2 + vy * t + y0
    if ( bullet.position.y <= ground.getHeightAtCoordinates(bullet.position.x, bullet.position.z) ) {
        bullet.fired = false;
        bullet.position.copyFrom(bullet.cannon.muzzle);
        bullet.cannon.nextBullet --;
        bullet.cannon.nextBullet = (bullet.cannon.nextBullet < 0) ? 0 : bullet.cannon.nextBullet;
    } 
};


// Level logic
ARTILLERY.scenes["level"] = function(canvas, engine) {
    // Scene and cameras
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3( .3, .5, .9);
    
    var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, BABYLON.Vector3.Zero(), scene);
    camera.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1);
    camera.setPosition(new BABYLON.Vector3(0, 8, 20));
    camera.attachControl(canvas, true);
    
    var camera1 = new BABYLON.TargetCamera("camera1", BABYLON.Vector3.Zero(), scene);
    var camera2 = new BABYLON.TargetCamera("camera2", BABYLON.Vector3.Zero(), scene);
    camera1.viewport = new BABYLON.Viewport(0, 0.5, 0.5, 0.5);
    camera2.viewport = new BABYLON.Viewport(0, 0, 0.5, 0.5);
    scene.activeCameras.push(camera);
    scene.activeCameras.push(camera1);
    scene.activeCameras.push(camera2);

    // Lights
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    light.intensity = 0.8;

    // landscape
    var groundSize = 40;
    var subdivisions = 30;
    var landscape = ARTILLERY.generateLandscape(groundSize, subdivisions, scene);
    
    // Cannons
    var cannonSize = 0;
    var x = 0.0;
    var y = 0.0;
    var z = 0.0;
    var camPos = BABYLON.Vector3.Zero();
    var camShift = new BABYLON.Vector3(4, 0.5, 4);        //cannon-muzzle scaling
    cannonSize = 1; 
   
    x = groundSize / 6 * Math.random() + groundSize / 5 - groundSize / 2;
    z = groundSize / 6 * Math.random() + groundSize / 5 - groundSize / 2; 
    y = landscape.ground.getHeightAtCoordinates(x, z) + cannonSize / 2;
    var pos1 = new BABYLON.Vector3(x, y, z);
    var cannon1 = ARTILLERY.generateCannon("cannon1", cannonSize, BABYLON.Color3.Blue(), pos1, -Math.PI / 5, 0, scene);
   
    x = -groundSize / 6 * Math.random() - groundSize / 5 + groundSize / 2;
    z = -groundSize / 6 * Math.random() - groundSize / 5 + groundSize / 2; 
    y = landscape.ground.getHeightAtCoordinates(x, z) + cannonSize / 2;
    var pos2 = new BABYLON.Vector3(x, y, z);
    var cannon2 = ARTILLERY.generateCannon("cannon2", cannonSize, BABYLON.Color3.Red(), pos2, -Math.PI / 5, Math.PI, scene);  

    
    var cannons = [cannon1, cannon2];  
    var cameras = [camera1, camera2];
    
    // Bullets
    var ammoNb = 3;
    var bullets = [];
    var bNb = 0;
    for (var c = 0; c < cannons.length; c++) {
        var cannon = cannons[c];
        for (var b = 0; b < ammoNb; b++) {
            var bullet = ARTILLERY.generateBullet(bNb.toString, cannon, scene);
            bullets.push(bullet);
            bNb ++;
        }
    }
    
    ARTILLERY.bindCannonControls(ARTILLERY.controls);
    
    var deltaX = 0.01;
    var deltaY = 0.01;
    var coolingRate = 1;
    var rotMatrix = BABYLON.Matrix.Zero();
    var vel = BABYLON.Vector3.Zero();
    
    //scene.debugLayer.show();
    scene.registerBeforeRender(function() {

        // move cannons and fire
        for (var c = 0; c < cannons.length; c ++) {
            // cannon temperature update
            cannons[c].temperature -= coolingRate;
            cannons[c].temperature = (cannons[c].temperature < 0) ? 0 : cannons[c].temperature; 
            
            // cannon rotation
            if (ARTILLERY.controls[c].up) {
                cannons[c].rotation.x -= deltaX;
            } else if (ARTILLERY.controls[c].down) {
                cannons[c].rotation.x += deltaX;
            }
            if (ARTILLERY.controls[c].left) {
                cannons[c].rotation.y -= deltaY;
            } else if (ARTILLERY.controls[c].right) {
                cannons[c].rotation.y += deltaY;
            }
            
            // cannon muzzle update
            BABYLON.Matrix.RotationYawPitchRollToRef(cannons[c].rotation.y, cannons[c].rotation.x, 0, rotMatrix);
            BABYLON.Vector3.TransformCoordinatesToRef(cannons[c].end, rotMatrix, cannons[c].muzzle);
            cannons[c].muzzle.addInPlace(cannons[c].position);
            
            if (ARTILLERY.controls[c].fire && cannons[c].temperature <= cannons[c].limitTemperature) {
                var loadedBullet = cannons[c].bullets[cannons[c].nextBullet];
                if (loadedBullet) {     // if the cannon has still an avalaible bullet
                    loadedBullet.fired = true;
                    loadedBullet.dateFired = Date.now();
                    cannons[c].muzzle.subtractToRef(cannons[c].position, vel);
                    vel.scaleInPlace(loadedBullet.speed);
                    loadedBullet.velocity.copyFrom(vel);
                    cannons[c].temperature += loadedBullet.heating;
                    cannons[c].nextBullet ++;
                    cannons[c].nextBullet = (cannons[c].nextBullet < cannons[c].capacity) ? cannons[c].nextBullet : -1;
                }
            } 


            cannons[c].position.subtractToRef(cannons[c].muzzle, camPos);
            camPos.multiplyInPlace(camShift);
            camPos.addInPlace(cannons[c].position);
            cameras[c].position.copyFrom(camPos);  
            cameras[c].setTarget(cannons[c].muzzle);          
        }
        
        // animate bullets
        for (var b = 0; b < bullets.length; b++) {
            var bullet = bullets[b];
            if (bullet.fired) {
                ARTILLERY.bulletBallistics(bullet, landscape.ground);
            } else {
                bullet.position.copyFrom(bullet.cannon.muzzle);
            }
        }
        
       //camera.alpha += 0.001; 
    });
    
    return scene;
};

