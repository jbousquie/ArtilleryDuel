"use strict";

var ARTILLERY = ARTILLERY || {};

ARTILLERY.init = function() {
  var canvas = document.querySelector('#renderCanvas');
  var engine = new BABYLON.Engine(canvas, true);
  var createScene = ARTILLERY.scenes["level"];
  var scene = createScene(canvas, engine);
  window.addEventListener("resize", function() {
    engine.resize();
  });

  // Start render loop
  engine.runRenderLoop(function(){
    scene.render();
  });
};
