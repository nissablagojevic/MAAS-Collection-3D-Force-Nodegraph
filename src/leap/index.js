import Leap from 'leapjs';

export function initLeapControls() {
  Leap.loop(function(frame){
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
      console.log(hand);
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
}