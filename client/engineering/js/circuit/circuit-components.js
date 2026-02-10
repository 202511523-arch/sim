/**
 * Circuit Components Library
 * Electronic component definitions and 3D representations
 */

import * as THREE from 'three';

// Base Component Class
export class CircuitComponent {
  constructor(id, type, nodeA, nodeB) {
    this.id = id;
    this.type = type;
    this.nodeA = nodeA;
    this.nodeB = nodeB;
    this.mesh = null;
    this.prevVoltage = 0;
    this.current = 0;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = 0;
  }

  createMesh(THREE) {
    // Override in subclasses
    return null;
  }

  updateVisual() {
    // Override in subclasses for dynamic visuals
  }
}

// ============================================
// Passive Components
// ============================================

/**
 * Resistor Component
 */
export class Resistor extends CircuitComponent {
  constructor(id, nodeA, nodeB, resistance = 1000) {
    super(id, 'resistor', nodeA, nodeB);
    this.resistance = resistance; // Ohms
    this.power = 0;
    this.tolerance = 5; // percentage
  }

  static getColorBands(resistance) {
    // 4-band resistor color code
    const colors = ['black', 'brown', 'red', 'orange', 'yellow',
      'green', 'blue', 'violet', 'gray', 'white'];
    const colorHex = [0x000000, 0x8b4513, 0xff0000, 0xffa500, 0xffff00,
      0x00ff00, 0x0000ff, 0x8b00ff, 0x808080, 0xffffff];

    const val = resistance.toString();
    const band1 = parseInt(val[0]) || 0;
    const band2 = parseInt(val[1]) || 0;
    const multiplier = Math.max(0, val.length - 2);

    return {
      band1: colorHex[band1],
      band2: colorHex[band2],
      multiplier: colorHex[multiplier] || colorHex[0],
      tolerance: 0xffd700 // gold = 5%
    };
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Color bands
    const bands = Resistor.getColorBands(this.resistance);
    const bandPositions = [-0.25, -0.1, 0.1, 0.25];
    const bandColors = [bands.band1, bands.band2, bands.multiplier, bands.tolerance];

    bandPositions.forEach((pos, i) => {
      const bandGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 16);
      const bandMat = new THREE.MeshStandardMaterial({ color: bandColors[i] });
      const band = new THREE.Mesh(bandGeo, bandMat);
      band.rotation.z = Math.PI / 2;
      band.position.x = pos;
      group.add(band);
    });

    // Leads
    const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.rotation.z = Math.PI / 2;
    lead1.position.x = -0.55;
    group.add(lead1);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.rotation.z = Math.PI / 2;
    lead2.position.x = 0.55;
    group.add(lead2);

    group.name = `Resistor_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }

  updateVisual() {
    this.power = this.current * this.current * this.resistance;
    // Could add heat glow effect for high power
  }
}

/**
 * Capacitor Component
 */
export class Capacitor extends CircuitComponent {
  constructor(id, nodeA, nodeB, capacitance = 0.000001) {
    super(id, 'capacitor', nodeA, nodeB);
    this.capacitance = capacitance; // Farads
    this.voltage = 0;
    this.isElectrolytic = capacitance > 0.000001; // >1µF typically electrolytic
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    if (this.isElectrolytic) {
      // Electrolytic capacitor (cylindrical)
      const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(body);

      // Top marking
      const topGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16);
      const topMat = new THREE.MeshStandardMaterial({ color: 0x4a4a6a });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.26;
      group.add(top);

      // Polarity stripe
      const stripeGeo = new THREE.BoxGeometry(0.02, 0.5, 0.15);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.position.set(0.24, 0, 0);
      group.add(stripe);
    } else {
      // Ceramic capacitor (disc)
      const bodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;
      group.add(body);
    }

    // Leads
    const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.position.set(-0.1, -0.45, 0);
    group.add(lead1);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.position.set(0.1, -0.45, 0);
    group.add(lead2);

    group.name = `Capacitor_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }
}

/**
 * Inductor Component
 */
export class Inductor extends CircuitComponent {
  constructor(id, nodeA, nodeB, inductance = 0.001) {
    super(id, 'inductor', nodeA, nodeB);
    this.inductance = inductance; // Henrys
    this.prevCurrent = 0;
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    // Coil representation
    const coilPoints = [];
    const coilRadius = 0.15;
    const coilHeight = 0.6;
    const turns = 8;

    for (let i = 0; i <= turns * 20; i++) {
      const t = i / (turns * 20);
      const angle = t * turns * Math.PI * 2;
      coilPoints.push(new THREE.Vector3(
        Math.cos(angle) * coilRadius,
        t * coilHeight - coilHeight / 2,
        Math.sin(angle) * coilRadius
      ));
    }

    const coilGeo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(coilPoints),
      turns * 20,
      0.03,
      8,
      false
    );
    const coilMat = new THREE.MeshStandardMaterial({
      color: 0xb87333, // Copper color
      metalness: 0.7,
      roughness: 0.3
    });
    const coil = new THREE.Mesh(coilGeo, coilMat);
    group.add(coil);

    // Core (optional ferrite)
    const coreGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 16);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    group.name = `Inductor_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }
}

// ============================================
// Active Components
// ============================================

/**
 * LED Component
 */
export class LED extends CircuitComponent {
  constructor(id, nodeA, nodeB, color = 'red') {
    super(id, 'led', nodeA, nodeB);
    this.color = color;
    this.forwardVoltage = LED.getForwardVoltage(color);
    this.brightness = 0;
    this.maxCurrent = 0.02; // 20mA
  }

  static getForwardVoltage(color) {
    const voltages = {
      red: 1.8,
      orange: 2.0,
      yellow: 2.1,
      green: 2.2,
      blue: 3.2,
      white: 3.3,
      uv: 3.5
    };
    return voltages[color] || 2.0;
  }

  static getColorHex(color) {
    const colors = {
      red: 0xff0000,
      orange: 0xff8800,
      yellow: 0xffff00,
      green: 0x00ff00,
      blue: 0x0088ff,
      white: 0xffffff,
      uv: 0x8800ff
    };
    return colors[color] || 0xff0000;
  }

  createMesh(THREE) {
    const group = new THREE.Group();
    const colorHex = LED.getColorHex(this.color);

    // LED dome
    const domeGeo = new THREE.SphereGeometry(0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.8,
      emissive: colorHex,
      emissiveIntensity: 0
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.15;
    dome.name = 'led_dome';
    group.add(dome);

    // LED base
    const baseGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.15, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.075;
    group.add(base);

    // Leads (anode is longer)
    const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });

    const cathode = new THREE.Mesh(leadGeo, leadMat);
    cathode.position.set(-0.05, -0.2, 0);
    cathode.name = 'cathode';
    group.add(cathode);

    const anodeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const anode = new THREE.Mesh(anodeGeo, leadMat);
    anode.position.set(0.05, -0.25, 0);
    anode.name = 'anode';
    group.add(anode);

    group.name = `LED_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }

  updateVisual() {
    if (this.mesh) {
      const dome = this.mesh.getObjectByName('led_dome');
      if (dome) {
        dome.material.emissiveIntensity = this.brightness;
      }
    }
  }
}

/**
 * Diode Component
 */
export class Diode extends CircuitComponent {
  constructor(id, nodeA, nodeB, model = '1N4007') {
    super(id, 'diode', nodeA, nodeB);
    this.model = model;
    this.saturationCurrent = 1e-12;
    this.forwardVoltage = 0.7;
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Cathode band
    const bandGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.08, 16);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.rotation.z = Math.PI / 2;
    band.position.x = 0.18;
    group.add(band);

    // Leads
    const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });

    const lead1 = new THREE.Mesh(leadGeo, leadMat);
    lead1.rotation.z = Math.PI / 2;
    lead1.position.x = -0.4;
    group.add(lead1);

    const lead2 = new THREE.Mesh(leadGeo, leadMat);
    lead2.rotation.z = Math.PI / 2;
    lead2.position.x = 0.4;
    group.add(lead2);

    group.name = `Diode_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }
}

/**
 * NPN Transistor Component
 */
export class TransistorNPN extends CircuitComponent {
  constructor(id, nodeB, nodeC, nodeE, model = '2N2222') {
    super(id, 'transistor_npn', nodeB, nodeC);
    this.nodeE = nodeE;
    this.model = model;
    this.beta = 100; // Current gain
    this.saturationVbe = 0.7;
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    // TO-92 package body
    const bodyShape = new THREE.Shape();
    bodyShape.absarc(0, 0, 0.2, 0, Math.PI, true);
    bodyShape.lineTo(-0.2, -0.15);
    bodyShape.lineTo(0.2, -0.15);

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 0.15, bevelEnabled: false });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    body.position.z = -0.075;
    group.add(body);

    // Three leads (E, B, C)
    const leadGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });

    const leadE = new THREE.Mesh(leadGeo, leadMat);
    leadE.position.set(-0.1, -0.35, 0);
    leadE.name = 'emitter';
    group.add(leadE);

    const leadB = new THREE.Mesh(leadGeo, leadMat);
    leadB.position.set(0, -0.35, 0);
    leadB.name = 'base';
    group.add(leadB);

    const leadC = new THREE.Mesh(leadGeo, leadMat);
    leadC.position.set(0.1, -0.35, 0);
    leadC.name = 'collector';
    group.add(leadC);

    // Label
    group.name = `Transistor_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }
}

// ============================================
// Power Components
// ============================================

/**
 * Battery / Voltage Source
 */
export class Battery extends CircuitComponent {
  constructor(id, nodePos, nodeNeg, voltage = 5) {
    super(id, 'voltage_source', nodePos, nodeNeg);
    this.voltage = voltage;
    this.isAC = false;
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    // Battery body
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d3748 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);

    // Positive terminal
    const posGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
    const posMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const pos = new THREE.Mesh(posGeo, posMat);
    pos.rotation.z = Math.PI / 2;
    pos.position.x = 0.45;
    group.add(pos);

    // Negative terminal
    const negGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
    const negMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const neg = new THREE.Mesh(negGeo, negMat);
    neg.rotation.z = Math.PI / 2;
    neg.position.x = -0.42;
    group.add(neg);

    // Label
    group.name = `Battery_${this.id}_${this.voltage}V`;
    group.userData.component = this;
    this.mesh = group;

    return group;
  }
}

/**
 * Switch Component
 */
export class Switch extends CircuitComponent {
  constructor(id, nodeA, nodeB, isClosed = false) {
    super(id, 'switch', nodeA, nodeB);
    this.isClosed = isClosed;
    this.resistance = isClosed ? 0.001 : 1e12; // Very low when closed, very high when open
  }

  toggle() {
    this.isClosed = !this.isClosed;
    this.resistance = this.isClosed ? 0.001 : 1e12;
    this.updateVisual();
  }

  createMesh(THREE) {
    const group = new THREE.Group();

    // Base
    const baseGeo = new THREE.BoxGeometry(0.4, 0.1, 0.3);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a5568 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Lever
    const leverGeo = new THREE.BoxGeometry(0.3, 0.05, 0.1);
    const leverMat = new THREE.MeshStandardMaterial({ color: 0x718096 });
    const lever = new THREE.Mesh(leverGeo, leverMat);
    lever.position.set(0, 0.1, 0);
    lever.name = 'lever';
    group.add(lever);

    // Terminals
    const termGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
    const termMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });

    const term1 = new THREE.Mesh(termGeo, termMat);
    term1.position.set(-0.15, -0.12, 0);
    group.add(term1);

    const term2 = new THREE.Mesh(termGeo, termMat);
    term2.position.set(0.15, -0.12, 0);
    group.add(term2);

    group.name = `Switch_${this.id}`;
    group.userData.component = this;
    this.mesh = group;

    this.updateVisual();
    return group;
  }

  updateVisual() {
    if (this.mesh) {
      const lever = this.mesh.getObjectByName('lever');
      if (lever) {
        lever.rotation.z = this.isClosed ? 0 : Math.PI / 6;
      }
    }
  }
}

// ============================================
// Export Component Factory
// ============================================

export const ComponentFactory = {
  createResistor: (id, nodeA, nodeB, resistance) => new Resistor(id, nodeA, nodeB, resistance),
  createCapacitor: (id, nodeA, nodeB, capacitance) => new Capacitor(id, nodeA, nodeB, capacitance),
  createInductor: (id, nodeA, nodeB, inductance) => new Inductor(id, nodeA, nodeB, inductance),
  createLED: (id, nodeA, nodeB, color) => new LED(id, nodeA, nodeB, color),
  createDiode: (id, nodeA, nodeB, model) => new Diode(id, nodeA, nodeB, model),
  createTransistorNPN: (id, nodeB, nodeC, nodeE, model) => new TransistorNPN(id, nodeB, nodeC, nodeE, model),
  createBattery: (id, nodePos, nodeNeg, voltage) => new Battery(id, nodePos, nodeNeg, voltage),
  createSwitch: (id, nodeA, nodeB, isClosed) => new Switch(id, nodeA, nodeB, isClosed)
};

export default ComponentFactory;
