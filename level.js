/// <reference path='./babylon.d.ts' />
"use strict";

var ARTILLERY = ARTILLERY || {};

// Artillery properties
ARTILLERY.scenes = ARTILLERY.scenes || {};
ARTILLERY.gravity = 1;
ARTILLERY.controls = [
    {up: false, down: false, left: false, right: false, fire: false}, 
    {up: false, down: false, left: false, right: false, fire: false}
];

// Artillery functions
ARTILLERY.generateLandscape = function(groundSize, sub, scene) {
    var groundTex = new BABYLON.Texture("images/ground.jpg", scene);
    groundTex.uScale = 30;
    groundTex.vScale = 30;

    // ground
    var ground = BABYLON.MeshBuilder.CreateGround("gd",{width: groundSize, height: groundSize, subdivisions: sub, updatable: true}, scene);
    var groundMat = new BABYLON.StandardMaterial("gm", scene);
    //groundMat.wireframe = true;
    groundMat.diffuseTexture = groundTex;
    groundMat.specularColor = BABYLON.Color3.Black();
    groundMat.backFaceCulling = false;
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
    cannon.caliber = caliber;       // cannon caliber
    cannon.capacity = 3;            // max load of bullets
    cannon.nextBullet = 0;          // index of next (un-fired) bullet
    cannon.bullets = [];            // bullet array
    cannon.temperature = 0;         // cannon temperature
    cannon.limitTemperature = 100;
    return cannon;
};

ARTILLERY.generateBullet = function(id, cannon, scene) {
    var bullet = BABYLON.MeshBuilder.CreateSphere(id, {segments: 4, diameter: cannon.caliber}, scene);
    bullet.material = cannon.material;
    bullet.position.copyFrom(cannon.position);
    // artillery properties
    bullet.cannon = cannon;                 // reference to the cannon it belongs to
    bullet.fired = false;                   // if the bullet is fired
    bullet.warming = 50;                    // how much the bullets warms the cannon when fired
    bullet.speed = 2;                     // bullet speed
    bullet.dateFired = 0.0;                 // timestamp on fire
    bullet.velocity = BABYLON.Vector3.Zero(); // initial velocity vector 
    cannon.bullets.push(bullet);            // load the bullet into the cannon
    return bullet;
};


ARTILLERY.bulletBalistic = function(bullet, ground) {
    
    var k = (Date.now() - bullet.dateFired) / 1000;

    bullet.position.x = k * bullet.velocity.x + bullet.cannon.position.x;        //  x = vx * t + x0
    bullet.position.z = k * bullet.velocity.z + bullet.cannon.position.z;        //  z = vz * t + z0
    bullet.position.y = -k * k * ARTILLERY.gravity * 0.5 + k * bullet.velocity.y + bullet.cannon.position.y;     // y = -g * t² / 2 + vy * t + y0
    if ( bullet.position.y <= ground.getHeightAtCoordinates(bullet.position.x, bullet.position.z) ) {
        bullet.fired = false;
        bullet.position.copyFrom(bullet.cannon.position);
        bullet.cannon.nextBullet --;
        bullet.cannon.nextBullet = (bullet.cannon.nextBullet < 0) ? 0 : bullet.cannon.nextBullet;
    } 
};

ARTILLERY.bindControls = function(controls) {
    // http://www.cambiaresearch.com/articles/15/javascript-key-codes
    window.addEventListener("keydown", function(evt) {
        // cannon1
        if (evt.keyCode === 38) { //up arrow
            controls[0].up = true;
        }
        if (evt.keyCode === 40) { //down arrow
            controls[0].down = true;
        }
        if (evt.keyCode === 37) { //left arrow
            controls[0].left = true;
        }
        if (evt.keyCode === 39) { //right arrow
            controls[0].right = true;
        }
        if (evt.keyCode === 13) { //enter
            controls[0].fire = true;
        }
        // cannon2
        if (evt.keyCode === 82) { //R
            controls[1].up = true;
        }
        if (evt.keyCode === 70) { //F
            controls[1].down = true;
        }
        if (evt.keyCode === 88) { //X
            controls[1].left = true;
        }
        if (evt.keyCode === 67) { //C
            controls[1].right = true;
        }
        if (evt.keyCode === 86) { //V
            controls[1].fire = true;
        }
    });  
    window.addEventListener("keyup", function(evt) {
        // cannon1
        if (evt.keyCode === 38) { //up arrow
            controls[0].up = false;
        }
        if (evt.keyCode === 40) { //down arrow
            controls[0].down = false;
        }
        if (evt.keyCode === 37) { //left arrow
            controls[0].left = false;
        }
        if (evt.keyCode === 39) { //right arrow
            controls[0].right = false;
        }
        if (evt.keyCode === 13) { //enter
            controls[0].fire = false;
        }
        // cannon2
        if (evt.keyCode === 82) { //R
            controls[1].up = false;
        }
        if (evt.keyCode === 70) { //F
            controls[1].down = false;
        }
        if (evt.keyCode === 88) { //X
            controls[1].left = false;
        }
        if (evt.keyCode === 67) { //C
            controls[1].right = false;
        }
        if (evt.keyCode === 86) { //V
            controls[1].fire = false;
        }
    });
};




// Level logic
ARTILLERY.scenes["level"] = function(canvas, engine) {
    // Scene and camera
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3( .3, .5, .9);
    var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, new BABYLON.Vector3(0, 0, -0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 15, 30));
    camera.attachControl(canvas, true);

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
    cannonSize = 1; 
   
    x = groundSize / 6 * Math.random() + groundSize / 10 - groundSize / 2;
    z = groundSize / 6 * Math.random() + groundSize / 10 - groundSize / 2; 
    y = landscape.ground.getHeightAtCoordinates(x, z) + cannonSize / 2;
    var pos1 = new BABYLON.Vector3(x, y, z);
    var cannon1 = ARTILLERY.generateCannon("cannon1", cannonSize, BABYLON.Color3.Blue(), pos1, -Math.PI / 5, 0, scene);
   
    x = -groundSize / 6 * Math.random() - groundSize / 10 + groundSize / 2;
    z = -groundSize / 6 * Math.random() - groundSize / 10 + groundSize / 2; 
    y = landscape.ground.getHeightAtCoordinates(x, z) + cannonSize / 2;
    var pos2 = new BABYLON.Vector3(x, y, z);
    var cannon2 = ARTILLERY.generateCannon("cannon2", cannonSize, BABYLON.Color3.Red(), pos2, -Math.PI / 5, Math.PI, scene);  
    
    var cannons = [cannon1, cannon2];  
    
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
    
    ARTILLERY.bindControls(ARTILLERY.controls);
    
    var deltaX = 0.01;
    var deltaY = 0.01;
    var coolingRate = 1;
    //scene.debugLayer.show();
    scene.registerBeforeRender(function() {

        // move cannons and fire
        for (var c = 0; c < cannons.length; c ++) {
            cannons[c].temperature -= coolingRate;
            cannons[c].temperature = (cannons[c].temperature < 0) ? 0 : cannons[c].temperature; 
            
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
            if (ARTILLERY.controls[c].fire && cannons[c].temperature <= cannons[c].limitTemperature) {
                var loadedBullet = cannons[c].bullets[cannons[c].nextBullet];
                if (loadedBullet) {     // if the cannon has still an avalaible bullet
                    loadedBullet.fired = true;
                    loadedBullet.dateFired = Date.now();
                    var vx = Math.cos(cannons[c].rotation.y) * loadedBullet.speed;
                    var vy = Math.sin(cannons[c].rotation.x) * loadedBullet.speed;
                    var vx = Math.sin(cannons[c].rotation.y) * loadedBullet.speed;
                    loadedBullet.velocity.copyFromFloats(x, y, z);
                    cannons[c].temperature += loadedBullet.warming;
                    cannons[c].nextBullet ++;
                    cannons[c].nextBullet = (cannons[c].nextBullet < cannons[c].capacity) ? cannons[c].nextBullet : -1;
                }
            }            
        }
        
        // animate bullets
        for (var b = 0; b < bullets.length; b++) {
            var bullet = bullets[b];
            if (bullet.fired) {
                ARTILLERY.bulletBalistic(bullet, landscape.ground);
            }
        }
        
       //camera.alpha += 0.001; 
    });
    
    return scene;
};

