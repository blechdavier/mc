const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xffffff, 0.001);

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const chunks = [];
const geometries = [];

const CHUNK_WIDTH = 16;
const CHUNK_HEIGHT = 64;


console.log("Asdfasdf");
//textures
const texture = new THREE.TextureLoader().load( "textures/txtr.png" );
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.NearestFilter;
texture.flipY = false;
const alphamap = new THREE.TextureLoader().load( "textures/alphamap.png" );
alphamap.magFilter = THREE.NearestFilter;
alphamap.minFilter = THREE.NearestFilter;
alphamap.flipY = false;
const material = new THREE.MeshBasicMaterial( { map: texture, alphaMap: alphamap, transparent: true, side:THREE.FrontSide} );

//lighting
const ambientlight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambientlight );
const sunlight = new THREE.DirectionalLight(0xffffff, 1);
sunlight.position.set(500, 1000, 200);
sunlight.target.position.set(-500, -1000, -200);
scene.add(sunlight);
scene.add(sunlight.target);

camera.position.set(256, 128, 800);

logicalProcessors = window.navigator.hardwareConcurrency;
console.log(logicalProcessors);


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

    // Hook up to the onMessage event, so you can receive messages
    // from the worker.
    for(let i = 0; i<32; i++) {
        for(let j = 0; j<32; j++) {
            workers[activeWorker].postMessage([59, i, j]);
            activeWorker++;
            if(activeWorker=workers.length) {
                activeWorker = 0;
            }
        }
    }
    //worker.postMessage([60, 100, 100]);
}

function animate() {
    
    requestAnimationFrame( animate );

    renderer.render( scene, camera );

};

animate();

function receivedWorkerMessage(event) {

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
    scene.add(chunks[chunks.length-1]);
    chunks[chunks.length-1].position.set(event.data[4]*CHUNK_WIDTH, 0, event.data[5]*CHUNK_WIDTH);
}

//use BufferGeometry.dispose();