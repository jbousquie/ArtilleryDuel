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
    var pathNb = 50;
    var w = 60;
    var paths = [];
    var j = -pathNb / 2;
    for (var p = 0; p < pathNb; p++) {
        var path = []; 
        var y = 0;  
        for (var i = -w / 2; i < w / 2; i++) {
            y = Math.sin((i * j) / 100) * Math.random() * Math.cos(i / 5) * 4;
            path.push(new BABYLON.Vector3(i, y, j));
        }
        j++
        paths.push(path);
    }
    var ground = BABYLON.MeshBuilder.CreateRibbon("gd",{pathArray: paths, sideOrientation: BABYLON.Mesh.BACKSIDE, updatable: true}, scene);
    var groundMat = new BABYLON.StandardMaterial("gm", scene);
    //groundMat.wireframe = true;
    groundMat.diffuseTexture = groundTex;
    ground.material = groundMat;
 
 
    return scene;
};