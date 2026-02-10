/**
 * Circuit Simulation Engine
 * Modified Nodal Analysis (MNA) based circuit solver
 */

export class CircuitEngine {
  constructor() {
    this.nodes = new Map();        // Node ID -> voltage
    this.components = [];          // All circuit components
    this.ground = 0;               // Ground node (reference = 0V)
    this.isRunning = false;
    this.frequency = 0;            // 0 = DC, >0 = AC
    this.time = 0;
    this.dt = 1 / 1000;            // 1ms timestep

    // Analysis results
    this.voltages = new Map();
    this.currents = new Map();
  }

  /**
   * Add a node to the circuit
   */
  addNode(id) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, 0);
    }
    return id;
  }

  /**
   * Add a component to the circuit
   */
  addComponent(component) {
    this.components.push(component);

    // Register nodes
    if (component.nodeA !== undefined) this.addNode(component.nodeA);
    if (component.nodeB !== undefined) this.addNode(component.nodeB);

    return component;
  }

  /**
   * Remove a component from the circuit
   */
  removeComponent(component) {
    const idx = this.components.indexOf(component);
    if (idx > -1) {
      this.components.splice(idx, 1);
    }
  }

  /**
   * Clear all components and nodes
   */
  clear() {
    this.components = [];
    this.nodes.clear();
    this.voltages.clear();
    this.currents.clear();
    this.time = 0;
  }

  /**
   * Build the Modified Nodal Analysis matrices
   * Solves: [G][V] = [I]
   * Where G is conductance matrix, V is voltage vector, I is current vector
   */
  buildMNAMatrix() {
    const nodeList = Array.from(this.nodes.keys()).filter(n => n !== this.ground);
    const n = nodeList.length;

    if (n === 0) return null;

    // Count voltage sources for matrix expansion
    const voltageSources = this.components.filter(c => c.type === 'voltage_source');
    const m = voltageSources.length;

    // Matrix size: (n + m) x (n + m)
    const size = n + m;
    const G = Array(size).fill(null).map(() => Array(size).fill(0));
    const I = Array(size).fill(0);

    // Node index mapping
    const nodeIndex = new Map();
    nodeList.forEach((node, idx) => nodeIndex.set(node, idx));

    // Stamp each component into the matrix
    this.components.forEach((comp, compIdx) => {
      if (comp.type === 'resistor') {
        this.stampResistor(G, nodeIndex, comp);
      } else if (comp.type === 'voltage_source') {
        const vsIdx = voltageSources.indexOf(comp);
        this.stampVoltageSource(G, I, nodeIndex, comp, n + vsIdx);
      } else if (comp.type === 'current_source') {
        this.stampCurrentSource(I, nodeIndex, comp);
      } else if (comp.type === 'capacitor') {
        this.stampCapacitor(G, I, nodeIndex, comp);
      } else if (comp.type === 'inductor') {
        this.stampInductor(G, I, nodeIndex, comp);
      } else if (comp.type === 'diode') {
        this.stampDiode(G, I, nodeIndex, comp);
      } else if (comp.type === 'led') {
        this.stampLED(G, I, nodeIndex, comp);
      }
    });

    return { G, I, nodeIndex, size };
  }

  /**
   * Stamp resistor into conductance matrix
   */
  stampResistor(G, nodeIndex, comp) {
    const conductance = 1 / comp.resistance;
    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) G[a][a] += conductance;
    if (b !== undefined) G[b][b] += conductance;
    if (a !== undefined && b !== undefined) {
      G[a][b] -= conductance;
      G[b][a] -= conductance;
    }
  }

  /**
   * Stamp voltage source into matrix
   */
  stampVoltageSource(G, I, nodeIndex, comp, row) {
    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) {
      G[a][row] += 1;
      G[row][a] += 1;
    }
    if (b !== undefined) {
      G[b][row] -= 1;
      G[row][b] -= 1;
    }

    // Voltage value (can be time-varying for AC)
    let voltage = comp.voltage;
    if (this.frequency > 0 && comp.isAC) {
      voltage = comp.voltage * Math.sin(2 * Math.PI * this.frequency * this.time);
    }
    I[row] = voltage;
  }

  /**
   * Stamp current source into current vector
   */
  stampCurrentSource(I, nodeIndex, comp) {
    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) I[a] -= comp.current;
    if (b !== undefined) I[b] += comp.current;
  }

  /**
   * Stamp capacitor (using backward Euler integration)
   */
  stampCapacitor(G, I, nodeIndex, comp) {
    const geq = comp.capacitance / this.dt;
    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) G[a][a] += geq;
    if (b !== undefined) G[b][b] += geq;
    if (a !== undefined && b !== undefined) {
      G[a][b] -= geq;
      G[b][a] -= geq;
    }

    // Current from previous state
    const ieq = comp.capacitance * (comp.prevVoltage || 0) / this.dt;
    if (a !== undefined) I[a] += ieq;
    if (b !== undefined) I[b] -= ieq;
  }

  /**
   * Stamp inductor (using backward Euler integration)
   */
  stampInductor(G, I, nodeIndex, comp) {
    const req = this.dt / comp.inductance;
    const geq = 1 / req;
    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) G[a][a] += geq;
    if (b !== undefined) G[b][b] += geq;
    if (a !== undefined && b !== undefined) {
      G[a][b] -= geq;
      G[b][a] -= geq;
    }

    // Current from previous state
    const ieq = (comp.prevCurrent || 0);
    if (a !== undefined) I[a] += ieq;
    if (b !== undefined) I[b] -= ieq;
  }

  /**
   * Stamp diode using Newton-Raphson linearization
   */
  stampDiode(G, I, nodeIndex, comp) {
    const Is = comp.saturationCurrent || 1e-12; // Saturation current
    const Vt = 0.026; // Thermal voltage at room temp
    const prevVd = comp.prevVoltage || 0;

    // Diode current: Id = Is * (exp(Vd/Vt) - 1)
    // Linearized: geq = dId/dVd = Is/Vt * exp(Vd/Vt)
    const expVd = Math.exp(Math.min(prevVd / Vt, 40)); // Limit to prevent overflow
    const geq = Is / Vt * expVd;
    const Id = Is * (expVd - 1);
    const ieq = Id - geq * prevVd;

    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) G[a][a] += geq;
    if (b !== undefined) G[b][b] += geq;
    if (a !== undefined && b !== undefined) {
      G[a][b] -= geq;
      G[b][a] -= geq;
    }

    if (a !== undefined) I[a] -= ieq;
    if (b !== undefined) I[b] += ieq;
  }

  /**
   * Stamp LED (diode with forward voltage)
   */
  stampLED(G, I, nodeIndex, comp) {
    const Vf = comp.forwardVoltage || 2.0; // Forward voltage
    const Is = 1e-12;
    const Vt = 0.026;
    const prevVd = (comp.prevVoltage || 0) - Vf;

    const expVd = Math.exp(Math.min(prevVd / Vt, 40));
    const geq = Is / Vt * expVd;
    const Id = Is * (expVd - 1);
    const ieq = Id - geq * prevVd;

    const a = nodeIndex.get(comp.nodeA);
    const b = nodeIndex.get(comp.nodeB);

    if (a !== undefined) G[a][a] += geq;
    if (b !== undefined) G[b][b] += geq;
    if (a !== undefined && b !== undefined) {
      G[a][b] -= geq;
      G[b][a] -= geq;
    }

    if (a !== undefined) I[a] -= ieq;
    if (b !== undefined) I[b] += ieq;

    // Calculate LED brightness based on current
    comp.current = Math.max(0, Id);
    comp.brightness = Math.min(1, comp.current / 0.02); // 20mA = full brightness
  }

  /**
   * Solve the linear system using Gaussian elimination
   */
  solve(G, I) {
    const n = G.length;
    const A = G.map(row => [...row]);
    const b = [...I];

    // Forward elimination with partial pivoting
    for (let col = 0; col < n; col++) {
      // Find pivot
      let maxRow = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) {
          maxRow = row;
        }
      }

      // Swap rows
      [A[col], A[maxRow]] = [A[maxRow], A[col]];
      [b[col], b[maxRow]] = [b[maxRow], b[col]];

      // Check for singular matrix
      if (Math.abs(A[col][col]) < 1e-15) continue;

      // Eliminate column
      for (let row = col + 1; row < n; row++) {
        const factor = A[row][col] / A[col][col];
        for (let j = col; j < n; j++) {
          A[row][j] -= factor * A[col][j];
        }
        b[row] -= factor * b[col];
      }
    }

    // Back substitution
    const x = Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      if (Math.abs(A[row][row]) < 1e-15) continue;
      x[row] = b[row];
      for (let col = row + 1; col < n; col++) {
        x[row] -= A[row][col] * x[col];
      }
      x[row] /= A[row][row];
    }

    return x;
  }

  /**
   * Run one analysis step
   */
  analyze() {
    const mna = this.buildMNAMatrix();
    if (!mna) return;

    const { G, I, nodeIndex, size } = mna;
    const solution = this.solve(G, I);

    // Extract node voltages
    nodeIndex.forEach((idx, node) => {
      this.voltages.set(node, solution[idx] || 0);
      this.nodes.set(node, solution[idx] || 0);
    });

    // Update component states
    this.components.forEach(comp => {
      const va = this.voltages.get(comp.nodeA) || 0;
      const vb = this.voltages.get(comp.nodeB) || 0;
      comp.prevVoltage = va - vb;

      // Calculate current through each component
      if (comp.type === 'resistor') {
        comp.current = comp.prevVoltage / comp.resistance;
      }
    });

    return {
      voltages: this.voltages,
      currents: this.currents
    };
  }

  /**
   * Step simulation forward in time
   */
  step() {
    if (!this.isRunning) return;

    // Newton-Raphson iterations for nonlinear elements
    for (let iter = 0; iter < 10; iter++) {
      this.analyze();
    }

    this.time += this.dt;
  }

  /**
   * Start simulation
   */
  start() {
    this.isRunning = true;
  }

  /**
   * Stop simulation
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Reset simulation
   */
  reset() {
    this.time = 0;
    this.components.forEach(comp => {
      comp.prevVoltage = 0;
      comp.prevCurrent = 0;
      comp.current = 0;
      if (comp.brightness !== undefined) comp.brightness = 0;
    });
    this.voltages.clear();
    this.currents.clear();
  }

  /**
   * Get analysis results
   */
  getResults() {
    return {
      time: this.time,
      voltages: Object.fromEntries(this.voltages),
      components: this.components.map(c => ({
        id: c.id,
        type: c.type,
        voltage: c.prevVoltage || 0,
        current: c.current || 0,
        brightness: c.brightness
      }))
    };
  }
}

export default CircuitEngine;
