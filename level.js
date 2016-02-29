/// <reference path='./babylon.d.ts' />
"use strict";

var ARTILLERY = ARTILLERY || {};

// Artillery properties
ARTILLERY.scenes = ARTILLERY.scenes || {};
ARTILLERY.gravity = 9.81;
ARTILLERY.airFriction = 0.997;


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
    
    // populate the perlin array with perlin noise
    var perlinSize = (sub + 1) * (sub + 1);
    var perlinOptions = {octaveCount: 4, amplitude: 0.6, persistence: 0.3};
    var perlin = generatePerlinNoise(perlinSize, perlinSize, perlinOptions);

    // the following parameters might change each level
    // might also something else than sinus curves : x², etc
    var amp = 2;                    // hill amplitude
    var wave = perlinSize / 1.5;    // wave number
    var waveHeight = 2.5;           // wave amplitude
    var start = -Math.PI / 2;       // start angle (sin)
    var perlinGround = function(positions) {
        var last = positions.length / 3 - 1;
        for (var idx = 0; idx < positions.length; idx +=3) {
            var e = idx / 3;
            var y = perlin[idx] * amp + Math.sin(idx / wave + start) * waveHeight;
            positions[idx + 1] = y
        }  
    };

    // apply the perlin noise to the ground and update the ground altitudes
    ground.updateMeshPositions(perlinGround);
    ground.updateCoordinateHeights();

    var landscape = {ground: ground};
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
    //cannonMat.freeze();
    cannon.material = cannonMat;
    // artillery properties
    cannon.size = size;                         // cannon size
    cannon.end = path[1];                       // cannon end point
    cannon.muzzle = BABYLON.Vector3.Zero();     // muzzzle world coordinates
    cannon.caliber = caliber;                   // cannon caliber
    cannon.bulletColor = color;                 // cannon bullet color
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
    bullet.caliber = cannon.caliber;
    bullet.cannon = cannon;                 // reference to the cannon it belongs to
    bullet.fired = false;                   // if the bullet is fired
    bullet.blowing = false;                 // if the bullet is exploding
    bullet.heating = 70;                    // how much the bullets warms the cannon when fired
    bullet.speed = 30;                      // bullet speed
    bullet.fragments = 60;                  // how many fragments when explode
    bullet.fragmentColor = cannon.bulletColor;
    bullet.dateFired = 0.0;                 // timestamp on fire
    bullet.dateBoom = 0.0;                  // timestamp on explode
    bullet.velocity = BABYLON.Vector3.Zero(); // initial velocity vector 
    bullet.explosion = ARTILLERY.generateExplosion(bullet, scene); 
    cannon.bullets.push(bullet);            // load the bullet into the cannon
    return bullet;
};

ARTILLERY.generateExplosion = function(bullet, scene) {
    var sps = new BABYLON.SolidParticleSystem("boom"+bullet.id, scene);
    var model = BABYLON.MeshBuilder.CreatePolyhedron('p', {}, scene);
    sps.addShape(model, bullet.fragments);
    model.dispose();
    sps.buildMesh();
    sps.mesh.isVisible = false;
    sps.mesh.hasVertexAlpha = true;
    // scale initially the particles to zero and initialize their color
    for (var i = 0; i < sps.nbParticles; i++) {
        var p = sps.particles[i];
        p.scale.x = 0;
        p.scale.y = 0;
        p.scale.z = 0;
        p.color.r = bullet.fragmentColor.r;
        p.color.g = bullet.fragmentColor.g;
        p.color.b = bullet.fragmentColor.b;
        p.color.r = 1.0;
     }
    sps.setParticles();
    sps.computeBoundingBox = true;
    sps.bullet = bullet;                    //reference to the bullet
    
    // explosion logic
    sps.counter = 0;
    sps.vars.minY = 0.0;
    sps.vars.t = 0.0;
    sps.vars.pWorld = BABYLON.Vector3.Zero();   // particle world position
    sps.updateParticle = function(p) {   
        // return cases
        if (!p.alive || !sps.bullet.blowing) {
            return; 
        }

        // compute ground altitude and check for collision
        p.position.addToRef(sps.mesh.position, sps.vars.pWorld);
        if (p.position.x < ARTILLERY.ground._minX + ARTILLERY.ground.position.x) {
            p.position.x = ARTILLERY.ground._minX + ARTILLERY.ground.position.x;
        } else if  (p.position.x > ARTILLERY.ground._maxX + ARTILLERY.ground.position.x) {
            p.position.x = ARTILLERY.ground._maxX + ARTILLERY.ground.position.x;
        }    
        if (p.position.z < ARTILLERY.ground._minZ + ARTILLERY.ground.position.z) {
            p.position.z = ARTILLERY.ground._minZ + ARTILLERY.ground.position.z;
        } else if  (p.position.z > ARTILLERY.ground._maxZ + ARTILLERY.ground.position.z) {
            p.position.x = ARTILLERY.ground._maxX + ARTILLERY.ground.position.z;
        }
        sps.vars.minY = ARTILLERY.ground.getHeightAtCoordinates(sps.vars.pWorld.x, sps.vars.pWorld.z);

        if (sps.vars.pWorld.y <= sps.vars.minY) {
            p.velocity.y = 0;
            p.position.y = sps.vars.minY - sps.mesh.position.y;
            p.color.a = (p.color.a < 0) ? 0 : p.color.a - 0.03;
            if (p.color.a == 0) {
                p.alive = false;
                sps.counter ++;
            }
            //sps.counter ++;
            if (sps.counter == sps.nbParticles ) {
                sps.counter = 0;
                sps.mesh.isVisible = false;
                sps.bullet.blowing = false;
            }
        }
        else {
            p.velocity.scaleInPlace(ARTILLERY.airFriction);
            p.position.x = sps.vars.t * p.velocity.x;
            p.position.z = sps.vars.t * p.velocity.z;
            p.position.y = -sps.vars.t * sps.vars.t * ARTILLERY.gravity * 0.5 + sps.vars.t * p.velocity.y;
            p.rotation.x += p.velocity.z * p.deltaRot;
            p.rotation.y += p.velocity.x * p.deltaRot;
            p.rotation.z += p.velocity.y * p.deltaRot;
        }  
    };
    
    return sps;
};

ARTILLERY.bulletBallistics = function(bullet, ground) {
    
    // move bullet    
    var t = (Date.now() - bullet.dateFired) / 1000;
    bullet.velocity.scaleInPlace(ARTILLERY.airFriction);
    bullet.position.x = t * bullet.velocity.x + bullet.cannon.muzzle.x;        //  x = vx * t + x0
    bullet.position.z = t * bullet.velocity.z + bullet.cannon.muzzle.z;        //  z = vz * t + z0
    bullet.position.y = -t * t * ARTILLERY.gravity * 0.5 + t * bullet.velocity.y + bullet.cannon.muzzle.y;     // y = -g * t² / 2 + vy * t + y0
    
    // ground collision test
    var y = ground.getHeightAtCoordinates(bullet.position.x, bullet.position.z);
    if ( bullet.position.y <= y ) {
        // trigger an explosion
        bullet.blowing = true;
        ARTILLERY.explose(bullet, y);    
        // recycle bullet : reload the cannon
        bullet.fired = false;
        bullet.position.copyFrom(bullet.cannon.position);
        bullet.cannon.nextBullet --;
        bullet.cannon.nextBullet = (bullet.cannon.nextBullet < 0) ? 0 : bullet.cannon.nextBullet;
    } 
};


ARTILLERY.explose = function(bullet, y) {

    // turn the sps visible and locate it at bullet impact
    bullet.explosion.mesh.isVisible = true;
    bullet.explosion.mesh.position.x = bullet.position.x;
    bullet.explosion.mesh.position.z = bullet.position.z;
    bullet.explosion.mesh.position.y = y;
    bullet.dateBoom = Date.now();

    // fragment initial sizes, velocities and rotations
    var boom = bullet.explosion.particles;
    for (var p = 0; p < bullet.explosion.nbParticles; p++) {
        boom[p].alive = true;
        boom[p].position.x = 0;
        boom[p].position.y = 0;
        boom[p].position.z = 0;
        boom[p].velocity.x = (0.5 - Math.random()) * 4;
        boom[p].velocity.z = (0.5 - Math.random()) * 4;
        boom[p].velocity.y = Math.random() * 8 + 2;
        boom[p].rotation.x = 2 * Math.PI * Math.random();
        boom[p].rotation.y = 2 * Math.PI * Math.random();
        boom[p].rotation.z = 2 * Math.PI * Math.random();
        boom[p].deltaRot = Math.random() / 20;
        var scl = Math.random() * bullet.caliber / 2;
        boom[p].scale.x = scl;
        boom[p].scale.y = scl;
        boom[p].scale.z = scl;
        boom[p].color.a = 1.0;
    }
    
    // dig thr ground
    ARTILLERY.impactGround(bullet.position.x, bullet.position.z);
};

// adapted from : https://github.com/BabylonJS/Babylon.js/blob/master/src/Mesh/babylon.groundMesh.ts#L104
ARTILLERY.impactGround = function(x, z) {
    // set x and z in ground local system
    var gd = ARTILLERY.ground;
    x -= gd.position.x;
    z -= gd.position.z;
    var col = Math.floor((x + gd._maxX) * gd.subdivisions / gd._width);
    var row = Math.floor(-(z + gd._maxZ) * gd.subdivisions / gd._height + gd.subdivisions);

    var i = row * (gd._subdivisions + 1) + col;
    var y1 = i * 3 + 1;
    var y2 = (i + 1) * 3 + 1;
    var y3 = (i + gd._subdivisions + 1) * 3 + 1;
    var quad = gd._heightQuads[row * gd.subdivisions + col];
    if (z >= quad.slope.x * x + quad.slope.y) {
        y1 = (i + 1 + gd.subdivisions + 1) * 3 + 1;
    }
    var changeAltitude = function(positions) {
        positions[y1] -= 0.05;
        positions[y2] -= 0.05;
        positions[y3] -= 0.05;
    }
    gd.updateMeshPositions(changeAltitude);
    gd.updateCoordinateHeights();
};


// Level logic
ARTILLERY.scenes["level"] = function(canvas, engine) {
    // Scene and cameras
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3( .3, .5, .9);
    
    // fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogDensity = 0.02;
    scene.fogColor = new BABYLON.Color3(0.7, 0.7, 0.65);
    
    var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, BABYLON.Vector3.Zero(), scene);
    camera.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1);
    camera.setPosition(new BABYLON.Vector3(0, 8, 20));
    camera.attachControl(canvas, true);
    /*
    camera.keysDown = null;
    camera.keysLeft = null;
    camera.keysRight = null;
    camera.keysUp = null;
    */
    
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
    ARTILLERY.ground = landscape.ground;
    
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
            var bullet = ARTILLERY.generateBullet(bNb.toString(), cannon, scene);
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
            
            // cannon fire
            if (ARTILLERY.controls[c].fire && cannons[c].temperature < cannons[c].limitTemperature) {
                var loadedBullet = cannons[c].bullets[cannons[c].nextBullet]; // get the next avalaible bullet if any
                if (loadedBullet) {     
                    loadedBullet.fired = true;
                    loadedBullet.dateFired = Date.now();
                    // compute bullet initial velocity vector from cannon direction
                    cannons[c].muzzle.subtractToRef(cannons[c].position, vel);
                    vel.scaleInPlace(loadedBullet.speed);
                    loadedBullet.velocity.copyFrom(vel);
                    // update cannon temperature and next bullet index
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
            if (bullet.blowing) {
                bullet.explosion.vars.t = (Date.now() - bullet.dateBoom) / 1000;        // update bullet time delta
                bullet.explosion.setParticles();
            } else if (bullet.fired) {
                ARTILLERY.bulletBallistics(bullet, landscape.ground);
            } else {
                bullet.position.copyFrom(bullet.cannon.position);
            }
        }
        
       //camera.alpha += 0.001; 
    });
    
    return scene;
};

