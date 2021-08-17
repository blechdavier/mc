const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x4ac5be, 0.003);
scene.background = new THREE.Color( 0x4ac5be );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const chunks = [];
const loadedChunks = [];
const geometries = [];

var renderDistance = 16;

const CHUNK_WIDTH = 32;
const CHUNK_HEIGHT = 64;

//mouse controls
var mousex = 0;
var mousey = 0;
var isdragging = false;
var dragstartx = 0;
var dragstarty = 0;
var camdragstartx = 0;
var camdragstarty = 0;
const sens = -0.008;

//keyboard input
var keys = [];
var cameraVel = [0, 0, 0];

const testArray = ["-1,1"];
const testString = "-1,1";

//textures
const texture = new THREE.TextureLoader().load( "textures/txtr.png" );
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.flipY = false;
const alphamap = new THREE.TextureLoader().load( "textures/alphamap.png" );
alphamap.magFilter = THREE.NearestFilter;
alphamap.minFilter = THREE.NearestFilter;
alphamap.flipY = false;
const material = new THREE.MeshBasicMaterial( {map: texture, side:THREE.FrontSide} );
const transparentmaterial = new THREE.MeshBasicMaterial( {map: texture, alphaMap: alphamap, transparent: true, side:THREE.DoubleSide} );

//lighting
const ambientlight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientlight );
const sunlight = new THREE.DirectionalLight(0xffffff, 1);
sunlight.position.set(500, 1000, 200);
sunlight.target.position.set(-500, -1000, -200);
scene.add(sunlight);
scene.add(sunlight.target);

camera.position.set(16, 20, 64);
//camera.rotation.x-=90*Math.PI/180;
// camera.rotation.z-=45*Math.PI/180;

logicalProcessors = window.navigator.hardwareConcurrency;

var startTime = Date.now();
var frames = 0;

if(logicalProcessors<2) {
    console.error("2 cpu cores required");
}
else {
    // Create the workers.
    var workers = [];
    for(let i = 0; i<logicalProcessors-1; i++) {
        workers.push(new Worker("worker.js"));
        workers[i].onmessage = receivedWorkerMessage;
    }
    activeWorker = 0;

}

function animate() {

    moveCamera();
    addChunksToQueue();
    requestAnimationFrame( animate );
    renderer.render( scene, camera );

};

animate();

function receivedWorkerMessage(event) {

    //add the solid chunk geometry
    geometries.push(new THREE.BufferGeometry());
    const positionNumComponents = 3;
    const normalNumComponents = 3;
    const uvNumComponents = 2;
      geometries[geometries.length-1].setAttribute(
          'position',
          new THREE.BufferAttribute(new Float32Array(event.data[0]), positionNumComponents));
      geometries[geometries.length-1].setAttribute(
          'normal',
          new THREE.BufferAttribute(new Float32Array(event.data[1]), normalNumComponents));
      geometries[geometries.length-1].setAttribute(
          'uv',
          new THREE.BufferAttribute(new Float32Array(event.data[2]), uvNumComponents));
      geometries[geometries.length-1].setIndex(event.data[3]);
      //const material = new THREE.MeshPhongMaterial( {color:'rgb(255,0,0)'} );
      chunks.push(new THREE.Mesh( geometries[geometries.length-1], material ));
      //chunks[chunks.length-1].position.setX(0);
      chunks[chunks.length-1].name = event.data[4]+","+event.data[5]+"opaque";
      scene.add(chunks[chunks.length-1]);
      chunks[chunks.length-1].position.set(event.data[4]*CHUNK_WIDTH, 0, event.data[5]*CHUNK_WIDTH);

      geometries.push(new THREE.BufferGeometry());
    geometries[geometries.length-1].setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(event.data[6]), positionNumComponents));
    geometries[geometries.length-1].setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(event.data[7]), normalNumComponents));
    geometries[geometries.length-1].setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(event.data[8]), uvNumComponents));
    geometries[geometries.length-1].setIndex(event.data[9]);
    //const material = new THREE.MeshPhongMaterial( {color:'rgb(255,0,0)'} );
    chunks.push(new THREE.Mesh( geometries[geometries.length-1], transparentmaterial ));
    //chunks[chunks.length-1].position.setX(0);
    chunks[chunks.length-1].name = event.data[4]+","+event.data[5]+"transparent";
    scene.add(chunks[chunks.length-1]);
    chunks[chunks.length-1].position.set(event.data[4]*CHUNK_WIDTH, 0, event.data[5]*CHUNK_WIDTH);
}


function addChunksToQueue() {
    for(let i = Math.floor(camera.position.x/CHUNK_WIDTH-renderDistance); i<Math.ceil(camera.position.x/CHUNK_WIDTH+renderDistance); i++) {
        for(let j = Math.floor(camera.position.z/CHUNK_WIDTH-renderDistance); j<Math.ceil(camera.position.z/CHUNK_WIDTH+renderDistance); j++) {
            if(!loadedChunks.includes(i*10000+j)) { 
                workers[activeWorker].postMessage([61, i, j]);
                activeWorker++;
                if(activeWorker=workers.length) {
                    activeWorker = 0;
                }
                loadedChunks.push(i*10000+j)
            }
        }
    }
}

//use BufferGeometry.dispose();

//mouse moving, update mousex and mousey variables
document.addEventListener('mousemove', function(event) {
    mousex = event.clientX;
    mousey = event.clientY;
    if(isdragging) {
        camera.rotation.x = sens * (mousey-dragstarty)+camdragstarty;
        camera.rotation.y = sens * (mousex-dragstartx)+camdragstartx;
        camera.rotation.order = "ZYX";
    }
});

//mouse pressed down, set isDragging to true
document.addEventListener('mousedown', function(event) {
    isdragging = true;
    dragstartx = mousex;
    dragstarty = mousey;
    camdragstartx = camera.rotation.y;
    camdragstarty = camera.rotation.x;
});

//mouse released, set isDragging to false
document.addEventListener('mouseup', function(event) {
    isdragging = false;
});

document.addEventListener('keydown', function(event) {
    keys[event.keyCode] = true;
});

document.addEventListener('keyup', function(event) {
    keys[event.keyCode] = false;
});

function moveCamera() {
    const speed = 0.1;
    //forward
    if(keys[87] || keys[38]) {
        cameraVel[0] -= Math.sin(camera.rotation.y) * speed;
        cameraVel[1] += Math.sin(camera.rotation.x) * speed;
        cameraVel[2] -= Math.cos(camera.rotation.y) * speed;
    }
    //backward
    if(keys[83] || keys[40]) {
        cameraVel[0] += Math.sin(camera.rotation.y) * speed;
        cameraVel[1] -= Math.sin(camera.rotation.x) * speed;
        cameraVel[2] += Math.cos(camera.rotation.y) * speed;
    }
    //right
    if(keys[68] || keys[39]) {
        cameraVel[0] += Math.cos(camera.rotation.y) * speed;
        cameraVel[2] -= Math.sin(camera.rotation.y) * speed;
    }
    //left
    if(keys[65] || keys[37]) {
        cameraVel[0] -= Math.cos(camera.rotation.y) * speed;
        cameraVel[2] += Math.sin(camera.rotation.y) * speed;
    }
    //up
    if(keys[32]) {
        cameraVel[1] += speed*0.5;
    }
    //down
    if(keys[16]) {
        cameraVel[1] -= speed*0.3;
    }
    const drag = 0.9;
    cameraVel[0] *= drag;
    cameraVel[1] *= drag;
    cameraVel[2] *= drag;
    camera.position.x += cameraVel[0];
    camera.position.y += cameraVel[1];
    camera.position.z += cameraVel[2];
}