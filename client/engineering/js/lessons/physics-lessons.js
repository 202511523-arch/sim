/**
 * Physics Lessons Module
 * Pre-built physics experiments and simulations
 */

import * as THREE from 'three';

export const PhysicsLessons = {
  // Free Fall Experiment
  freeFall: {
    id: 'free-fall',
    name: 'Free Fall',
    subject: 'physics',
    topic: 'mechanics',
    description: 'Observe the motion of an object falling due to gravity.',
    concepts: ['Gravitational Acceleration', 'Potential Energy', 'Kinetic Energy'],
    formula: 'h = ½gt², v = gt',

    setup: (scene, physics, THREE) => {
      // Create a ball at height
      const geometry = new THREE.SphereGeometry(0.3, 32, 32);
      const material = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.3,
        roughness: 0.4
      });
      const ball = new THREE.Mesh(geometry, material);
      ball.position.set(0, 8, 0);
      ball.castShadow = true;
      ball.name = 'FreeFall_Ball';
      scene.add(ball);

      return { objects: [ball], mainObject: ball };
    },

    onStart: (objects, physics) => {
      physics.createBody(objects.mainObject, {
        mass: 1,
        restitution: 0.6
      });
    },

    getInfo: (physics, mainObject) => {
      const props = physics.getBodyProperties(mainObject);
      if (props) {
        const speed = Math.sqrt(
          props.velocity.x ** 2 +
          props.velocity.y ** 2 +
          props.velocity.z ** 2
        );
        return {
          height: props.position.y.toFixed(2) + ' m',
          speed: speed.toFixed(2) + ' m/s',
          velocity_y: props.velocity.y.toFixed(2) + ' m/s'
        };
      }
      return null;
    }
  },

  // Pendulum Motion
  pendulum: {
    id: 'pendulum',
    name: 'Pendulum Motion',
    subject: 'physics',
    topic: 'mechanics',
    description: 'Observe the periodic motion of a simple pendulum.',
    concepts: ['Period', 'Amplitude', 'Conservation of Energy'],
    formula: 'T = 2π√(L/g)',

    setup: (scene, physics) => {
      // Create pendulum pivot
      const pivotGeo = new THREE.SphereGeometry(0.1);
      const pivotMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
      const pivot = new THREE.Mesh(pivotGeo, pivotMat);
      pivot.position.set(0, 5, 0);
      scene.add(pivot);

      // Create pendulum bob
      const bobGeo = new THREE.SphereGeometry(0.3, 32, 32);
      const bobMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.4,
        roughness: 0.3
      });
      const bob = new THREE.Mesh(bobGeo, bobMat);
      bob.position.set(2, 2, 0);
      bob.castShadow = true;
      bob.name = 'Pendulum_Bob';
      scene.add(bob);

      // Create string (line)
      const stringGeo = new THREE.BufferGeometry().setFromPoints([
        pivot.position,
        bob.position
      ]);
      const stringMat = new THREE.LineBasicMaterial({ color: 0xffffff });
      const string = new THREE.Line(stringGeo, stringMat);
      string.name = 'Pendulum_String';
      scene.add(string);

      return {
        objects: [pivot, bob, string],
        mainObject: bob,
        pivot: pivot,
        string: string
      };
    },

    onUpdate: (objects, physics) => {
      // Update string position
      if (objects.string && objects.mainObject && objects.pivot) {
        const positions = objects.string.geometry.attributes.position;
        positions.setXYZ(0, objects.pivot.position.x, objects.pivot.position.y, objects.pivot.position.z);
        positions.setXYZ(1, objects.mainObject.position.x, objects.mainObject.position.y, objects.mainObject.position.z);
        positions.needsUpdate = true;
      }
    }
  },

  // Collision Experiment
  collision: {
    id: 'collision',
    name: 'Collision',
    subject: 'physics',
    topic: 'mechanics',
    description: 'Observe the collision of two objects and the conservation of momentum.',
    concepts: ['Conservation of Momentum', 'Elastic Collision', 'Inelastic Collision'],
    formula: 'm₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'',

    setup: (scene, physics) => {
      // Ball 1 (moving)
      const ball1Geo = new THREE.SphereGeometry(0.4, 32, 32);
      const ball1Mat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.2,
        roughness: 0.5
      });
      const ball1 = new THREE.Mesh(ball1Geo, ball1Mat);
      ball1.position.set(-4, 0.4, 0);
      ball1.castShadow = true;
      ball1.name = 'Collision_Ball1';
      scene.add(ball1);

      // Ball 2 (stationary)
      const ball2Geo = new THREE.SphereGeometry(0.4, 32, 32);
      const ball2Mat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.2,
        roughness: 0.5
      });
      const ball2 = new THREE.Mesh(ball2Geo, ball2Mat);
      ball2.position.set(0, 0.4, 0);
      ball2.castShadow = true;
      ball2.name = 'Collision_Ball2';
      scene.add(ball2);

      return {
        objects: [ball1, ball2],
        mainObject: ball1,
        ball1: ball1,
        ball2: ball2
      };
    },

    onStart: (objects, physics) => {
      const body1 = physics.createBody(objects.ball1, {
        mass: 1,
        restitution: 0.9
      });
      physics.createBody(objects.ball2, {
        mass: 1,
        restitution: 0.9
      });

      // Give initial velocity to ball1
      body1.velocity.set(5, 0, 0);
    },

    getInfo: (physics, objects) => {
      const p1 = physics.getBodyProperties(objects.ball1);
      const p2 = physics.getBodyProperties(objects.ball2);

      if (p1 && p2) {
        const momentum1 = p1.velocity.x * 1; // mass = 1
        const momentum2 = p2.velocity.x * 1;
        const totalMomentum = momentum1 + momentum2;

        return {
          'Ball 1 Speed': p1.velocity.x.toFixed(2) + ' m/s',
          'Ball 2 Speed': p2.velocity.x.toFixed(2) + ' m/s',
          'Total Momentum': totalMomentum.toFixed(2) + ' kg·m/s'
        };
      }
      return null;
    }
  },

  // Inclined Plane
  inclinedPlane: {
    id: 'inclined-plane',
    name: 'Inclined Plane',
    subject: 'physics',
    topic: 'mechanics',
    description: 'Observe object motion and friction on an inclined plane.',
    concepts: ['Component Force', 'Friction', 'Acceleration'],
    formula: 'a = g(sinθ - μcosθ)',

    setup: (scene, physics) => {
      // Create inclined plane
      const planeGeo = new THREE.BoxGeometry(8, 0.2, 3);
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.1,
        roughness: 0.8
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.position.set(0, 2, 0);
      plane.rotation.z = -Math.PI / 6; // 30 degrees
      plane.receiveShadow = true;
      plane.name = 'Inclined_Plane';
      scene.add(plane);

      // Create box on plane
      const boxGeo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.2,
        roughness: 0.6
      });
      const box = new THREE.Mesh(boxGeo, boxMat);
      box.position.set(-2.5, 4, 0);
      box.rotation.z = -Math.PI / 6;
      box.castShadow = true;
      box.name = 'Sliding_Box';
      scene.add(box);

      return {
        objects: [plane, box],
        mainObject: box,
        plane: plane
      };
    },

    onStart: (objects, physics) => {
      physics.createBody(objects.plane, {
        mass: 0, // static
        friction: 0.3
      });
      physics.createBody(objects.mainObject, {
        mass: 2,
        friction: 0.3
      });
    }
  },

  // Projectile Motion
  projectile: {
    id: 'projectile',
    name: 'Projectile Motion',
    subject: 'physics',
    topic: 'mechanics',
    description: 'Observe the parabolic trajectory of a projectile.',
    concepts: ['Horizontal Motion', 'Vertical Motion', 'Peak Point', 'Range'],
    formula: 'R = v₀²sin(2θ)/g, H = v₀²sin²θ/(2g)',

    setup: (scene, physics) => {
      // Create projectile
      const projGeo = new THREE.SphereGeometry(0.25, 32, 32);
      const projMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e,
        metalness: 0.4,
        roughness: 0.3
      });
      const projectile = new THREE.Mesh(projGeo, projMat);
      projectile.position.set(-5, 0.5, 0);
      projectile.castShadow = true;
      projectile.name = 'Projectile';
      scene.add(projectile);

      // Create launcher visual
      const launcherGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 16);
      const launcherMat = new THREE.MeshStandardMaterial({
        color: 0x374151,
        metalness: 0.6,
        roughness: 0.4
      });
      const launcher = new THREE.Mesh(launcherGeo, launcherMat);
      launcher.position.set(-5.5, 0.75, 0);
      launcher.rotation.z = Math.PI / 4; // 45 degrees
      scene.add(launcher);

      return {
        objects: [projectile, launcher],
        mainObject: projectile,
        launcher: launcher,
        trajectory: []
      };
    },

    onStart: (objects, physics) => {
      const body = physics.createBody(objects.mainObject, {
        mass: 0.5,
        restitution: 0.3
      });

      // Launch at 45 degrees with initial velocity
      const angle = Math.PI / 4;
      const speed = 10;
      body.velocity.set(
        speed * Math.cos(angle),
        speed * Math.sin(angle),
        0
      );
    },

    getInfo: (physics, mainObject) => {
      const props = physics.getBodyProperties(mainObject);
      if (props) {
        const speed = Math.sqrt(
          props.velocity.x ** 2 +
          props.velocity.y ** 2
        );
        return {
          'Height': props.position.y.toFixed(2) + ' m',
          'Horizontal Distance': (props.position.x + 5).toFixed(2) + ' m',
          'Speed': speed.toFixed(2) + ' m/s'
        };
      }
      return null;
    }
  }
};

// Get all lessons as array
export function getAllPhysicsLessons() {
  return Object.values(PhysicsLessons);
}

// Get lesson by ID
export function getLessonById(id) {
  return Object.values(PhysicsLessons).find(lesson => lesson.id === id);
}
