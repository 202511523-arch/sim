/**
 * Circuit Designer (TinkerCAD-style)
 * Interactive drag-and-drop circuit design interface
 */

import * as THREE from 'three';
import { CircuitEngine } from './circuit-engine.js';
import { ComponentFactory, Resistor, LED, Battery, Switch } from './circuit-components.js';
import { Breadboard } from './breadboard.js';
import { ArduinoUno, RaspberryPiPico } from './microcontrollers.js';

export class CircuitDesigner {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Circuit state
    this.engine = new CircuitEngine();
    this.breadboard = null;
    this.components = [];
    this.wires = [];
    this.boards = [];

    // Interaction state
    this.selectedComponent = null;
    this.isDragging = false;
    this.dragOffset = new THREE.Vector3();
    this.isWiring = false;
    this.wireStart = null;
    this.tempWire = null;

    // Raycaster for picking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Component library
    this.componentLibrary = {
      resistor: { name: 'Resistor', icon: 'straighten', factory: (id) => ComponentFactory.createResistor(id, null, null, 220) },
      capacitor: { name: 'Capacitor', icon: 'adjust', factory: (id) => ComponentFactory.createCapacitor(id, null, null, 0.0001) },
      led_red: { name: 'LED (Red)', icon: 'lightbulb', factory: (id) => ComponentFactory.createLED(id, null, null, 'red') },
      led_green: { name: 'LED (Green)', icon: 'lightbulb', factory: (id) => ComponentFactory.createLED(id, null, null, 'green') },
      led_blue: { name: 'LED (Blue)', icon: 'lightbulb', factory: (id) => ComponentFactory.createLED(id, null, null, 'blue') },
      battery_5v: { name: 'Power 5V', icon: 'battery_charging_full', factory: (id) => ComponentFactory.createBattery(id, null, null, 5) },
      battery_9v: { name: 'Power 9V', icon: 'battery_charging_full', factory: (id) => ComponentFactory.createBattery(id, null, null, 9) },
      switch: { name: 'Switch', icon: 'toggle_off', factory: (id) => ComponentFactory.createSwitch(id, null, null, false) },
      arduino: { name: 'Arduino Uno', icon: 'developer_board', factory: (id) => new ArduinoUno(id) },
      pico: { name: 'RPi Pico', icon: 'memory', factory: (id) => new RaspberryPiPico(id) }
    };

    // Wire colors for user selection
    this.wireColors = [
      { name: 'Red', hex: 0xff0000 },
      { name: 'Black', hex: 0x000000 },
      { name: 'Yellow', hex: 0xffff00 },
      { name: 'Green', hex: 0x00ff00 },
      { name: 'Blue', hex: 0x0000ff },
      { name: 'Orange', hex: 0xff8800 },
      { name: 'White', hex: 0xffffff }
    ];
    this.currentWireColor = 0xff0000;

    // Groups for organization
    this.designerGroup = new THREE.Group();
    this.designerGroup.name = 'CircuitDesigner';

    // Work surface
    this.createWorkSurface();
  }

  /**
   * Create the work surface (table)
   */
  createWorkSurface() {
    // Table surface
    const tableGeo = new THREE.BoxGeometry(10, 0.1, 8);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x3d5a5b,
      roughness: 0.8
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.05;
    table.receiveShadow = true;
    table.name = 'workSurface';
    this.designerGroup.add(table);

    // Grid lines
    const gridHelper = new THREE.GridHelper(10, 40, 0x2d4445, 0x2d4445);
    gridHelper.position.y = 0.01;
    this.designerGroup.add(gridHelper);

    this.scene.add(this.designerGroup);
  }

  /**
   * Initialize with breadboard
   */
  addBreadboard(x = 0, z = 0) {
    this.breadboard = new Breadboard();
    const mesh = this.breadboard.createMesh(THREE);
    mesh.position.set(x, 0.1, z);
    this.designerGroup.add(mesh);
    return this.breadboard;
  }

  /**
   * Add a component from the library
   */
  addComponent(type, x = 0, z = 0) {
    const libItem = this.componentLibrary[type];
    if (!libItem) {
      console.error('Unknown component type:', type);
      return null;
    }

    const id = `${type}_${Date.now()}`;
    const component = libItem.factory(id);

    // Create mesh
    const mesh = component.createMesh(THREE);
    mesh.position.set(x, 0.2, z);
    mesh.userData.component = component;
    mesh.userData.type = type;
    mesh.userData.isDraggable = true;

    this.designerGroup.add(mesh);
    this.components.push({ component, mesh, type });

    // Add to circuit engine (nodes will be assigned when connected)
    this.engine.addComponent(component);

    return { component, mesh };
  }

  /**
   * Add a microcontroller board
   */
  addBoard(type, x = 0, z = 0) {
    let board;
    if (type === 'arduino') {
      board = new ArduinoUno(`arduino_${Date.now()}`);
    } else if (type === 'pico') {
      board = new RaspberryPiPico(`pico_${Date.now()}`);
    } else {
      console.error('Unknown board type:', type);
      return null;
    }

    const mesh = board.createMesh(THREE);
    mesh.position.set(x, 0.15, z);
    mesh.userData.board = board;
    mesh.userData.type = type;
    mesh.userData.isDraggable = true;

    this.designerGroup.add(mesh);
    this.boards.push({ board, mesh, type });

    return { board, mesh };
  }

  /**
   * Start drawing a wire from a point
   */
  startWire(position, nodeId = null) {
    this.isWiring = true;
    this.wireStart = { position: position.clone(), nodeId };

    // Create temporary wire visualization
    const material = new THREE.LineBasicMaterial({
      color: this.currentWireColor,
      linewidth: 3
    });
    const geometry = new THREE.BufferGeometry().setFromPoints([
      position.clone(),
      position.clone()
    ]);
    this.tempWire = new THREE.Line(geometry, material);
    this.designerGroup.add(this.tempWire);
  }

  /**
   * Update temporary wire endpoint
   */
  updateTempWire(endPosition) {
    if (this.tempWire && this.wireStart) {
      const positions = this.tempWire.geometry.attributes.position.array;
      positions[3] = endPosition.x;
      positions[4] = endPosition.y + 0.1;
      positions[5] = endPosition.z;
      this.tempWire.geometry.attributes.position.needsUpdate = true;
    }
  }

  /**
   * Complete wire connection
   */
  completeWire(endPosition, endNodeId = null) {
    if (!this.isWiring || !this.wireStart) return null;

    // Remove temp wire
    if (this.tempWire) {
      this.designerGroup.remove(this.tempWire);
      this.tempWire = null;
    }

    // Create permanent wire with curved path
    const wire = this.createCurvedWire(
      this.wireStart.position,
      endPosition,
      this.currentWireColor
    );

    wire.userData = {
      startNode: this.wireStart.nodeId,
      endNode: endNodeId,
      color: this.currentWireColor
    };

    this.wires.push(wire);
    this.designerGroup.add(wire);

    // Reset wiring state
    this.isWiring = false;
    this.wireStart = null;

    return wire;
  }

  /**
   * Create a curved wire mesh
   */
  createCurvedWire(start, end, color) {
    const height = 0.15 + Math.random() * 0.1;
    const mid = new THREE.Vector3(
      (start.x + end.x) / 2,
      Math.max(start.y, end.y) + height,
      (start.z + end.z) / 2
    );

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(start.x, start.y + 0.05, start.z),
      mid,
      new THREE.Vector3(end.x, end.y + 0.05, end.z)
    );

    const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.015, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.6
    });

    const wire = new THREE.Mesh(tubeGeo, tubeMat);
    wire.name = `wire_${Date.now()}`;

    return wire;
  }

  /**
   * Cancel current wiring operation
   */
  cancelWire() {
    if (this.tempWire) {
      this.designerGroup.remove(this.tempWire);
      this.tempWire = null;
    }
    this.isWiring = false;
    this.wireStart = null;
  }

  /**
   * Remove a wire
   */
  removeWire(wire) {
    const idx = this.wires.indexOf(wire);
    if (idx > -1) {
      this.wires.splice(idx, 1);
      this.designerGroup.remove(wire);
    }
  }

  /**
   * Remove a component
   */
  removeComponent(componentData) {
    const idx = this.components.indexOf(componentData);
    if (idx > -1) {
      this.components.splice(idx, 1);
      this.designerGroup.remove(componentData.mesh);
      this.engine.removeComponent(componentData.component);
    }
  }

  /**
   * Handle mouse down for interaction
   */
  onMouseDown(event, domElement) {
    this.updateMouse(event, domElement);

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.designerGroup.children, true);

    for (const intersect of intersects) {
      let obj = intersect.object;

      // Find draggable parent
      while (obj && !obj.userData.isDraggable) {
        obj = obj.parent;
      }

      if (obj && obj.userData.isDraggable) {
        // Check for Shift+click to start wiring
        if (event.shiftKey) {
          this.startWire(intersect.point);
          return;
        }

        // Start dragging
        this.selectedComponent = obj;
        this.isDragging = true;

        // Calculate drag offset
        const planeIntersect = new THREE.Vector3();
        this.raycaster.ray.intersectPlane(this.plane, planeIntersect);
        this.dragOffset.copy(obj.position).sub(planeIntersect);

        return;
      }

      // Check for hole click (breadboard)
      if (obj.userData.hole) {
        if (this.isWiring) {
          this.completeWire(intersect.point, obj.userData.hole.id);
        } else {
          this.startWire(intersect.point, obj.userData.hole.id);
        }
        return;
      }

      // Check for pin click (Arduino/Pico)
      if (obj.userData.pinName) {
        const pinPos = new THREE.Vector3();
        obj.getWorldPosition(pinPos);

        if (this.isWiring) {
          this.completeWire(pinPos, obj.userData.pinName);
        } else {
          this.startWire(pinPos, obj.userData.pinName);
        }
        return;
      }
    }

    // Click on empty space while wiring - cancel
    if (this.isWiring) {
      this.cancelWire();
    }
  }

  /**
   * Handle mouse move for dragging
   */
  onMouseMove(event, domElement) {
    this.updateMouse(event, domElement);

    if (this.isDragging && this.selectedComponent) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const planeIntersect = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(this.plane, planeIntersect)) {
        this.selectedComponent.position.x = planeIntersect.x + this.dragOffset.x;
        this.selectedComponent.position.z = planeIntersect.z + this.dragOffset.z;
      }
    }

    if (this.isWiring) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const planeIntersect = new THREE.Vector3();

      if (this.raycaster.ray.intersectPlane(this.plane, planeIntersect)) {
        this.updateTempWire(planeIntersect);
      }
    }
  }

  /**
   * Handle mouse up
   */
  onMouseUp(event) {
    this.isDragging = false;
    this.selectedComponent = null;
  }

  /**
   * Update mouse coordinates
   */
  updateMouse(event, domElement) {
    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Set wire color
   */
  setWireColor(colorHex) {
    this.currentWireColor = colorHex;
  }

  /**
   * Run circuit simulation
   */
  runSimulation() {
    this.engine.start();
    this.engine.analyze();
  }

  /**
   * Stop simulation
   */
  stopSimulation() {
    this.engine.stop();
    this.engine.reset();
  }

  /**
   * Update simulation and visuals
   */
  update(delta) {
    if (this.engine.isRunning) {
      this.engine.step();

      // Update component visuals
      this.components.forEach(({ component }) => {
        if (component.updateVisual) {
          component.updateVisual();
        }
      });
    }
  }

  /**
   * Get component library for UI
   */
  getComponentLibrary() {
    return Object.entries(this.componentLibrary).map(([key, value]) => ({
      type: key,
      name: value.name,
      icon: value.icon
    }));
  }

  /**
   * Get wire colors for UI
   */
  getWireColors() {
    return this.wireColors;
  }

  /**
   * Clear all components and wires
   */
  clear() {
    // Remove components
    this.components.forEach(({ mesh }) => {
      this.designerGroup.remove(mesh);
    });
    this.components = [];

    // Remove boards
    this.boards.forEach(({ mesh }) => {
      this.designerGroup.remove(mesh);
    });
    this.boards = [];

    // Remove wires
    this.wires.forEach(wire => {
      this.designerGroup.remove(wire);
    });
    this.wires = [];

    // Reset engine
    this.engine.clear();
  }

  /**
   * Export circuit as JSON
   */
  exportCircuit() {
    return {
      components: this.components.map(({ component, type }) => ({
        type,
        id: component.id,
        position: component.mesh?.position.toArray(),
        properties: this.getComponentProperties(component)
      })),
      boards: this.boards.map(({ board, type }) => ({
        type,
        id: board.id,
        position: board.mesh?.position.toArray()
      })),
      wires: this.wires.map(wire => ({
        startNode: wire.userData.startNode,
        endNode: wire.userData.endNode,
        color: wire.userData.color
      }))
    };
  }

  /**
   * Get component-specific properties
   */
  getComponentProperties(component) {
    const props = {};
    if (component.resistance !== undefined) props.resistance = component.resistance;
    if (component.capacitance !== undefined) props.capacitance = component.capacitance;
    if (component.voltage !== undefined) props.voltage = component.voltage;
    if (component.color !== undefined) props.color = component.color;
    return props;
  }
}

export default CircuitDesigner;
