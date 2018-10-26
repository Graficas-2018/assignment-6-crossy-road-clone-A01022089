var renderer = null,
scene = null,
camera = null,
root = null,
group = null,
orbitControls = null,
character = null, characterBox = null, characterHelper = null;
var currentTime = Date.now();


var jumpAnimator = null;

var duration = 10; // ms

var canvas = null;

var movement = null;
var treeCol = null;
var trees = [];

var carCol = null;
var cars = [];
var carsMesh = [];

function firstSection()
{
    material = new THREE.MeshPhongMaterial({ color: 0xA03f00 });
    geometry = new THREE.CubeGeometry(4, 8, 4);
    var tree = new THREE.Mesh(geometry, material);
    tree.position.set(-10,0,-10);

    // Collider
    treeCol = new THREE.Box3().setFromObject(tree);
    //var treeHelper = new THREE.BoxHelper(tree, 0x00ff00);
    trees.push(treeCol);

    scene.add(tree);
}


function secondSection()
{
  var material = new THREE.MeshPhongMaterial({ color: 0xAA0000 });
  var geometry = new THREE.CubeGeometry(8, 5, 2);
  var car = new THREE.Mesh(geometry, material);
  car.position.set(2,-2,-20);

  // Collider
  carCol = new THREE.Box3().setFromObject(car);
  var carHelper = new THREE.BoxHelper(car, 0x00ff00);

  carsMesh.push(car);
  cars.push(carCol);

  scene.add(car);
}

function moveCharacter(event)
{
    switch(event.keyCode)
    {
        case 38:
            character.position.z -= 2;
            jumpAnimator.start();
            movement = 'front';
            break;

        case 37:
            character.position.x -= 2;
            jumpAnimator.start();
            movement = 'left';
            break;

        case 39:
            character.position.x += 2;
            jumpAnimator.start();
            movement = 'right';
            break;
        case 40:
            character.position.z += 2;
            jumpAnimator.start();
            movement = 'back';
            break;
    }
}

function detectCollision()
{
    characterHelper.update();
    characterBox = new THREE.Box3().setFromObject(character);

    for (var t of trees)
    {
        if (characterBox.intersectsBox(t))
        {
            console.log('Collide with tree');

            switch(movement)
            {
                case 'front':
                        character.position.z += 2;
                        break;
                case 'left':
                        character.position.x += 2;
                        break;
                case 'right':
                        character.position.x -= 2;
                        break;
                case 'back':
                        character.position.z -= 2;
                        break;

                default:
                        break;
            }
        }
    }


    var index = 0;
    for (var c of cars)
    {
        c = new THREE.Box3().setFromObject(carsMesh[index]);
        if (characterBox.intersectsBox(c))
        {
            console.log('Collide with car');
            //scene.remove(character);
            character.position.set(0,-3,0);
            camera.position.set(0, 6, 25);

        }
        index += 1;
    }
}

function moveAnimation()
{

  jumpAnimator = new KF.KeyFrameAnimator;
  jumpAnimator.init({
      interps:
          [
            {
              keys:[0,  0.1],
                values:[
                        { y: -1 },
                        { y: -3 }
                        ],
                target:character.position
            },
        ],
      loop: false,
      duration:duration * 50,
  });
}

function run()
{
    var now = Date.now();
    var deltat = now - currentTime
    currentTime = now;

    requestAnimationFrame(function() { run(); });

    // Render the scene
    renderer.render( scene, camera );

    // Collider detection
    detectCollision();

    // Update the animations
    KF.update();

    // Update the camera controller
    orbitControls.update();

    for (var c of carsMesh)
    {
      c.position.x += 0.05 * deltat;
      if( c.position.x > 100)
      {
        c.position.x -= 200;
      }
    }


}

function setLightColor(light, r, g, b)
{
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
}

var directionalLight = null;
var spotLight = null;
var ambientLight = null;
var mapUrl = "../images/checker_large.gif";

var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

function createScene(canvas)
{

    this.canvas = canvas;

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 5000 );
    camera.position.set(0, 6, 25);
    scene.add(camera);

    orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    ambientLight = new THREE.AmbientLight ( 0xCCCCCC );
    root.add(ambientLight);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;


    //character
    var textureMap = new THREE.TextureLoader().load("../images/companionCube.png");
    var material = new THREE.MeshPhongMaterial({ map: textureMap });
    geometry = new THREE.CubeGeometry(2, 2, 2);
    character = new THREE.Mesh(geometry, material);
    character.position.set(0,-3,0);

    characterHelper =new THREE.BoxHelper(character, 0x00ff00);

    scene.add(character);
    //group.add(characterHelper);

    firstSection();
    secondSection();

    // Create the animations
    moveAnimation();

    // Now add the group to our scene
    scene.add( root );
}
