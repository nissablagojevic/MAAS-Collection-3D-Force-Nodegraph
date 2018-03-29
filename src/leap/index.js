import Leap from 'leapjs';
import debounce from 'lodash/debounce';

export function initLeapControls() {
  window.controller = Leap.loop({enableGestures:true},function(frame){
    var handIds = {};
    if (frame.hands === undefined ) {
      var handsLength = 0
    } else {
      var handsLength = frame.hands.length;
    }

    for (var handId = 0, handCount = handsLength; handId != handCount; handId++) {
      var hand = frame.hands[handId];
      var posX = (hand.palmPosition[0]*3);
      var posY = (hand.palmPosition[2]*3)-200;
      var posZ = (hand.palmPosition[1]*3)-400;
      var rotX = (hand._rotation[2]*90);
      var rotY = (hand._rotation[1]*90);
      var rotZ = (hand._rotation[0]*90);
      //console.log(hand);
      /**var sphere = spheres[hand.id];
       if (!sphere) {
            var sphereDiv = document.getElementById("sphere").cloneNode(true);
            sphereDiv.setAttribute('id',hand.id);
            sphereDiv.style.backgroundColor='#'+Math.floor(Math.random()*16777215).toString(16);
            document.getElementById('scene').appendChild(sphereDiv);
            spheres[hand.id] = hand.id;
          } else {
            var sphereDiv =  document.getElementById(hand.id);
            if (typeof(sphereDiv) != 'undefined' && sphereDiv != null) {
              moveSphere(sphereDiv, posX, posY, posZ, rotX, rotY, rotZ);
            }
          }**/
      handIds[hand.id] = true;
    }
  });

  //var swiper = window.controller.gesture('swipe');
  //swiper.update((g) => swipe(g));
  window.controller.connect();
}

export function swipe(gesture, action = null) {
  var cooloff = 300;
  var tolerance = 50;
  var x = -2, y = -2;

  //debounce throttles responses for us
  var slider = debounce(function(xDir, yDir) {
    x += xDir;
    y += yDir;
    console.log("x:"+xDir);
    console.log("y:"+yDir);
  }, cooloff);

  //determine direction
  if (Math.abs(gesture.translation()[0]) > tolerance || Math.abs(gesture.translation()[1]) > tolerance) {
    var xDir = Math.abs(gesture.translation()[0]) > tolerance ? (gesture.translation()[0] > 0 ? -1 : 1) : 0;
    var yDir = Math.abs(gesture.translation()[1]) > tolerance ? (gesture.translation()[1] < 0 ? -1 : 1) : 0;
    slider(xDir, yDir);
  }
}