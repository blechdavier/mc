const scene = new THREE.Scene();
//scene.fog = new THREE.FogExp2(0x4ac5be, 0.001);
scene.background = new THREE.Color( 0x4ac5be );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );


const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(window.devicePixelRatio || 1);
document.body.appendChild( renderer.domElement );

//chunk management
var PlayerChunkX = 0;
var PlayerChunkZ = 0;
var PrevChunkX = null;
var PrevChunkZ = null;
const chunks = [];
const loadedChunks = [];
const geometries = [];
var chunkpattern = [];

const CHUNK_WIDTH = 32;
const CHUNK_HEIGHT = 64;

var renderDistance = 8;
scene.fog = new THREE.Fog(0x4ac5be, renderDistance*CHUNK_WIDTH/2, renderDistance*CHUNK_WIDTH)
generateChunkPattern(renderDistance);

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
    PlayerChunkX = Math.floor((camera.position.x-8)/CHUNK_WIDTH);
    PlayerChunkZ = Math.floor((camera.position.z-8)/CHUNK_WIDTH);

    if(PlayerChunkX !== PrevChunkX || PlayerChunkZ !== PrevChunkZ) {
        for(let i = 0; i<loadedChunks.length; i++) {
            if(-1 != chunkpattern.findIndex(el => el[0]==loadedChunks[i][0] && el[1]==loadedChunks[i][1])) {
                // scene.remove( chunks[i] );
                // loadedChunks.splice(i, 1);
                // chunks.splice(i, 1);
                // geometries.splice(i, 1);
                // i--;
            }
        }
        addChunksToQueue();
    }

    requestAnimationFrame( animate );
    renderer.render( scene, camera );

    PrevChunkX = PlayerChunkX;
    PrevChunkZ = PlayerChunkZ;

};

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
    for(let i = 0; i<chunkpattern.length; i++) {
        chunkX = chunkpattern[i][0]+PlayerChunkX;
        chunkZ = chunkpattern[i][1]+PlayerChunkZ;
        //console.log(loadedChunks.findIndex(el => el[0]==0 && el[1]==0))
        if(-1==loadedChunks.findIndex(el => el[0]==chunkX && el[1]==chunkZ)) { // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
            workers[activeWorker].postMessage([61, chunkX, chunkZ]);
            activeWorker++;
            if(activeWorker=workers.length) {
                activeWorker = 0;
            }
            //console.log([chunkX, chunkZ]);
            loadedChunks.push(([chunkX, chunkZ]))
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

function distsquared(x1, y1, x2, y2) {
    a = x1-x2;
    b = y1-y2;
    return(a*a+b*b);
}

function generateChunkPattern(dist) {
    distances = [];
    for(let i = -dist; i<dist+1; i++) {
        for(let j = -dist; j<dist+1; j++) {
            chunkdist = distsquared(i, j, 0, 0);
            if(chunkdist<=dist*dist) {
                let k = 0;
                for(k = 0; k<distances.length; k++) {
                    if(chunkdist<distances[k])
                        break;
                }
                distances.splice(k, 0, chunkdist);
                chunkpattern.splice(k, 0, [i, j]);
            }
        }
    }
    // console.log(chunkpattern)
    distances = undefined;//possibly saves memory but not sure
}




animate();