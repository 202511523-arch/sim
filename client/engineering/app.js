/**
 * 3D Studio Pro - Main Application
 * Web-based 3D Model Viewer with Blender/CAD features
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

// Post-processing
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { PhysicsEngine } from './js/physics.js';
import { AITutor } from './js/ai-tutor.js';
import { RoboticsLessons } from './js/lessons/robotics-lessons.js';

// ============================================
// App State
// ============================================
const state = {
  currentTool: 'select',
  viewMode: 'solid',
  selectedObject: null,
  objects: [],
  measurePoints: [],
  isMeasuring: false,
  history: { undo: [], redo: [] },
  appMode: 'study' // 'study' or 'cad'
};

// CAD Collaboration socket reference
let cadSocket = null;
let cadCollabReady = false;

// ============================================
// CAD State Persistence
// ============================================
const cadState = {
  objects: [],
  selectedObject: null,
  transformMode: 'translate'
};

// ============================================
// Scene Setup
// ============================================
let scene, camera, renderer, controls, transformControls;
let raycaster, mouse;
let gridHelper, axesHelper;
let ambientLight, directionalLight;
let stats = { objects: 0, triangles: 0 };
let physics, aiTutor;
let composer, outlinePass;

function initScene() {
  const canvas = document.getElementById('viewport');
  const container = document.getElementById('viewport-container');

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a24); // Lighter charcoal
  scene.fog = new THREE.Fog(0x1a1a24, 50, 200);

  // Camera
  let width = container.clientWidth || 800;
  let height = container.clientHeight || 600;

  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.set(8, 6, 8);
  camera.lookAt(0, 0, 0);

  // Renderer
  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Lighting
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  // Controls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1;
  controls.maxDistance = 100;
  controls.target.set(0, 0, 0);

  // Blender-style Controls
  controls.mouseButtons = {
    LEFT: null,                // Reserved for selection
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.PAN     // Standard Pan fallback
  };

  // Dynamic MMB Mapping (Shift=Pan, Ctrl=Zoom)
  const updateMiddleButtonMode = (e) => {
    if (e.shiftKey) {
      controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
    } else {
      controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
    }
  };

  renderer.domElement.addEventListener('mousedown', (e) => {
    if (e.button === 1) { // Middle Button
      updateMiddleButtonMode(e);
      // Prevent autoscroll on Windows
      e.preventDefault();
    }
  }, true);

  // Reset to Rotate on mouseup to prevent "sticky" behavior
  window.addEventListener('mouseup', (e) => {
    if (e.button === 1) {
      controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
    }
  }, true);

  // Transform Controls
  transformControls = new TransformControls(camera, renderer.domElement);

  let dragStartTransform = null;

  transformControls.addEventListener('dragging-changed', (e) => {
    controls.enabled = !e.value;

    // Undo/Redo Logic
    if (state.selectedObject) {
      if (e.value) { // Drag Start
        // Capture state before change
        dragStartTransform = {
          position: state.selectedObject.position.clone(),
          rotation: state.selectedObject.rotation.clone(),
          scale: state.selectedObject.scale.clone()
        };
      } else { // Drag End
        if (dragStartTransform) {
          // Capture state after change
          const dragEndTransform = {
            position: state.selectedObject.position.clone(),
            rotation: state.selectedObject.rotation.clone(),
            scale: state.selectedObject.scale.clone()
          };

          // Push to history
          addToHistory({
            type: 'transform',
            objectUuid: state.selectedObject.uuid,
            before: dragStartTransform,
            after: dragEndTransform
          });

          // Log for calibration
          logCalibrationData(state.selectedObject);

          dragStartTransform = null;
        }
      }
    }
  });

  transformControls.addEventListener('change', () => {
    if (state.selectedObject) {
      updatePropertiesPanel();
    }
  });
  scene.add(transformControls);

  // Raycaster
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Grid
  gridHelper = new THREE.GridHelper(20, 20, 0x3f3f5f, 0x1a1a24);
  gridHelper.material.opacity = 0.6;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  // Axes Helper
  axesHelper = new THREE.AxesHelper(2);
  scene.add(axesHelper);

  // Lighting
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(10, 20, 10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.camera.bottom = -15;
  scene.add(directionalLight);

  // Hemisphere Light for ambient
  const hemiLight = new THREE.HemisphereLight(0x7c3aed, 0x06b6d4, 0.3);
  scene.add(hemiLight);

  // Ground plane (shadow receiver)
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.3 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.userData.isGround = true;
  scene.add(ground);

  // Handle resize
  window.addEventListener('resize', onWindowResize);

  // Post-processing Setup
  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
  outlinePass.edgeStrength = 6.0;
  outlinePass.edgeGlow = 0.5;
  outlinePass.edgeThickness = 2.0;
  outlinePass.pulsePeriod = 0;
  outlinePass.visibleEdgeColor.set('#fcfc00'); // Neon Yellow
  outlinePass.hiddenEdgeColor.set('#fcfc00');  // Keep same to prevent flickering on occlusion
  composer.addPass(outlinePass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  // Physics & AI Setup
  physics = new PhysicsEngine();
  aiTutor = new AITutor();

  setStatus('3D Studio Pro Ready');
}

function onWindowResize() {
  const container = document.getElementById('viewport-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
  if (composer) composer.setSize(container.clientWidth, container.clientHeight);
}

// ============================================
// Animation Loop
// ============================================
let lastTime = performance.now();
let frameCount = 0;
let fps = 60;

function animate() {
  requestAnimationFrame(animate);

  // FPS counter
  frameCount++;
  const currentTime = performance.now();
  if (currentTime - lastTime >= 1000) {
    fps = frameCount;
    document.getElementById('fps-counter').textContent = `${fps} FPS`;
    frameCount = 0;
    lastTime = currentTime;
  }

  // Update controls
  controls.update();

  // Update stats
  updateStats();

  // Physics Update
  if (state.appMode === 'study' && physics && physics.isRunning) {
    physics.update(1 / 60);

    // Update lesson info if active
    if (learningState.currentLesson && learningState.currentSubject === 'physics') {
      updateLessonInfo();
    }
  }

  // Lesson-specific Update
  if (state.appMode === 'study' && learningState.currentLessonModule && learningState.currentLessonModule.onUpdate && learningState.lessonObjects.length > 0) {
    learningState.currentLessonModule.onUpdate(learningState.lessonObjects, 1 / 60);
  }

  // Debug Box Animation
  const debugBox = scene.getObjectByName('DebugBox');
  if (debugBox) {
    debugBox.rotation.y += 0.01;
    debugBox.rotation.x += 0.005;
  }

  // Render
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  // Update Annotations (Leader Line)
  updateAnnotationUI();
}

function updateStats() {
  let triangles = 0;
  let objects = 0;

  if (scene) {
    scene.traverse((obj) => {
      if (obj.isMesh && obj.geometry && !obj.userData.isGround) {
        objects++;
        const geo = obj.geometry;
        if (geo.index) {
          triangles += geo.index.count / 3;
        } else if (geo.attributes.position) {
          triangles += geo.attributes.position.count / 3;
        }
      }
    });
  }

  const elObjects = document.getElementById('stats-objects');
  const elTriangles = document.getElementById('stats-triangles');

  if (elObjects) elObjects.textContent = `Objects: ${objects}`;
  if (elTriangles) elTriangles.textContent = `Triangles: ${Math.floor(triangles).toLocaleString()}`;
}

// ============================================
// Object Management
// ============================================
function addPrimitive(type, remote = false, remoteData = {}) {
  let geometry, mesh;
  const colorHex = remoteData.color || 0x6366f1;
  const material = new THREE.MeshStandardMaterial({
    color: colorHex,
    metalness: 0,
    roughness: 0.5
  });

  switch (type) {
    case 'cube':
      geometry = new THREE.BoxGeometry(1, 1, 1);
      break;
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.5, 32, 32);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      break;
    case 'cone':
      geometry = new THREE.ConeGeometry(0.5, 1, 32);
      break;
    case 'torus':
      geometry = new THREE.TorusGeometry(0.4, 0.15, 16, 48);
      break;
    case 'plane':
      geometry = new THREE.PlaneGeometry(2, 2);
      material.side = THREE.DoubleSide;
      break;
    default:
      return;
  }

  mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = remoteData.name || `${type.charAt(0).toUpperCase() + type.slice(1)}_${state.objects.length + 1}`;
  mesh.position.y = type === 'plane' ? 0.01 : 0.5;

  if (type === 'plane') {
    mesh.rotation.x = -Math.PI / 2;
  }

  // Apply remote position/rotation/scale if provided
  if (remoteData.position) {
    mesh.position.set(remoteData.position.x, remoteData.position.y, remoteData.position.z);
  }
  if (remoteData.rotation) {
    mesh.rotation.set(remoteData.rotation.x, remoteData.rotation.y, remoteData.rotation.z);
  }
  if (remoteData.scale) {
    mesh.scale.set(remoteData.scale.x, remoteData.scale.y, remoteData.scale.z);
  }

  // Use remote uuid if provided (for syncing)
  if (remoteData.uuid) {
    mesh.uuid = remoteData.uuid;
  }

  scene.add(mesh);
  state.objects.push(mesh);

  updateHierarchy();

  if (!remote) {
    selectObject(mesh);
    // Broadcast to collaborators
    if (cadSocket && cadCollabReady) {
      cadSocket.emit('cad:add-primitive', {
        type: type,
        uuid: mesh.uuid,
        name: mesh.name,
        position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
        rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
        scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
        color: colorHex
      });
    }
  }

  setStatus(`${mesh.name} Added`);
  return mesh;
}

function selectObject(obj, remote = false) {
  // Deselect previous
  if (state.selectedObject) {
    const prevItem = document.querySelector(`.hierarchy-item[data-uuid="${state.selectedObject.uuid}"]`);
    if (prevItem) prevItem.classList.remove('selected');
  }

  state.selectedObject = obj;

  if (obj) {
    // Update hierarchy selection
    const item = document.querySelector(`.hierarchy-item[data-uuid="${obj.uuid}"]`);
    if (item) item.classList.add('selected');

    // Outline - Highlight meshes within selection
    if (outlinePass) {
      const selectedMeshes = [];
      if (obj.userData && obj.userData.groupMembers) {
        selectedMeshes.push(...obj.userData.groupMembers);
      } else if (obj.isMesh) {
        selectedMeshes.push(obj);
      } else {
        obj.traverse(child => {
          if (child.isMesh) selectedMeshes.push(child);
        });
      }
      outlinePass.selectedObjects = selectedMeshes;
    }

    updatePropertiesPanel();
    showAnnotation(obj);

    // Broadcast selection to collaborators
    if (!remote && cadSocket && cadCollabReady) {
      cadSocket.emit('cad:select-object', { uuid: obj.uuid });
    }
  } else {
    // DESELECT
    if (outlinePass) outlinePass.selectedObjects = [];
    if (transformControls) transformControls.detach(); // Hide G/R/S gizmo
    updatePropertiesPanel(); // Reset panel
    hideAnnotation();

    // Broadcast deselection
    if (!remote && cadSocket && cadCollabReady) {
      cadSocket.emit('cad:select-object', { uuid: null });
    }
  }
}

// ============================================
// Annotation UI Logic (Leader Line)
// ============================================
function showAnnotation(obj) {
  const layer = document.getElementById('annotation-layer');
  const nameEl = document.getElementById('popup-part-name');
  const descEl = document.getElementById('popup-part-desc');

  if (layer && nameEl && descEl) {
    nameEl.textContent = obj.userData.displayName || obj.name || 'Component';
    descEl.textContent = obj.userData.description || 'No description available for this part.';
    layer.classList.remove('hidden');
  }
}

function hideAnnotation() {
  const layer = document.getElementById('annotation-layer');
  if (layer) layer.classList.add('hidden');
}

function updateAnnotationUI() {
  const layer = document.getElementById('annotation-layer');
  if (!layer || layer.classList.contains('hidden') || !state.selectedObject) return;

  const obj = state.selectedObject;
  const container = document.getElementById('viewport-container');
  const popup = document.getElementById('part-popup');
  const path = document.getElementById('leader-line-path');

  // 1. Get 3D Position (Center of geometry)
  const worldPos = new THREE.Vector3();
  if (obj.geometry) {
    obj.geometry.computeBoundingBox();
    obj.geometry.boundingBox.getCenter(worldPos);
    worldPos.applyMatrix4(obj.matrixWorld);
  } else {
    obj.getWorldPosition(worldPos);
  }

  // 2. Project to 2D
  const screenPos = worldPos.clone().project(camera);

  // Convert to pixel coordinates
  const x = (screenPos.x * 0.5 + 0.5) * container.clientWidth;
  const y = (-(screenPos.y * 0.5) + 0.5) * container.clientHeight;

  // 3. Update Leader Line (SVG Path)
  // Popup anchor point (Left-middle of popup)
  const popupRect = popup.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const popupX = popupRect.left - containerRect.left;
  const popupY = popupRect.top - containerRect.top + (popupRect.height / 2);

  // Draw simple curved path
  const curveFactor = Math.abs(popupX - x) * 0.5;
  const d = `M ${x} ${y} C ${x + curveFactor} ${y}, ${popupX - curveFactor} ${popupY}, ${popupX} ${popupY}`;
  path.setAttribute('d', d);

  // Check if point is behind camera
  if (screenPos.z > 1) {
    layer.style.opacity = '0';
  } else {
    layer.style.opacity = '1';
  }
}

function deleteSelectedObject(remote = false, remoteUuid = null) {
  const obj = remoteUuid
    ? state.objects.find(o => o.uuid === remoteUuid)
    : state.selectedObject;

  if (!obj) return;

  const uuid = obj.uuid;
  const name = obj.name;

  transformControls.detach();
  scene.remove(obj);

  const index = state.objects.indexOf(obj);
  if (index > -1) {
    state.objects.splice(index, 1);
  }

  if (state.selectedObject === obj) {
    state.selectedObject = null;
  }

  updateHierarchy();
  resetPropertiesPanel();
  setStatus(`${name} Deleted`);

  // Broadcast deletion to collaborators
  if (!remote && cadSocket && cadCollabReady) {
    cadSocket.emit('cad:delete-object', { uuid: uuid });
  }
}

// ============================================
// UI Updates
// ============================================
function updateHierarchy() {
  const treeId = state.appMode === 'cad' ? 'cad-hierarchy-tree' : 'hierarchy-tree';
  const tree = document.getElementById(treeId);
  if (!tree) return;

  let html = `
        <div class="hierarchy-item scene-root">
            <span class="material-icons-round">public</span>
            <span class="hierarchy-name">Scene</span>
        </div>
    `;

  const renderItem = (obj, depth = 0) => {
    // Only show if it's in state.objects OR it's explicitly selectable (part)
    if (!state.objects.includes(obj) && !obj.userData.isSelectable) return '';

    const selected = state.selectedObject === obj ? 'selected' : '';
    const margin = depth * 15;
    let itemHtml = `
            <div class="hierarchy-item ${selected}" data-uuid="${obj.uuid}" style="padding-left: ${20 + margin}px">
                <span class="material-icons-round" style="font-size: 16px;">${obj.isGroup ? 'category' : 'precision_manufacturing'}</span>
                <span class="hierarchy-name">${obj.userData.displayName || obj.name}</span>
            </div>
        `;

    if (obj.children) {
      obj.children.forEach(child => {
        itemHtml += renderItem(child, depth + 1);
      });
    }
    return itemHtml;
  };

  state.objects.forEach((obj) => {
    html += renderItem(obj);
  });

  tree.innerHTML = html;

  // Add click handlers
  document.querySelectorAll('.hierarchy-item[data-uuid]').forEach(item => {
    item.addEventListener('click', () => {
      const uuid = item.dataset.uuid;
      // Search recursively for the object
      let found = null;
      const search = (list) => {
        for (const o of list) {
          if (o.uuid === uuid) { found = o; break; }
          if (o.children) search(o.children);
          if (found) break;
        }
      };
      search(state.objects);
      if (found) selectObject(found);
    });
  });
}

function updatePropertiesPanel() {
  const obj = state.selectedObject;
  const nameDisplay = document.getElementById('obj-name-display');
  const verticesDisplay = document.getElementById('obj-vertices');
  const facesDisplay = document.getElementById('obj-faces');
  const descDisplay = document.getElementById('obj-description');

  if (!obj) {
    if (nameDisplay) nameDisplay.textContent = 'No Selection';
    if (verticesDisplay) verticesDisplay.textContent = '-';
    if (facesDisplay) facesDisplay.textContent = '-';
    if (descDisplay) descDisplay.textContent = 'Select a model to view details.';
    return;
  }

  // Name
  if (nameDisplay) nameDisplay.textContent = obj.name || 'Unknown Object';

  // Geometry info
  if (obj.geometry) {
    const geo = obj.geometry;
    const vertices = geo.attributes.position ? geo.attributes.position.count : 0;
    const faces = geo.index ? geo.index.count / 3 : vertices / 3;
    if (verticesDisplay) verticesDisplay.textContent = vertices.toLocaleString();
    if (facesDisplay) facesDisplay.textContent = Math.floor(faces).toLocaleString();
  }

  // Description (Simplified logic based on name/type)
  if (descDisplay) {
    if (obj.userData && obj.userData.description) {
      descDisplay.textContent = obj.userData.description;
    } else {
      descDisplay.textContent = `Provides information about ${obj.name}. It is one of the mechanical components.`;
    }
  }
}

function resetPropertiesPanel() {
  document.getElementById('obj-name').value = 'No Selection';
  document.getElementById('obj-vertices').textContent = '-';
  document.getElementById('obj-faces').textContent = '-';

  ['pos-x', 'pos-y', 'pos-z'].forEach(id => {
    document.getElementById(id).value = 0;
  });
  ['rot-x', 'rot-y', 'rot-z'].forEach(id => {
    document.getElementById(id).value = 0;
  });
  ['scale-x', 'scale-y', 'scale-z'].forEach(id => {
    document.getElementById(id).value = 1;
  });
}

function setStatus(message) {
  document.getElementById('status-message').textContent = message;
}

// ============================================
// Tool Management
// ============================================
function setTool(tool) {
  state.currentTool = tool;

  // Update UI
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  // Update transform controls
  if (state.selectedObject) {
    switch (tool) {
      case 'move':
        transformControls.setMode('translate');
        transformControls.attach(state.selectedObject);
        break;
      case 'rotate':
        transformControls.setMode('rotate');
        transformControls.attach(state.selectedObject);
        break;
      case 'scale':
        transformControls.setMode('scale');
        transformControls.attach(state.selectedObject);
        break;
      default:
        transformControls.detach();
    }
  } else {
    transformControls.detach();
  }

  // Measure tool state
  if (tool === 'measure') {
    state.isMeasuring = true;
    state.measurePoints = [];
    setStatus('Click the first point to measure');
  } else {
    state.isMeasuring = false;
    document.getElementById('measurement-display').classList.add('hidden');
  }
}

function setViewMode(mode) {
  state.viewMode = mode;

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  state.objects.forEach(obj => {
    if (obj.material) {
      switch (mode) {
        case 'wireframe':
          obj.material.wireframe = true;
          break;
        case 'solid':
          obj.material.wireframe = false;
          break;
        case 'textured':
          obj.material.wireframe = false;
          break;
      }
    }
  });
}

// ============================================
// Camera Presets
// ============================================
function setViewPreset(view) {
  const distance = 10;
  const target = controls.target.clone();

  switch (view) {
    case 'front':
      camera.position.set(target.x, target.y, target.z + distance);
      break;
    case 'back':
      camera.position.set(target.x, target.y, target.z - distance);
      break;
    case 'left':
      camera.position.set(target.x - distance, target.y, target.z);
      break;
    case 'right':
      camera.position.set(target.x + distance, target.y, target.z);
      break;
    case 'top':
      camera.position.set(target.x, target.y + distance, target.z + 0.001);
      break;
    case 'bottom':
      camera.position.set(target.x, target.y - distance, target.z + 0.001);
      break;
  }

  camera.lookAt(target);
}

// ============================================
// File Loaders
// ============================================
const loaders = {
  gltf: new GLTFLoader(),
  glb: new GLTFLoader(),
  obj: new OBJLoader(),
  stl: new STLLoader(),
  fbx: new FBXLoader()
};

async function loadModel(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  const url = URL.createObjectURL(file);

  setStatus(`Loading ${file.name}...`);

  try {
    let model;

    switch (extension) {
      case 'gltf':
      case 'glb':
        const gltf = await loaders.gltf.loadAsync(url);
        model = gltf.scene;
        break;
      case 'obj':
        model = await loaders.obj.loadAsync(url);
        break;
      case 'stl':
        const geometry = await loaders.stl.loadAsync(url);
        const material = new THREE.MeshStandardMaterial({
          color: 0x6366f1,
          metalness: 0.2,
          roughness: 0.6
        });
        model = new THREE.Mesh(geometry, material);
        break;
      case 'fbx':
        model = await loaders.fbx.loadAsync(url);
        break;
      default:
        throw new Error('Unsupported file format.');
    }

    // Normalize model size and position
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 5 / maxDim;
    model.scale.multiplyScalar(scale);

    box.setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    model.position.y = box.getSize(new THREE.Vector3()).y / 2;

    // Setup shadows
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    model.name = file.name.replace(/\.[^/.]+$/, '');
    scene.add(model);
    state.objects.push(model);

    updateHierarchy();
    selectObject(model);

    // Focus camera on model
    const modelBox = new THREE.Box3().setFromObject(model);
    const modelCenter = modelBox.getCenter(new THREE.Vector3());
    controls.target.copy(modelCenter);

    setStatus(`${file.name} Loaded`);

  } catch (error) {
    console.error('Load error:', error);
    setStatus(`Load failed: ${error.message}`);
  }

  URL.revokeObjectURL(url);
}

// ============================================
// Exporters
// ============================================
function exportScene(format) {
  const exportGroup = new THREE.Group();
  state.objects.forEach(obj => {
    exportGroup.add(obj.clone());
  });

  let exporter, data, blob, ext;

  switch (format) {
    case 'gltf':
    case 'glb':
      exporter = new GLTFExporter();
      const binary = format === 'glb';
      exporter.parse(exportGroup, (result) => {
        if (binary) {
          blob = new Blob([result], { type: 'application/octet-stream' });
        } else {
          blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
        }
        downloadBlob(blob, `scene.${format}`);
      }, { binary });
      return;
    case 'obj':
      exporter = new OBJExporter();
      data = exporter.parse(exportGroup);
      blob = new Blob([data], { type: 'text/plain' });
      ext = 'obj';
      break;
    case 'stl':
      exporter = new STLExporter();
      data = exporter.parse(exportGroup, { binary: true });
      blob = new Blob([data], { type: 'application/octet-stream' });
      ext = 'stl';
      break;
    default:
      return;
  }

  downloadBlob(blob, `scene.${ext}`);
  closeModal('export-modal');
  setStatus(`scene.${ext} export complete`);
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function captureScreenshot() {
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = 'screenshot.png';
  link.click();
  setStatus('Screenshot saved');
}

// ============================================
// Measurement Tool
// ============================================
let measureLine = null;
let measureSpheres = [];

function handleMeasureClick(event) {
  if (!state.isMeasuring) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const objects = state.objects.filter(o => o.isMesh || o.isGroup);
  const intersects = raycaster.intersectObjects(objects, true);

  if (intersects.length > 0) {
    const point = intersects[0].point.clone();
    state.measurePoints.push(point);

    // Add visual marker
    const sphereGeo = new THREE.SphereGeometry(0.05);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.copy(point);
    sphere.userData.isHelper = true;
    scene.add(sphere);
    measureSpheres.push(sphere);

    if (state.measurePoints.length === 2) {
      // Draw line
      const points = state.measurePoints;
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
      measureLine = new THREE.Line(lineGeo, lineMat);
      measureLine.userData.isHelper = true;
      scene.add(measureLine);

      // Calculate distance
      const distance = points[0].distanceTo(points[1]);
      document.getElementById('measure-distance').textContent = distance.toFixed(3);
      document.getElementById('measurement-display').classList.remove('hidden');

      setStatus(`Distance: ${distance.toFixed(3)} units`);

      // Reset for next measurement
      state.measurePoints = [];
    } else {
      setStatus('Click the second point to measure');
    }
  }
}

function clearMeasurements() {
  if (measureLine) {
    scene.remove(measureLine);
    measureLine = null;
  }
  measureSpheres.forEach(s => scene.remove(s));
  measureSpheres = [];
  state.measurePoints = [];
  document.getElementById('measurement-display').classList.add('hidden');
}

// ============================================
// Mouse Handlers
// ============================================
function onMouseClick(event) {
  if (state.isMeasuring) {
    handleMeasureClick(event);
    return;
  }

  // Skip if clicking on transform controls
  if (transformControls && transformControls.dragging) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const filterObjects = state.objects.filter(o => o.isMesh || o.isGroup);
  const intersects = raycaster.intersectObjects(filterObjects, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;

    // 1. Prefer logical units (groupMembers) or explicitly selectable parts
    // Walk up to find the nearest parent that is either in state.objects or explicitly selectable
    let current = obj;
    let fallback = null;
    while (current) {
      // If we find a node that has groupMembers with actual multiple members, it's a logical unit
      if (current.userData && current.userData.groupMembers && current.userData.groupMembers.length > 1) {
        obj = current;
        break;
      }
      // If we find a node that HAS a parentGroup that is a multi-member group
      if (current.userData && current.userData.parentGroup) {
        const pg = current.userData.parentGroup;
        if (pg.userData && pg.userData.groupMembers && pg.userData.groupMembers.length > 1) {
          obj = pg;
          break;
        }
      }

      // If we find a node in state.objects, it's a candidate for selection
      if (state.objects.includes(current)) {
        fallback = current;
      }
      // If selectable part metadata is present
      if (current.userData && (current.userData.isSelectable || current.userData.displayName)) {
        obj = current;
        break;
      }
      current = current.parent;
    }

    // If no explicit selectable unit found, use the fallback from state.objects
    if (current === null && fallback) {
      obj = fallback;
    }

    if (state.objects.includes(obj) || obj.userData.isSelectable || obj.userData.groupMembers) {
      selectObject(obj);
    }
  } else {
    selectObject(null);
  }
}

function onMouseMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  // Update coordinates display
  raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersection = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersection);

  if (intersection) {
    document.getElementById('coord-x').textContent = intersection.x.toFixed(2);
    document.getElementById('coord-y').textContent = intersection.y.toFixed(2);
    document.getElementById('coord-z').textContent = intersection.z.toFixed(2);
  }
}

// ============================================
// Modal Functions
// ============================================
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

// ============================================
// Keyboard Shortcuts
// ============================================
function onKeyDown(event) {
  // Ignore if typing in input
  if (event.target.tagName === 'INPUT') return;

  switch (event.key.toLowerCase()) {
    case 'q':
      setTool('select');
      break;
    case 'g':
      setTool('move');
      break;
    case 'r':
      setTool('rotate');
      break;
    case 's':
      if (!event.ctrlKey) setTool('scale');
      break;
    case 'x':
    case 'delete':
      deleteSelectedObject();
      break;
    case 'f':
      if (state.selectedObject) {
        controls.target.copy(state.selectedObject.position);
      }
      break;
    case 'escape':
      selectObject(null);
      if (state.isMeasuring) {
        setTool('select');
        clearMeasurements();
      }
      break;
  }

  // Ctrl shortcuts
  if (event.ctrlKey) {
    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault();
        newScene();
        break;
      case 'o':
        event.preventDefault();
        openModal('import-modal');
        break;
      case 's':
        event.preventDefault();
        openModal('export-modal');
        break;
    }
  }

  // Numpad view presets
  if (event.key.startsWith('Numpad')) {
    switch (event.key) {
      case 'Numpad1':
        setViewPreset('front');
        break;
      case 'Numpad3':
        setViewPreset('right');
        break;
      case 'Numpad7':
        setViewPreset('top');
        break;
    }
  }
}

// ============================================
// Scene Management
// ============================================
function newScene() {
  // Remove all objects
  state.objects.forEach(obj => {
    scene.remove(obj);
  });
  state.objects = [];
  state.selectedObject = null;

  transformControls.detach();
  clearMeasurements();
  updateHierarchy();
  resetPropertiesPanel();

  setStatus('New scene created');
}

// ============================================
// Drag & Drop
// ============================================
function setupDragDrop() {
  const viewport = document.getElementById('viewport-container');
  const dropZone = document.getElementById('drop-zone');

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    viewport.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  viewport.addEventListener('dragenter', () => {
    dropZone.classList.remove('hidden');
  });

  dropZone.addEventListener('dragleave', (e) => {
    if (e.target === dropZone) {
      dropZone.classList.add('hidden');
    }
  });

  dropZone.addEventListener('drop', (e) => {
    dropZone.classList.add('hidden');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      loadModel(files[0]);
    }
  });
}

// ============================================
// Event Listeners Setup
// ============================================
function setupEventListeners() {
  // Viewport mouse events
  const canvas = renderer.domElement;
  canvas.addEventListener('click', onMouseClick);
  canvas.addEventListener('mousemove', onMouseMove);

  // Keyboard
  window.addEventListener('keydown', onKeyDown);

  // Tool buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
  });

  // View mode buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.mode));
  });

  // View presets
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => setViewPreset(btn.dataset.view));
  });

  // Primitive buttons (Handled in CAD setup within setupLearningPlatform)
  // document.querySelectorAll('.primitive-btn').forEach(btn => {
  //   btn.addEventListener('click', () => addPrimitive(btn.dataset.shape));
  // });

  // Toolbar buttons (Removed for simplification)
  // document.getElementById('btn-new').addEventListener('click', newScene);
  // document.getElementById('btn-open').addEventListener('click', () => openModal('import-modal'));
  // document.getElementById('btn-export').addEventListener('click', () => openModal('export-modal'));
  document.getElementById('btn-screenshot-alt')?.addEventListener('click', captureScreenshot);
  document.getElementById('btn-fullscreen-alt')?.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  // Property inputs (Disabled for simplification)
  // setupPropertyInputs();

  // Blender-style Keyboard Shortcuts & Snapping
  const updateSnapping = (enabled) => {
    if (enabled) {
      transformControls.setTranslationSnap(0.5);
      transformControls.setRotationSnap(Math.PI / 4); // 45 degrees
      transformControls.setScaleSnap(0.1);
    } else {
      transformControls.setTranslationSnap(null);
      transformControls.setRotationSnap(null);
      transformControls.setScaleSnap(null);
    }
  };

  window.addEventListener('keyup', (event) => {
    if (event.key === 'Shift') {
      updateSnapping(false);
      setStatus('Snap Off');
    }
  });

  // Helper for safe event listeners
  const safeAddListener = (id, type, listener) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(type, listener);
  };

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Shift' && !event.repeat) {
      updateSnapping(true);
      setStatus('Snap On (45° / 0.5 units)');
    }

    // Ignore if typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

    switch (event.key.toLowerCase()) {
      case 'g': // Grab (Translate)
        if (state.selectedObject) {
          setTool('move');
          setStatus('Move Mode');
        }
        break;
      case 'r': // Rotate
        if (state.selectedObject) {
          setTool('rotate');
          setStatus('Rotate Mode');
        }
        break;
      case 's': // Scale
        if (state.selectedObject) {
          setTool('scale');
          setStatus('Scale Mode');
        }
        break;
      case 'escape': // Cancel/Deselect
        if (transformControls.dragging) {
          transformControls.detach();
        } else {
          selectObject(null);
          setTool('select');
          setStatus('Deselect');
        }
        break;
      case 'z':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          if (event.shiftKey) redo(); else undo();
        }
        break;
      case 'y':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          redo();
        }
        break;
    }
  });

  // Safe attachments for UI buttons
  safeAddListener('btn-undo', 'click', undo);
  safeAddListener('btn-redo', 'click', redo);
  safeAddListener('btn-screenshot-alt', 'click', captureScreenshot);

  const fileInput = document.getElementById('file-input');
  const fileDropArea = document.getElementById('file-drop-area');
  if (fileDropArea && fileInput) {
    fileDropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        loadModel(e.target.files[0]);
        const modal = document.getElementById('import-modal');
        if (modal) modal.classList.add('hidden');
      }
    });
  }

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal')?.classList.add('hidden'));
  });

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  });

  document.querySelectorAll('.export-btn').forEach(btn => {
    btn.addEventListener('click', () => exportScene(btn.dataset.format));
  });

  setupDragDrop();

  // Annotation Close Button
  document.getElementById('close-popup-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    selectObject(null);
  });

  // Listen for custom lesson load events (from Landing Page)
  window.addEventListener('load-lesson', (e) => {
    if (e.detail && e.detail.lessonId) {
      loadLesson(e.detail.lessonId);
    }
  });
}

// ============================================
// Undo / Redo System
// ============================================
function addToHistory(action) {
  state.history.undo.push(action);
  state.history.redo = []; // Clear redo stack on new action
  // Limit stack size if needed
  if (state.history.undo.length > 50) state.history.undo.shift();
  console.log('Action added to history:', action);
}

function undo() {
  if (state.history.undo.length === 0) {
    setStatus('Nothing to undo.');
    return;
  }

  const action = state.history.undo.pop();
  state.history.redo.push(action);

  applyAction(action, true); // true = inverse (undo)
  setStatus('Undone');
}

function redo() {
  if (state.history.redo.length === 0) {
    setStatus('Nothing to redo.');
    return;
  }

  const action = state.history.redo.pop();
  state.history.undo.push(action);

  applyAction(action, false); // false = normal (redo)
  setStatus('Redone');
}

function applyAction(action, isUndo) {
  if (action.type === 'transform') {
    const obj = state.objects.find(o => o.uuid === action.objectUuid);
    if (obj) {
      const data = isUndo ? action.before : action.after;
      obj.position.copy(data.position);
      obj.rotation.copy(data.rotation);
      obj.scale.copy(data.scale);

      // If currently selected, update gizmo and panel
      if (state.selectedObject === obj) {
        transformControls.attach(obj);
        updatePropertiesPanel();
        logCalibrationData(obj); // Log on undo/redo too
      }
    }
  }
}

// Global logger for calibration
function logCalibrationData(obj) {
  if (!obj) return;
  const transformData = {
    position: { x: parseFloat(obj.position.x.toFixed(3)), y: parseFloat(obj.position.y.toFixed(3)), z: parseFloat(obj.position.z.toFixed(3)) },
    rotation: { x: parseFloat(obj.rotation.x.toFixed(3)), y: parseFloat(obj.rotation.y.toFixed(3)), z: parseFloat(obj.rotation.z.toFixed(3)) },
    scale: parseFloat(obj.scale.x.toFixed(3))
  };
  console.log(`[Calibration] ${obj.name || 'Object'} Transform:`, JSON.stringify(transformData, null, 2));
}

function setupPropertyInputs() {
  // Name input
  document.getElementById('obj-name').addEventListener('change', (e) => {
    if (state.selectedObject) {
      state.selectedObject.name = e.target.value;
      updateHierarchy();
    }
  });

  // Position inputs
  ['pos-x', 'pos-y', 'pos-z'].forEach((id, i) => {
    document.getElementById(id).addEventListener('input', (e) => {
      if (state.selectedObject) {
        const axis = ['x', 'y', 'z'][i];
        state.selectedObject.position[axis] = parseFloat(e.target.value) || 0;
      }
    });
    document.getElementById(id).addEventListener('change', (e) => {
      if (state.selectedObject) {
        const axis = ['x', 'y', 'z'][i];
        state.selectedObject.position[axis] = parseFloat(e.target.value) || 0;
        logCalibrationData(state.selectedObject);
      }
    });
  });

  // Rotation inputs
  ['rot-x', 'rot-y', 'rot-z'].forEach((id, i) => {
    document.getElementById(id).addEventListener('change', (e) => {
      if (state.selectedObject) {
        const axis = ['x', 'y', 'z'][i];
        state.selectedObject.rotation[axis] = THREE.MathUtils.degToRad(parseFloat(e.target.value) || 0);
        logCalibrationData(state.selectedObject);
      }
    });
  });

  // Scale inputs
  ['scale-x', 'scale-y', 'scale-z'].forEach((id, i) => {
    document.getElementById(id).addEventListener('change', (e) => {
      if (state.selectedObject) {
        const axis = ['x', 'y', 'z'][i];
        state.selectedObject.scale[axis] = parseFloat(e.target.value) || 1;
        logCalibrationData(state.selectedObject);
      }
    });
  });

  // Material color
  document.getElementById('mat-color').addEventListener('input', (e) => {
    if (state.selectedObject && state.selectedObject.material) {
      state.selectedObject.material.color.set(e.target.value);
      if (cadSocket && cadCollabReady) {
        cadSocket.emit('cad:material-update', { uuid: state.selectedObject.uuid, color: e.target.value });
      }
    }
  });

  // Material metalness
  document.getElementById('mat-metalness').addEventListener('input', (e) => {
    if (state.selectedObject && state.selectedObject.material) {
      state.selectedObject.material.metalness = parseFloat(e.target.value);
      e.target.nextElementSibling.textContent = parseFloat(e.target.value).toFixed(2);
      if (cadSocket && cadCollabReady) {
        cadSocket.emit('cad:material-update', { uuid: state.selectedObject.uuid, metalness: parseFloat(e.target.value) });
      }
    }
  });

  // Material roughness
  document.getElementById('mat-roughness').addEventListener('input', (e) => {
    if (state.selectedObject && state.selectedObject.material) {
      state.selectedObject.material.roughness = parseFloat(e.target.value);
      e.target.nextElementSibling.textContent = parseFloat(e.target.value).toFixed(2);
      if (cadSocket && cadCollabReady) {
        cadSocket.emit('cad:material-update', { uuid: state.selectedObject.uuid, roughness: parseFloat(e.target.value) });
      }
    }
  });

  // Light controls
  document.getElementById('light-ambient').addEventListener('input', (e) => {
    ambientLight.intensity = parseFloat(e.target.value);
    e.target.nextElementSibling.textContent = parseFloat(e.target.value).toFixed(1);
  });

  document.getElementById('light-directional').addEventListener('input', (e) => {
    directionalLight.intensity = parseFloat(e.target.value);
    e.target.nextElementSibling.textContent = parseFloat(e.target.value).toFixed(1);
  });
}

// ============================================
// Learning Platform functions
// ============================================
const learningState = {
  currentSubject: 'engineering',
  currentLessonId: null,
  currentLessonModule: null,
  lessonObjects: [],
  lessonData: null
};

function getLessonsForSubject(subject) {
  const lessons = [];
  try {
    if (typeof RoboticsLessons !== 'undefined' && RoboticsLessons) {
      lessons.push(...Object.values(RoboticsLessons));
    }
  } catch (e) {
    console.error('Extraction error:', e);
  }

  // Failsafe Lesson
  if (lessons.length === 0) {
    lessons.push({
      id: 'failsafe-1',
      name: 'System Diagnosis Mode',
      subject: 'engineering',
      description: 'Emergency lesson activated when lesson data fails to load.',
      setup: (scene, physics, THREE) => {
        const group = new THREE.Group();
        const geo = new THREE.TorusKnotGeometry(1.5, 0.4, 128, 16);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff00ff, metalness: 0.7, roughness: 0.2 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 3;
        group.add(mesh);
        scene.add(group);
        return { objects: [mesh] };
      }
    });
  }
  return lessons;
}

function renderLessons(subject) {
  const list = document.getElementById('lessons-list');
  if (!list) return;

  const lessons = getLessonsForSubject(subject);
  const statusEl = document.getElementById('status-message');
  if (statusEl) {
    const robCount = (typeof RoboticsLessons !== 'undefined') ? Object.keys(RoboticsLessons).length : 'ERR';
    statusEl.textContent = `Mechanical Models: ${robCount}`;
  }

  if (lessons.length === 0) {
    list.innerHTML = `<div style="padding: 20px; color: #ff0000; text-align: center; font-weight: bold;">CRITICAL DATA ERROR: NO LESSONS</div>`;
    return;
  }

  list.innerHTML = lessons.map(lesson => `
        <div class="lesson-card" data-lesson-id="${lesson.id}">
            <div class="lesson-card-header">
                <div class="lesson-icon">
                    <span class="material-icons-round">engineering</span>
                </div>
                <span class="lesson-title">${lesson.name}</span>
            </div>
            <p class="lesson-desc">${lesson.description || 'No lesson description.'}</p>
        </div>
    `).join('');

  // Add click handlers
  list.querySelectorAll('.lesson-card').forEach(card => {
    card.addEventListener('click', () => loadLesson(card.dataset.lessonId));
  });
}

function loadLesson(lessonId) {
  // Stop any running simulation
  if (physics && physics.isRunning) {
    physics.stop();
    updateSimStatus();
  }

  // Clear previous lesson objects
  clearLessonObjects();

  // Find lesson module
  const lessons = getLessonsForSubject(learningState.currentSubject);
  const lesson = lessons.find(l => l.id === lessonId);

  if (!lesson) {
    console.error('Lesson not found:', lessonId);
    return;
  }

  learningState.currentLessonId = lessonId;
  learningState.currentLessonModule = lesson;

  // Update UI
  document.querySelectorAll('.lesson-card').forEach(c => c.classList.remove('active'));
  const card = document.querySelector(`.lesson-card[data-lesson-id="${lessonId}"]`);
  if (card) card.classList.add('active');

  // Update Lesson Info Overlay
  const infoOverlay = document.getElementById('lesson-info-overlay');
  if (infoOverlay) {
    document.getElementById('lesson-title').textContent = lesson.name;
    document.getElementById('lesson-description').textContent = lesson.description;

    // Formula
    const formulaContainer = document.querySelector('.formula-display');
    if (lesson.formula) {
      formulaContainer.textContent = lesson.formula;
      formulaContainer.classList.remove('hidden');
    } else {
      formulaContainer.classList.add('hidden');
    }

    infoOverlay.classList.remove('hidden');
  }

  // Setup 3D Scene
  if (lesson.setup) {
    try {
      const result = lesson.setup(scene, physics, THREE);
      if (result && result.objects) {
        // Add objects to state
        learningState.lessonObjects = result.objects;
        result.objects.forEach(obj => {
          if (!state.objects.includes(obj)) {
            state.objects.push(obj);
          }
        });

        // Store extra data for updates
        learningState.lessonData = result;

        updateHierarchy();
        setStatus(`${lesson.name} lesson loaded`);

        // Update AI context
        if (aiTutor) {
          aiTutor.setContext({
            subject: learningState.currentSubject,
            topic: lesson.topic,
            experiment: lesson.name
          });
        }

        // Initial Physics Setup if needed (but waited for start)
      }
    } catch (e) {
      console.error('Lesson setup error:', e);
      setStatus(`Error loading lesson: ${e.message}`);
    }
  }
}

function clearLessonObjects() {
  // Remove physics bodies
  if (physics) {
    learningState.lessonObjects.forEach(obj => {
      physics.removeBody(obj);
    });
    physics.reset();
  }

  // Remove meshes
  learningState.lessonObjects.forEach(obj => {
    scene.remove(obj);
    const idx = state.objects.indexOf(obj);
    if (idx > -1) state.objects.splice(idx, 1);

    // Dispose
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });

  // Remove helpers/lines created dynamically
  scene.children.forEach(child => {
    if (child.name.startsWith('Pendulum_String') || child.name.includes('Helper')) { // Cleanup specific helpers if missed
      scene.remove(child);
    }
  });

  learningState.lessonObjects = [];
  learningState.lessonData = null;
  learningState.currentLessonId = null;
  learningState.currentLessonModule = null;

  updateHierarchy();

  // Hide overlay
  document.getElementById('lesson-info-overlay')?.classList.add('hidden');
}

function updateLessonInfo() {
  const lesson = learningState.currentLessonModule;
  const data = learningState.lessonData;

  if (lesson && lesson.getInfo && data && physics) {
    const info = lesson.getInfo(physics, data.mainObject || data.objects[0]);
    if (info) {
      const container = document.querySelector('.data-display');
      container.innerHTML = Object.entries(info).map(([key, value]) => `
                <div class="data-row">
                    <span>${key}</span>
                    <span class="data-value">${value}</span>
                </div>
            `).join('');
    }
  }

  // Custom update loop for non-physics animations (like pendulum string)
  if (lesson && lesson.onUpdate && data) {
    lesson.onUpdate(data, physics);
  }
}

function setupLearningPlatform() {
  // Subject tabs
  document.querySelectorAll('.subject-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.subject-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      learningState.currentSubject = tab.dataset.subject;
      renderLessons(tab.dataset.subject);
    });
  });

  // Panel tabs (Right Panel: Properties vs AI)
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const panelId = tab.dataset.panel + '-panel';
      const panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
    });
  });

  // Simulation controls
  const btnPlay = document.getElementById('sim-play-mech');
  const btnPause = document.getElementById('sim-pause-mech');
  const btnStop = document.getElementById('sim-stop-mech');

  if (btnPlay) btnPlay.addEventListener('click', () => {
    if (physics && learningState.currentLessonModule) {
      if (!physics.isRunning && learningState.currentLessonModule.onStart) {
        learningState.currentLessonModule.onStart(learningState.lessonData, physics);
      }
      physics.start();
      updateSimStatus();
    }
  });

  if (btnPause) btnPause.addEventListener('click', () => {
    if (physics) {
      physics.pause();
      updateSimStatus();
    }
  });

  if (btnStop) btnStop.addEventListener('click', () => {
    if (physics) {
      physics.stop();
      if (learningState.currentLessonId) {
        loadLesson(learningState.currentLessonId);
      }
      updateSimStatus();
    }
  });

  document.getElementById('sim-speed')?.addEventListener('input', (e) => {
    if (physics) {
      physics.setTimeScale(parseFloat(e.target.value));
      const speedVal = document.getElementById('speed-value');
      if (speedVal) speedVal.textContent = e.target.value + 'x';
    }
  });

  // Explode view toggle
  const btnExplode = document.getElementById('sim-explode-alt');
  if (btnExplode) {
    btnExplode.addEventListener('click', () => {
      btnExplode.classList.toggle('active');
      const lesson = learningState.currentLessonModule;
      if (lesson && lesson.toggleExplode && learningState.lessonObjects.length > 0) {
        lesson.toggleExplode(learningState.lessonObjects);
      }
    });
  }

  // AI Chat (Right Panel Version)
  const chatInput = document.querySelector('#ai-tutor-panel .chat-input');
  const btnSend = document.querySelector('#ai-tutor-panel .btn-send');

  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text) return;

    addChatMessage(text, 'user');
    chatInput.value = '';

    if (aiTutor) {
      const result = await aiTutor.sendMessage(text);
      if (result.success) {
        addChatMessage(result.message, 'ai');
      } else {
        addChatMessage(`Error: ${result.error}`, 'ai');
      }
    }
  };

  if (btnSend) btnSend.addEventListener('click', sendMessage);
  if (chatInput) chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Initial Render
  renderLessons('engineering');
  updateApiKeyStatus();

  // Settings Modal (Gemini API)
  document.getElementById('btn-settings')?.addEventListener('click', () => {
    // For now just log or handle if modal exists
    console.log('Settings clicked');
  });

  // ========================================
  // CAD Mode Setup
  // ========================================
  const btnStudy = document.getElementById('nav-study');
  const btnCad = document.getElementById('nav-cad');

  if (btnStudy && btnCad) {
    btnStudy.addEventListener('click', (e) => {
      e.preventDefault();
      switchWorkspaceMode('study');
    });
    btnCad.addEventListener('click', (e) => {
      e.preventDefault();
      switchWorkspaceMode('cad');
    });
  }

  // CAD Sidebar Primitive Buttons
  document.querySelectorAll('#cad-sidebar .primitive-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.appMode === 'cad') {
        addPrimitive(btn.dataset.shape);
      }
    });
  });

  // CAD Sidebar Transform Buttons
  document.querySelectorAll('#cad-sidebar .tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.appMode === 'cad') {
        setTool(btn.dataset.tool);
      }
    });
  });

  // CAD Import Button
  const btnImport = document.getElementById('cad-import-btn');
  const fileInput = document.getElementById('cad-file-input');

  if (btnImport && fileInput) {
    btnImport.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        loadModel(e.target.files[0]);
      }
      e.target.value = ''; // Reset input to allow re-importing same file
    });
  }
}

function addChatMessage(text, role) {
  const container = document.querySelector('.chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${role}`;

  const avatar = role === 'ai' ? 'smart_toy' : 'person';

  msgDiv.innerHTML = `
        <div class="message-avatar">
            <span class="material-icons-round">${avatar}</span>
        </div>
        <div class="message-content">
            ${text}
        </div>
    `;

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

function updateSimStatus() {
  const icon = document.getElementById('sim-status-icon');
  const text = document.getElementById('sim-status-text');
  const status = document.querySelector('.sim-status');

  const isRunning = physics && physics.isRunning;

  if (isRunning) {
    icon.textContent = 'play_circle';
    text.textContent = 'Running';
    status?.classList.add('running');
    status?.classList.remove('paused');
  } else {
    icon.textContent = 'pause_circle';
    text.textContent = 'Stopped';
    status?.classList.remove('running');
    status?.classList.add('paused');
  }
}

function updateApiKeyStatus() {
  if (!aiTutor) return;

  const hasKey = aiTutor.checkConfiguration();
  const statusEl = document.getElementById('ai-status');
  const statusText = document.getElementById('ai-status-text');

  if (hasKey) {
    statusEl?.classList.add('configured');
    if (statusText) statusText.textContent = 'API Connected';
  } else {
    statusEl?.classList.remove('configured');
    if (statusText) statusText.textContent = 'API Key Not Configured';
  }
}

// ============================================
// switchWorkspaceMode: Study <-> CAD
// ============================================
// ============================================
// switchWorkspaceMode: Study <-> CAD (Persisted)
// ============================================
function switchWorkspaceMode(mode) {
  if (state.appMode === mode) return;

  const btnStudy = document.getElementById('nav-study');
  const btnCad = document.getElementById('nav-cad');
  const studySidebar = document.getElementById('study-sidebar');
  const cadSidebar = document.getElementById('cad-sidebar');
  const landingOverlay = document.getElementById('study-landing-overlay');

  if (mode === 'study') {
    // ----------------------------
    // Switching TO Study Mode
    // ----------------------------
    state.appMode = 'study';

    // 1. Stash CAD State
    cadState.objects = [...state.objects]; // Copy references
    cadState.selectedObject = state.selectedObject;
    cadState.transformMode = transformControls.mode;

    // Remove CAD objects from scene (hide them)
    cadState.objects.forEach(obj => scene.remove(obj));
    transformControls.detach();
    state.objects = [];
    state.selectedObject = null;

    // 2. UI Updates
    btnStudy?.classList.add('active');
    btnCad?.classList.remove('active');
    if (studySidebar) studySidebar.style.display = 'block';
    if (cadSidebar) cadSidebar.style.display = 'none';

    // 3. Restore Study Mode
    // Check if we have a paused/stopped lesson state?
    // For now, reload last lesson or default, assuming simple restore
    const lessonId = learningState.currentLessonId || 'robotArm';
    // loadLesson clears the scene (which is now empty) and loads new lesson
    loadLesson(lessonId);

  } else {
    // ----------------------------
    // Switching TO CAD Mode
    // ----------------------------
    state.appMode = 'cad';

    // 1. Stash/Clear Study State
    if (physics) physics.stop();
    // We don't really "stash" study objects, we just re-load lessons
    // Identify current study objects to remove
    // (loadLesson creates new objects every time anyway)
    state.objects.forEach(obj => scene.remove(obj));
    state.objects = [];
    state.selectedObject = null;
    learningState.currentLessonModule = null;
    learningState.lessonObjects = []; // Clear study refs
    transformControls.detach();

    // 2. UI Updates
    btnStudy?.classList.remove('active');
    btnCad?.classList.add('active');
    if (studySidebar) studySidebar.style.display = 'none';
    if (cadSidebar) cadSidebar.style.display = 'block';
    if (landingOverlay) landingOverlay.style.display = 'none';

    // 3. Restore CAD State
    cadState.objects.forEach(obj => {
      scene.add(obj);
      state.objects.push(obj);
    });

    if (cadState.selectedObject) {
      // Re-select if it was selected
      // Check if it's still valid?
      selectObject(cadState.selectedObject);
    }

    if (cadState.transformMode) {
      setTool(cadState.transformMode === 'translate' ? 'move' : cadState.transformMode);
    }

    setStatus('CAD Mode Active');
    updateHierarchy();
  }
}

window.switchWorkspaceMode = switchWorkspaceMode;

// ============================================
// CAD Real-time Collaboration
// ============================================
function setupCADCollaboration() {
  // Get socket from WorkspaceCollaboration or create new one
  if (window.workspaceCollaboration && window.workspaceCollaboration.socket) {
    cadSocket = window.workspaceCollaboration.socket;
    cadCollabReady = true;
    console.log('🔧 CAD Collab: Using existing workspace socket');
  } else if (typeof io !== 'undefined') {
    const token = localStorage.getItem('simvex_token') || sessionStorage.getItem('simvex_token');
    if (token) {
      cadSocket = io({ auth: { token }, transports: ['websocket', 'polling'] });
      cadCollabReady = true;
      console.log('🔧 CAD Collab: Created new socket');
    }
  }

  if (!cadSocket) {
    console.warn('🔧 CAD Collab: No socket available');
    return;
  }

  // Remote collaborator selection indicators
  const remoteSelections = new Map(); // userId -> { uuid, indicator }

  // --- Listen for remote CAD events ---

  // Remote add primitive
  cadSocket.on('cad:add-primitive', (data) => {
    console.log('🔧 CAD Remote: Add primitive', data.type, 'from', data.userName);
    if (state.appMode !== 'cad') return; // Only apply in CAD mode
    addPrimitive(data.type, true, {
      uuid: data.uuid,
      name: data.name,
      position: data.position,
      rotation: data.rotation,
      scale: data.scale,
      color: data.color
    });
  });

  // Remote transform update
  cadSocket.on('cad:transform-update', (data) => {
    const obj = state.objects.find(o => o.uuid === data.uuid);
    if (!obj) return;
    if (data.position) obj.position.set(data.position.x, data.position.y, data.position.z);
    if (data.rotation) obj.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
    if (data.scale) obj.scale.set(data.scale.x, data.scale.y, data.scale.z);
    // Update UI if this object is selected
    if (state.selectedObject === obj) {
      updatePropertiesPanel();
    }
  });

  // Remote delete object
  cadSocket.on('cad:delete-object', (data) => {
    console.log('🔧 CAD Remote: Delete object', data.uuid, 'from', data.userName);
    deleteSelectedObject(true, data.uuid);
  });

  // Remote material update
  cadSocket.on('cad:material-update', (data) => {
    const obj = state.objects.find(o => o.uuid === data.uuid);
    if (!obj || !obj.material) return;
    if (data.color !== undefined) obj.material.color.set(data.color);
    if (data.metalness !== undefined) obj.material.metalness = data.metalness;
    if (data.roughness !== undefined) obj.material.roughness = data.roughness;
    if (state.selectedObject === obj) updatePropertiesPanel();
  });

  // Remote select object (show indicator)
  cadSocket.on('cad:select-object', (data) => {
    // Clean up previous indicator for this user
    const prev = remoteSelections.get(data.userId);
    if (prev && prev.indicator) {
      prev.indicator.parent?.remove(prev.indicator);
    }

    if (!data.uuid) {
      remoteSelections.delete(data.userId);
      return;
    }

    const obj = state.objects.find(o => o.uuid === data.uuid);
    if (!obj) return;

    // Create selection indicator ring for remote user
    const userColors = ['#667eea', '#f093fb', '#43e97b', '#f5576c', '#fa709a', '#4facfe'];
    let hash = 0;
    const uid = String(data.userId);
    for (let i = 0; i < uid.length; i++) hash = uid.charCodeAt(i) + ((hash << 5) - hash);
    const color = userColors[Math.abs(hash) % userColors.length];

    const ringGeo = new THREE.TorusGeometry(0.8, 0.03, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.userData.isHelper = true;
    obj.add(ring);

    remoteSelections.set(data.userId, { uuid: data.uuid, indicator: ring, userName: data.userName });
  });

  // --- Broadcast transform changes ---
  // Hook into TransformControls change event
  if (transformControls) {
    let transformThrottle = 0;
    transformControls.addEventListener('objectChange', () => {
      const obj = transformControls.object;
      if (!obj || !cadCollabReady) return;

      const now = Date.now();
      if (now - transformThrottle < 50) return; // 20fps throttle
      transformThrottle = now;

      cadSocket.emit('cad:transform-update', {
        uuid: obj.uuid,
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
        scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z }
      });
    });
  }

  console.log('🔧 CAD Collaboration initialized');
}

// ============================================
// Initialize Application
// ============================================
function init() {
  try {
    initScene();
    setupEventListeners();
    setupLearningPlatform();
    animate();

    // Initial render
    renderLessons('engineering');
    updateHierarchy();

    // Setup CAD collaboration (delayed to ensure socket is ready)
    setTimeout(() => {
      setupCADCollaboration();
    }, 2000);

    console.log('🔬 3D Engineering Lab initialized');
    const statusEl = document.getElementById('status-message');
    if (statusEl) statusEl.textContent += ' | Init OK';
  } catch (e) {
    console.error('Initialization error:', e);
    const statusEl = document.getElementById('status-message');
    if (statusEl) statusEl.textContent = 'ERROR: ' + e.message;
  }
}

// Start the application
init();
