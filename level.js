var scenes = scenes || {};
scenes["level"] = function(canvas, engine) {
    // Scene and camera
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3( .3, .5, .9);
    var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, new BABYLON.Vector3(0, 0, -0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 5, -20));
    camera.attachControl(canvas, true);

    // Lights
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    light.intensity = 0.8;
    
    var groundTex = new BABYLON.Texture("images/ground.jpg", scene);
    groundTex.uScale = 30;
    groundTex.vScale = 30;

    // ground
    var groundSize = 40;
    var sub = 60;
    var ground = BABYLON.MeshBuilder.CreateGround("gd",{width: groundSize, height: groundSize, subdivisions: sub, updatable: true}, scene);
    var groundMat = new BABYLON.StandardMaterial("gm", scene);
    groundMat.wireframe = true;
    groundMat.diffuseTexture = groundTex;
    groundMat.specularColor = BABYLON.Color3.Black();
    ground.material = groundMat;
    
    var perlinSize = sub * groundSize;
    var perlinOptions = {octaveCount: 4, amplitude: 0.6, persistence: 0.3};
    var perlin = generatePerlinNoise(perlinSize, perlinSize, perlinOptions);
    var amp = 2;                    // hill amplitude
    var wave = perlinSize / 1.5;    // wave number
    var waveHeight = 2.5;           // wave amplitude
    var start = -Math.PI / 2;       // start angle (sin)
    var perlinGround = function(positions) {
        for (var idx = 0; idx < positions.length; idx +=3) {
            positions[idx + 1] = perlin[idx] * amp + Math.sin(idx / wave + start) * waveHeight;
        }  
    };
    ground.updateMeshPositions(perlinGround);
    ground.updateCoordinateHeights();
 
 
    return scene;
};