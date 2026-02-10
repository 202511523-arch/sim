/**
 * Robotics & Mechanical Lessons Module (Architecture Overhaul v3.3)
 * High-precision Mechanical Modeling & "Pure Displacement" Exploded View Engine
 * Fixed: Blender/CAD indexing mismatch (.00X -> _(X+1))
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CustomAssets } from '../custom-assets.js';
import { PartMetadata, getPartInfo, normalizePartName } from '../part-metadata.js';

const gltfLoader = new GLTFLoader();

// ============================================
// Advanced Material System
// ============================================

const Materials = {
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.3 }),
  industrialRed: new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.3, roughness: 0.3 }),
  industrialBlue: new THREE.MeshStandardMaterial({ color: 0x1976d2, metalness: 0.3, roughness: 0.3 }),
  matteBlack: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.1, roughness: 0.8 }),
  aluminum: new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7, roughness: 0.4 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 }),
  circuitGreen: new THREE.MeshStandardMaterial({ color: 0x2e7d32, metalness: 0.1, roughness: 0.5 })
};

// ============================================
// Pure Displacement Engine (v3.3)
// ============================================

const setupCustomModelDisassembly = (model, section, options = {}) => {
  const {
    explosionIntensity = 1.0,
    metadataHeuristic = null,
    radialSuppressAxis = null,
    dampenY = 1.0,
    staticObjectName = null,
    centerObjectName = null,
    topologicalMode = 'centric',
    manualGroups = [],
    autoGroup = false,
    autoGroupIgnore = [],
    customPartDirections = {}, // { 'PartName': THREE.Vector3 }
    getSelectiveSuppressAxis = null // (name) => { x: bool, y: bool, z: bool }
  } = options;

  model.updateMatrixWorld(true);

  // 1. Calculate Robust Center
  const meshCentroids = [];
  model.traverse(child => {
    if (child.isMesh) {
      if (child.geometry.boundingBox === null) child.geometry.computeBoundingBox();
      const localCenter = new THREE.Vector3();
      child.geometry.boundingBox.getCenter(localCenter);
      const worldCenter = localCenter.clone().applyMatrix4(child.matrixWorld);
      meshCentroids.push(worldCenter);
    }
  });

  let modelCenter = new THREE.Vector3();
  if (meshCentroids.length > 0) {
    meshCentroids.forEach(c => modelCenter.add(c));
    modelCenter.divideScalar(meshCentroids.length);
  } else {
    const modelBox = new THREE.Box3().setFromObject(model);
    modelBox.getCenter(modelCenter);
  }

  // Pivot Adjustment
  if (centerObjectName) {
    let centerObj = null;
    const targetNorm = normalizePartName(centerObjectName);
    model.traverse(child => {
      if (child.name && normalizePartName(child.name) === targetNorm) centerObj = child;
    });
    if (centerObj) {
      centerObj.updateMatrixWorld(true);
      modelCenter.setFromMatrixPosition(centerObj.matrixWorld);
    }
  }

  const modelRadius = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).length() || 1.0;
  const staticNorm = normalizePartName(staticObjectName);

  // Identify Logic Units
  const objectToUnit = new Map();
  const unitData = new Map(); // Unit leader -> { center, name }
  const processedMeshes = new Set();

  // A. Process Manual Groups
  manualGroups.forEach((groupNames, idx) => {
    const meshes = [];
    const normalizedRules = groupNames.map(n => normalizePartName(n));
    let groupName = `ManualGroup_${idx}`;

    model.traverse(child => {
      if (child.isMesh) {
        const normName = normalizePartName(child.name);
        // Use EXACT normalized matching to prevent collisions
        if (normalizedRules.some(rule => rule === normName)) {
          meshes.push(child);
          processedMeshes.add(child);
        }
      }
    });

    if (meshes.length > 0) {
      const leader = meshes[0];
      meshes.forEach(m => objectToUnit.set(m, leader));

      const collectiveBox = new THREE.Box3();
      meshes.forEach(m => collectiveBox.expandByObject(m));
      const center = new THREE.Vector3();
      collectiveBox.getCenter(center);

      unitData.set(leader, { center, name: groupName });
      leader.userData.groupMembers = meshes;
    }
  });

  // B. Auto Grouping
  if (autoGroup) {
    const autoGroups = new Map(); // BaseName -> [meshes]

    model.traverse(child => {
      if (child.isMesh && !processedMeshes.has(child)) {
        // Parse Name: Check for _Digit or .Digit suffix
        // Example: Solid2001_1 or Solid2001.001 -> Base: Solid2001
        const name = child.name;
        let baseName = name;

        // Regex to find Base_N or Base.N pattern
        const match = name.match(/^(.+)[_.]\d+$/);
        if (match) {
          baseName = match[1];
        }

        // Check ignore list (normalized)
        const normBase = normalizePartName(baseName);
        const shouldIgnore = autoGroupIgnore.some(ignore => normalizePartName(ignore) === normBase);

        if (!shouldIgnore && match) {
          if (!autoGroups.has(baseName)) autoGroups.set(baseName, []);
          autoGroups.get(baseName).push(child);
          processedMeshes.add(child);
        }
      }
    });

    // Register Auto Groups
    autoGroups.forEach((meshes, baseName) => {
      if (meshes.length > 0) { // Even single items can be groups if matched pattern
        const leader = meshes[0];
        meshes.forEach(m => objectToUnit.set(m, leader));

        const collectiveBox = new THREE.Box3();
        meshes.forEach(m => collectiveBox.expandByObject(m));
        const center = new THREE.Vector3();
        collectiveBox.getCenter(center);

        unitData.set(leader, { center, name: baseName });
        leader.userData.groupMembers = meshes;
      }
    });
  }

  // C. Identify top-level units for remaining objects
  let topUnits = model.children;
  if (topUnits.length === 1 && (topUnits[0].isGroup || topUnits[0].type === 'Object3D')) {
    topUnits = topUnits[0].children;
  }

  topUnits.forEach(unit => {
    // If unit is already handled (e.g. it's a mesh in a group), skip
    // But simple traversal:
    unit.traverse(child => {
      if (child.isMesh && !objectToUnit.has(child)) {
        objectToUnit.set(child, unit);
      }
    });

    // If this unit is effectively a new group leader
    if (!unitData.has(unit)) {
      // Check if ANY child is already claimed. If so, this unit logic is tricky via traversal.
      // Simply: If the unit itself is a Mesh and not claimed, claim it.
      // If it's a Group, claim its unclaimed children.

      // Simplified: Just calculate center for the unit itself (group or mesh)
      // But we need to be careful not to override existing group assignments from children.
      // Current Simple Logic: Treat the top-level node as the unit for any UNCLAIMED children.

      let hasUnclaimed = false;
      const unitBox = new THREE.Box3();

      unit.traverse(child => {
        if (child.isMesh && objectToUnit.get(child) === unit) {
          hasUnclaimed = true;
          unitBox.expandByObject(child);
        }
      });

      if (hasUnclaimed) {
        if (unitBox.isEmpty()) unitBox.setFromObject(unit); // Fallback
        const center = new THREE.Vector3();
        unitBox.getCenter(center);
        unitData.set(unit, { center, name: unit.name });
      }
    }
  });

  // 2. Setup Metadata
  model.traverse(child => {
    if (child.isMesh) {
      child.userData.isSelectable = true;
      let info = { name: child.name || 'Component', description: 'A component of the mechanical system.' };
      if (metadataHeuristic) {
        const result = metadataHeuristic(child.name);
        if (result) info = result;
      }

      // Auto-group name override
      const unit = objectToUnit.get(child);
      if (unit && unitData.has(unit)) {
        // If part of a group, maybe share the name?
        // For now keep individual names unless it's a "part".
        // The user wants "Group behavior".
        child.userData.parentGroup = unit; // Link for selection logic
      }

      child.userData.displayName = info.name;
      child.userData.description = info.description;
    }
  });

  // 3. Calculate Displacements
  unitData.forEach((data, unit) => {
    unit.userData.originalPosition = unit.position.clone();

    // World Direction
    let worldDir = data.center.clone().sub(modelCenter);
    const distFromCenter = worldDir.length();

    let mag = modelRadius * 0.12 * explosionIntensity;
    const propFactor = 0.5 + (distFromCenter / modelRadius) * 0.5;
    mag *= propFactor;

    if (radialSuppressAxis === 'x') worldDir.x *= 0.1;
    if (radialSuppressAxis === 'y') worldDir.y *= 0.1;
    if (radialSuppressAxis === 'z') worldDir.z *= 0.1;

    // Selective Suppression (New v3.4 feature)
    if (getSelectiveSuppressAxis) {
      const suppress = getSelectiveSuppressAxis(data.name);
      if (suppress) {
        if (suppress.x) worldDir.x = 0;
        if (suppress.y) worldDir.y = 0;
        if (suppress.z) worldDir.z = 0;
      }
    }

    if (worldDir.length() < 0.001) worldDir.set(0, 1, 0);
    worldDir.normalize();

    // Check Custom Direction
    // Check against Unit Name (e.g. ManualGroup_0 or specific part name)
    // Also check if any mesh in this unit matches the custom part rules
    // Simplest: Check if the unit name allows override, OR check meshes.

    // Helper to find normalized match
    const findCustomDir = (name) => {
      const norm = normalizePartName(name);
      for (const [key, vector] of Object.entries(customPartDirections)) {
        if (normalizePartName(key) === norm) return vector;
      }
      return null;
    };

    let customDir = null;
    // Check unit name (might be group name)
    customDir = findCustomDir(data.name);

    // Check children names if not found
    if (!customDir) {
      unit.traverse(child => {
        if (!customDir && child.isMesh && objectToUnit.get(child) === unit) {
          customDir = findCustomDir(child.name);
        }
      });
    }

    if (customDir) {
      worldDir.copy(customDir).normalize();
      // If custom direction is set, maybe boost mag? Keep standard mag for consistency.
    }

    // Static Check
    const normName = normalizePartName(unit.name);
    // Also check if any child OR group member is the static object
    let isStatic = (staticNorm && normName === staticNorm);
    if (!isStatic && staticNorm) {
      if (unit.userData.groupMembers) {
        if (unit.userData.groupMembers.some(m => normalizePartName(m.name) === staticNorm)) {
          isStatic = true;
        }
      }
      if (!isStatic) {
        unit.traverse(child => {
          if (child.isMesh && (objectToUnit.get(child) === unit || !objectToUnit.has(child))) {
            if (normalizePartName(child.name) === staticNorm) isStatic = true;
          }
        });
      }
    }

    if (!isStatic) {
      const worldDelta = worldDir.clone().multiplyScalar(mag);
      worldDelta.y *= dampenY;

      model.traverse(child => {
        if (objectToUnit.get(child) === unit && child.isMesh) {
          if (!child.userData.originalPosition) child.userData.originalPosition = child.position.clone();

          if (child.parent) {
            const parentScale = new THREE.Vector3();
            const parentQuat = new THREE.Quaternion();
            child.parent.getWorldScale(parentScale);
            child.parent.getWorldQuaternion(parentQuat);

            const localDelta = worldDelta.clone().applyQuaternion(parentQuat.clone().invert());
            localDelta.x /= parentScale.x || 1;
            localDelta.y /= parentScale.y || 1;
            localDelta.z /= parentScale.z || 1;

            child.userData.explosionOffset = localDelta;
          }
        }
      });
    } else {
      model.traverse(child => {
        if (objectToUnit.get(child) === unit && child.isMesh) {
          child.userData.explosionOffset = new THREE.Vector3(0, 0, 0);
          if (!child.userData.originalPosition) child.userData.originalPosition = child.position.clone();
        }
      });
    }
  });

  return { modelCenter };
};

const explosionUpdate = (objects, delta) => {
  const group = objects[0];
  if (!group || !group.userData) return;

  const isExploded = group.userData.isExploded;
  const targetProgress = isExploded ? 1 : 0;

  if (group.userData.explosionProgress === undefined) group.userData.explosionProgress = 0;

  if (Math.abs(group.userData.explosionProgress - targetProgress) > 0.001) {
    group.userData.explosionProgress += (targetProgress - group.userData.explosionProgress) * 5 * delta;

    group.traverse(child => {
      if (child.userData && child.userData.explosionOffset) {
        const offset = child.userData.explosionOffset.clone().multiplyScalar(group.userData.explosionProgress);
        const originalPos = child.userData.originalPosition || new THREE.Vector3();
        child.position.set(originalPos.x + offset.x, originalPos.y + offset.y, originalPos.z + offset.z);
      }
    });
  }
};

// ============================================
// Lesson Definitions
// ============================================

export const RoboticsLessons = {
  v4Engine: {
    id: 'v4-engine',
    name: 'V4 Cylinder Engine Structure (Precise-Exploded)',
    subject: 'engineering',
    topic: 'mechanical',
    description: 'Crank and piston mechanism of a V4 engine implemented with high-precision engineering design.',
    setup: (scene, physics, THREE) => {
      const root = new THREE.Group();
      root.name = 'V4_Custom_Root';

      const custom = CustomAssets.v4Engine.fullModel;
      if (custom && custom.url) {
        gltfLoader.load(custom.url, (gltf) => {
          const model = gltf.scene;
          model.scale.setScalar(custom.scale || 15);
          if (custom.position) model.position.set(custom.position.x, custom.position.y, custom.position.z);

          // Flatten Hierarchy: Detach all meshes from their original parents and attach to root model
          // This prevents internal groups (like "Solid1003") from being treated as single units
          const meshes = [];
          model.traverse(child => {
            if (child.isMesh) meshes.push(child);
          });
          meshes.forEach(mesh => {
            // Re-parent to model root, preserving world transform
            model.attach(mesh);
          });

          setupCustomModelDisassembly(model, 'v4Engine', {
            explosionIntensity: 2.4, // Increased intensity for better visibility
            // radialSuppressAxis: 'x', // REMOVED: Allow expansion in X axis too for Crankshaft separation
            staticObjectName: '솔리드1003_1', // Engine Block as static anchor
            centerObjectName: '솔리드1003_1',
            autoGroup: false, // EXPLICITLY FALSE to prevent "Solid1003" grouping
            manualGroups: [
              ['솔리드1003_2', '솔리드1003_1']
            ],
            getSelectiveSuppressAxis: (name) => {
              // Pistons, Rods, Crankshaft, and Bolts move freely (no suppression)
              const lower = name.toLowerCase();
              if (lower.includes('piston') ||
                lower.includes('rod') ||
                lower.includes('crankshaft') ||
                lower.includes('bolt')) {
                return { x: false, y: false, z: false };
              }
              // Other parts move only in Z
              return { x: true, y: true, z: false };
            },
            metadataHeuristic: (name) => getPartInfo(name, 'v4Engine')
          });
          root.add(model);
        });
      }
      scene.add(root);
      return { objects: [root], mainObject: root };
    },
    onUpdate: explosionUpdate,
    toggleExplode: (objects) => { objects[0].userData.isExploded = !objects[0].userData.isExploded; }
  },

  robotGripper: {
    id: 'robot-gripper',
    name: 'Precision Robot Gripper (Precise-Exploded)',
    description: 'A two-finger parallel gripper combining a servo motor and a gear link mechanism.',
    setup: (scene, physics, THREE) => {
      const root = new THREE.Group();
      root.name = 'Gripper_Custom_Root';

      const custom = CustomAssets.robotGripper.fullModel;
      if (custom && custom.url) {
        gltfLoader.load(custom.url, (gltf) => {
          const model = gltf.scene;
          model.scale.setScalar(custom.scale || 12);
          if (custom.position) model.position.set(custom.position.x, custom.position.y, custom.position.z);

          setupCustomModelDisassembly(model, 'robotGripper', {
            explosionIntensity: 0.3,
            staticObjectName: 'Solid1008',
            centerObjectName: 'Solid1008',
            metadataHeuristic: (name) => getPartInfo(name, 'robotGripper')
          });
          root.add(model);
        });
      }
      scene.add(root);
      return { objects: [root], mainObject: root };
    },
    onUpdate: explosionUpdate,
    toggleExplode: (objects) => { objects[0].userData.isExploded = !objects[0].userData.isExploded; }
  },

  robotArm: {
    id: 'robot-arm',
    name: '6-Axis Industrial Robot Arm (Precise-Exploded)',
    setup: (scene, physics, THREE) => {
      const root = new THREE.Group();
      root.name = 'RobotArm_Custom_Root';

      const custom = CustomAssets.robotArm.fullModel;
      if (custom && custom.url) {
        gltfLoader.load(custom.url, (gltf) => {
          const model = gltf.scene;
          model.scale.setScalar(custom.scale || 16);
          setupCustomModelDisassembly(model, 'robotArm', {
            explosionIntensity: 0.8,
            staticObjectName: 'Solid1_2',
            centerObjectName: 'Solid1_2',
            dampenY: 0.3,
            autoGroup: true,
            autoGroupIgnore: ['Solid1'],
            manualGroups: [
              ['Solid1_2', 'Solid1_1'],
              ['Solid1_3', 'Solid1_1001'],
              ['Solid1_2002', 'Solid1_3001', 'Solid1_1002'],
              ['Solid1001_1', 'Solid1001_3', 'Solid1001_2'],
              ['Solid1002_1', 'Solid1002_2', 'Solid1002_3'],
              ['Solid1003', 'Solid1003_1'],
              ['Solid1004_1', 'Solid1004'],
              ['Solid1005', 'Solid1005_1'],
              ['Solid1006', 'Solid1006_1', 'Solid1006_2'],
              ['Solid1011', 'Solid1012'],
              // Explicitly group user mentioned parts if needed, but autoGroup should catch them
              // ['Solid2001_1', 'Solid2001_2'] -> caught by autoGroup
            ],
            metadataHeuristic: (name) => getPartInfo(name, 'robotArm')
          });
          root.add(model);
        });
      }
      scene.add(root);
      return { objects: [root] };
    },
    onUpdate: explosionUpdate,
    toggleExplode: (objects) => { objects[0].userData.isExploded = !objects[0].userData.isExploded; }
  },

  suspension: {
    id: 'suspension',
    name: 'High-Load Suspension (Precise-Exploded)',
    setup: (scene, physics, THREE) => {
      const root = new THREE.Group();
      const custom = CustomAssets.suspension.fullModel;
      if (custom && custom.url) {
        gltfLoader.load(custom.url, (gltf) => {
          const model = gltf.scene;
          model.scale.setScalar(custom.scale || 15);
          setupCustomModelDisassembly(model, 'suspension', {
            explosionIntensity: 0.4, // Reduced intensity for tighter disassembly
            radialSuppressAxis: 'y',
            centerObjectName: 'Solid1020_1',
            staticObjectName: 'Solid1020_1',
            autoGroup: true,
            manualGroups: [
              ['Solid1020_1', 'Solid1020']
            ],
            customPartDirections: {
              'Solid1008': new THREE.Vector3(-1, 0, 0), // Coil Spring -> Left
              'Solid1002': new THREE.Vector3(1, 0, 0),  // Nut/Bolt -> Right
              'Solid1007': new THREE.Vector3(0, 1, 0)   // Piston Rod -> Up
            },
            metadataHeuristic: (name) => getPartInfo(name, 'suspension')
          });
          root.add(model);
        });
      }
      scene.add(root);
      return { objects: [root], mainObject: root };
    },
    onUpdate: explosionUpdate,
    toggleExplode: (objects) => { objects[0].userData.isExploded = !objects[0].userData.isExploded; }
  },

  leafSpring: {
    id: 'leaf-spring',
    name: 'Multi-Leaf Spring (Precise-Exploded)',
    setup: (scene, physics, THREE) => {
      const root = new THREE.Group();
      const custom = CustomAssets.leafSpring.fullModel;
      if (custom && custom.url) {
        gltfLoader.load(custom.url, (gltf) => {
          const model = gltf.scene;
          model.scale.setScalar(custom.scale || 25);
          setupCustomModelDisassembly(model, 'leafSpring', {
            explosionIntensity: 0.4,
            radialSuppressAxis: 'x', // Leaf springs are usually long along X or Z.
            staticObjectName: 'Solid1031_1', // Spring Leaf Pack as static anchor
            centerObjectName: 'Solid1031_1',
            autoGroup: true,
            manualGroups: [
              ['Solid1033', 'Solid1033_1'],
              ['Solid1032', 'Solid1032_1'],
              ['Solid1030', 'Solid1030_1'],
              ['Solid1029', 'Solid1029_1'],
              ['Solid2001_3', 'Solid2001_2']
            ],
            metadataHeuristic: (name) => getPartInfo(name, 'leafSpring')
          });
          root.add(model);
        });
      }
      scene.add(root);
      return { objects: [root], mainObject: root };
    },
    onUpdate: explosionUpdate,
    toggleExplode: (objects) => { objects[0].userData.isExploded = !objects[0].userData.isExploded; }
  }
};

export function getAllRoboticsLessons() { return Object.values(RoboticsLessons); }
export function getRoboticsLessonById(id) { return Object.values(RoboticsLessons).find(lesson => lesson.id === id); }
export default RoboticsLessons;
