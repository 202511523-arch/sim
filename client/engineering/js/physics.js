/**
 * Physics Engine Module - Cannon-ES Integration
 * Provides physics simulation for the 3D Science Learning Platform
 */

import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import * as THREE from 'three';

export class PhysicsEngine {
  constructor() {
    this.world = null;
    this.bodies = new Map(); // Map Three.js mesh UUID to physics body
    this.isRunning = false;
    this.timeScale = 1;
    this.fixedTimeStep = 1 / 60;
    this.maxSubSteps = 3;

    this.init();
  }

  init() {
    // Create physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0); // Earth gravity
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;

    // Default material
    this.defaultMaterial = new CANNON.Material('default');
    this.defaultContactMaterial = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: 0.3,
        restitution: 0.3
      }
    );
    this.world.addContactMaterial(this.defaultContactMaterial);

    // Add ground plane
    this.addGround();
  }

  addGround() {
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({
      mass: 0, // Static body
      shape: groundShape,
      material: this.defaultMaterial
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
    this.groundBody = groundBody;
  }

  /**
   * Create a physics body for a Three.js mesh
   */
  createBody(mesh, options = {}) {
    const {
      mass = 1,
      friction = 0.3,
      restitution = 0.3,
      type = 'dynamic' // 'dynamic', 'static', 'kinematic'
    } = options;

    let shape;
    const geometry = mesh.geometry;

    // Determine shape based on geometry type
    if (geometry.type === 'BoxGeometry') {
      const params = geometry.parameters;
      shape = new CANNON.Box(new CANNON.Vec3(
        (params.width || 1) * mesh.scale.x / 2,
        (params.height || 1) * mesh.scale.y / 2,
        (params.depth || 1) * mesh.scale.z / 2
      ));
    } else if (geometry.type === 'SphereGeometry') {
      const radius = (geometry.parameters.radius || 0.5) * Math.max(mesh.scale.x, mesh.scale.y, mesh.scale.z);
      shape = new CANNON.Sphere(radius);
    } else if (geometry.type === 'CylinderGeometry') {
      const params = geometry.parameters;
      shape = new CANNON.Cylinder(
        (params.radiusTop || 0.5) * mesh.scale.x,
        (params.radiusBottom || 0.5) * mesh.scale.x,
        (params.height || 1) * mesh.scale.y,
        params.radialSegments || 16
      );
    } else {
      // Default to box approximation
      const box = new THREE.Box3().setFromObject(mesh);
      const size = box.getSize(new THREE.Vector3());
      shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    }

    // Create material
    const material = new CANNON.Material();
    const contactMaterial = new CANNON.ContactMaterial(
      material,
      this.defaultMaterial,
      { friction, restitution }
    );
    this.world.addContactMaterial(contactMaterial);

    // Create body
    const body = new CANNON.Body({
      mass: type === 'static' ? 0 : mass,
      shape: shape,
      material: material,
      position: new CANNON.Vec3(mesh.position.x, mesh.position.y, mesh.position.z),
      quaternion: new CANNON.Quaternion(
        mesh.quaternion.x,
        mesh.quaternion.y,
        mesh.quaternion.z,
        mesh.quaternion.w
      )
    });

    if (type === 'kinematic') {
      body.type = CANNON.Body.KINEMATIC;
    }

    this.world.addBody(body);
    this.bodies.set(mesh.uuid, { body, mesh });

    return body;
  }

  /**
   * Remove physics body for a mesh
   */
  removeBody(mesh) {
    const entry = this.bodies.get(mesh.uuid);
    if (entry) {
      this.world.removeBody(entry.body);
      this.bodies.delete(mesh.uuid);
    }
  }

  /**
   * Update physics simulation
   */
  update(deltaTime) {
    if (!this.isRunning) return;

    // Step the physics world
    this.world.step(this.fixedTimeStep, deltaTime * this.timeScale, this.maxSubSteps);

    // Sync Three.js meshes with physics bodies
    this.bodies.forEach(({ body, mesh }) => {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    });
  }

  /**
   * Start/resume simulation
   */
  start() {
    this.isRunning = true;
  }

  /**
   * Pause simulation
   */
  pause() {
    this.isRunning = false;
  }

  /**
   * Stop and reset simulation
   */
  stop() {
    this.isRunning = false;
    // Reset all bodies to initial positions
    this.bodies.forEach(({ body, mesh }) => {
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
    });
  }

  /**
   * Set gravity
   */
  setGravity(x, y, z) {
    this.world.gravity.set(x, y, z);
  }

  /**
   * Set time scale (slow motion / fast forward)
   */
  setTimeScale(scale) {
    this.timeScale = Math.max(0.1, Math.min(scale, 5));
  }

  /**
   * Apply force to a body
   */
  applyForce(mesh, force, point = null) {
    const entry = this.bodies.get(mesh.uuid);
    if (entry) {
      const forceVec = new CANNON.Vec3(force.x, force.y, force.z);
      if (point) {
        const pointVec = new CANNON.Vec3(point.x, point.y, point.z);
        entry.body.applyForce(forceVec, pointVec);
      } else {
        entry.body.applyForce(forceVec);
      }
    }
  }

  /**
   * Apply impulse to a body
   */
  applyImpulse(mesh, impulse, point = null) {
    const entry = this.bodies.get(mesh.uuid);
    if (entry) {
      const impulseVec = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
      if (point) {
        const pointVec = new CANNON.Vec3(point.x, point.y, point.z);
        entry.body.applyImpulse(impulseVec, pointVec);
      } else {
        entry.body.applyImpulse(impulseVec);
      }
    }
  }

  /**
   * Get body properties
   */
  getBodyProperties(mesh) {
    const entry = this.bodies.get(mesh.uuid);
    if (entry) {
      return {
        mass: entry.body.mass,
        velocity: {
          x: entry.body.velocity.x,
          y: entry.body.velocity.y,
          z: entry.body.velocity.z
        },
        angularVelocity: {
          x: entry.body.angularVelocity.x,
          y: entry.body.angularVelocity.y,
          z: entry.body.angularVelocity.z
        },
        position: {
          x: entry.body.position.x,
          y: entry.body.position.y,
          z: entry.body.position.z
        }
      };
    }
    return null;
  }

  /**
   * Set body mass
   */
  setBodyMass(mesh, mass) {
    const entry = this.bodies.get(mesh.uuid);
    if (entry) {
      entry.body.mass = mass;
      entry.body.updateMassProperties();
    }
  }

  /**
   * Reset the entire physics world
   */
  reset() {
    // Remove all bodies except ground
    this.bodies.forEach(({ body }) => {
      this.world.removeBody(body);
    });
    this.bodies.clear();
    this.isRunning = false;
  }
}

// Preset physics scenarios
export const PhysicsPresets = {
  EARTH: { gravity: [0, -9.82, 0], name: 'Earth (9.82 m/s²)' },
  MOON: { gravity: [0, -1.62, 0], name: 'Moon (1.62 m/s²)' },
  MARS: { gravity: [0, -3.71, 0], name: 'Mars (3.71 m/s²)' },
  JUPITER: { gravity: [0, -24.79, 0], name: 'Jupiter (24.79 m/s²)' },
  ZERO_G: { gravity: [0, 0, 0], name: 'Zero-G' }
};

export { CANNON };
