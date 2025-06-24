import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { RGBShiftShader } from 'three/examples/jsm/shaders/RGBShiftShader.js'
import gsap from "gsap"
import { TextureLoader } from 'three'
let model;
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
// const cube = new THREE.Mesh(geometry, material)
// scene.add(cube)
camera.position.z = 3

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 10); // Maximum intensity
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(7, 10, 50);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector("#canvas"),
  antialias: true,
  alpha: true,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

const controls= new OrbitControls(camera, renderer.domElement);
controls.enableDamping= true

// Instead, just load the GLTF model directly:
const loader = new GLTFLoader();
loader.load(
  "/DamagedHelmet.gltf",
  function (gltf) {
    model = gltf.scene;
    scene.add(model);
    // Make all meshes metallic and reflective with the cubemap
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.transparent = false;
        child.material.opacity = 1;
        child.material.metalness = 1;
        child.material.roughness = 0;
        child.material.envMap = envMap;
        child.material.envMapIntensity = 3.5;
        child.material.needsUpdate = true;
      }
    });
  },
  undefined,
  function (error) {
    console.error('An error happened while loading the GLTF model:', error);
  }
);

// --- Load CubeTexture for environment reflections ---
const cubeTextureLoader = new THREE.CubeTextureLoader();
const envMap = cubeTextureLoader.load([
  '/cubemap/px.jpg', // right
  '/cubemap/nx.jpg', // left
  '/cubemap/py.jpg', // top
  '/cubemap/ny.jpg', // bottom
  '/cubemap/pz.jpg', // front
  '/cubemap/nz.jpg', // back
]);
scene.environment = envMap;
scene.background = envMap;

// --- Skybox Cube Parallax Effect ---
const skyboxTexture = new THREE.TextureLoader().load('https://cdn.polyhaven.com/asset_img/primary/pond_bridge_night.png?height=760');
const materials = [
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide }), // right
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide }), // left
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide }), // top
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide }), // bottom
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide }), // front
  new THREE.MeshBasicMaterial({ map: skyboxTexture, side: THREE.BackSide }), // back
];
const skyboxGeometry = new THREE.BoxGeometry(100, 100, 100);
const skybox = new THREE.Mesh(skyboxGeometry, materials);
scene.add(skybox);

// Parallax effect: rotate skybox based on mouse movement
let targetRotation = { x: 0, y: 0 };
window.addEventListener('mousemove', (event) => {
  const x = (event.clientX / window.innerWidth) * 2 - 1;
  const y = (event.clientY / window.innerHeight) * 2 - 1;
  targetRotation.y = x * 0.2; // adjust multiplier for effect strength
  targetRotation.x = y * 0.2;
});

// --- Postprocessing: EffectComposer with RGB Shift ---
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms['amount'].value = 0.001; // Subtle effect, increase for more
composer.addPass(rgbShiftPass);
window.addEventListener('mousemove', (e) => {
  if(model){
    const rotationY = (e.clientY/window.innerHeight- 0.5) * (Math.PI * 0.9)
    const rotationX = (e.clientX/window.innerWidth - 0.5)* (Math.PI * 0.9)
    gsap.to(model.rotation, {
      y: rotationX,
      x: rotationY,
      duration: 0.5,
      ease: "power2.Out"
    })
  }
})
window.addEventListener('resize ', (e) => {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  composer.setSize(window.innerWidth, window.innerHeight)
})

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  skybox.rotation.y += (targetRotation.y - skybox.rotation.y) * 0.05;
  skybox.rotation.x += (targetRotation.x - skybox.rotation.x) * 0.05;
  composer.render(); // Use composer instead of renderer
}
animate();