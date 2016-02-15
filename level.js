var scenes = scenes || {};
scenes["level"] = function(canvas, engine) {
    // Scene and camera
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3( .4, .5, .8);
    var camera = new BABYLON.ArcRotateCamera("camera1",  0, 0, 0, new BABYLON.Vector3(0, 0, -0), scene);
    camera.setPosition(new BABYLON.Vector3(0, 5, -20));
    camera.attachControl(canvas, true);

    // Lights
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    light.intensity = 0.8;
    
    var groundTex = new BABYLON.Texture("images/grass.jpg", scene);

    // ground
    var pathNb = 50;
    var w = 60;
    var paths = [];
    var j = -pathNb / 2;
    for (var p = 0; p < pathNb; p++) {
        var path = [];   
        for (var i = -w / 2; i < w / 2; i++) {
            path.push(new BABYLON.Vector3(i, 0, j));
        }
        j++
        paths.push(path);
    }
    var ground = BABYLON.MeshBuilder.CreateRibbon("gd",{pathArray: paths, sideOrientation: BABYLON.Mesh.BACKSIDE, updatable: true}, scene);
    var groundMat = new BABYLON.StandardMaterial("gm", scene);
    //groundMat.wireframe = true;
    ground.material = groundMat;
 
 
    return scene;
};