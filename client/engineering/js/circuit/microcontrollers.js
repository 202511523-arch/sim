/**
 * Microcontroller Board Models
 * Arduino and Raspberry Pi Pico virtual boards for circuit CAD
 */

import * as THREE from 'three';

// ============================================
// Arduino Uno Model
// ============================================

export class ArduinoUno {
  constructor(id = 'arduino_uno') {
    this.id = id;
    this.type = 'arduino_uno';
    this.mesh = null;

    // Pin definitions
    this.pins = {
      // Power pins
      VIN: { type: 'power', voltage: null, x: -1.2, z: -0.8 },
      GND1: { type: 'ground', voltage: 0, x: -1.1, z: -0.8 },
      GND2: { type: 'ground', voltage: 0, x: -1.0, z: -0.8 },
      '5V': { type: 'power', voltage: 5, x: -0.9, z: -0.8 },
      '3.3V': { type: 'power', voltage: 3.3, x: -0.8, z: -0.8 },
      RESET: { type: 'control', x: -0.7, z: -0.8 },
      IOREF: { type: 'reference', x: -0.6, z: -0.8 },

      // Analog pins (A0-A5)
      A0: { type: 'analog', pin: 14, x: -0.4, z: -0.8 },
      A1: { type: 'analog', pin: 15, x: -0.3, z: -0.8 },
      A2: { type: 'analog', pin: 16, x: -0.2, z: -0.8 },
      A3: { type: 'analog', pin: 17, x: -0.1, z: -0.8 },
      A4: { type: 'analog', pin: 18, x: 0, z: -0.8, altFunc: 'SDA' },
      A5: { type: 'analog', pin: 19, x: 0.1, z: -0.8, altFunc: 'SCL' },

      // Digital pins (0-13)
      D0: { type: 'digital', pin: 0, x: 1.2, z: -0.8, altFunc: 'RX' },
      D1: { type: 'digital', pin: 1, x: 1.1, z: -0.8, altFunc: 'TX' },
      D2: { type: 'digital', pin: 2, x: 1.0, z: -0.8, interrupt: true },
      D3: { type: 'digital', pin: 3, x: 0.9, z: -0.8, pwm: true, interrupt: true },
      D4: { type: 'digital', pin: 4, x: 0.8, z: -0.8 },
      D5: { type: 'digital', pin: 5, x: 0.7, z: -0.8, pwm: true },
      D6: { type: 'digital', pin: 6, x: 0.6, z: -0.8, pwm: true },
      D7: { type: 'digital', pin: 7, x: 0.5, z: -0.8 },

      D8: { type: 'digital', pin: 8, x: 0.5, z: 0.8 },
      D9: { type: 'digital', pin: 9, x: 0.6, z: 0.8, pwm: true },
      D10: { type: 'digital', pin: 10, x: 0.7, z: 0.8, pwm: true, altFunc: 'SS' },
      D11: { type: 'digital', pin: 11, x: 0.8, z: 0.8, pwm: true, altFunc: 'MOSI' },
      D12: { type: 'digital', pin: 12, x: 0.9, z: 0.8, altFunc: 'MISO' },
      D13: { type: 'digital', pin: 13, x: 1.0, z: 0.8, altFunc: 'SCK', led: true },
      GND3: { type: 'ground', voltage: 0, x: 1.1, z: 0.8 },
      AREF: { type: 'reference', x: 1.2, z: 0.8 },
    };

    // Pin states
    this.pinStates = {};
    Object.keys(this.pins).forEach(name => {
      this.pinStates[name] = {
        mode: 'INPUT', // INPUT, OUTPUT, INPUT_PULLUP
        value: 0,      // 0 or 1 for digital, 0-1023 for analog
        pwmValue: 0    // 0-255 for PWM
      };
    });
  }

  createMesh(THREE) {
    const group = new THREE.Group();
    group.name = this.id;

    // PCB Board
    const pcbGeo = new THREE.BoxGeometry(2.7, 0.08, 2.1);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x006699,  // Arduino blue
      roughness: 0.6
    });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.receiveShadow = true;
    group.add(pcb);

    // USB Port
    const usbGeo = new THREE.BoxGeometry(0.35, 0.12, 0.5);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(-1.2, 0.1, 0);
    group.add(usb);

    // DC Jack
    const jackGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.35, 16);
    const jackMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const jack = new THREE.Mesh(jackGeo, jackMat);
    jack.rotation.x = Math.PI / 2;
    jack.position.set(-1.0, 0.1, -0.75);
    group.add(jack);

    // Main microcontroller chip (ATmega328P)
    const chipGeo = new THREE.BoxGeometry(0.8, 0.1, 0.25);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0.3, 0.09, 0);
    group.add(chip);

    // Crystal oscillator
    const crystalGeo = new THREE.BoxGeometry(0.15, 0.08, 0.08);
    const crystalMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.6 });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 0.08, 0.2);
    group.add(crystal);

    // Reset button
    const resetGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.05, 16);
    const resetMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
    const reset = new THREE.Mesh(resetGeo, resetMat);
    reset.position.set(-0.5, 0.1, 0.5);
    reset.name = 'reset_button';
    group.add(reset);

    // LEDs (TX, RX, L, ON)
    const ledColors = { TX: 0x00ff00, RX: 0x00ff00, L: 0xffff00, ON: 0x00ff00 };
    const ledPositions = { TX: [0.6, 0.2], RX: [0.5, 0.2], L: [0.4, 0.2], ON: [-0.8, 0.2] };

    Object.entries(ledPositions).forEach(([name, pos]) => {
      const ledGeo = new THREE.SphereGeometry(0.03, 8, 8);
      const ledMat = new THREE.MeshStandardMaterial({
        color: ledColors[name],
        emissive: ledColors[name],
        emissiveIntensity: 0
      });
      const led = new THREE.Mesh(ledGeo, ledMat);
      led.position.set(pos[0], 0.08, pos[1]);
      led.name = `led_${name}`;
      group.add(led);
    });

    // Pin headers
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });

    Object.entries(this.pins).forEach(([name, pin]) => {
      // Header plastic
      const headerGeo = new THREE.BoxGeometry(0.1, 0.15, 0.1);
      const header = new THREE.Mesh(headerGeo, headerMat);
      header.position.set(pin.x, 0.075, pin.z);
      group.add(header);

      // Metal pin
      const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8);
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(pin.x, 0.15, pin.z);
      pinMesh.name = `pin_${name}`;
      pinMesh.userData.pinName = name;
      pinMesh.userData.pinData = pin;
      group.add(pinMesh);
    });

    // Arduino logo text (simplified as a plane)
    const logoGeo = new THREE.PlaneGeometry(0.6, 0.15);
    const logoMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    const logo = new THREE.Mesh(logoGeo, logoMat);
    logo.rotation.x = -Math.PI / 2;
    logo.position.set(-0.3, 0.041, -0.3);
    group.add(logo);

    group.userData.board = this;
    this.mesh = group;

    return group;
  }

  // Set pin mode
  pinMode(pin, mode) {
    if (this.pinStates[pin]) {
      this.pinStates[pin].mode = mode;
    }
  }

  // Digital write
  digitalWrite(pin, value) {
    if (this.pinStates[pin] && this.pinStates[pin].mode === 'OUTPUT') {
      this.pinStates[pin].value = value ? 1 : 0;
      this.updatePinVisual(pin);
    }
  }

  // Analog write (PWM)
  analogWrite(pin, value) {
    const pinData = this.pins[pin];
    if (pinData && pinData.pwm && this.pinStates[pin]) {
      this.pinStates[pin].pwmValue = Math.min(255, Math.max(0, value));
      this.updatePinVisual(pin);
    }
  }

  // Update LED visuals
  updatePinVisual(pin) {
    if (pin === 'D13' && this.mesh) {
      const led = this.mesh.getObjectByName('led_L');
      if (led) {
        led.material.emissiveIntensity = this.pinStates[pin].value;
      }
    }
  }

  // Set LED state
  setLED(name, on) {
    if (this.mesh) {
      const led = this.mesh.getObjectByName(`led_${name}`);
      if (led) {
        led.material.emissiveIntensity = on ? 0.8 : 0;
      }
    }
  }

  // Get pin voltage for circuit connection
  getPinVoltage(pinName) {
    const pin = this.pins[pinName];
    const state = this.pinStates[pinName];

    if (!pin || !state) return 0;

    if (pin.type === 'power') return pin.voltage;
    if (pin.type === 'ground') return 0;
    if (state.mode === 'OUTPUT') {
      if (pin.pwm && state.pwmValue > 0) {
        return (state.pwmValue / 255) * 5;
      }
      return state.value * 5;
    }
    return 0;
  }
}

// ============================================
// Raspberry Pi Pico Model
// ============================================

export class RaspberryPiPico {
  constructor(id = 'rpi_pico') {
    this.id = id;
    this.type = 'rpi_pico';
    this.mesh = null;

    // Pin definitions (40 pins)
    this.pins = {};

    // Left side pins (1-20)
    const leftPins = [
      { num: 1, name: 'GP0', type: 'gpio' },
      { num: 2, name: 'GP1', type: 'gpio' },
      { num: 3, name: 'GND', type: 'ground' },
      { num: 4, name: 'GP2', type: 'gpio' },
      { num: 5, name: 'GP3', type: 'gpio' },
      { num: 6, name: 'GP4', type: 'gpio' },
      { num: 7, name: 'GP5', type: 'gpio' },
      { num: 8, name: 'GND', type: 'ground' },
      { num: 9, name: 'GP6', type: 'gpio' },
      { num: 10, name: 'GP7', type: 'gpio' },
      { num: 11, name: 'GP8', type: 'gpio' },
      { num: 12, name: 'GP9', type: 'gpio' },
      { num: 13, name: 'GND', type: 'ground' },
      { num: 14, name: 'GP10', type: 'gpio' },
      { num: 15, name: 'GP11', type: 'gpio' },
      { num: 16, name: 'GP12', type: 'gpio' },
      { num: 17, name: 'GP13', type: 'gpio' },
      { num: 18, name: 'GND', type: 'ground' },
      { num: 19, name: 'GP14', type: 'gpio' },
      { num: 20, name: 'GP15', type: 'gpio' },
    ];

    // Right side pins (21-40)
    const rightPins = [
      { num: 21, name: 'GP16', type: 'gpio' },
      { num: 22, name: 'GP17', type: 'gpio' },
      { num: 23, name: 'GND', type: 'ground' },
      { num: 24, name: 'GP18', type: 'gpio' },
      { num: 25, name: 'GP19', type: 'gpio' },
      { num: 26, name: 'GP20', type: 'gpio' },
      { num: 27, name: 'GP21', type: 'gpio' },
      { num: 28, name: 'GND', type: 'ground' },
      { num: 29, name: 'GP22', type: 'gpio' },
      { num: 30, name: 'RUN', type: 'control' },
      { num: 31, name: 'GP26_A0', type: 'adc' },
      { num: 32, name: 'GP27_A1', type: 'adc' },
      { num: 33, name: 'GND', type: 'ground' },
      { num: 34, name: 'GP28_A2', type: 'adc' },
      { num: 35, name: 'ADC_VREF', type: 'reference' },
      { num: 36, name: '3V3', type: 'power', voltage: 3.3 },
      { num: 37, name: '3V3_EN', type: 'control' },
      { num: 38, name: 'GND', type: 'ground' },
      { num: 39, name: 'VSYS', type: 'power', voltage: 5 },
      { num: 40, name: 'VBUS', type: 'power', voltage: 5 },
    ];

    // Populate pins
    leftPins.forEach((p, i) => {
      this.pins[p.name + (p.type === 'ground' ? `_L${i}` : '')] = {
        ...p,
        x: -0.8,
        z: -0.5 + i * 0.05,
        side: 'left'
      };
    });

    rightPins.forEach((p, i) => {
      this.pins[p.name + (p.type === 'ground' ? `_R${i}` : '')] = {
        ...p,
        x: 0.8,
        z: -0.5 + i * 0.05,
        side: 'right'
      };
    });

    // Pin states
    this.pinStates = {};
    Object.keys(this.pins).forEach(name => {
      this.pinStates[name] = {
        mode: 'INPUT',
        value: 0,
        pwmValue: 0
      };
    });
  }

  createMesh(THREE) {
    const group = new THREE.Group();
    group.name = this.id;

    // PCB Board (green)
    const pcbGeo = new THREE.BoxGeometry(2.0, 0.06, 0.85);
    const pcbMat = new THREE.MeshStandardMaterial({
      color: 0x228b22,  // Green PCB
      roughness: 0.6
    });
    const pcb = new THREE.Mesh(pcbGeo, pcbMat);
    pcb.receiveShadow = true;
    group.add(pcb);

    // USB Micro port
    const usbGeo = new THREE.BoxGeometry(0.25, 0.08, 0.3);
    const usbMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8 });
    const usb = new THREE.Mesh(usbGeo, usbMat);
    usb.position.set(-0.88, 0.04, 0);
    group.add(usb);

    // RP2040 chip
    const chipGeo = new THREE.BoxGeometry(0.35, 0.08, 0.35);
    const chipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const chip = new THREE.Mesh(chipGeo, chipMat);
    chip.position.set(0, 0.06, 0);
    group.add(chip);

    // Boot button
    const bootGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const boot = new THREE.Mesh(bootGeo, bootMat);
    boot.position.set(0.5, 0.06, 0.2);
    boot.name = 'boot_button';
    group.add(boot);

    // On-board LED
    const ledGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const ledMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0
    });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0.3, 0.05, 0);
    led.name = 'led_onboard';
    group.add(led);

    // Pin headers
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });

    Object.entries(this.pins).forEach(([name, pin]) => {
      const xPos = pin.side === 'left' ? -0.9 : 0.9;

      // Header plastic
      const headerGeo = new THREE.BoxGeometry(0.08, 0.1, 0.04);
      const header = new THREE.Mesh(headerGeo, headerMat);
      header.position.set(xPos, 0.05, pin.z);
      group.add(header);

      // Metal pin
      const pinGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8);
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(xPos, 0.1, pin.z);
      pinMesh.name = `pin_${name}`;
      pinMesh.userData.pinName = name;
      pinMesh.userData.pinData = pin;
      group.add(pinMesh);
    });

    group.userData.board = this;
    this.mesh = group;

    return group;
  }

  setLED(on) {
    if (this.mesh) {
      const led = this.mesh.getObjectByName('led_onboard');
      if (led) {
        led.material.emissiveIntensity = on ? 0.8 : 0;
      }
    }
  }

  getPinVoltage(pinName) {
    const pin = this.pins[pinName];
    const state = this.pinStates[pinName];

    if (!pin || !state) return 0;

    if (pin.type === 'power') return pin.voltage;
    if (pin.type === 'ground') return 0;
    if (state.mode === 'OUTPUT') {
      return state.value * 3.3;
    }
    return 0;
  }
}

// ============================================
// Export
// ============================================

export const BoardFactory = {
  createArduinoUno: (id) => new ArduinoUno(id),
  createRaspberryPiPico: (id) => new RaspberryPiPico(id)
};

export default { ArduinoUno, RaspberryPiPico, BoardFactory };
