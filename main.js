import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as Parallax from "parallax-effect";
import { SplatMesh } from "@sparkjsdev/spark";

let scene, camera, renderer, model, splatMesh, controls;
const pos0 = new THREE.Vector3(0, 0, 5);
const fov0 = 45;

// Debug helper: dump scene objects with basic info
function dumpSceneObjects() {
  const list = [];
  scene.traverse((o) => {
    const info = {
      name: o.name || null,
      type: o.type,
      visible: !!o.visible,
      children: o.children ? o.children.length : 0,
    };
    if (o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
      info.vertexCount = o.geometry.attributes.position.count;
    }
    if (o.material) info.material = o.material.type || null;
    list.push(info);
  });
  console.log("Scene dump:", list);
}

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
  document.getElementById("app").appendChild(renderer.domElement);

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Visual helpers to help locate the splats

  // Orbit controls to inspect the scene manually
  // (debug helpers removed)

  // Load Gaussian Splat using Spark
  const splatPath = "/splat.ply";

  try {
    splatMesh = new SplatMesh({ url: splatPath });
    // Rotate to match Blender's default Z-up coordinate system
    // Blender Z-up -> Three.js Y-up conversion: rotate -90deg around X
    splatMesh.rotation.x = -Math.PI / 2;
    splatMesh.position.set(0.15, -0.8, 0);
    scene.add(splatMesh);

    console.log(
      "SplatMesh created and added to scene, loading from:",
      splatPath,
    );

    // Wait a bit for the splat to load, then auto-fit camera
    setTimeout(() => {
      try {
        dumpSceneObjects();
        const bbox = new THREE.Box3();
        let found = false;

        scene.traverse((o) => {
          if (o.isMesh || o.isPoints || o.isGroup) {
            try {
              bbox.expandByObject(o);
              found = true;
            } catch (e) {
              console.warn("Could not expand bbox for object:", o.type);
            }
          }
        });

        if (found && !bbox.isEmpty()) {
          const center = bbox.getCenter(new THREE.Vector3());
          const size = bbox.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z, 1);
          const fitDistance = maxDim * 1.6 + 1.0;

          camera.position.copy(
            new THREE.Vector3(center.x, center.y, center.z + fitDistance),
          );
          // Apply a small offset so the camera tilts/rotates to show the splat better
          // Positive X moves camera right, negative Y moves camera down slightly
          const cameraTiltOffset = new THREE.Vector3(-0.5, 0.7, 0);
          camera.position.add(cameraTiltOffset);
          camera.lookAt(center);
          camera.updateProjectionMatrix();

          if (controls) {
            controls.target.copy(center);
            controls.update();
          }

          console.log(
            "Auto-fit camera to loaded splats, center:",
            center,
            "size:",
            size,
            "fitDistance:",
            fitDistance,
          );
        } else {
          console.warn(
            "No objects found in scene or bbox is empty after Spark load.",
          );
        }

        // Inspect scene objects
        scene.traverse((o) => {
          if (o.isMesh || o.isPoints) {
            try {
              const worldPos = new THREE.Vector3();
              o.getWorldPosition(worldPos);
              const worldScale = new THREE.Vector3();
              o.getWorldScale(worldScale);
              console.log("Object found:", o.name || o.type, {
                position: worldPos,
                scale: worldScale,
                type: o.type,
                visible: o.visible,
              });
            } catch (e) {
              console.warn("Error inspecting object:", e);
            }
          }
        });
      } catch (e) {
        console.error("Error during post-load debug fit:", e);
      }
    }, 1000);
  } catch (err) {
    console.log("Failed to create SplatMesh, trying GLB fallback...", err);
    loadGLBFallback();
  }

  // Parallax tracking
  Parallax.init((view) => {
    // Adjust camera based on face position
    // view.x and view.y are roughly in [-1, 1]
    camera.position.set(
      pos0.x + view.x * 2,
      pos0.y + view.y * 2,
      pos0.z * (1.0 - view.z * 0.2),
    );
    camera.lookAt(0, 0, 0);
    camera.fov = fov0 / (1.0 + view.z * 0.1);
    camera.updateProjectionMatrix();
  }).catch((err) => {
    console.warn("Parallax init failed (no webcam?):", err);
  });

  window.addEventListener("resize", onWindowResize, false);
}

function loadGLBFallback() {
  const loader = new GLTFLoader();
  loader.load(
    "./model.glb",
    (gltf) => {
      if (model) scene.remove(model);
      model = gltf.scene;
      scene.add(model);
      console.log("GLB model loaded successfully");

      // Auto-fit camera to GLB model
      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      const size = bbox.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 1);
      const fitDistance = maxDim * 2.0;

      camera.position.set(center.x, center.y, center.z + fitDistance);
      camera.lookAt(center);
      controls.target.copy(center);
      controls.update();
    },
    undefined,
    (error) => {
      console.log(
        "No custom model found. Using empty scene with helpers.",
        error,
      );
    },
  );
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  // Update controls
  if (controls) controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

init();
animate();
