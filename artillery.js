"use strict";

var init = function() {
  var canvas = document.querySelector('#renderCanvas');
  var engine = new BABYLON.Engine(canvas, true);
  var createScene = scenes["level"];
  var scene = createScene(canvas, engine);
  window.addEventListener("resize", function() {
    engine.resize();
  });


  engine.runRenderLoop(function(){
    scene.render();
  });
};
