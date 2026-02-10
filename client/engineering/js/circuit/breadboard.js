/**
 * Breadboard Module
 * Virtual breadboard with pin connections and component placement
 */

import * as THREE from 'three';

export class Breadboard {
  constructor() {
    this.rows = 30;           // Number of rows
    this.powerRails = 2;      // Top and bottom power rails
    this.holesPerRow = 10;    // 5 on each side + gap

    this.holes = new Map();   // Position -> hole data
    this.connections = [];    // Internal connections
    this.wires = [];          // External wires
    this.placedComponents = []; // Components on the board

    this.mesh = null;
    this.holeMeshes = new Map();

    this.holeSpacing = 0.1;   // 2.54mm in 3D units (scaled)

    this.initHoles();
  }

  /**
   * Initialize hole grid with internal connections
   */
  initHoles() {
    // Power rails (horizontally connected in groups of 5)
    for (let rail = 0; rail < 2; rail++) {
      const y = rail === 0 ? 1 : -1; // Top and bottom
      for (let type = 0; type < 2; type++) { // + and - rails
        for (let x = 0; x < this.rows; x++) {
          const id = `rail_${rail}_${type}_${x}`;
          const groupId = `rail_${rail}_${type}_${Math.floor(x / 5)}`;
          this.holes.set(id, {
            id,
            x: x * this.holeSpacing - (this.rows * this.holeSpacing) / 2,
            y: 0,
            z: (y * 0.5) + (type * 0.1 - 0.05),
            group: groupId,
            type: type === 0 ? 'positive' : 'negative',
            connected: null,
            isRail: true
          });
        }
      }
    }

    // Main breadboard area (5 holes vertically connected on each side)
    for (let row = 0; row < this.rows; row++) {
      // Left side (columns A-E, internally connected)
      for (let col = 0; col < 5; col++) {
        const id = `main_${row}_L${col}`;
        const groupId = `main_${row}_L`;
        this.holes.set(id, {
          id,
          x: row * this.holeSpacing - (this.rows * this.holeSpacing) / 2,
          y: 0,
          z: -0.2 - col * this.holeSpacing,
          group: groupId,
          type: 'main',
          column: String.fromCharCode(65 + col), // A-E
          row: row + 1,
          connected: null,
          isRail: false
        });
      }

      // Right side (columns F-J, internally connected)
      for (let col = 0; col < 5; col++) {
        const id = `main_${row}_R${col}`;
        const groupId = `main_${row}_R`;
        this.holes.set(id, {
          id,
          x: row * this.holeSpacing - (this.rows * this.holeSpacing) / 2,
          y: 0,
          z: 0.2 + col * this.holeSpacing,
          group: groupId,
          type: 'main',
          column: String.fromCharCode(70 + col), // F-J
          row: row + 1,
          connected: null,
          isRail: false
        });
      }
    }
  }

  /**
   * Create 3D mesh for breadboard
   */
  createMesh(THREE) {
    const group = new THREE.Group();
    group.name = 'Breadboard';

    // Main board body
    const boardWidth = this.rows * this.holeSpacing + 0.4;
    const boardDepth = 1.4;
    const boardHeight = 0.1;

    const boardGeo = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,  // Beige/white color
      roughness: 0.8
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = -boardHeight / 2;
    board.receiveShadow = true;
    group.add(board);

    // Power rail strips (red and blue)
    const railColors = [0xef4444, 0x3b82f6]; // Red (+), Blue (-)
    for (let rail = 0; rail < 2; rail++) {
      const z = rail === 0 ? 0.55 : -0.55;
      for (let type = 0; type < 2; type++) {
        const stripGeo = new THREE.BoxGeometry(boardWidth - 0.1, 0.02, 0.08);
        const stripMat = new THREE.MeshStandardMaterial({ color: railColors[type] });
        const strip = new THREE.Mesh(stripGeo, stripMat);
        strip.position.set(0, 0.01, z + (type * 0.1 - 0.05));
        group.add(strip);
      }
    }

    // Center divider
    const dividerGeo = new THREE.BoxGeometry(boardWidth - 0.2, 0.03, 0.15);
    const dividerMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const divider = new THREE.Mesh(dividerGeo, dividerMat);
    divider.position.set(0, 0.01, 0);
    group.add(divider);

    // Create holes
    const holeGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

    this.holes.forEach((hole, id) => {
      const holeMesh = new THREE.Mesh(holeGeo, holeMat.clone());
      holeMesh.position.set(hole.x, 0.01, hole.z);
      holeMesh.name = id;
      holeMesh.userData.hole = hole;
      group.add(holeMesh);
      this.holeMeshes.set(id, holeMesh);
    });

    // Row/column labels
    this.addLabels(group, THREE);

    this.mesh = group;
    return group;
  }

  /**
   * Add row and column labels
   */
  addLabels(group, THREE) {
    // This would require a font loader for text
    // For simplicity, we'll skip actual text rendering
    // Could use sprites or canvas textures in production
  }

  /**
   * Place a component on the breadboard
   */
  placeComponent(component, startHoleId, endHoleId) {
    const startHole = this.holes.get(startHoleId);
    const endHole = this.holes.get(endHoleId);

    if (!startHole || !endHole) {
      console.error('Invalid hole IDs');
      return false;
    }

    // Check if holes are available
    if (startHole.connected || endHole.connected) {
      console.error('Holes already occupied');
      return false;
    }

    // Connect component to holes
    component.nodeA = startHole.group;
    component.nodeB = endHole.group;
    startHole.connected = component;
    endHole.connected = component;

    // Position component mesh between holes
    if (component.mesh) {
      const midX = (startHole.x + endHole.x) / 2;
      const midZ = (startHole.z + endHole.z) / 2;
      component.mesh.position.set(midX, 0.15, midZ);

      // Rotate to align with holes
      const angle = Math.atan2(endHole.z - startHole.z, endHole.x - startHole.x);
      component.mesh.rotation.y = -angle;
    }

    this.placedComponents.push({
      component,
      startHole: startHoleId,
      endHole: endHoleId
    });

    return true;
  }

  /**
   * Remove a component from the breadboard
   */
  removeComponent(component) {
    const placement = this.placedComponents.find(p => p.component === component);
    if (placement) {
      const startHole = this.holes.get(placement.startHole);
      const endHole = this.holes.get(placement.endHole);

      if (startHole) startHole.connected = null;
      if (endHole) endHole.connected = null;

      const idx = this.placedComponents.indexOf(placement);
      this.placedComponents.splice(idx, 1);
    }
  }

  /**
   * Add a wire connection between two holes
   */
  addWire(startHoleId, endHoleId, color = 0xff0000) {
    const startHole = this.holes.get(startHoleId);
    const endHole = this.holes.get(endHoleId);

    if (!startHole || !endHole) {
      console.error('Invalid hole IDs for wire');
      return null;
    }

    const wire = {
      id: `wire_${Date.now()}`,
      startHole: startHoleId,
      endHole: endHoleId,
      color,
      mesh: null
    };

    this.wires.push(wire);

    return wire;
  }

  /**
   * Create wire mesh
   */
  createWireMesh(wire, THREE) {
    const startHole = this.holes.get(wire.startHole);
    const endHole = this.holes.get(wire.endHole);

    if (!startHole || !endHole) return null;

    const start = new THREE.Vector3(startHole.x, 0.05, startHole.z);
    const end = new THREE.Vector3(endHole.x, 0.05, endHole.z);

    // Create curved wire path
    const midHeight = 0.15 + Math.random() * 0.1;
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      midHeight,
      (start.z + end.z) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(20);

    const wireGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      20,
      0.015,
      8,
      false
    );
    const wireMat = new THREE.MeshStandardMaterial({
      color: wire.color,
      metalness: 0.3,
      roughness: 0.6
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.name = wire.id;
    wireMesh.userData.wire = wire;

    wire.mesh = wireMesh;
    return wireMesh;
  }

  /**
   * Remove a wire
   */
  removeWire(wireId) {
    const idx = this.wires.findIndex(w => w.id === wireId);
    if (idx > -1) {
      const wire = this.wires[idx];
      if (wire.mesh && wire.mesh.parent) {
        wire.mesh.parent.remove(wire.mesh);
      }
      this.wires.splice(idx, 1);
    }
  }

  /**
   * Get all connected groups (for circuit analysis)
   */
  getConnectedGroups() {
    const groups = new Map();

    this.holes.forEach((hole) => {
      if (!groups.has(hole.group)) {
        groups.set(hole.group, []);
      }
      groups.get(hole.group).push(hole);
    });

    // Add wire connections
    this.wires.forEach(wire => {
      const startGroup = this.holes.get(wire.startHole)?.group;
      const endGroup = this.holes.get(wire.endHole)?.group;

      if (startGroup && endGroup && startGroup !== endGroup) {
        // Merge groups (simplified - in real implementation, use union-find)
        const endHoles = groups.get(endGroup) || [];
        const startHoles = groups.get(startGroup) || [];
        groups.set(startGroup, [...startHoles, ...endHoles]);
        groups.delete(endGroup);
      }
    });

    return groups;
  }

  /**
   * Highlight a hole on hover
   */
  highlightHole(holeId, highlight = true) {
    const holeMesh = this.holeMeshes.get(holeId);
    if (holeMesh) {
      holeMesh.material.color.setHex(highlight ? 0x00ff00 : 0x333333);
      holeMesh.scale.setScalar(highlight ? 1.5 : 1);
    }
  }

  /**
   * Get hole at position (for raycasting)
   */
  getHoleAtPosition(x, z) {
    let closest = null;
    let minDist = Infinity;

    this.holes.forEach((hole, id) => {
      const dist = Math.sqrt((hole.x - x) ** 2 + (hole.z - z) ** 2);
      if (dist < minDist && dist < 0.05) {
        minDist = dist;
        closest = id;
      }
    });

    return closest;
  }

  /**
   * Clear all components and wires
   */
  clear() {
    this.placedComponents.forEach(p => {
      const startHole = this.holes.get(p.startHole);
      const endHole = this.holes.get(p.endHole);
      if (startHole) startHole.connected = null;
      if (endHole) endHole.connected = null;
    });
    this.placedComponents = [];

    this.wires.forEach(w => {
      if (w.mesh && w.mesh.parent) {
        w.mesh.parent.remove(w.mesh);
      }
    });
    this.wires = [];
  }
}

export default Breadboard;
