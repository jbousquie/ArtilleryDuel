/// <reference path='./babylon.d.ts' />
"use strict";

var ARTILLERY = ARTILLERY || {};
ARTILLERY.scenes = ARTILLERY.scenes || {};

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
    var cannon = BABYLON.MeshBuilder.CreateTube("c"+id, {path: path, radius: size / 8, tessellation: 16, cap: BABYLON.Mesh._CAP_START}, scene);
    cannon.position = position;
    cannon.rotation.x = angle;
    cannon.rotation.y = rotY;
    var cannonMat = new BABYLON.StandardMaterial("cm"+id, scene);
    cannonMat.diffuseColor = color;
    cannonMat.backFaceCulling = false;
    cannonMat.freeze();
    cannon.material = cannonMat;
    return cannon;
};

ARTILLERY.scenes["level"] = function(canvas, engine) {
    // Scene and camera
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3( .3, .5, .9);
    var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, new BABYLON.Vector3(0, 0, -0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 10, 40));
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
    var cannon1 = ARTILLERY.generateCannon("1", cannonSize, BABYLON.Color3.Blue(), pos1, -Math.PI / 5, 0, scene);
   
    x = -groundSize / 6 * Math.random() - groundSize / 10 + groundSize / 2;
    z = -groundSize / 6 * Math.random() - groundSize / 10 + groundSize / 2; 
    y = landscape.ground.getHeightAtCoordinates(x, z) + cannonSize / 2;
    var pos2 = new BABYLON.Vector3(x, y, z);
    var cannon2 = ARTILLERY.generateCannon("1", cannonSize, BABYLON.Color3.Red(), pos2, -Math.PI / 5, Math.PI, scene);    
    
    //scene.debugLayer.show();
    return scene;
};