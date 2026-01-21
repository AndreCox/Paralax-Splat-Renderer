import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import * as Parallax from 'parallax-effect';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

let scene, camera, renderer, model, splatViewer;
const pos0 = new THREE.Vector3(0, 0, 5);
const fov0 = 45;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(fov0, aspect, 0.1, 1000);
    camera.position.copy(pos0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('app').appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Environment map for Cycles-like reflections
    new RGBELoader()
        .setPath('https://threejs.org/examples/textures/equirectangular/')
        .load('royal_esplanade_1k.hdr', function (texture) {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            scene.environment = texture;
            // scene.background = texture; // Uncomment if you want the HDR as background
        });

    // Placeholder Geometric Model
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 100, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff88, metalness: 0.7, roughness: 0.2 });
    model = new THREE.Mesh(geometry, material);
    scene.add(model);

    // Load custom model if available (prefer SPLAT/PLY, then GLB)
    const splatLoader = './model.ply'; // or './model.splat'
    
    splatViewer = new GaussianSplats3D.Viewer({
        'selfRenderMode': GaussianSplats3D.RenderMode.None, // We want to render manually in our loop
        'camera': camera,
        'renderer': renderer,
        'scene': scene,
        'ignoreParallax': true, // We handle camera ourselves
        'useBuiltInControls': false
    });

    splatViewer.addSplatScene(splatLoader, {
        'splatAlphaTest': 0.1,
        'showLoadingUI': false,
    }).then(() => {
        scene.remove(model);
        console.log('Gaussian Splat loaded successfully.');
    }).catch(() => {
        console.log('No .ply splat found, trying GLB...');
        const loader = new GLTFLoader();
        loader.load('./model.glb', (gltf) => {
            scene.remove(model);
            model = gltf.scene;
            scene.add(model);
        }, undefined, (error) => {
            console.log('No custom model found or error loading it. Using placeholder.');
        });
    });

    // Parallax tracking
    Parallax.init(view => {
        // Adjust camera based on face position
        // view.x and view.y are roughly in [-1, 1]
        camera.position.set(
            pos0.x + view.x * 2,
            pos0.y + view.y * 2,
            pos0.z * (1.0 - view.z * 0.2)
        );
        camera.lookAt(0, 0, 0);
        camera.fov = fov0 / (1.0 + view.z * 0.1);
        camera.updateProjectionMatrix();
    }).catch(err => {
        console.warn('Parallax init failed (no webcam?):', err);
    });

    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (splatViewer) splatViewer.update();
    renderer.render(scene, camera);
}

init();
animate();
