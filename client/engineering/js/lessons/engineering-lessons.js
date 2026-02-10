/**
 * Engineering Lessons Module
 * Circuit experiments and electrical engineering education
 */

import * as THREE from 'three';
import { CircuitEngine } from '../circuit/circuit-engine.js';
import { Resistor, LED, Battery, Capacitor, Switch, ComponentFactory } from '../circuit/circuit-components.js';
import { Breadboard } from '../circuit/breadboard.js';

export const EngineeringLessons = {
  // Basic LED Circuit
  ledCircuit: {
    id: 'led-circuit',
    name: 'LED Lighting Circuit',
    subject: 'engineering',
    topic: 'basic',
    description: 'Configure a basic circuit using an LED and a resistor.',
    concepts: ["Ohm's Law", 'LED Forward Voltage', 'Resistance Calculation'],
    formula: 'R = (V_s - V_f) / I',

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'LEDCircuit';

      // Create circuit engine
      const circuit = new CircuitEngine();

      // Create components
      const battery = new Battery('battery1', 'node_pos', 'node_neg', 5);
      const resistor = new Resistor('r1', 'node_pos', 'node_mid', 220);
      const led = new LED('led1', 'node_mid', 'node_neg', 'red');

      // Add to circuit
      circuit.addComponent(battery);
      circuit.addComponent(resistor);
      circuit.addComponent(led);

      // Create meshes
      const batteryMesh = battery.createMesh(THREE);
      batteryMesh.position.set(-1.5, 0.5, 0);
      group.add(batteryMesh);

      const resistorMesh = resistor.createMesh(THREE);
      resistorMesh.position.set(0, 0.5, 0);
      group.add(resistorMesh);

      const ledMesh = led.createMesh(THREE);
      ledMesh.position.set(1.5, 0.5, 0);
      group.add(ledMesh);

      // Wire connections (simplified visual)
      const wireMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
      const wirePoints1 = [
        new THREE.Vector3(-1, 0.5, 0),
        new THREE.Vector3(-0.5, 0.5, 0)
      ];
      const wireGeo1 = new THREE.BufferGeometry().setFromPoints(wirePoints1);
      const wire1 = new THREE.Line(wireGeo1, wireMat);
      group.add(wire1);

      const wirePoints2 = [
        new THREE.Vector3(0.5, 0.5, 0),
        new THREE.Vector3(1, 0.5, 0)
      ];
      const wireGeo2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
      const wire2 = new THREE.Line(wireGeo2, wireMat);
      group.add(wire2);

      // Ground return wire
      const wireMat2 = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
      const wirePoints3 = [
        new THREE.Vector3(1.5, 0.2, 0),
        new THREE.Vector3(1.5, -0.3, 0),
        new THREE.Vector3(-1.5, -0.3, 0),
        new THREE.Vector3(-1.5, 0.3, 0)
      ];
      const wireGeo3 = new THREE.BufferGeometry().setFromPoints(wirePoints3);
      const wire3 = new THREE.Line(wireGeo3, wireMat2);
      group.add(wire3);

      // Info panel background
      const infoPanelGeo = new THREE.PlaneGeometry(3, 1.5);
      const infoPanelMat = new THREE.MeshBasicMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const infoPanel = new THREE.Mesh(infoPanelGeo, infoPanelMat);
      infoPanel.position.set(0, 2.5, 0);
      infoPanel.name = 'infoPanel';
      group.add(infoPanel);

      group.position.y = 1;
      scene.add(group);

      // Store circuit for simulation
      group.userData.circuit = circuit;
      group.userData.components = { battery, resistor, led };

      return {
        objects: [group],
        mainObject: group,
        circuit
      };
    },

    onStart: (objects, physics) => {
      const group = objects[0];
      if (group.userData.circuit) {
        group.userData.circuit.start();
        group.userData.circuit.analyze();
      }
    },

    onUpdate: (objects, delta) => {
      const group = objects[0];
      if (group.userData.circuit && group.userData.circuit.isRunning) {
        group.userData.circuit.step();

        // Update LED visual
        const led = group.userData.components?.led;
        if (led) {
          led.updateVisual();
        }
      }
    },

    getInfo: (objects) => {
      const group = objects[0];
      const circuit = group?.userData?.circuit;
      const components = group?.userData?.components;

      if (!circuit || !components) {
        return { title: 'LED Lighting Circuit', data: {} };
      }

      const results = circuit.getResults();
      const ledComp = results.components.find(c => c.id === 'led1');
      const resistorComp = results.components.find(c => c.id === 'r1');

      return {
        title: 'LED Lighting Circuit',
        data: {
          'Supply Voltage': '5V',
          'LED Forward Voltage': `${components.led.forwardVoltage}V`,
          'Resistance': '220Ω',
          'Calculated Current': `${((5 - components.led.forwardVoltage) / 220 * 1000).toFixed(1)}mA`,
          'LED Brightness': `${((ledComp?.brightness || 0) * 100).toFixed(0)}%`
        }
      };
    }
  },

  // Series/Parallel Resistor Circuit
  resistorCircuit: {
    id: 'resistor-circuit',
    name: 'Series/Parallel Resistor Circuit',
    subject: 'engineering',
    topic: 'resistors',
    description: 'Learn about equivalent resistance in series and parallel circuits.',
    concepts: ['Series Resistance', 'Parallel Resistance', 'Equivalent Resistance'],
    formula: 'Series: R_total = R1 + R2, Parallel: 1/R_total = 1/R1 + 1/R2',

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'ResistorCircuit';

      // Create circuit engine
      const circuit = new CircuitEngine();

      // Series resistors
      const battery = new Battery('battery1', 'node_pos', 'node_neg', 9);
      const r1 = new Resistor('r1', 'node_pos', 'node_a', 1000);
      const r2 = new Resistor('r2', 'node_a', 'node_b', 2000);

      // Parallel resistors
      const r3 = new Resistor('r3', 'node_b', 'node_neg', 1000);
      const r4 = new Resistor('r4', 'node_b', 'node_neg', 1000);

      circuit.addComponent(battery);
      circuit.addComponent(r1);
      circuit.addComponent(r2);
      circuit.addComponent(r3);
      circuit.addComponent(r4);

      // Create meshes
      const batteryMesh = battery.createMesh(THREE);
      batteryMesh.position.set(-2, 1, 0);
      group.add(batteryMesh);

      const r1Mesh = r1.createMesh(THREE);
      r1Mesh.position.set(-0.5, 1, 0);
      group.add(r1Mesh);

      const r2Mesh = r2.createMesh(THREE);
      r2Mesh.position.set(0.5, 1, 0);
      group.add(r2Mesh);

      const r3Mesh = r3.createMesh(THREE);
      r3Mesh.position.set(1.5, 1.5, 0);
      r3Mesh.rotation.z = Math.PI / 2;
      group.add(r3Mesh);

      const r4Mesh = r4.createMesh(THREE);
      r4Mesh.position.set(1.5, 0.5, 0);
      r4Mesh.rotation.z = Math.PI / 2;
      group.add(r4Mesh);

      // Labels
      const labelPositions = [
        { text: 'R1=1kΩ', pos: [-0.5, 1.5, 0] },
        { text: 'R2=2kΩ', pos: [0.5, 1.5, 0] },
        { text: 'R3=1kΩ', pos: [2.2, 1.5, 0] },
        { text: 'R4=1kΩ', pos: [2.2, 0.5, 0] },
        { text: 'Series', pos: [0, 2, 0] },
        { text: 'Parallel', pos: [1.5, 2, 0] }
      ];

      group.position.y = 0.5;
      scene.add(group);

      group.userData.circuit = circuit;
      group.userData.resistors = { r1, r2, r3, r4 };

      return { objects: [group], mainObject: group, circuit };
    },

    onStart: (objects, physics) => {
      const group = objects[0];
      if (group.userData.circuit) {
        group.userData.circuit.start();
        group.userData.circuit.analyze();
      }
    },

    getInfo: (objects) => {
      // Calculate equivalent resistance
      const seriesR = 1000 + 2000; // R1 + R2 = 3kΩ
      const parallelR = (1000 * 1000) / (1000 + 1000); // R3 || R4 = 500Ω
      const totalR = seriesR + parallelR;
      const current = 9 / totalR * 1000; // mA

      return {
        title: 'Series/Parallel Resistor Circuit',
        data: {
          'Power': '9V',
          'Series Equiv. Resistance (R1+R2)': `${seriesR}Ω = ${seriesR / 1000}kΩ`,
          'Parallel Equiv. Resistance (R3||R4)': `${parallelR}Ω`,
          'Total Equiv. Resistance': `${totalR}Ω = ${(totalR / 1000).toFixed(1)}kΩ`,
          'Circuit Current': `${current.toFixed(2)}mA`
        }
      };
    }
  },

  // RC Charging Circuit
  rcCircuit: {
    id: 'rc-circuit',
    name: 'RC Charge/Discharge Circuit',
    subject: 'engineering',
    topic: 'capacitors',
    description: 'Observe the charging and discharging process of a capacitor.',
    concepts: ['Time Constant', 'Exponential Function', 'Charge/Discharge'],
    formula: 'τ = RC, V(t) = V₀(1 - e^(-t/τ))',

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'RCCircuit';

      const circuit = new CircuitEngine();

      const battery = new Battery('battery1', 'node_pos', 'node_neg', 5);
      const resistor = new Resistor('r1', 'node_pos', 'node_cap', 10000); // 10kΩ
      const capacitor = new Capacitor('c1', 'node_cap', 'node_neg', 0.0001); // 100µF
      const sw = new Switch('sw1', 'node_pos', 'node_sw', false);

      circuit.addComponent(battery);
      circuit.addComponent(resistor);
      circuit.addComponent(capacitor);

      const batteryMesh = battery.createMesh(THREE);
      batteryMesh.position.set(-2, 1, 0);
      group.add(batteryMesh);

      const resistorMesh = resistor.createMesh(THREE);
      resistorMesh.position.set(0, 1, 0);
      group.add(resistorMesh);

      const capacitorMesh = capacitor.createMesh(THREE);
      capacitorMesh.position.set(2, 1, 0);
      group.add(capacitorMesh);

      // Voltage indicator (visual)
      const indicatorGeo = new THREE.BoxGeometry(0.1, 1, 0.1);
      const indicatorMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
      indicator.position.set(2.5, 0.5, 0);
      indicator.name = 'voltageIndicator';
      group.add(indicator);

      group.position.y = 0.5;
      scene.add(group);

      group.userData.circuit = circuit;
      group.userData.capacitor = capacitor;
      group.userData.startTime = 0;

      return { objects: [group], mainObject: group, circuit };
    },

    onStart: (objects, physics) => {
      const group = objects[0];
      group.userData.startTime = Date.now();
      if (group.userData.circuit) {
        group.userData.circuit.start();
      }
    },

    onUpdate: (objects, delta) => {
      const group = objects[0];
      const circuit = group.userData.circuit;

      if (circuit && circuit.isRunning) {
        circuit.step();

        // Update voltage indicator
        const cap = group.userData.capacitor;
        const indicator = group.getObjectByName('voltageIndicator');
        if (indicator && cap) {
          const voltage = Math.abs(cap.prevVoltage || 0);
          const normalizedV = Math.min(voltage / 5, 1);
          indicator.scale.y = 0.1 + normalizedV * 0.9;
          indicator.material.color.setHSL(normalizedV * 0.3, 1, 0.5);
        }
      }
    },

    getInfo: (objects) => {
      const group = objects[0];
      const cap = group?.userData?.capacitor;
      const elapsed = (Date.now() - (group?.userData?.startTime || Date.now())) / 1000;

      const R = 10000;
      const C = 0.0001;
      const tau = R * C; // Time constant = 1 second
      const voltage = cap ? Math.abs(cap.prevVoltage || 0) : 0;

      return {
        title: 'RC Charge/Discharge Circuit',
        data: {
          'Resistance': '10kΩ',
          'Capacitance': '100µF',
          'Time Constant (τ=RC)': `${tau}s`,
          'Elapsed Time': `${elapsed.toFixed(2)}s`,
          'Capacitor Voltage': `${voltage.toFixed(2)}V`,
          'Charge Rate': `${((voltage / 5) * 100).toFixed(1)}%`
        }
      };
    }
  },

  // Arduino LED Blink
  arduinoLed: {
    id: 'arduino-led',
    name: 'Arduino LED Control',
    subject: 'engineering',
    topic: 'microcontroller',
    description: 'A basic circuit to control an LED with Arduino.',
    concepts: ['Digital Output', 'GPIO', 'PWM'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'ArduinoLED';

      // Import and create Arduino dynamically
      const ArduinoPlaceholder = {
        createMesh: (THREE) => {
          const arduinoGroup = new THREE.Group();

          // PCB
          const pcbGeo = new THREE.BoxGeometry(2.7, 0.08, 2.1);
          const pcbMat = new THREE.MeshStandardMaterial({ color: 0x006699 });
          const pcb = new THREE.Mesh(pcbGeo, pcbMat);
          arduinoGroup.add(pcb);

          // USB
          const usbGeo = new THREE.BoxGeometry(0.35, 0.12, 0.5);
          const usbMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });
          const usb = new THREE.Mesh(usbGeo, usbMat);
          usb.position.set(-1.2, 0.1, 0);
          arduinoGroup.add(usb);

          // LED on pin 13
          const ledGeo = new THREE.SphereGeometry(0.05, 8, 8);
          const ledMat = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0
          });
          const led = new THREE.Mesh(ledGeo, ledMat);
          led.position.set(0.4, 0.1, 0.2);
          led.name = 'led_L';
          arduinoGroup.add(led);

          return arduinoGroup;
        }
      };

      const arduinoMesh = ArduinoPlaceholder.createMesh(THREE);
      arduinoMesh.position.set(-1, 0.5, 0);
      group.add(arduinoMesh);

      // External LED
      const ledGeo = new THREE.SphereGeometry(0.15, 16, 16);
      const ledMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0
      });
      const externalLed = new THREE.Mesh(ledGeo, ledMat);
      externalLed.position.set(2, 0.5, 0);
      externalLed.name = 'external_led';
      group.add(externalLed);

      // Resistor
      const resistorGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16);
      const resistorMat = new THREE.MeshStandardMaterial({ color: 0xd4c4a8 });
      const resistor = new THREE.Mesh(resistorGeo, resistorMat);
      resistor.rotation.z = Math.PI / 2;
      resistor.position.set(1, 0.5, 0);
      group.add(resistor);

      // Wires
      const wireMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const wirePoints = [
        new THREE.Vector3(0.5, 0.5, 0),
        new THREE.Vector3(0.75, 0.5, 0)
      ];
      const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
      const wire = new THREE.Line(wireGeo, wireMat);
      group.add(wire);

      const wirePoints2 = [
        new THREE.Vector3(1.25, 0.5, 0),
        new THREE.Vector3(1.85, 0.5, 0)
      ];
      const wireGeo2 = new THREE.BufferGeometry().setFromPoints(wirePoints2);
      const wire2 = new THREE.Line(wireGeo2, wireMat);
      group.add(wire2);

      group.position.y = 0.5;
      scene.add(group);

      // Blink state
      group.userData.blinkState = false;
      group.userData.blinkTimer = 0;
      group.userData.blinkInterval = 1; // 1 second

      return { objects: [group], mainObject: group };
    },

    onStart: (objects, physics) => {
      const group = objects[0];
      group.userData.blinkTimer = 0;
    },

    onUpdate: (objects, delta) => {
      const group = objects[0];
      group.userData.blinkTimer += delta;

      if (group.userData.blinkTimer >= group.userData.blinkInterval) {
        group.userData.blinkTimer = 0;
        group.userData.blinkState = !group.userData.blinkState;

        // Toggle LEDs
        const ledL = group.getObjectByName('led_L');
        const externalLed = group.getObjectByName('external_led');
        const intensity = group.userData.blinkState ? 0.8 : 0;

        if (ledL) ledL.material.emissiveIntensity = intensity;
        if (externalLed) externalLed.material.emissiveIntensity = intensity;
      }
    },

    getInfo: (objects) => {
      const group = objects[0];
      const state = group?.userData?.blinkState ? 'HIGH' : 'LOW';

      return {
        title: 'Arduino LED Control',
        data: {
          'Pin': 'D13',
          'Resistance': '220Ω',
          'LED State': state,
          'Blink Interval': '1s',
          'Code': 'digitalWrite(13, HIGH/LOW)'
        }
      };
    }
  }
};

// Get all engineering lessons
export function getAllEngineeringLessons() {
  return Object.values(EngineeringLessons);
}

// Get lesson by ID
export function getEngineeringLessonById(id) {
  return Object.values(EngineeringLessons).find(lesson => lesson.id === id);
}

export default EngineeringLessons;
