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

ARTILLERY.bindCannonControls = function(controls) {
    // http://www.cambiaresearch.com/articles/15/javascript-key-codes
    window.addEventListener("keydown", function(evt) {
        // cannon1
        if (evt.keyCode === 104) { //numpad up arrow
            controls[0].up = true;
        }
        if (evt.keyCode === 98) { //numpad down arrow
            controls[0].down = true;
        }
        if (evt.keyCode === 100) { //numpad left arrow
            controls[0].left = true;
        }
        if (evt.keyCode === 102) { //numpad right arrow
            controls[0].right = true;
        }
        if (evt.keyCode === 13) { //enter
            controls[0].fire = true;
        }
        // cannon2
        if (evt.keyCode === 90 || evt.keyCode == 87) { //Z or W
            controls[1].up = true;
        }
        if (evt.keyCode === 88) { //S
            controls[1].down = true;
        }
        if (evt.keyCode === 65 || evt.keyCode == 81) { //A or Q
            controls[1].left = true;
        }
        if (evt.keyCode === 68) { //D
            controls[1].right = true;
        }
        if (evt.keyCode === 16) { //SHIFT
            controls[1].fire = true;
        }
    });  
    window.addEventListener("keyup", function(evt) {
        // cannon1
        if (evt.keyCode === 104) { //numpad up arrow
            controls[0].up = false;
        }
        if (evt.keyCode === 98) { //numpad down arrow
            controls[0].down = false;
        }
        if (evt.keyCode === 100) { //numpad left arrow
            controls[0].left = false;
        }
        if (evt.keyCode === 102) { //numpad right arrow
            controls[0].right = false;
        }
        if (evt.keyCode === 13) { //numpad enter
            controls[0].fire = false;
        }
        // cannon2
        if (evt.keyCode === 90 || evt.keyCode == 87) { //Z or W
            controls[1].up = false;
        }
        if (evt.keyCode === 88) { //S
            controls[1].down = false;
        }
        if (evt.keyCode === 65 || evt.keyCode == 81) { //A or Q
            controls[1].left = false;
        }
        if (evt.keyCode === 68) { //D
            controls[1].right = false;
        }
        if (evt.keyCode === 16) { //SHIFT
            controls[1].fire = false;
        }
    });
};