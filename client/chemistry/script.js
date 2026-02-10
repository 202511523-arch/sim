// Complete Periodic Table with accurate chemistry data (Common Elements)
const elements = [
    // Period 1
    { symbol: 'H', name: 'Hydrogen', number: 1, mass: 1.008, color: '#FFFFFF', radius: 25, electroneg: 2.20, valence: 1, maxBonds: 1, electrons: [1], category: 'nonmetal', canBondWith: ['nonmetal', 'halogen', 'metalloid'] },
    { symbol: 'He', name: 'Helium', number: 2, mass: 4.003, color: '#D9FFFF', radius: 28, electroneg: null, valence: 0, maxBonds: 0, electrons: [2], category: 'noble-gas', canBondWith: [] },

    // Period 2
    { symbol: 'Li', name: 'Lithium', number: 3, mass: 6.941, color: '#CC80FF', radius: 45, electroneg: 0.98, valence: 1, maxBonds: 1, electrons: [2, 1], category: 'alkali', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Be', name: 'Beryllium', number: 4, mass: 9.012, color: '#C2FF00', radius: 38, electroneg: 1.57, valence: 2, maxBonds: 2, electrons: [2, 2], category: 'alkaline-earth', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'B', name: 'Boron', number: 5, mass: 10.81, color: '#FFB5B5', radius: 35, electroneg: 2.04, valence: 3, maxBonds: 3, electrons: [2, 3], category: 'metalloid', canBondWith: ['nonmetal', 'halogen', 'metalloid'] },
    { symbol: 'C', name: 'Carbon', number: 6, mass: 12.011, color: '#909090', radius: 40, electroneg: 2.55, valence: 4, maxBonds: 4, electrons: [2, 4], category: 'nonmetal', canBondWith: ['nonmetal', 'halogen', 'metalloid', 'metal'] },
    { symbol: 'N', name: 'Nitrogen', number: 7, mass: 14.007, color: '#3050F8', radius: 38, electroneg: 3.04, valence: 3, maxBonds: 4, electrons: [2, 5], category: 'nonmetal', canBondWith: ['nonmetal', 'halogen', 'metalloid', 'metal'] },
    { symbol: 'O', name: 'Oxygen', number: 8, mass: 15.999, color: '#FF0D0D', radius: 37, electroneg: 3.44, valence: 2, maxBonds: 2, electrons: [2, 6], category: 'nonmetal', canBondWith: ['nonmetal', 'halogen', 'metalloid', 'metal', 'alkali', 'alkaline-earth', 'transition'] },
    { symbol: 'F', name: 'Fluorine', number: 9, mass: 18.998, color: '#90E050', radius: 35, electroneg: 3.98, valence: 1, maxBonds: 1, electrons: [2, 7], category: 'halogen', canBondWith: ['nonmetal', 'metal', 'metalloid', 'alkali', 'alkaline-earth', 'transition'] },
    { symbol: 'Ne', name: 'Neon', number: 10, mass: 20.18, color: '#B3E3F5', radius: 30, electroneg: null, valence: 0, maxBonds: 0, electrons: [2, 8], category: 'noble-gas', canBondWith: [] },

    // Period 3
    { symbol: 'Na', name: 'Sodium', number: 11, mass: 22.990, color: '#AB5CF2', radius: 50, electroneg: 0.93, valence: 1, maxBonds: 1, electrons: [2, 8, 1], category: 'alkali', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Mg', name: 'Magnesium', number: 12, mass: 24.305, color: '#8AFF00', radius: 45, electroneg: 1.31, valence: 2, maxBonds: 2, electrons: [2, 8, 2], category: 'alkaline-earth', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Al', name: 'Aluminum', number: 13, mass: 26.982, color: '#BFA6A6', radius: 43, electroneg: 1.61, valence: 3, maxBonds: 3, electrons: [2, 8, 3], category: 'metal', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Si', name: 'Silicon', number: 14, mass: 28.086, color: '#F0C8A0', radius: 42, electroneg: 1.90, valence: 4, maxBonds: 4, electrons: [2, 8, 4], category: 'metalloid', canBondWith: ['nonmetal', 'halogen', 'metalloid'] },
    { symbol: 'P', name: 'Phosphorus', number: 15, mass: 30.974, color: '#FF8000', radius: 42, electroneg: 2.19, valence: 3, maxBonds: 5, electrons: [2, 8, 5], category: 'nonmetal', canBondWith: ['nonmetal', 'halogen', 'metalloid'] },
    { symbol: 'S', name: 'Sulfur', number: 16, mass: 32.06, color: '#FFFF30', radius: 42, electroneg: 2.58, valence: 2, maxBonds: 6, electrons: [2, 8, 6], category: 'nonmetal', canBondWith: ['nonmetal', 'halogen', 'metalloid', 'metal'] },
    { symbol: 'Cl', name: 'Chlorine', number: 17, mass: 35.45, color: '#1FF01F', radius: 40, electroneg: 3.16, valence: 1, maxBonds: 1, electrons: [2, 8, 7], category: 'halogen', canBondWith: ['nonmetal', 'metal', 'metalloid', 'alkali', 'alkaline-earth', 'transition'] },
    { symbol: 'Ar', name: 'Argon', number: 18, mass: 39.948, color: '#80D1E3', radius: 35, electroneg: null, valence: 0, maxBonds: 0, electrons: [2, 8, 8], category: 'noble-gas', canBondWith: [] },

    // Period 4 (selected)
    { symbol: 'K', name: 'Potassium', number: 19, mass: 39.098, color: '#8F40D4', radius: 55, electroneg: 0.82, valence: 1, maxBonds: 1, electrons: [2, 8, 8, 1], category: 'alkali', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Ca', name: 'Calcium', number: 20, mass: 40.078, color: '#3DFF00', radius: 52, electroneg: 1.00, valence: 2, maxBonds: 2, electrons: [2, 8, 8, 2], category: 'alkaline-earth', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Fe', name: 'Iron', number: 26, mass: 55.845, color: '#E06633', radius: 42, electroneg: 1.83, valence: 3, maxBonds: 6, electrons: [2, 8, 14, 2], category: 'transition', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Cu', name: 'Copper', number: 29, mass: 63.546, color: '#C88033', radius: 40, electroneg: 1.90, valence: 2, maxBonds: 4, electrons: [2, 8, 18, 1], category: 'transition', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Zn', name: 'Zinc', number: 30, mass: 65.38, color: '#7D80B0', radius: 42, electroneg: 1.65, valence: 2, maxBonds: 4, electrons: [2, 8, 18, 2], category: 'transition', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Br', name: 'Bromine', number: 35, mass: 79.904, color: '#A62929', radius: 45, electroneg: 2.96, valence: 1, maxBonds: 1, electrons: [2, 8, 18, 7], category: 'halogen', canBondWith: ['nonmetal', 'metal', 'metalloid', 'alkali', 'alkaline-earth', 'transition'] },

    // Period 5 (selected)
    { symbol: 'Ag', name: 'Silver', number: 47, mass: 107.87, color: '#C0C0C0', radius: 44, electroneg: 1.93, valence: 1, maxBonds: 4, electrons: [2, 8, 18, 18, 1], category: 'transition', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'I', name: 'Iodine', number: 53, mass: 126.90, color: '#940094', radius: 47, electroneg: 2.66, valence: 1, maxBonds: 7, electrons: [2, 8, 18, 18, 7], category: 'halogen', canBondWith: ['nonmetal', 'metal', 'metalloid', 'alkali', 'alkaline-earth', 'transition'] },

    // Period 6 (selected)
    { symbol: 'Au', name: 'Gold', number: 79, mass: 196.97, color: '#FFD123', radius: 44, electroneg: 2.54, valence: 3, maxBonds: 6, electrons: [2, 8, 18, 32, 18, 1], category: 'transition', canBondWith: ['nonmetal', 'halogen'] },
    { symbol: 'Pb', name: 'Lead', number: 82, mass: 207.2, color: '#575961', radius: 46, electroneg: 2.33, valence: 4, maxBonds: 4, electrons: [2, 8, 18, 32, 18, 4], category: 'metal', canBondWith: ['nonmetal', 'halogen'] },
];

// Bond type definitions based on electronegativity difference
const BOND_TYPES = {
    COVALENT: 'covalent',      // < 0.5 electronegativity diff
    POLAR_COVALENT: 'polar',   // 0.5 - 1.7
    IONIC: 'ionic'             // > 1.7
};

// Check if two elements can bond based on chemistry rules
function canElementsBond(element1, element2) {
    // 1. Noble Gases Exception: Generally inert
    if (element1.category === 'noble-gas' || element2.category === 'noble-gas') {
        return false;
    }
    // 2. Allow all other bonds (Removed strict compatibility check)
    // This enables N-O, nonmetal-nonmetal, and coordinate bonds.
    return true;
}

// Get bond type based on electronegativity difference with chemical exceptions
function getBondType(element1, element2) {
    const s1 = element1.symbol;
    const s2 = element2.symbol;
    const cat1 = element1.category;
    const cat2 = element2.category;

    // Exception 1: Hydrogen Fluoride (HF) - Technically >1.7 but Polar Covalent
    if ((s1 === 'H' && s2 === 'F') || (s1 === 'F' && s2 === 'H')) {
        return BOND_TYPES.POLAR_COVALENT;
    }

    // Exception 2: Nitrogen-Oxygen (NO) - Treated as Polar Covalent due to resonance/dipole significance
    if ((s1 === 'N' && s2 === 'O') || (s1 === 'O' && s2 === 'N')) {
        return BOND_TYPES.POLAR_COVALENT;
    }

    // Exception 3: Alkali Metal Hydrides (e.g., NaH) - Technically <1.7 but Ionic
    if ((s1 === 'H' && cat2 === 'alkali') || (s2 === 'H' && cat1 === 'alkali')) {
        return BOND_TYPES.IONIC;
    }

    if (!element1.electroneg || !element2.electroneg) return BOND_TYPES.IONIC;

    const diff = Math.abs(element1.electroneg - element2.electroneg);
    // Adjusted threshold to 0.4 to capture weakly polar bonds like C-N (0.45) or others if desired
    if (diff < 0.4) return BOND_TYPES.COVALENT;
    if (diff <= 1.7) return BOND_TYPES.POLAR_COVALENT;
    return BOND_TYPES.IONIC;
}

// Check if atom can accept more bonds (Extended Octet Rule)
function canAtomAcceptBond(atom, proposedOrder = 1, partnerElement = null) {
    const currentBonds = countBonds(atom);
    const newTotal = currentBonds + proposedOrder;
    const symbol = atom.element.symbol;

    // --- Strict Chemical Valence Rules ---

    // 1. Hydrogen & Halogens (Group 17): Strictly max 1 bond
    if (['H', 'F', 'Cl', 'Br', 'I'].includes(symbol)) {
        if (newTotal > 1) return false;
    }

    // 2. Carbon: Strictly max 4 bonds
    if (symbol === 'C') {
        if (newTotal > 4) return false;
    }

    // 3. Oxygen: Max 2 (or 3 for H3O+)
    if (symbol === 'O') {
        if (newTotal > 3) return false; // H3O+ boundary
        if (newTotal > 2 && (!partnerElement || partnerElement.symbol !== 'H')) {
            // Usually O doesn't form 3 bonds unless it's a protonation or resonance
            return false;
        }
    }

    // 4. Nitrogen: Max 3 (or 4 for NH4+)
    if (symbol === 'N') {
        if (newTotal > 4) return false;
    }

    // 5. Boron/Beryllium: Electron deficient is okay (e.g. BF3 has 3 bonds), but cap at 4
    if (symbol === 'B' || symbol === 'Be') {
        if (newTotal > 4) return false;
    }

    // 6. Metals (Transition/Post-transition): Strict Cap at 6
    // Prevents "spiderweb" bonding for Ag, Au, Pb, etc.
    const group = atom.element.group;
    if ((group >= 3 && group <= 12) || (group >= 13 && atom.element.number > 13)) {
        if (newTotal > 6) return false;
    }

    // --- General Valence & Extended Octet Logic ---

    // Calculate Effective Valence Capacity based on Charge
    let effectiveValence = atom.element.valence;
    const charge = atom.charge || 0;

    // Adjust capacity for ions (simplified)
    if (atom.element.group >= 14) effectiveValence += charge;

    // Rule A: Within standard valence limit -> OK
    if (newTotal <= effectiveValence) return true;

    // Rule B: Special Ions (Ammonium, Hydronium) -> OK
    if (symbol === 'N' && newTotal <= 4) return true;
    if (symbol === 'O' && newTotal <= 3) return true;

    // Rule C: Extended Octet (Period 3+ elements: P, S, etc.)
    // Only allows hypervalency if bonded to high electronegativity atoms (F, O, Cl) or if user insists
    const isPeriod3Plus = atom.element.number >= 13;
    if (isPeriod3Plus) {
        if (newTotal <= atom.element.maxBonds) return true;
    }

    return false;
}


// Helper: Count bonds for an atom
function countBonds(atom) {
    return bonds.reduce((sum, bond) => {
        if (bond.atom1 === atom || bond.atom2 === atom) {
            return sum + (bond.order || 1);
        }
        return sum;
    }, 0);
}

// Show notification helper (Moved to global scope)
// Show notification helper (Moved to global scope)
function showNotification(message, duration = 3000, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `chem-toast ${type}`;

    // Icon mapping
    let icon = 'info';
    if (type === 'error') icon = 'error_outline';
    if (type === 'warning') icon = 'warning_amber';
    if (type === 'success') icon = 'check_circle';

    notification.innerHTML = `
        <span class="material-icons-round">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translate(-50%, -20px) scale(0.9)'; // Disappear upwards
        notification.style.transition = 'all 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, duration);
}

// Helper for multi-element update
function updateUI(idOrSelector, value) {
    const selector = idOrSelector.includes('.') || idOrSelector.includes('#') || idOrSelector.includes('[')
        ? idOrSelector
        : `#${idOrSelector}, .${idOrSelector}-display`;
    document.querySelectorAll(selector).forEach(el => {
        if (el.tagName === 'INPUT') el.value = value;
        else el.textContent = value;
    });
}

// Show bond error message
function showBondError(element1, element2) {
    const msg = `Cannot bond ${element1.name}(${element1.symbol}) and ${element2.name}(${element2.symbol}).\n` +
        `Reason: ${element1.category === 'noble-gas' || element2.category === 'noble-gas' ?
            'Noble gases generally do not form bonds.' :
            'Chemically incompatible elements.'}`;

    showNotification(msg, 4000, 'error');
}

// Molecule name mapping
const moleculeNames = {
    'water': 'Water',
    'methane': 'Methane',
    'ethanol': 'Ethanol',
    'benzene': 'Benzene',
    'ammonia': 'Ammonia',
    'co2': 'Carbon Dioxide',
    'acetone': 'Acetone',
    'acetic-acid': 'Acetic Acid'
};

// Chemical information database
const chemicalDatabase = {
    'water': {
        name: 'Water',
        formula: 'H₂O',
        molarMass: 18.015,
        boilingPoint: '100°C',
        meltingPoint: '0°C',
        density: '1.00 g/cm³',
        polarity: 'Polar',
        uses: 'Solvent, life support'
    },
    'methane': {
        name: 'Methane',
        formula: 'CH₄',
        molarMass: 16.043,
        boilingPoint: '-161.5°C',
        meltingPoint: '-182.5°C',
        density: '0.656 g/L',
        polarity: 'Non-polar',
        uses: 'Fuel, hydrogen production'
    },
    'ethanol': {
        name: 'Ethanol',
        formula: 'C₂H₅OH',
        molarMass: 46.069,
        boilingPoint: '78.4°C',
        meltingPoint: '-114.1°C',
        density: '0.789 g/cm³',
        polarity: 'Polar',
        uses: 'Solvent, fuel, disinfectant'
    },
    'benzene': {
        name: 'Benzene',
        formula: 'C₆H₆',
        molarMass: 78.114,
        boilingPoint: '80.1°C',
        meltingPoint: '5.5°C',
        density: '0.876 g/cm³',
        polarity: 'Non-polar',
        uses: 'Solvent, chemical synthesis'
    },
    'ammonia': {
        name: 'Ammonia',
        formula: 'NH₃',
        molarMass: 17.031,
        boilingPoint: '-33.3°C',
        meltingPoint: '-77.7°C',
        density: '0.73 g/L',
        polarity: 'Polar',
        uses: 'Fertilizer, cleaning agent'
    },
    'co2': {
        name: 'Carbon Dioxide',
        formula: 'CO₂',
        molarMass: 44.009,
        boilingPoint: '-78.5°C (sublimation)',
        meltingPoint: '-56.6°C',
        density: '1.98 g/L',
        polarity: 'Non-polar',
        uses: 'Fire extinguisher, soft drinks'
    },
    'acetone': {
        name: 'Acetone',
        formula: 'C₃H₆O',
        molarMass: 58.080,
        boilingPoint: '56.1°C',
        meltingPoint: '-94.7°C',
        density: '0.784 g/cm³',
        polarity: 'Polar',
        uses: 'Solvent, cleaning agent'
    },
    'acetic-acid': {
        name: 'Acetic Acid',
        formula: 'C₂H₄O₂',
        molarMass: 60.052,
        boilingPoint: '118.1°C',
        meltingPoint: '16.6°C',
        density: '1.049 g/cm³',
        polarity: 'Polar',
        uses: 'Vinegar, chemical synthesis'
    }
};

// Global state
let canvas, ctx;
let atoms = [];
let bonds = [];
let selectedElement = elements[5]; // Default to Carbon (Atomic number 6)
let selectedAtom = null;
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };
let cameraOffset = { x: 0, y: 0 };
let cameraZoom = 1;
let lastMousePos = { x: 0, y: 0 };
let measureMode = null; // 'angle' or 'distance'
let measurePoints = [];
let animationRunning = false;
let animationId = null;
let bondEditMode = false;
let vibrationMode = false;
let reactionMode = false;
let vibrationAmplitude = 0;

// Current Tool State
let currentTool = 'select'; // 'select', 'rotate', 'build', 'measure-angle', 'measure-distance'
let isDrawingBond = false;
let bondSourceAtom = null;
let mouseWorldPos = { x: 0, y: 0 };

// Lab Simulation State
let temperature = 298;
let thermalDecompEnabled = false;
let simulationId = null;
let currentSimMode = 'molecule'; // 'molecule', 'atom', 'periodic', 'gas', 'equilibrium', 'thermo'

function handleModeChange(mode) {
    currentSimMode = mode;
    const modeNames = {
        'molecule': 'Molecule',
        'atom': 'Atom',
        'periodic': 'Periodic Table',
        'gas': 'Gas',
        'equilibrium': 'Chemical Equilibrium',
        'thermo': 'Thermochemistry'
    };
    showNotification(`Switched to ${modeNames[mode] || mode} mode.`, 2000, 'success');

    // Clear viewport if needed
    if (mode === 'atom') {
        // Reset focus for single atom
        selectedAtom = null;
        if (atoms.length > 1) {
            atoms = [atoms[0]]; // Focus on first atom or most recent
        } else if (atoms.length === 0) {
            loadQuickMolecule('water'); // Placeholder
            atoms = [atoms[0]];
        }
        bonds = [];
    }

    render();
}

// Initialize
function init() {
    canvas = document.getElementById('viewport');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse events
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // 1. Toolbar & View Controls
    document.querySelectorAll('.strip-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.strip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const toolId = btn.id;
            switch (toolId) {
                case 'select-tool': currentTool = 'select'; break;
                case 'rotate-tool': currentTool = 'rotate'; break;
                case 'build-tool': currentTool = 'build'; break;
                case 'toggle-bond': currentTool = 'bond'; break;
                case 'measure-angle': currentTool = 'measure-angle'; break;
                case 'measure-distance': currentTool = 'measure-distance'; break;
            }
            render();
        });
    });

    document.getElementById('zoom-in')?.addEventListener('click', () => zoom(1.2));
    document.getElementById('zoom-out')?.addEventListener('click', () => zoom(0.8));
    document.getElementById('clear-all')?.addEventListener('click', clearAll);
    document.getElementById('delete-atom')?.addEventListener('click', deleteSelectedAtom);
    document.getElementById('export-pdf')?.addEventListener('click', exportMoleculeToPDF);

    // 2. Lab Simulation
    document.getElementById('temp-slider')?.addEventListener('input', (e) => {
        temperature = parseInt(e.target.value);
        document.getElementById('temp-value').textContent = `${temperature} K`;
        updateTemperatureBackground(temperature); // Update background color
        render();
    });

    document.getElementById('thermal-decomp')?.addEventListener('change', (e) => {
        thermalDecompEnabled = e.target.checked;
    });

    // 3. Analysis Tools
    document.getElementById('calc-moles')?.addEventListener('click', calculateMoles);
    document.getElementById('calc-ph')?.addEventListener('click', calculatepH);
    document.getElementById('calc-charges')?.addEventListener('click', () => calculateAtomicCharges(false));
    document.getElementById('show-mo-diagram')?.addEventListener('click', showMODiagram);

    // 4. Quick Molecules
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => loadQuickMolecule(btn.dataset.molecule));
    });

    // Initialize Everything
    populateElementGrid();
    initStudyNotes();
    loadQuickMolecule('water');

    // Additional UI bindings
    document.getElementById('show-ir')?.addEventListener('click', () => showSpectrum('IR'));
    document.getElementById('show-nmr')?.addEventListener('click', () => showSpectrum('NMR'));
    document.getElementById('generate-qchem')?.addEventListener('click', generateQChemInput);
    document.getElementById('vibration-mode')?.addEventListener('click', toggleVibrationMode);
    document.getElementById('reaction-pathway')?.addEventListener('click', toggleReactionPathway);
    document.getElementById('vib-freq')?.addEventListener('input', (e) => {
        document.getElementById('freq-value').textContent = `${e.target.value} cm⁻¹`;
    });

    // Start global animation loop
    requestAnimationFrame(renderLoop);

    document.getElementById('sim-mode-select')?.addEventListener('change', (e) => {
        handleModeChange(e.target.value);
    });

    // Handle URL parameters for direct simulation access
    const urlParams = new URLSearchParams(window.location.search);
    const modeParam = urlParams.get('mode');
    if (modeParam) {
        const modeSelect = document.getElementById('sim-mode-select');
        if (modeSelect) {
            modeSelect.value = modeParam;
            handleModeChange(modeParam);
        }
    }

    // Welcome feedback to confirm script is working
    setTimeout(() => {
        showNotification('SIMVEX Chemistry Analysis Engine activated.', 3000);
    }, 1000);
}

// === Real-time Auto-update Integration Function ===
function updateAllRealtime() {
    // 1. Basic Info (Formula, Molecular Weight)
    updateMoleculeInfo();

    // 2. Physicochemical Properties & Thermodynamics (Energy, Enthalpy, etc.)
    calculateProperties();

    // 3. Molecular Orbital Energy (HOMO/LUMO)
    calculateMOEnergies();

    // 4. VSEPR Geometry Analysis
    evaluateMoleculeGeometry();

    // 5. Charge Calculation (Default: NPA)
    // Simple check as too many atoms can cause lag
    if (atoms.length < 50) calculateAtomicCharges(true);
}

/**
 * Initialize Study Notes and Manage Functionality
 */
function initStudyNotes() {
    // --- Modal Elements ---
    const modal = document.getElementById('study-modal');
    const openBtn = document.getElementById('open-study-tool');
    const closeBtn = document.getElementById('close-study-modal');
    const tabs = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    if (!modal) return;

    // Open/Close Modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.showModal();
            renderNotes();
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => modal.close());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.close();
    });

    // Tab Switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.fontWeight = 'normal';
                t.style.color = 'var(--text-muted)';
            });
            tabPanes.forEach(c => {
                c.style.display = 'none';
                c.classList.remove('active');
            });
            tab.classList.add('active');
            tab.style.fontWeight = 'bold';
            tab.style.color = 'var(--text-main)';
            const content = document.getElementById(`tab-${tab.dataset.tab}`);
            if (content) {
                content.style.display = 'block';
                content.classList.add('active');
            }
        });
    });

    // --- Study Notes Logic ---
    const notesList = document.getElementById('popup-notes-list');
    const editor = document.getElementById('popup-note-editor');
    const addBtn = document.getElementById('popup-add-note');
    const cancelBtn = document.getElementById('popup-cancel-note');
    const saveBtn = document.getElementById('popup-save-note');
    const titleInput = document.getElementById('popup-note-title');
    const contentInput = document.getElementById('popup-note-content');
    const searchInput = document.getElementById('note-search');

    let notes = JSON.parse(localStorage.getItem('chemNotes')) || [];

    function renderNotes(filter = '') {
        if (!notesList) return;
        notesList.innerHTML = '';
        const filtered = notes.filter(n =>
            n.title.toLowerCase().includes(filter.toLowerCase()) ||
            n.content.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            notesList.innerHTML = '<div class="empty-state">No notes found</div>';
            return;
        }

        filtered.forEach((note, index) => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.innerHTML = `
                <h3>${note.title}</h3>
                <p>${note.content}</p>
                <small style="color:#666; display:block; margin-top:5px;">${note.date}</small>
                <div style="position:absolute; top:10px; right:10px;">
                    <button class="icon-btn delete-note" data-index="${index}" style="color:#888;">🗑️</button>
                </div>
            `;
            notesList.appendChild(card);
        });

        document.querySelectorAll('.delete-note').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                if (confirm('Are you sure you want to delete this note?')) {
                    // Find correct item if filtered (simplified: just reload for now or use unique ID)
                    // For robustness with filter: match object reference
                    const targetNote = filtered[idx];
                    const mainIdx = notes.indexOf(targetNote);
                    if (mainIdx > -1) {
                        notes.splice(mainIdx, 1);
                        localStorage.setItem('chemNotes', JSON.stringify(notes));
                        renderNotes(searchInput ? searchInput.value : '');
                    }
                }
            });
        });
    }

    const aiSendBtn = document.getElementById('ai-send-btn');
    const aiInput = document.getElementById('ai-chat-input') || document.getElementById('ai-input');
    const aiLog = document.getElementById('ai-chat-history');

    async function sendToGemini(query) {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            appendChatMessage('ai', "API key not set. Please set your API key in the Dashboard first!");
            return;
        }

        try {
            const formula = document.getElementById('formula').textContent;
            const weight = document.getElementById('mol-weight').textContent;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `The user is currently performing a chemistry simulation. The current molecule is ${formula} (Molecular Weight: ${weight}). Please answer the following question like a friendly chemistry teacher: ${query}` }] }]
                })
            });
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            const text = data.candidates[0].content.parts[0].text;
            appendChatMessage('ai', text);
        } catch (error) {
            appendChatMessage('ai', "An error occurred. Please check if your API key is correct. (Error: " + error.message + ")");
            console.error(error);
        }
    }

    function handleChat() {
        const query = aiInput.value.trim();
        if (!query) return;

        appendChatMessage('user', query);
        aiInput.value = '';
        sendToGemini(query);
    }

    function appendChatMessage(sender, text) {
        if (!aiLog) return;
        const msg = document.createElement('div');
        msg.className = `chat-bubble ${sender}`;
        msg.style.cssText = `
            margin-bottom: 12px;
            padding: 10px 14px;
            border-radius: 12px;
            max-width: 85%;
            font-size: 13px;
            line-height: 1.5;
            ${sender === 'user' ?
                'background: var(--accent-blue); color: white; align-self: flex-end; margin-left: auto;' :
                'background: rgba(255,255,255,0.05); color: #ddd; align-self: flex-start; border: 1px solid rgba(255,255,255,0.1);'}
        `;
        msg.textContent = text;
        aiLog.appendChild(msg);
        aiLog.scrollTop = aiLog.scrollHeight;
    }

    if (aiSendBtn) aiSendBtn.addEventListener('click', handleChat);
    if (aiInput) aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    if (addBtn) addBtn.addEventListener('click', () => {
        editor.classList.remove('hidden');
        titleInput.value = '';
        contentInput.value = '';
        titleInput.focus();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        editor.classList.add('hidden');
    });

    if (saveBtn) saveBtn.addEventListener('click', () => {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title || !content) {
            alert('Please enter both title and content.');
            return;
        }
        notes.unshift({
            title, content,
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
        });
        localStorage.setItem('chemNotes', JSON.stringify(notes));
        editor.classList.add('hidden');
        renderNotes();
    });

    if (searchInput) searchInput.addEventListener('input', (e) => renderNotes(e.target.value));

    // Support for Chemistry FABs
    const fabChat = document.getElementById('fab-chat');
    if (fabChat) {
        fabChat.addEventListener('click', () => {
            modal.showModal();
            const tab = document.querySelector('.tab-btn[data-tab="ai-tutor"]');
            if (tab) tab.click();
        });
    }
}

function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    render();
}

function populateElementGrid() {
    const grid = document.getElementById('element-grid');
    grid.innerHTML = '';

    elements.forEach((element, index) => {
        const btn = document.createElement('button');
        btn.className = 'element-btn';
        btn.draggable = true;
        if (index === 5) btn.classList.add('selected'); // Carbon selected by default (Atomic number 6)
        btn.style.borderColor = element.color;
        btn.innerHTML = `
            <div class="element-symbol" style="color: ${element.color}">${element.symbol}</div>
            <div class="element-number">${element.number}</div>
        `;
        const catMap = {
            'nonmetal': 'Non-metal', 'noble-gas': 'Noble Gas', 'alkali': 'Alkali Metal',
            'alkaline-earth': 'Alkaline Earth Metal', 'metalloid': 'Metalloid', 'halogen': 'Halogen',
            'metal': 'Metal', 'transition': 'Transition Metal', 'lanthanide': 'Lanthanide', 'actinide': 'Actinide'
        };
        const catName = catMap[element.category] || element.category;
        btn.title = `${element.name} (${element.symbol})\nCategory: ${catName}\nAtomic Mass: ${element.mass}\nElectronegativity: ${element.electroneg || '-'}\nValence: ${element.valence}`;

        btn.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', element.symbol);
            e.dataTransfer.effectAllowed = 'copy';
            btn.classList.add('dragging');
        });

        btn.addEventListener('dragend', () => {
            btn.classList.remove('dragging');
        });

        btn.addEventListener('click', () => {
            document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedElement = element;
            currentTool = 'build';
        });
        grid.appendChild(btn);
    });
}

// Mouse events
function onMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    lastMousePos = { x: mouseX, y: mouseY };

    // Check if clicking on an atom
    const clickedAtom = getAtomAtPosition(mouseX, mouseY);

    if (e.button === 0) { // Left click
        if (bondEditMode && clickedAtom) {
            // Bond edit mode
            if (!selectedAtom) {
                selectedAtom = clickedAtom;
                render();
            } else if (selectedAtom !== clickedAtom) {
                toggleBondBetweenAtoms(selectedAtom, clickedAtom);
                selectedAtom = null;
                render();
            }
        } else if (currentTool === 'measure-distance' && clickedAtom) {
            measurePoints.push(clickedAtom);
            if (measurePoints.length === 2) {
                const distance = calculateDistance(measurePoints[0], measurePoints[1]);
                alert(`Distance: ${distance.toFixed(1)} pm`);
                measurePoints = [];
            }
            render();
        } else if (currentTool === 'measure-angle' && clickedAtom) {
            measurePoints.push(clickedAtom);
            if (measurePoints.length === 3) {
                const angle = calculateAngle(measurePoints[0], measurePoints[1], measurePoints[2]);
                alert(`Bond Angle: ${angle.toFixed(1)}°`);
                measurePoints = [];
            }
            render();
        } else if (currentTool === 'build') {
            if (clickedAtom) {
                // Clicked on an atom in build mode: Start bond creation
                // Do NOT change the element type automatically.
                bondSourceAtom = clickedAtom;
                isDrawingBond = true;
                selectedAtom = clickedAtom;
            } else {
                // Add new atom in build mode
                const worldPos = screenToWorld(mouseX, mouseY);
                const newAtom = addAtom(worldPos.x, worldPos.y);
                selectedAtom = newAtom;
                bondSourceAtom = newAtom;
                isDrawingBond = true;
            }
        } else if (clickedAtom) {
            // Select atom
            selectAtom(clickedAtom);
            updateVSEPRPanel(clickedAtom);

            if (currentTool === 'select') {
                isDragging = true; // Enable atom dragging
            }
        } else {
            // Empty space click
            isDragging = true; // Camera pan or rotate
        }
    } else if (e.button === 1 || e.button === 2) { // Middle or right click
        isDragging = true;
        dragStartPos = { x: mouseX, y: mouseY };
    }

    // Bond clicking logic for verification
    if (!clickedAtom && !isDrawingBond && !isDragging) {
        // Simple line-point collision detection for bonds
        const bondClicked = bonds.find(bond => {
            const p1 = worldToScreen(bond.atom1.x, bond.atom1.y);
            const p2 = worldToScreen(bond.atom2.x, bond.atom2.y);

            // Distance from point to line segment
            const A = mouseX - p1.x;
            const B = mouseY - p1.y;
            const C = p2.x - p1.x;
            const D = p2.y - p1.y;

            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) param = dot / len_sq;

            let xx, yy;
            if (param < 0) { xx = p1.x; yy = p1.y; }
            else if (param > 1) { xx = p2.x; yy = p2.y; }
            else { xx = p1.x + param * C; yy = p1.y + param * D; }

            const dx = mouseX - xx;
            const dy = mouseY - yy;
            return (dx * dx + dy * dy) < 25; // 5px radius threshold
        });

        if (bondClicked) {
            showBondDetails(bondClicked, mouseX, mouseY);
        } else {
            hideBondDetails();
        }
    }
}

function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldPos = screenToWorld(mouseX, mouseY);
    mouseWorldPos = worldPos;

    if (isDrawingBond && currentTool === 'build') {
        render();
    } else if (isDragging) {
        if (selectedAtom && currentTool === 'select' && e.buttons === 1) {
            // Drag atom
            selectedAtom.x = worldPos.x;
            selectedAtom.y = worldPos.y;
            analyzeBonds();
            updateAllRealtime(); // Add real-time data update during drag
            render();
        } else {
            const dx = mouseX - lastMousePos.x;
            const dy = mouseY - lastMousePos.y;

            if (currentTool === 'rotate' && e.buttons === 1) {
                // Rotate molecule around center
                const angle = dx * 0.01;

                // Center of mass
                let cmX = 0, cmY = 0;
                atoms.forEach(a => { cmX += a.x; cmY += a.y; });
                cmX /= atoms.length;
                cmY /= atoms.length;

                atoms.forEach(atom => {
                    const relX = atom.x - cmX;
                    const relY = atom.y - cmY;
                    atom.x = cmX + (relX * Math.cos(angle) - relY * Math.sin(angle));
                    atom.y = cmY + (relX * Math.sin(angle) + relY * Math.cos(angle));
                });
            } else {
                // Pan camera
                cameraOffset.x += dx;
                cameraOffset.y += dy;
            }
            render();
        }
    }
    lastMousePos = { x: mouseX, y: mouseY };

    // Update cursor
    const atom = getAtomAtPosition(mouseX, mouseY);
    canvas.style.cursor = atom ? 'pointer' : 'default';

    lastMousePos = { x: mouseX, y: mouseY };
}

function onMouseUp(e) {
    if (isDrawingBond && currentTool === 'build') {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const targetAtom = getAtomAtPosition(mouseX, mouseY);

        const worldPos = screenToWorld(mouseX, mouseY);
        const dist = Math.sqrt(Math.pow(worldPos.x - bondSourceAtom.x, 2) + Math.pow(worldPos.y - bondSourceAtom.y, 2));

        if (targetAtom && targetAtom !== bondSourceAtom) {
            // Check chemistry rules before bonding
            if (canElementsBond(bondSourceAtom.element, targetAtom.element) &&
                canAtomAcceptBond(bondSourceAtom, 1, targetAtom.element) &&
                canAtomAcceptBond(targetAtom, 1, bondSourceAtom.element)) {

                // Connect to existing atom
                if (!bonds.some(b => (b.atom1 === bondSourceAtom && b.atom2 === targetAtom) || (b.atom1 === targetAtom && b.atom2 === bondSourceAtom))) {
                    const bondType = getBondType(bondSourceAtom.element, targetAtom.element);
                    bonds.push({ atom1: bondSourceAtom, atom2: targetAtom, order: 1, type: bondType });

                    // Trigger geometry update needed
                    if (atoms.length > 2) optimizeGeometry();
                    updateAllRealtime(); // Update on bond creation
                }
            } else {
                showBondError(bondSourceAtom.element, targetAtom.element);
            }
        } else if (dist > 20) {
            // Create new atom and connect
            const newAtom = addAtom(worldPos.x, worldPos.y);
            // Do not call within addAtom; process all at once after bond completion here

            if (canElementsBond(bondSourceAtom.element, newAtom.element) &&
                canAtomAcceptBond(bondSourceAtom, 1, newAtom.element) &&
                canAtomAcceptBond(newAtom, 1, bondSourceAtom.element)) {

                const bondType = getBondType(bondSourceAtom.element, newAtom.element);
                bonds.push({ atom1: bondSourceAtom, atom2: newAtom, order: 1, type: bondType });

                // Trigger geometry update needed
                if (atoms.length > 2) optimizeGeometry();
                updateAllRealtime(); // Update on new atom+bond creation
            } else {
                showBondError(bondSourceAtom.element, newAtom.element);
            }
        }
    }
    isDragging = false;
    isDrawingBond = false;
    bondSourceAtom = null;
    render();
}

function onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    zoom(zoomFactor);
}

function zoom(factor) {
    cameraZoom *= factor;
    cameraZoom = Math.max(0.3, Math.min(3, cameraZoom));
    render();
}

function resetView() {
    cameraOffset = { x: 0, y: 0 };
    cameraZoom = 1;
    render();
}

// Coordinate conversion
function screenToWorld(screenX, screenY) {
    return {
        x: (screenX - canvas.width / 2 - cameraOffset.x) / cameraZoom,
        y: (screenY - canvas.height / 2 - cameraOffset.y) / cameraZoom
    };
}

function worldToScreen(worldX, worldY) {
    return {
        x: worldX * cameraZoom + canvas.width / 2 + cameraOffset.x,
        y: worldY * cameraZoom + canvas.height / 2 + cameraOffset.y
    };
}

// Atom operations
function addAtom(x, y) {
    currentMoleculeType = 'custom'; // Custom type when adding atom
    const atom = {
        x: x,
        y: y,
        z: (Math.random() - 0.5) * 20, // Initial structural noise for 3D relaxation
        vx: 0,
        vy: 0,
        vz: 0,
        element: selectedElement,
        id: Date.now() + Math.random(),
        charge: 0
    };

    atoms.push(atom);

    // Auto-create bonds DISABLED to prevent spiderwebbing. 
    // Users should draw bonds manually.
    /*
    if (!isDrawingBond) {
        // ... removed ...
    }
    */

    updateMoleculeInfo();
    analyzeBonds();
    render();
    return atom;
}

function getAtomAtPosition(screenX, screenY) {
    for (let i = atoms.length - 1; i >= 0; i--) {
        const atom = atoms[i];
        const screenPos = worldToScreen(atom.x, atom.y);
        const dx = screenX - screenPos.x;
        const dy = screenY - screenPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < atom.element.radius * cameraZoom) {
            return atom;
        }
    }
    return null;
}

function selectAtom(atom) {
    selectedAtom = atom;

    const bondCount = countBonds(atom);
    const hybridization = getHybridization(atom, bondCount);
    const oxidationState = calculateOxidationState(atom);

    const panel = document.getElementById('atom-properties');
    panel.innerHTML = `
        <div class="property-item">
            <div class="property-label">Element</div>
            <div class="property-value">${atom.element.name}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Symbol</div>
            <div class="property-value">${atom.element.symbol}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Atomic Number</div>
            <div class="property-value">${atom.element.number}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Electronegativity</div>
            <div class="property-value">${atom.element.electroneg}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Bonds</div>
            <div class="property-value">${bondCount}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Hybridization</div>
            <div class="property-value">${hybridization}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Oxidation State</div>
            <div class="property-value">${oxidationState >= 0 ? '+' : ''}${oxidationState}</div>
        </div>
        <div class="property-item">
            <div class="property-label">Charge Adjustment</div>
            <div class="property-value" style="display:flex; align-items:center; justify-content:flex-end; gap:5px;">
                <button id="charge-dec" style="background:#444; color:#fff; border:1px solid #777; width:22px; height:22px; border-radius:4px; cursor:pointer;">-</button>
                <span id="charge-val" style="min-width:30px; text-align:center; font-weight:bold;">${(atom.charge > 0 ? '+' : '') + (atom.charge || 0)}</span>
                <button id="charge-inc" style="background:#444; color:#fff; border:1px solid #777; width:22px; height:22px; border-radius:4px; cursor:pointer;">+</button>
            </div>
        </div>
        <div class="property-item">
            <div class="property-label">Physical State</div>
            <div class="property-value">
                <select id="atom-state-select" style="background:rgba(255,255,255,0.1); color:white; border:1px solid #444; border-radius:4px; font-size:0.8em; padding:2px 4px; width:100%;">
                    <option value="g" ${(!atom.state || atom.state === 'g') ? 'selected' : ''}>Gas (g)</option>
                    <option value="l" ${atom.state === 'l' ? 'selected' : ''}>Liquid (l)</option>
                    <option value="s" ${atom.state === 's' ? 'selected' : ''}>Solid (s)</option>
                    <option value="aq" ${atom.state === 'aq' ? 'selected' : ''}>Aqueous (aq)</option>
                </select>
            </div>
        </div>
    `;

    document.getElementById('atom-state-select').addEventListener('change', (e) => {
        atom.state = e.target.value;
        render();
    });

    // Update VSEPR and Chemical Info for the selected atom
    updateVSEPRPanel(atom);
    updateChemicalInfo(atom);

    document.getElementById('charge-dec').onclick = () => {
        atom.charge = (atom.charge || 0) - 1;
        updateAtomUI();
    };
    document.getElementById('charge-inc').onclick = () => {
        atom.charge = (atom.charge || 0) + 1;
        updateAtomUI();
    };

    function updateAtomUI() {
        const valStr = (atom.charge > 0 ? '+' : '') + (atom.charge || 0);
        const chargeEl = document.getElementById('charge-val');
        if (chargeEl) chargeEl.textContent = valStr;
        updateAllRealtime();
        render();
    }

    render();
}

// countBonds is defined at Line 164. Removing duplicate.

function calculateOxidationState(atom) {
    if (!atom || !atom.element) return 0;
    const sym = atom.element.symbol;

    // Standard oxidation states (Simplified)
    if (sym === 'H') return 1;
    if (sym === 'O') return -2;
    if (sym === 'F') return -1;
    if (['Li', 'Na', 'K', 'Rb', 'Cs'].includes(sym)) return 1;
    if (['Be', 'Mg', 'Ca', 'Sr', 'Ba'].includes(sym)) return 2;
    if (sym === 'Al') return 3;

    // For others, return based on charge if set, else 0
    return atom.charge || 0;
}

function getHybridization(atom, bondCount) {
    if (atom.element.symbol === 'C') {
        if (bondCount === 4) return 'sp³';
        if (bondCount === 3) return 'sp²';
        if (bondCount === 2) return 'sp';
    }
    if (atom.element.symbol === 'N') {
        if (bondCount === 4) return 'sp³';
        if (bondCount === 3) return 'sp³';
        if (bondCount === 2) return 'sp²';
    }
    if (atom.element.symbol === 'O') {
        if (bondCount === 2) return 'sp³';
        if (bondCount === 1) return 'sp²';
    }
    return '-';
}

// Molecule presets
// Molecule presets
function loadQuickMolecule(type) {
    atoms = [];
    bonds = [];
    selectedAtom = null;

    // Update thermodynamic data for preset
    updateThermodynamics(type);

    let atomData = [];
    let bondData = [];

    switch (type) {
        case 'water':
            atomData = [
                { element: 'O', x: 0, y: 0 },
                { element: 'H', x: -100, y: 80 },
                { element: 'H', x: 100, y: 80 }
            ];
            break;
        case 'methane':
            atomData = [
                { element: 'C', x: 0, y: 0 },
                { element: 'H', x: 0, y: -100 },
                { element: 'H', x: 100, y: 30 },
                { element: 'H', x: -100, y: 30 },
                { element: 'H', x: 0, y: 100 }
            ];
            break;
        case 'ethanol':
            atomData = [
                { element: 'C', x: -120, y: 0 },
                { element: 'C', x: 0, y: 0 },
                { element: 'O', x: 120, y: 0 },
                { element: 'H', x: 200, y: 0 },
                { element: 'H', x: -120, y: -80 },
                { element: 'H', x: -120, y: 80 },
                { element: 'H', x: -200, y: 0 },
                { element: 'H', x: 0, y: -80 },
                { element: 'H', x: 0, y: 80 }
            ];
            break;
        case 'benzene':
            const radius = 100;
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
                atomData.push({
                    element: 'C',
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius
                });
            }
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
                atomData.push({
                    element: 'H',
                    x: Math.cos(angle) * (radius + 60),
                    y: Math.sin(angle) * (radius + 60)
                });
            }
            break;
        case 'ammonia':
            atomData = [
                { element: 'N', x: 0, y: 0 },
                { element: 'H', x: 0, y: -100 },
                { element: 'H', x: 87, y: 50 },
                { element: 'H', x: -87, y: 50 }
            ];
            break;
        case 'co2':
            atomData = [
                { element: 'C', x: 0, y: 0 },
                { element: 'O', x: -120, y: 0 },
                { element: 'O', x: 120, y: 0 }
            ];
            bondData = [
                { atom1: 0, atom2: 1, order: 2 },
                { atom1: 0, atom2: 2, order: 2 }
            ];
            break;
        case 'acetone':
            // Acetone (CH3)2CO - Trigonal planar (center C), Tetrahedral (methyl C)
            // Center C (sp2) at (0,0)
            // Oxygen at top (0, -80)
            // Methyl C1 at bottom-left (-70, 40)
            // Methyl C2 at bottom-right (70, 40)
            atomData = [
                { element: 'C', x: 0, y: 0 },       // Central Carbon (C=O)
                { element: 'O', x: 0, y: -90 },     // Oxygen
                { element: 'C', x: -80, y: 50 },    // Left Methyl Carbon
                { element: 'C', x: 80, y: 50 },     // Right Methyl Carbon

                // Left Methyl Hydrogens (Tetrahedral projection)
                { element: 'H', x: -140, y: 20 },
                { element: 'H', x: -90, y: 110 },
                { element: 'H', x: -40, y: 80 },    // Back/overlap H

                // Right Methyl Hydrogens (Tetrahedral projection)
                { element: 'H', x: 140, y: 20 },
                { element: 'H', x: 90, y: 110 },
                { element: 'H', x: 40, y: 80 }      // Back/overlap H
            ];
            /*
            Index:
            0: C (center)
            1: O
            2: C (left)
            3: C (right)
            4,5,6: H (left)
            7,8,9: H (right)
            */
            bondData = [
                { atom1: 0, atom2: 1, order: 2 }, // C=O
                { atom1: 0, atom2: 2, order: 1 }, // C-C
                { atom1: 0, atom2: 3, order: 1 }, // C-C
                { atom1: 2, atom2: 4, order: 1 }, // C-H
                { atom1: 2, atom2: 5, order: 1 }, // C-H
                { atom1: 2, atom2: 6, order: 1 }, // C-H
                { atom1: 3, atom2: 7, order: 1 }, // C-H
                { atom1: 3, atom2: 8, order: 1 }, // C-H
                { atom1: 3, atom2: 9, order: 1 }  // C-H
            ];
            break;
        case 'acetic-acid':
            atomData = [
                { element: 'C', x: -120, y: 0 },
                { element: 'C', x: 0, y: 0 },
                { element: 'O', x: 80, y: -80 },
                { element: 'O', x: 80, y: 80 },
                { element: 'H', x: 160, y: 80 },
                { element: 'H', x: -180, y: -60 },
                { element: 'H', x: -180, y: 60 },
                { element: 'H', x: -60, y: 80 }
            ];
            bondData = [
                { atom1: 1, atom2: 2, order: 2 }
            ];
            break;
        default:
            return;
    }

    // Create atoms
    atomData.forEach(data => {
        const element = elements.find(e => e.symbol === data.element);
        atoms.push({
            x: data.x,
            y: data.y,
            element: element,
            id: Date.now() + Math.random(),
            charge: 0
        });
    });

    // Create bonds
    if (bondData.length > 0) {
        bondData.forEach(data => {
            bonds.push({
                atom1: atoms[data.atom1],
                atom2: atoms[data.atom2],
                order: data.order
            });
        });
    }

    // Auto-create remaining bonds
    atoms.forEach((atom, i) => {
        atoms.forEach((other, j) => {
            if (i < j) {
                // Check if bond already exists
                const existingBond = bonds.find(b =>
                    (b.atom1 === atom && b.atom2 === other) ||
                    (b.atom1 === other && b.atom2 === atom)
                );

                if (!existingBond) {
                    const dx = atom.x - other.x;
                    const dy = atom.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        bonds.push({ atom1: atom, atom2: other, order: 1 });
                    }
                }
            }
        });
    });

    currentMoleculeType = type;
    document.getElementById('molecule-name').textContent = moleculeNames[type] || type;

    // Clear analysis panels if elements missing
    const vseprPanel = document.getElementById('vsepr-geometry');
    if (vseprPanel) vseprPanel.innerHTML = '<div class="empty-state">Waiting for analysis...</div>';

    updateMoleculeInfo();
    analyzeBonds();
    updateChemicalInfo(type);
    updateThermodynamics(type);
    updateAllRealtime(); // All calculations update
    render();
}

function updateMoleculeInfo() {
    updateUI('atom-count', atoms.length);
    updateUI('bond-count', bonds.length);
    updateUI('hud-atoms', atoms.length);
    updateUI('hud-bonds', bonds.length);

    // Calculate formula
    const elementCounts = {};
    atoms.forEach(atom => {
        const symbol = atom.element.symbol;
        elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
    });

    let formula = '';
    const sortedElements = Object.entries(elementCounts).sort((a, b) => {
        const order = ['C', 'H', 'N', 'O', 'F', 'P', 'S', 'Cl', 'Br', 'I', 'Na', 'Mg'];
        const idxA = order.indexOf(a[0]);
        const idxB = order.indexOf(b[0]);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });

    sortedElements.forEach(([symbol, count]) => {
        formula += symbol;
        if (count > 1) {
            // Simplified subscripts for HUD/Browser compatibility
            formula += count;
        }
    });

    updateUI('formula', formula || '-');
    updateUI('hud-formula', formula || '-');

    // If custom molecule, update the displayed name to the formula
    if (currentMoleculeType === 'custom') {
        const displayName = formula ? `Custom (${formula})` : 'Custom Molecule';
        updateUI('molecule-name', displayName);
    }

    // Calculate molecular weight
    let weight = 0;
    atoms.forEach(atom => {
        weight += atom.element.mass || 0;
    });

    const weightStr = weight.toFixed(2) + ' g/mol';
    updateUI('mol-weight', weightStr);
    updateUI('hud-weight', weightStr);

    // Calculate formal charge
    let totalCharge = 0;
    atoms.forEach(atom => {
        totalCharge += atom.charge || 0;
    });
    updateUI('formal-charge', totalCharge);
    updateUI('hud-charge', totalCharge);
}

function analyzeBonds() {
    evaluateMoleculeGeometry();
    if (bonds.length === 0) {
        document.getElementById('bond-analysis').innerHTML = '<div class="empty-state">No bonds present</div>';
        return;
    }

    const bondTypes = {};
    bonds.forEach(bond => {
        const atom1 = bond.atom1.element.symbol;
        const atom2 = bond.atom2.element.symbol;
        const key = [atom1, atom2].sort().join('-');
        const order = bond.order || 1;
        const orderText = order === 1 ? 'Single' : order === 2 ? 'Double' : order === 3 ? 'Triple' : 'Single';

        if (!bondTypes[key]) {
            bondTypes[key] = { count: 0, order: orderText, length: 0 };
        }
        bondTypes[key].count++;

        // Calculate bond length
        const dx = bond.atom1.x - bond.atom2.x;
        const dy = bond.atom1.y - bond.atom2.y;
        bondTypes[key].length += Math.sqrt(dx * dx + dy * dy);
    });

    let html = '';
    Object.entries(bondTypes).forEach(([key, data]) => {
        const avgLength = (data.length / data.count).toFixed(1);
        html += `
            <div class="property-item">
                <div class="property-label">${key} ${data.order} Bond</div>
                <div class="property-value">${data.count} unit(s) (Avg ${avgLength} pm)</div>
            </div>
        `;
    });

    document.getElementById('bond-analysis').innerHTML = html;
}

// Physics Optimization (Pseudo-3D)
function optimizeGeometry() {
    const iterations = 50;
    const baseSpringConstant = 0.05;
    const baseRepulsionConstant = 2000;
    const baseDamping = 0.8;
    const angleStrength = 0.1;

    for (let iter = 0; iter < iterations; iter++) {
        atoms.forEach(atom => {
            // Determine physics parameters based on state
            let repulsionMod = 1.0;
            let damping = baseDamping;
            let motionScale = 1.0;
            let springMod = 1.0;
            const state = atom.state || 'g'; // Default to gas

            switch (state) {
                case 's': // Solid: Rigid
                    damping = 0.4;
                    motionScale = 0.05;
                    springMod = 2.0;
                    repulsionMod = 0.5;
                    break;
                case 'l': // Liquid: Fluid, cohesive
                    damping = 0.9;
                    repulsionMod = 0.8;
                    break;
                case 'aq': // Aqueous: Solvated
                    damping = 0.85;
                    repulsionMod = 1.1;
                    break;
                case 'g': // Gas
                default:
                    damping = 0.8;
                    repulsionMod = 1.5;
                    break;
            }

            let forceX = 0;
            let forceY = 0;
            let forceZ = 0;

            // 1. Repulsion from other atoms (3D)
            atoms.forEach(other => {
                if (atom === other) return;
                const dx = atom.x - other.x;
                const dy = atom.y - other.y;
                const dz = (atom.z || 0) - (other.z || 0);
                const distSq = dx * dx + dy * dy + dz * dz;
                const dist = Math.sqrt(distSq);

                if (dist > 0.1) {
                    const force = (baseRepulsionConstant * repulsionMod) / distSq;
                    forceX += (dx / dist) * force;
                    forceY += (dy / dist) * force;
                    forceZ += (dz / dist) * force;
                }
            });

            // 2. Spring force (3D)
            bonds.forEach(bond => {
                if (bond.atom1 !== atom && bond.atom2 !== atom) return;

                const other = bond.atom1 === atom ? bond.atom2 : bond.atom1;
                const dx = other.x - atom.x;
                const dy = other.y - atom.y;
                const dz = (other.z || 0) - (atom.z || 0);
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const targetDist = 100;

                if (dist > 0.1) {
                    const force = (dist - targetDist) * baseSpringConstant * springMod;
                    forceX += (dx / dist) * force;
                    forceY += (dy / dist) * force;
                    forceZ += (dz / dist) * force;
                }
            });

            // 3. VSEPR Angular Forces (3D)
            if (atom.vsepr && atom.vsepr.sigma >= 2) {
                const neighbors = bonds
                    .filter(b => b.atom1 === atom || b.atom2 === atom)
                    .map(b => b.atom1 === atom ? b.atom2 : b.atom1);

                const targetDeg = atom.vsepr.angle;
                // Note: In 3D, we use the ideal angle directly without 2D adjustment.

                // Apply only to adjacent neighbor pairs in the simplified list
                for (let i = 0; i < neighbors.length; i++) {
                    for (let j = i + 1; j < neighbors.length; j++) {
                        const n1 = neighbors[i];
                        const n2 = neighbors[j];

                        const v1x = n1.x - atom.x;
                        const v1y = n1.y - atom.y;
                        const v1z = (n1.z || 0) - (atom.z || 0);

                        const v2x = n2.x - atom.x;
                        const v2y = n2.y - atom.y;
                        const v2z = (n2.z || 0) - (atom.z || 0);

                        const dot = v1x * v2x + v1y * v2y + v1z * v2z;
                        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
                        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

                        if (mag1 > 0.1 && mag2 > 0.1) {
                            const angleRad = Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
                            const angleDeg = angleRad * 180 / Math.PI;
                            const diff = targetDeg - angleDeg;

                            const dnx = n2.x - n1.x;
                            const dny = n2.y - n1.y;
                            const dnz = (n2.z || 0) - (n1.z || 0);
                            const distN = Math.sqrt(dnx * dnx + dny * dny + dnz * dnz);

                            if (distN > 0.1) {
                                const fMag = diff * angleStrength;
                                const fx = (dnx / distN) * fMag;
                                const fy = (dny / distN) * fMag;
                                const fz = (dnz / distN) * fMag;

                                n1.vx = (n1.vx || 0) - fx; n1.vy = (n1.vy || 0) - fy; n1.vz = (n1.vz || 0) - fz;
                                n2.vx = (n2.vx || 0) + fx; n2.vy = (n2.vy || 0) + fy; n2.vz = (n2.vz || 0) + fz;
                            }
                        }
                    }
                }
            }

            // Flattening force (Z-constraint) - reduced for solids
            const flattenStrength = state === 's' ? 0.001 : 0.01;
            forceZ -= (atom.z || 0) * flattenStrength;

            // Update Velocity & Position with State Modifiers
            atom.vx = ((atom.vx || 0) * damping + forceX) * motionScale;
            atom.vy = ((atom.vy || 0) * damping + forceY) * motionScale;
            atom.vz = ((atom.vz || 0) * damping + forceZ) * motionScale;

            // Limit speed for stability
            const speed = Math.sqrt(atom.vx * atom.vx + atom.vy * atom.vy + atom.vz * atom.vz);
            if (speed > 20) {
                const scale = 20 / speed;
                atom.vx *= scale; atom.vy *= scale; atom.vz *= scale;
            }

            atom.x += atom.vx;
            atom.y += atom.vy;
            atom.z = (atom.z || 0) + atom.vz;
        });
    }

    // Clear velocities loop (if needed for rendering stability or other logic, keeping original structure)
    // Actually, in Verlet integration or similar, we keep velocities. 
    // But the original code cleared them at the end of function (Line 1301). 
    // This implies the 'velocities' here are actually just 'forces per frame' accumulations?
    // Determine from context: if lines 1290-1296 used vx*damping + force, then vx accumulates.
    // If the original cleared them, it means it was resetting accumulation. 
    // Let's keep it consistent: we updated position inside loop.
    // If we clear them outside the loop (after 50 iters), it means next frame starts with 0 velocity?
    // That would make physics jerky or completely dependent on static forces.
    // However, looking at line 1301 in Step 379: "atoms.forEach(atom => { atom.vx = 0... })".
    // This means the simulation resets velocity every animation frame, 
    // effectively making it "overdamped" or "force-directed layout" rather than Newtonian physics.
    // We will preserve this behavior but apply our scale factors during the loop.

    atoms.forEach(atom => {
        atom.vx = 0; atom.vy = 0; atom.vz = 0;
    });

    analyzeBonds();
}

function calculateProperties() {
    if (atoms.length === 0) {
        document.getElementById('formula').textContent = "-";
        document.getElementById('mol-weight').textContent = "0.00 g/mol";
        document.getElementById('hud-formula').textContent = "-";
        document.getElementById('hud-weight').textContent = "0.00";
        document.getElementById('hud-atoms').textContent = "0";
        document.getElementById('hud-bonds').textContent = "0";

        // Full Reset of all properties
        updateUI('enthalpy', '-');
        updateUI('entropy', '-');
        updateUI('gibbs', '-');
        updateUI('formal-charge', '0');
        updateUI('dipole-moment', '0.00 D');
        updateUI('polarity', '-');
        updateUI('energy', '-');
        updateUI('total-energy', '-');

        // Since the warning message is inside polarity, it disappears when polarity is reset.
        // Direct DOM access just in case.
        const polarityEl = document.getElementById('polarity');
        if (polarityEl) polarityEl.textContent = '-';

        const warningEl = document.getElementById('charge-warning');
        if (warningEl) warningEl.style.display = 'none';

        return;
    }

    // Molecular energy calculation (bond energy-based approximation)
    // Bond energy data (kJ/mol)
    const bondEnergies = {
        'C-C': 347, 'C=C': 614, 'C≡C': 839,
        'C-H': 413, 'C-O': 358, 'C=O': 799,
        'C-N': 305, 'C=N': 615, 'C≡N': 891,
        'O-H': 463, 'O-O': 146, 'O=O': 498,
        'N-H': 391, 'N-N': 163, 'N=N': 418, 'N≡N': 945,
        'H-H': 436, 'H-F': 567, 'H-Cl': 431,
        'C-Cl': 339, 'C-F': 485
    };

    // Total bond energy calculation
    let totalBondEnergy = 0;
    bonds.forEach(bond => {
        const sym1 = bond.atom1.element.symbol;
        const sym2 = bond.atom2.element.symbol;
        const order = bond.order || 1;

        // Generate bond key (alphabetical order)
        const sortedSyms = [sym1, sym2].sort();
        let bondKey = sortedSyms.join('-');
        if (order === 2) bondKey = sortedSyms.join('=');
        if (order === 3) bondKey = sortedSyms.join('≡');

        // Retrieve bond energy (use average if not present)
        const energy = bondEnergies[bondKey] || bondEnergies[sortedSyms.join('-')] || 350;
        totalBondEnergy += energy;
    });

    // Formation Energy = -(Total Bond Energy) (Negative: stable)
    const formationEnergy = -totalBondEnergy;
    document.getElementById('energy').textContent = formationEnergy.toFixed(1) + ' kJ/mol';

    // 1. Molecular Formula & Weight
    let formulaMap = {};
    let totalWeight = 0;
    atoms.forEach(atom => {
        formulaMap[atom.element.symbol] = (formulaMap[atom.element.symbol] || 0) + 1;
        totalWeight += (atom.element.mass || 0); // Corrected to use .mass instead of undefined .weight
    });

    let formulaStr = "";
    if (formulaMap['C']) formulaStr += `C${formulaMap['C'] > 1 ? formulaMap['C'] : ''}`;
    if (formulaMap['H']) formulaStr += `H${formulaMap['H'] > 1 ? formulaMap['H'] : ''}`;
    Object.keys(formulaMap).sort().forEach(sym => {
        if (sym !== 'C' && sym !== 'H') {
            formulaStr += `${sym}${formulaMap[sym] > 1 ? formulaMap[sym] : ''}`;
        }
    });

    document.getElementById('formula').textContent = formulaStr || "-";
    document.getElementById('mol-weight').textContent = totalWeight.toFixed(2) + " g/mol";

    // Update HUD
    document.getElementById('hud-formula').textContent = formulaStr || "-";
    document.getElementById('hud-weight').textContent = totalWeight.toFixed(2) + " g/mol";
    document.getElementById('hud-atoms').textContent = atoms.length;
    document.getElementById('hud-bonds').textContent = bonds.length;

    // 2. Formal Charge (Total)
    let totalFormalCharge = 0;
    atoms.forEach(atom => {
        const bondOrder = countBonds(atom);
        const lp = calculateLonePairs(atom, bondOrder);
        const fc = atom.element.valence - (lp * 2 + bondOrder);
        totalFormalCharge += fc;
    });
    document.getElementById('formal-charge').textContent = totalFormalCharge;

    // 3. Thermodynamic Estimation (Joback/Heuristic)
    let enthalpy = 0;
    let entropy = 0;
    // Basic value (correction based on hydrocarbons) - this was in original code, but now moved here
    enthalpy += 68.29;

    atoms.forEach(atom => {
        const sym = atom.element.symbol;
        const bondsCount = bonds.filter(b => b.atom1 === atom || b.atom2 === atom).length;
        if (sym === 'C') {
            if (bondsCount === 4) { enthalpy += -20.64; entropy += -46.43; } // -CH3, -CH2- etc simplified
            else if (bondsCount === 3) { enthalpy += 28.14; entropy += -18.43; } // =CH-
            else if (bondsCount === 2) { enthalpy += 77.14; entropy += 12.57; }  // =C=
        } else if (sym === 'H') {
            enthalpy += -5.0; // Restored approximate values for H, O, N etc.
        } else if (sym === 'O') {
            if (bondsCount === 2) { enthalpy += -128.8; entropy += -13.6; }
            else if (bondsCount === 1) { enthalpy += -25.2; entropy += 14.8; }
        } else if (sym === 'N') {
            enthalpy += 20.0; entropy += -10.0;
        }
    });

    const T = 298.15;
    const gibbsVal = enthalpy - (T * entropy / 1000);

    // Update Thermodynamic Fields
    const enthalpyEl = document.getElementById('enthalpy');
    const entropyEl = document.getElementById('entropy');
    const gibbsEl = document.getElementById('gibbs');
    if (enthalpyEl) enthalpyEl.textContent = enthalpy.toFixed(1) + ' kJ/mol';
    if (entropyEl) entropyEl.textContent = entropy.toFixed(1) + ' J/mol·K';
    if (gibbsEl) gibbsEl.textContent = gibbsVal.toFixed(1) + ' kJ/mol';

    // 4. Dipole & Polarity
    let dipoleX = 0, dipoleY = 0, dipoleZ = 0;
    bonds.forEach(bond => {
        const dX = (bond.atom2.x - bond.atom1.x) * 0.01;
        const dY = (bond.atom2.y - bond.atom1.y) * 0.01;
        const dZ = ((bond.atom2.z || 0) - (bond.atom1.z || 0)) * 0.01;
        const eDiff = (bond.atom2.element.electroneg - bond.atom1.element.electroneg);
        dipoleX += dX * eDiff;
        dipoleY += dY * eDiff;
        dipoleZ += dZ * eDiff;
    });

    const totalDipole = Math.sqrt(dipoleX * dipoleX + dipoleY * dipoleY + dipoleZ * dipoleZ);
    document.getElementById('dipole').textContent = totalDipole.toFixed(2) + ' D';
    let polarityVal = totalDipole > 0.5 ? 'Polar' : 'Non-polar';

    // --- Chemical Validation (Imported from Jjinmak) ---
    const warnings = [];
    const metals = ['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr', 'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra', 'Al', 'Fe', 'Cu', 'Zn', 'Ag', 'Au'];

    // 1. Oxyacid Salt Rule: Metal should bond to Oxygen, not Central Non-metal (P, S, etc.) directly in salts
    // Specifically for Phosphorous acids: P-H hydrogens are non-acidic and should not be replaced by Metal.
    bonds.forEach(bond => {
        const sym1 = bond.atom1.element.symbol;
        const sym2 = bond.atom2.element.symbol;
        if ((metals.includes(sym1) && sym2 === 'P') || (metals.includes(sym2) && sym1 === 'P')) {
            warnings.push('Invalid structure: Metal directly bonded to Phosphorus (P). (Oxyacid salt rule violation)');
        }
    });

    // 2. Charge Balance Check
    let totalCharge = 0;
    atoms.forEach(atom => {
        // calculateOxidationState helper is needed or simplified charge logic
        // In Jjinmak, it calls calculateOxidationState(atom). 
        // Verify if calculateOxidationState exists in this scope or global. It is defined in script.js (verified in Step 32: line 2875).
        totalCharge += calculateOxidationState(atom);
    });
    if (Math.abs(totalCharge) > 0.9 && atoms.length > 0) {
        warnings.push(`Charge Imbalance: Total charge is ${totalCharge > 0 ? '+' : ''}${totalCharge}.`);
    }

    const polarityElem = document.getElementById('polarity');
    if (warnings.length > 0) {
        polarityElem.innerHTML = `${polarityVal}<br><span style="color:#FF5555; font-size:0.8em; display:block; margin-top:4px;">⚠️ ${warnings[0]}</span>`;
    } else {
        polarityElem.textContent = polarityVal;
    }

    // 5. Advanced Properties
    const hartreeBase = -76.0;
    const hartreeEnergy = hartreeBase - (atoms.length * 0.1);
    document.getElementById('energy').textContent = hartreeEnergy.toFixed(4) + " Eh";
    document.getElementById('total-energy').textContent = hartreeEnergy.toFixed(4) + " Eh";
}

function calculateAngle(atom1, atom2, atom3) {
    const v1x = atom1.x - atom2.x;
    const v1y = atom1.y - atom2.y;
    const v1z = (atom1.z || 0) - (atom2.z || 0);
    const v2x = atom3.x - atom2.x;
    const v2y = atom3.y - atom2.y;
    const v2z = (atom3.z || 0) - (atom2.z || 0);
    const dot = v1x * v2x + v1y * v2y + v1z * v2z;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);
    const cosAngle = dot / (mag1 * mag2);
    return Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI;
}

function analyzeVSEPR(atom) {
    const bondCount = countBonds(atom);
    const lonePairs = calculateLonePairs(atom, bondCount);
    const sigmaBonds = bonds.filter(b => b.atom1 === atom || b.atom2 === atom).length;
    const totalRegions = sigmaBonds + lonePairs;
    let molecularGeometry = '';
    let idealAngle = 0;

    if (totalRegions === 2) { molecularGeometry = 'Linear'; idealAngle = 180; }
    else if (totalRegions === 3) {
        idealAngle = 120;
        if (lonePairs === 0) molecularGeometry = 'Trigonal Planar';
        else if (lonePairs === 1) molecularGeometry = 'Bent';
    } else if (totalRegions === 4) {
        idealAngle = 109.5;
        if (lonePairs === 0) molecularGeometry = 'Tetrahedral';
        else if (lonePairs === 1) molecularGeometry = 'Trigonal Pyramidal';
        else if (lonePairs === 2) molecularGeometry = 'Bent';
    } else if (totalRegions === 5) {
        idealAngle = 90;
        molecularGeometry = 'Trigonal Bipyramidal';
        if (lonePairs === 1) molecularGeometry = 'Seesaw';
        if (lonePairs === 2) molecularGeometry = 'T-shaped';
        if (lonePairs === 3) molecularGeometry = 'Linear';
    } else if (totalRegions === 6) {
        idealAngle = 90;
        molecularGeometry = 'Octahedral';
        if (lonePairs === 1) molecularGeometry = 'Square Pyramidal';
        if (lonePairs === 2) molecularGeometry = 'Square Planar';
    }

    atom.vsepr = { sn: totalRegions, lp: lonePairs, angle: idealAngle, geometry: molecularGeometry, sigma: sigmaBonds };
    return atom.vsepr;
}

function evaluateMoleculeGeometry() {
    atoms.forEach(analyzeVSEPR);
}

function updateVSEPRPanel(atom) {
    const data = analyzeVSEPR(atom);
    const panel = document.getElementById('vsepr-geometry');
    panel.innerHTML = `
        <div class="property-item">
            <div class="property-label">Central Atom</div>
            <div class="property-value">${atom.element.symbol} (Steric #: ${data.sn})</div>
        </div>
        <div class="property-item">
            <div class="property-label">Bonding Regions (σ)</div>
            <div class="property-value">${data.sigma} unit(s)</div>
        </div>
        <div class="property-item">
            <div class="property-label">Lone Pairs</div>
            <div class="property-value">${data.lp} unit(s)</div>
        </div>
        <div class="property-item">
            <div class="property-label">Molecular Geometry</div>
            <div class="property-value" style="color:var(--accent-secondary); font-weight:bold">${data.geometry}</div>
        </div>
    `;
}

function calculateLonePairs(atom, bondCount) {
    const valence = atom.element.valence;
    const charge = atom.charge || 0;
    const loneElectrons = valence - bondCount - charge;
    return Math.max(0, Math.floor(loneElectrons / 2));
}

function updateMoleculeInfo() {
    calculateProperties();
}

function updateChemicalInfo(moleculeType) {
    if (moleculeType === 'custom') {
        document.getElementById('chemical-info').innerHTML = `
            <div class="property-item"><div class="property-label">Category</div><div class="property-value">Custom</div></div>
            <div class="property-item"><div class="property-label">Status</div><div class="property-value">Analyzing...</div></div>
        `;
        return;
    }
    const info = chemicalDatabase[moleculeType];
    if (!info) return;
    document.getElementById('chemical-info').innerHTML = `
        <div class="property-item"><div class="property-label">Chemical Name</div><div class="property-value">${info.name}</div></div>
        <div class="property-item"><div class="property-label">Boiling Point</div><div class="property-value">${info.boilingPoint}</div></div>
        <div class="property-item"><div class="property-label">Melting Point</div><div class="property-value">${info.meltingPoint}</div></div>
        <div class="property-item"><div class="property-label">Density</div><div class="property-value">${info.density}</div></div>
    `;
}

// Toggle bond between two atoms (with chemistry rule check)
function toggleBondBetweenAtoms(atom1, atom2) {
    currentMoleculeType = 'custom';
    const existingBond = bonds.find(b =>
        (b.atom1 === atom1 && b.atom2 === atom2) ||
        (b.atom1 === atom2 && b.atom2 === atom1)
    );

    if (existingBond) {
        // Cycle through bond orders (Check if we can increase)
        if (existingBond.order === 1) {
            if (canAtomAcceptBond(atom1, 1, atom2.element) && canAtomAcceptBond(atom2, 1, atom1.element)) {
                existingBond.order = 2;
                showNotification('Changed to double bond', 1500);
            } else {
                showNotification('Cannot add more bonds according to chemical rules.', 2000, 'error');
            }
        } else if (existingBond.order === 2) {
            if (canAtomAcceptBond(atom1, 1, atom2.element) && canAtomAcceptBond(atom2, 1, atom1.element)) {
                existingBond.order = 3;
                showNotification('Changed to triple bond', 1500);
            } else {
                showNotification('Cannot add more bonds according to chemical rules.', 2000, 'error');
            }
        } else {
            bonds = bonds.filter(b => b !== existingBond);
            showNotification('Bond removed', 1500);
        }
    } else {
        // Create new bond - CHECK RULES
        if (canElementsBond(atom1.element, atom2.element) &&
            canAtomAcceptBond(atom1, 1, atom2.element) &&
            canAtomAcceptBond(atom2, 1, atom1.element)) {

            const bondType = getBondType(atom1.element, atom2.element);
            bonds.push({ atom1, atom2, order: 1, type: bondType });
            showNotification('Single bond created', 1500);
        } else {
            showNotification('Cannot create bond according to chemical rules.', 2000, 'error');
        }
    }

    updateAllRealtime();
    analyzeBonds();
    render();
}

// deleteSelectedAtom is defined at the end of the file. Removing duplicate.

// Clear all atoms and bonds
function clearAll() {
    if (confirm('Are you sure you want to delete all atoms and bonds?')) {
        currentMoleculeType = 'custom'; // Custom state upon reset
        atoms = [];
        bonds = [];
        selectedAtom = null;
        measurePoints = [];
        bondSourceAtom = null;

        // Reset UI panels safely
        const chemInfo = document.getElementById('chemical-info');
        if (chemInfo) chemInfo.innerHTML = '<div class="empty-state">Select a compound.</div>';

        const bondAnalysis = document.getElementById('bond-analysis');
        if (bondAnalysis) bondAnalysis.innerHTML = '<div class="empty-state">Analyzing...</div>';

        const vsepr = document.getElementById('vsepr-geometry');
        if (vsepr) vsepr.innerHTML = '<div class="empty-state">Waiting for analysis...</div>';

        const spectrum = document.getElementById('spectrum-canvas');
        if (spectrum) spectrum.innerHTML = '<div class="empty-state">Waiting for analysis</div>';

        updateAllRealtime(); // Immediate reflection on reset
        render();
        showNotification('All contents have been reset.');
    }
}

// Save molecule to localStorage
function saveMolecule() {
    if (atoms.length === 0) {
        alert('No molecule to save');
        return;
    }

    const name = prompt('Enter molecule name:');
    if (!name) return;

    const moleculeData = {
        name: name,
        atoms: atoms.map(a => ({
            x: a.x,
            y: a.y,
            z: a.z || 0, // Save z-coordinate
            elementSymbol: a.element.symbol,
            charge: a.charge
        })),
        bonds: bonds.map(b => ({
            atom1Index: atoms.indexOf(b.atom1),
            atom2Index: atoms.indexOf(b.atom2),
            order: b.order
        }))
    };

    localStorage.setItem('molecule_' + name, JSON.stringify(moleculeData));
    alert('Molecule saved: ' + name);
}

// Load molecule from localStorage
function loadSavedMolecule() {
    const name = prompt('Enter the name of the molecule to load:');
    if (!name) return;

    const data = localStorage.getItem('molecule_' + name);
    if (!data) {
        alert('Saved molecule not found: ' + name);
        return;
    }

    const moleculeData = JSON.parse(data);

    atoms = [];
    bonds = [];

    // Recreate atoms
    moleculeData.atoms.forEach(atomData => {
        const element = elements.find(e => e.symbol === atomData.elementSymbol);
        atoms.push({
            x: atomData.x,
            y: atomData.y,
            z: atomData.z || 0, // Load z-coordinate
            element: element,
            id: Date.now() + Math.random(),
            charge: atomData.charge || 0
        });
    });

    // Recreate bonds
    moleculeData.bonds.forEach(bondData => {
        bonds.push({
            atom1: atoms[bondData.atom1Index],
            atom2: atoms[bondData.atom2Index],
            order: bondData.order || 1
        });
    });

    document.getElementById('molecule-name').textContent = moleculeData.name;
    updateMoleculeInfo();
    analyzeBonds();
    render();

    alert('Molecule loaded: ' + name);
}

// Calculate moles
function calculateMoles() {
    const mass = parseFloat(document.getElementById('mass-input').value);
    if (isNaN(mass)) {
        alert('Please enter mass');
        return;
    }

    const molarMass = parseFloat(document.getElementById('mol-weight').textContent);
    const moles = (mass / molarMass).toFixed(4);

    document.getElementById('moles-result').textContent = moles + ' mol';
}

// Calculate pH
function calculatepH() {
    const hConc = parseFloat(document.getElementById('ph-input').value);
    if (isNaN(hConc) || hConc <= 0) {
        alert('Please enter a valid H⁺ concentration (positive)');
        return;
    }

    const pH = -Math.log10(hConc);
    const pOH = 14 - pH;

    document.getElementById('ph-result').textContent = `pH: ${pH.toFixed(2)} | pOH: ${pOH.toFixed(2)}`;
}

// Show spectrum
function showSpectrum(type) {
    const container = document.getElementById('spectrum-canvas');
    container.innerHTML = ''; // Clear previous

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth - 20;
    canvas.height = 150;
    canvas.style.marginTop = '10px';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const peaks = [];
    let title = "";
    let color = "#4A9EFF";

    if (type === 'IR') {
        title = "IR Spectrum (Predicted)";
        color = "#4A9EFF";
        if (bonds.some(b => b.atom1.element.symbol === 'O' || b.atom2.element.symbol === 'O')) {
            peaks.push({ pos: 0.15, width: 0.1, h: 0.8, name: "O-H" }); // 3200-3600
        }
        if (bonds.some(b => b.atom1.element.symbol === 'C' && b.atom2.element.symbol === 'H')) {
            peaks.push({ pos: 0.3, width: 0.05, h: 0.7, name: "C-H" }); // 2850-3000
        }
        if (bonds.some(b => b.order === 2 && (b.atom1.element.symbol === 'C' && b.atom2.element.symbol === 'O'))) {
            peaks.push({ pos: 0.6, width: 0.03, h: 0.9, name: "C=O" }); // 1650-1750
        }
    } else {
        title = "¹H NMR Spectrum (Predicted)";
        color = "#A855F7";
        const groups = analyzeNMR();
        groups.forEach((group, i) => {
            let shift = 1.0;
            const atom = group[0];
            const neighbors = bonds.filter(b => b.atom1 === atom || b.atom2 === atom).map(b => b.atom1 === atom ? b.atom2 : b.atom1);
            neighbors.forEach(n => {
                if (n.element.symbol === 'O') shift += 3.5;
                else if (n.element.symbol === 'N') shift += 2.0;
                else if (n.element.symbol === 'C') shift += 0.5;
            });
            // Map 0-12 ppm to 1.0 - 0.0 X-axis
            peaks.push({ pos: 1 - (shift / 12), width: 0.01, h: group.length * 0.2, name: `${shift.toFixed(1)} ppm` });
        });
    }

    // Draw Graph
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 130);
    ctx.lineTo(canvas.width - 10, 130);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter';
    ctx.fillText(title, 35, 20);

    // Draw Peaks
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let x = 30; x < canvas.width - 10; x++) {
        const t = (x - 30) / (canvas.width - 40);
        let y = 130;

        peaks.forEach(p => {
            const val = Math.exp(-Math.pow(t - p.pos, 2) / (2 * Math.pow(p.width, 2)));
            y -= val * p.h * 100;
        });

        if (x === 30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Legend
    const legend = document.createElement('div');
    legend.style.fontSize = '11px';
    legend.style.color = '#94a3b8';
    legend.style.marginTop = '5px';
    legend.style.padding = '0 10px';
    legend.innerHTML = peaks.map(p => `<span style="margin-right:10px">• ${p.name}</span>`).join('');
    container.appendChild(legend);
}

// Graph Isomorphism for Symmetry Detection (Morgan Algorithm)
function analyzeNMR() {
    // 1. Assign initial invariants (Element based)
    let signatures = atoms.map(a => a.element.symbol);

    // 2. Iterative refinement
    for (let iter = 0; iter < 3; iter++) {
        const nextSignatures = atoms.map((atom, i) => {
            const neighbors = bonds
                .filter(b => b.atom1 === atom || b.atom2 === atom)
                .map(b => {
                    const other = b.atom1 === atom ? b.atom2 : b.atom1;
                    const otherIdx = atoms.indexOf(other);
                    return { sig: signatures[otherIdx], order: b.order };
                });

            neighbors.sort((a, b) => a.sig.localeCompare(b.sig) || a.order - b.order);
            const neighborStr = neighbors.map(n => n.sig + n.order).join(',');
            return signatures[i] + '-[' + neighborStr + ']';
        });
        signatures = nextSignatures;
    }

    // 3. Group Hydrogens
    const hGroups = {};
    atoms.forEach((atom, i) => {
        if (atom.element.symbol === 'H') {
            const sig = signatures[i];
            if (!hGroups[sig]) hGroups[sig] = [];
            hGroups[sig].push(atom);
        }
    });

    return Object.values(hGroups);
}

// Toggle animation
function toggleAnimation() {
    animationRunning = !animationRunning;
    document.getElementById('animate').classList.toggle('active');

    if (animationRunning) {
        startAnimation();
    } else {
        stopAnimation();
    }
}

/**
 * Global Animation Loop
 * Handles physics, thermal motion, and rendering
 */
function renderLoop(time) {
    // 1. Physics / Optimization (only if needed or every few frames)
    // We could call optimizeGeometry() here for real-time relaxation, 
    // but it might be heavy. Let's do it if atoms are moving significantly.

    // 2. Rendering (which now includes thermal logic)
    render();

    // 3. Continue Loop
    animationId = requestAnimationFrame(renderLoop);
}

function startAnimation() {
    // Simplified: just ensure loop is running if it wasn't
    if (!animationId) {
        renderLoop();
    }
}

// Setup Toolbar Tools
function setupToolbarTools() {
    const tools = ['select-tool', 'rotate-tool', 'build-tool', 'measure-angle', 'measure-distance'];

    tools.forEach(toolId => {
        document.getElementById(toolId).addEventListener('click', () => {
            // Update current tool state
            currentTool = toolId.replace('-tool', '');
            if (toolId === 'measure-angle') currentTool = 'measure-angle';
            if (toolId === 'measure-distance') currentTool = 'measure-distance';

            // Update UI active state
            tools.forEach(id => document.getElementById(id).classList.remove('active'));
            document.getElementById(toolId).classList.add('active');

            // Special handling for build tool
            if (currentTool === 'build') {
                selectedAtom = null; // Clear selection
                bondEditMode = false;
            }

            // Reset other modes
            if (currentTool !== 'select') {
                bondEditMode = false;
                document.getElementById('toggle-bond').classList.remove('active');
            }

            render();
        });
    });
}

// Generate Q-Chem input file
function generateQChemInput() {
    if (atoms.length === 0) {
        alert('Please create a molecule first');
        return;
    }

    const method = document.getElementById('calc-method').value;
    const basis = document.getElementById('basis-set').value;

    let methodString = '';
    switch (method) {
        case 'hf': methodString = 'HF'; break;
        case 'dft': methodString = 'B3LYP'; break;
        case 'mp2': methodString = 'MP2'; break;
        case 'ccsd': methodString = 'CCSD(T)'; break;
    }

    let input = `$comment
${document.getElementById('molecule-name').textContent} - Q-Chem Calculation
Generated by Molecular Visualizer
$end

$molecule
0 1
`;

    // Add atomic coordinates (convert from canvas to Angstrom)
    atoms.forEach(atom => {
        const x = (atom.x / 100).toFixed(6);
        const y = (atom.y / 100).toFixed(6);
        const z = ((atom.z || 0) / 100).toFixed(6); // Include z-coordinate
        input += `${atom.element.symbol}  ${x}  ${y}  ${z}\n`;
    });

    input += `$end

$rem
METHOD         ${methodString}
BASIS          ${basis.toUpperCase()}
JOBTYPE        SP
MEM_TOTAL      2000
SYM_IGNORE     TRUE
$end`;

    document.getElementById('qchem-output').value = input;

    // Calculate approximate MO energies
    calculateMOEnergies();
}

// Calculate molecular orbital energies
function calculateMOEnergies() {
    if (atoms.length === 0) {
        // Reset all energy fields
        updateUI('homo-energy', '-');
        updateUI('lumo-energy', '-');
        updateUI('band-gap', '-');
        updateUI('total-energy', '-');
        updateUI('zpe', '-');
        updateUI('rotational', '-');
        updateUI('electronic-state', '-');
        return;
    }

    // HOMO/LUMO approximation based on Koopman's theorem
    // Ionization energy data (eV)
    const ionizationEnergies = {
        'H': 13.6, 'C': 11.26, 'N': 14.53, 'O': 13.62,
        'F': 17.42, 'Cl': 12.97, 'S': 10.36, 'P': 10.49,
        'Br': 11.81, 'I': 10.45
    };

    // Electron affinity data (eV)
    const electronAffinities = {
        'H': 0.75, 'C': 1.26, 'N': -0.07, 'O': 1.46,
        'F': 3.40, 'Cl': 3.61, 'S': 2.08, 'P': 0.75,
        'Br': 3.36, 'I': 3.06
    };

    // Weighted average ionization energy calculation
    let totalIE = 0, totalEA = 0, count = 0;
    atoms.forEach(atom => {
        const sym = atom.element.symbol;
        if (ionizationEnergies[sym]) {
            totalIE += ionizationEnergies[sym];
            totalEA += electronAffinities[sym] || 0;
            count++;
        }
    });

    const avgIE = count > 0 ? totalIE / count : 10;
    const avgEA = count > 0 ? totalEA / count : 1;

    // HOMO ≈ -IE (Koopman's theorem)
    // LUMO ≈ -EA (approximate)
    const homo = -avgIE / 27.211;  // Convert eV to Hartree
    const lumo = -avgEA / 27.211;
    const gap = (avgIE - avgEA);  // HOMO-LUMO gap in eV

    document.getElementById('homo-energy').textContent = homo.toFixed(4) + ' Eh';
    document.getElementById('lumo-energy').textContent = lumo.toFixed(4) + ' Eh';
    document.getElementById('band-gap').textContent = gap.toFixed(3) + ' eV';

    // Calculate total energy (Sum of atomic energies + bond correction)
    const atomicEnergies = {
        'H': -0.5, 'C': -37.8, 'N': -54.6, 'O': -75.1,
        'F': -99.7, 'P': -341.3, 'S': -398.1, 'Cl': -460.1,
        'Br': -2573.4, 'I': -297.8
    };

    let atomEnergy = atoms.reduce((sum, atom) => {
        return sum + (atomicEnergies[atom.element.symbol] || -10);
    }, 0);

    // Bond energy correction (stabilization)
    const bondCorrection = bonds.length * -0.15;  // Approx -0.15 Eh per bond
    const totalEnergy = atomEnergy + bondCorrection;

    document.getElementById('total-energy').textContent = totalEnergy.toFixed(4) + ' Eh';

    // Zero-point energy (Approx based on vibration mode)
    // ZPE ≈ 0.5 * sum(hν) ≈ 0.01-0.02 Eh per atom for organic molecules
    const zpe = atoms.length * 0.015;
    document.getElementById('zpe').textContent = zpe.toFixed(4) + ' Eh';

    // Rotational constants (Inertia moment-based approximation)
    let Ixx = 0, Iyy = 0;
    atoms.forEach(atom => {
        const mass = atom.element.mass;
        Ixx += mass * atom.y * atom.y;
        Iyy += mass * atom.x * atom.x;
    });
    const avgI = (Ixx + Iyy) / 2;
    const rotConst = avgI > 0 ? (1.05457e-34 / (8 * Math.PI * Math.PI * avgI * 1e-47)).toFixed(2) : 1.0;
    document.getElementById('rotational').textContent = rotConst + ' GHz';

    // Electronic state
    const totalElectrons = atoms.reduce((sum, atom) => sum + atom.element.number, 0);
    const unpaired = totalElectrons % 2;
    document.getElementById('electronic-state').textContent = unpaired === 0 ? '¹A (Singlet)' : '²A (Doublet)';
}

// Show molecular orbitals
function showMolecularOrbitals() {
    const msg = "Molecular Orbital Visualization\n\n" +
        "HOMO: Highest Occupied Molecular Orbital\n" +
        "LUMO: Lowest Unoccupied Molecular Orbital\n\n" +
        "⚠️ Note: These values are approximations based on Koopman's Theorem.\n" +
        "Accurate values require quantum chemical calculations (DFT, HF, etc.).";
    alert(msg);
    calculateMOEnergies();
}

// Show MO diagram
function showMODiagram() {
    const canvas = document.getElementById('spectrum-canvas');
    const homo = parseFloat(document.getElementById('homo-energy').textContent);
    const lumo = parseFloat(document.getElementById('lumo-energy').textContent);
    const gap = parseFloat(document.getElementById('band-gap').textContent);

    if (isNaN(homo)) {
        alert('Please click the "Calculate Properties" button first');
        return;
    }

    canvas.innerHTML = `
        <div style="width: 100%; text-align: center; padding: 1rem;">
            <div style="font-weight: 600; color: var(--accent-green); margin-bottom: 1rem;">MO Energy Diagram</div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
                <div style="width: 80%; background: var(--bg-secondary); padding: 0.5rem; border: 2px solid var(--accent-blue); border-radius: 4px;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">LUMO (Unoccupied)</div>
                    <div style="font-size: 0.85rem; color: var(--accent-blue);">${lumo.toFixed(4)} Eh</div>
                </div>
                <div style="height: 40px; border-left: 2px dashed var(--border-color); position: relative;">
                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.7rem; color: var(--accent-purple);">
                        Δ = ${gap.toFixed(2)} eV
                    </span>
                </div>
                <div style="width: 80%; background: var(--bg-secondary); padding: 0.5rem; border: 2px solid var(--accent-green); border-radius: 4px;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">HOMO (Occupied) ↿⇂</div>
                    <div style="font-size: 0.85rem; color: var(--accent-green);">${homo.toFixed(4)} Eh</div>
                </div>
            </div>
            <div style="margin-top: 0.75rem; font-size: 0.7rem; color: var(--text-secondary);">
                * Approximation based on Koopman's Theorem
            </div>
        </div>
    `;
}

// Calculate Atomic Charges (Mulliken/NPA approximation)
// Calculate Atomic Charges (Mulliken/NPA/ESP approximation)
function calculateAtomicCharges(silent = false) {
    const methodEl = document.getElementById('charge-method');
    const method = methodEl ? methodEl.value : 'npa';
    const resultsArea = document.getElementById('charge-results');
    if (!resultsArea) return;
    resultsArea.innerHTML = '';

    atoms.forEach((atom, index) => {
        let charge = 0;
        const bondCount = countBonds(atom);
        const electronegativity = atom.element.electroneg;

        if (method === 'mulliken') {
            charge = (bondCount * 0.1) - (electronegativity * 0.05);
        } else if (method === 'npa') {
            const avgNeighborsEN = bonds
                .filter(b => b.atom1 === atom || b.atom2 === atom)
                .reduce((sum, b) => sum + (b.atom1 === atom ? b.atom2.element.electroneg : b.atom1.element.electroneg), 0) / (bondCount || 1);
            charge = (electronegativity - (avgNeighborsEN || electronegativity)) * 0.11;
        } else if (method === 'esp') {
            charge = -electronegativity * 0.1 + (bondCount * 0.05);
        }

        const sign = charge >= 0 ? '+' : '';
        const color = charge > 0 ? 'var(--accent-blue)' : charge < 0 ? 'var(--accent-purple)' : 'var(--text-secondary)';

        const item = document.createElement('div');
        item.className = 'charge-item';
        item.innerHTML = `
            <span class="sym">${atom.element.symbol}${index + 1}</span>
            <span class="val" style="color:${color}">${sign}${charge.toFixed(3)}</span>
        `;
        resultsArea.appendChild(item);
    });

    if (!silent) {
        showNotification(`${method.toUpperCase()} charge analysis complete.`, 2000);
    }
}

// Vibration & Reaction Animations
function toggleVibrationMode() {
    vibrationMode = !vibrationMode;
    document.getElementById('vibration-mode')?.classList.toggle('active');
    if (vibrationMode) {
        reactionMode = false;
        document.getElementById('reaction-pathway')?.classList.remove('active');
    }
}

function toggleReactionPathway() {
    reactionMode = !reactionMode;
    document.getElementById('reaction-pathway')?.classList.toggle('active');
    if (reactionMode) {
        vibrationMode = false;
        document.getElementById('vibration-mode')?.classList.remove('active');
    }
}

function updateThermodynamics(moleculeType) {
    const thermoData = {
        'water': { enthalpy: '-285.8 kJ/mol', entropy: '69.9 J/(mol·K)', gibbs: '-237.1 kJ/mol' },
        'methane': { enthalpy: '-74.6 kJ/mol', entropy: '186.3 J/(mol·K)', gibbs: '-50.5 kJ/mol' },
        'ethanol': { enthalpy: '-277.6 kJ/mol', entropy: '160.7 J/(mol·K)', gibbs: '-174.8 kJ/mol' },
        'benzene': { enthalpy: '82.9 kJ/mol', entropy: '269.2 J/(mol·K)', gibbs: '129.7 kJ/mol' },
        'ammonia': { enthalpy: '-45.9 kJ/mol', entropy: '192.8 J/(mol·K)', gibbs: '-16.4 kJ/mol' },
        'co2': { enthalpy: '-393.5 kJ/mol', entropy: '213.8 J/(mol·K)', gibbs: '-394.4 kJ/mol' },
        'acetone': { enthalpy: '-248.4 kJ/mol', entropy: '199.8 J/(mol·K)', gibbs: '-155.4 kJ/mol' },
        'acetic-acid': { enthalpy: '-484.5 kJ/mol', entropy: '159.8 J/(mol·K)', gibbs: '-389.9 kJ/mol' }
    };

    const data = thermoData[moleculeType];
    const enthalpyEl = document.getElementById('enthalpy-val');
    const entropyEl = document.getElementById('entropy-val');
    const gibbsEl = document.getElementById('gibbs-val');

    if (data && enthalpyEl && entropyEl && gibbsEl) {
        enthalpyEl.textContent = data.enthalpy;
        entropyEl.textContent = data.entropy;
        gibbsEl.textContent = data.gibbs;
    } else if (enthalpyEl && entropyEl && gibbsEl) {
        enthalpyEl.textContent = '-';
        entropyEl.textContent = '-';
        gibbsEl.textContent = '-';
    }
}

function startVibration() {
    vibrationAmplitude = 0;
    function vibrate() {
        if (!vibrationMode) return;
        vibrationAmplitude += 0.1;
        const freqValue = document.getElementById('vib-freq')?.value || 1000;
        const amplitude = 5 * (freqValue / 1000);
        atoms.forEach((atom, index) => {
            const phase = (index % 2) * Math.PI;
            atom.y += Math.sin(vibrationAmplitude + phase) * amplitude * 0.1;
        });
        render();
        animationId = requestAnimationFrame(vibrate);
    }
    vibrate();
}

function startReactionPathway() {
    let step = 0;
    const totalSteps = 100;
    const initialPositions = atoms.map(a => ({ x: a.x, y: a.y, z: a.z || 0 }));
    function animateReaction() {
        if (!reactionMode) return;
        step = (step + 1) % totalSteps;
        const progress = step / totalSteps;
        atoms.forEach((atom, index) => {
            const init = initialPositions[index];
            const displacement = Math.sin(progress * Math.PI * 2) * 10;
            if (index % 2 === 0) atom.x = init.x + displacement;
            else atom.x = init.x - displacement;
            atom.y = init.y;
            atom.z = init.z;
        });
        render();
        animationId = requestAnimationFrame(animateReaction);
    }
    animateReaction();
}

function stopAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

async function exportMoleculeToPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        showNotification('Cannot load PDF library.', 2000, 'error');
        return;
    }
    const doc = new jsPDF();
    const formula = document.getElementById('formula').textContent;

    doc.setFontSize(22);
    doc.text('Molecular Analysis Report', 20, 20);
    doc.setFontSize(14);
    doc.text(`Formula: ${formula}`, 20, 35);
    doc.text(`Molecular Weight: ${document.getElementById('mol-weight').textContent}`, 20, 45);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 55);

    // Capture canvas
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 20, 65, 170, 100);

    doc.text('Chemical Properties:', 20, 180);
    doc.setFontSize(10);
    doc.text(`Enthalpy: ${document.getElementById('enthalpy').textContent}`, 25, 190);
    doc.text(`Entropy: ${document.getElementById('entropy').textContent}`, 25, 195);
    doc.text(`Gibbs Free Energy: ${document.getElementById('gibbs').textContent}`, 25, 200);
    doc.text(`Dipole Moment: ${document.getElementById('dipole').textContent}`, 25, 205);

    doc.save(`Molecule_${formula || 'Study'}.pdf`);
    showNotification('PDF file created.');
}

// --- 1. Atom Mode Renderer ---
function renderAtomMode(time) {
    if (atoms.length === 0) return;
    const atom = selectedAtom || atoms[0];
    const element = atom.element;
    const center = worldToScreen(0, 0); // Always center the atom in this mode

    // 1. Draw Shells (Electron Orbits)
    const shellCounts = element.electrons || [0];
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';

    shellCounts.forEach((count, i) => {
        const radius = (i + 1) * 60 * cameraZoom;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Electrons on this shell
        for (let j = 0; j < count; j++) {
            const angle = time * (1.5 / (i + 1)) + (j * Math.PI * 2 / count);
            const ex = center.x + Math.cos(angle) * radius;
            const ey = center.y + Math.sin(angle) * radius;

            // Electron Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#4facfe';
            ctx.fillStyle = '#4facfe';
            ctx.beginPath();
            ctx.arc(ex, ey, 4 * cameraZoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });

    // 2. Draw Nucleus (Protons & Neutrons)
    const pCount = element.number;
    const nCount = Math.round(element.mass - element.number);
    const particles = [];
    for (let i = 0; i < pCount; i++) particles.push({ type: 'p', color: '#ff4b2b' });
    for (let i = 0; i < nCount; i++) particles.push({ type: 'n', color: '#888' });

    // Shuffle and draw particle cluster
    particles.forEach((p, i) => {
        const angle = i * 137.5 * Math.PI / 180; // Vogel's phyllotaxis pattern
        const r = Math.sqrt(i) * 5 * cameraZoom;
        const px = center.x + Math.cos(angle) * r;
        const py = center.y + Math.sin(angle) * r;

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, 4 * cameraZoom, 0, Math.PI * 2);
        ctx.fill();
        // Particle stroke for depth
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
    });

    // 3. Atom Info Overlay
    ctx.fillStyle = 'white';
    ctx.font = `bold ${24 * cameraZoom}px Outfit`;
    ctx.textAlign = 'center';
    ctx.fillText(`${element.symbol}`, center.x, center.y + 10 * cameraZoom);
}

// --- 2. Gas Mode Renderer ---
let gasParticles = [];
function initGasMode() {
    gasParticles = [];
    const count = 50;
    for (let i = 0; i < count; i++) {
        gasParticles.push({
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 300,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            element: selectedElement
        });
    }
}

function renderGasMode(time) {
    if (gasParticles.length === 0) initGasMode();

    const center = worldToScreen(0, 0);
    // V determines container size
    const volume = 400 * cameraZoom; // Fixed for now, can be linked to a slider
    const width = volume;
    const height = volume * 0.75;

    // Draw Container
    ctx.strokeStyle = 'var(--accent-blue)';
    ctx.lineWidth = 2;
    ctx.strokeRect(center.x - width / 2, center.y - height / 2, width, height);
    ctx.fillStyle = 'rgba(79, 172, 254, 0.05)';
    ctx.fillRect(center.x - width / 2, center.y - height / 2, width, height);

    // Particle Physics
    const speedScale = (temperature / 298) * 2;
    gasParticles.forEach(p => {
        p.x += p.vx * speedScale;
        p.y += p.vy * speedScale;

        // Wall collisions
        const halfW = width / (2 * cameraZoom);
        const halfH = height / (2 * cameraZoom);

        if (p.x > halfW || p.x < -halfW) { p.vx *= -1; p.x = Math.max(-halfW, Math.min(halfW, p.x)); }
        if (p.y > halfH || p.y < -halfH) { p.vy *= -1; p.y = Math.max(-halfH, Math.min(halfH, p.y)); }

        // Draw Particle
        const pos = worldToScreen(p.x, p.y);
        ctx.fillStyle = p.element.color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5 * cameraZoom, 0, Math.PI * 2);
        ctx.fill();
    });

    // Display P, V, T
    const pressure = (gasParticles.length * temperature) / (width * height / 1000);
    ctx.fillStyle = 'white';
    ctx.font = '14px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`P: ${pressure.toFixed(2)} atm`, center.x - width / 2 + 10, center.y - height / 2 + 25);
    ctx.fillText(`V: ${(width / 100).toFixed(1)} L`, center.x - width / 2 + 10, center.y - height / 2 + 45);
    ctx.fillText(`T: ${temperature} K`, center.x - width / 2 + 10, center.y - height / 2 + 65);
}

// --- 3. Equilibrium Mode Renderer ---
let eqParticles = { A: 20, B: 20, C: 5, D: 5 };
let eqPositions = [];

function initEquilibriumMode() {
    eqPositions = [];
    const total = 50;
    for (let i = 0; i < total; i++) {
        eqPositions.push({
            x: (Math.random() - 0.5) * 500,
            y: (Math.random() - 0.5) * 400,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            type: i < 25 ? (Math.random() > 0.5 ? 'A' : 'B') : (Math.random() > 0.5 ? 'C' : 'D')
        });
    }
}

function renderEquilibriumMode(time) {
    if (eqPositions.length === 0) initEquilibriumMode();
    const center = worldToScreen(0, 0);

    // Physics Loop & Reaction
    eqPositions.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Container boundary
        if (Math.abs(p.x) > 300) p.vx *= -1;
        if (Math.abs(p.y) > 250) p.vy *= -1;

        // Dynamic Reaction Probability (Simplified Equilibrium)
        // Rate Forward: A + B -> C + D
        // Rate Backward: C + D -> A + B
        if (Math.random() < 0.005) {
            if ((p.type === 'A' || p.type === 'B') && (eqParticles.A + eqParticles.B > 10)) {
                p.type = Math.random() > 0.5 ? 'C' : 'D';
                eqParticles[p.type]++;
                // Update counts (Simplified)
            } else if ((p.type === 'C' || p.type === 'D') && (eqParticles.C + eqParticles.D > 5)) {
                p.type = Math.random() > 0.5 ? 'A' : 'B';
            }
        }

        const pos = worldToScreen(p.x, p.y);
        ctx.fillStyle = p.type === 'A' ? '#ff4b2b' : p.type === 'B' ? '#4facfe' : p.type === 'C' ? '#f093fb' : '#f9d423';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8 * cameraZoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 8px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(p.type, pos.x, pos.y + 3);
    });

    // Dashboard
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(20, 20, 200, 100);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Inter';
    ctx.fillText(`Chemical Equilibrium (A + B ⇌ C + D)`, 30, 40);
    ctx.font = '10px Inter';
    ctx.fillText(`A: Red, B: Blue | C: Purple, D: Yellow`, 30, 60);
    ctx.fillText(`Temp Effect: ${temperature} K`, 30, 80);
}

// --- 4. Thermo Mode Renderer (Hess's Law) ---
let thermoReactions = [
    { text: "C(s) + O₂(g) → CO₂(g)", dh: -393.5 },
    { text: "CO(g) + ½O₂(g) → CO₂(g)", dh: -283.0 },
    { text: "C(s) + ½O₂(g) → CO(g)", dh: -110.5 }
];

function renderThermoMode(time) {
    const center = worldToScreen(0, 0);

    // Draw Reaction Cycle Visualization
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Cycle Points
    const p1 = { x: center.x, y: center.y - 150 }; // C + O2
    const p2 = { x: center.x - 150, y: center.y + 100 }; // CO + 1/2 O2
    const p3 = { x: center.x + 150, y: center.y + 100 }; // CO2

    // Draw Arrows
    drawArrow(p1.x, p1.y, p3.x, p3.y, "ΔH₁ = -393.5 kJ");
    drawArrow(p1.x, p1.y, p2.x, p2.y, "ΔH₂ = -110.5 kJ");
    drawArrow(p2.x, p2.y, p3.x, p3.y, "ΔH₃ = -283.0 kJ");
    ctx.setLineDash([]);

    // Nodes
    drawNode(p1.x, p1.y, "C + O₂", "#ff4b2b");
    drawNode(p2.x, p2.y, "CO + ½O₂", "#4facfe");
    drawNode(p3.x, p3.y, "CO₂", "#f093fb");

    // Hess's Law Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText("Hess's Law: ΔH₁ = ΔH₂ + ΔH₃", center.x, center.y + 200);
}

function drawArrow(x1, y1, x2, y2, label) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const len = Math.sqrt(dx * dx + dy * dy);

    ctx.beginPath();
    ctx.moveTo(x1 + Math.cos(angle) * 30, y1 + Math.sin(angle) * 30);
    ctx.lineTo(x2 - Math.cos(angle) * 30, y2 - Math.sin(angle) * 30);
    ctx.stroke();

    // Arrow Head
    ctx.save();
    ctx.translate(x2 - Math.cos(angle) * 30, y2 - Math.sin(angle) * 30);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-10, 5);
    ctx.fill();
    ctx.restore();

    // Label
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Inter';
    ctx.fillText(label, (x1 + x2) / 2, (y1 + y2) / 2 - 10);
}

function drawNode(x, y, text, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y + 5);
}

// --- 5. Periodic Mode Renderer ---
function renderPeriodicMode(time) {
    const center = worldToScreen(0, 0);
    const cellSize = 50 * cameraZoom;
    const startX = center.x - (9 * cellSize);
    const startY = center.y - (4 * cellSize);

    // Standard Periodic Table Layout (Simplified)
    const layout = [
        { s: 'H', r: 0, c: 0 }, { s: 'He', r: 0, c: 17 },
        { s: 'Li', r: 1, c: 0 }, { s: 'Be', r: 1, c: 1 }, { s: 'B', r: 1, c: 12 }, { s: 'C', r: 1, c: 13 }, { s: 'N', r: 1, c: 14 }, { s: 'O', r: 1, c: 15 }, { s: 'F', r: 1, c: 16 }, { s: 'Ne', r: 1, c: 17 },
        { s: 'Na', r: 2, c: 0 }, { s: 'Mg', r: 2, c: 1 }, { s: 'Al', r: 2, c: 12 }, { s: 'Si', r: 2, c: 13 }, { s: 'P', r: 2, c: 14 }, { s: 'S', r: 2, c: 15 }, { s: 'Cl', r: 2, c: 16 }, { s: 'Ar', r: 2, c: 17 },
        { s: 'K', r: 3, c: 0 }, { s: 'Ca', r: 3, c: 1 }, { s: 'Fe', r: 3, c: 7 }, { s: 'Cu', r: 3, c: 10 }, { s: 'Zn', r: 3, c: 11 }, { s: 'Br', r: 3, c: 16 }
    ];

    layout.forEach(item => {
        const el = elements.find(e => e.symbol === item.s);
        if (!el) return;

        const x = startX + item.c * (cellSize + 5);
        const y = startY + item.r * (cellSize + 5);

        // Draw Cell
        ctx.fillStyle = el.color + '33';
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        roundRect(ctx, x, y, cellSize, cellSize, 8);
        ctx.fill();
        ctx.stroke();

        // Symbol & Number
        ctx.fillStyle = 'white';
        ctx.font = `bold ${14 * cameraZoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText(el.symbol, x + cellSize / 2, y + cellSize / 2 + 5);
        ctx.font = `${8 * cameraZoom}px Inter`;
        ctx.fillText(el.number, x + cellSize / 2, y + 12);
    });

    // Trend Legend
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText("Periodic Table Property Visualization (SIMVEX Table View)", center.x, startY - 50);
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Rendering
function render() {
    const time = Date.now() * 0.002; // Global time factor

    if (currentSimMode === 'atom') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderAtomMode(time);
        return;
    }
    if (currentSimMode === 'gas') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderGasMode(time);
        return;
    }
    if (currentSimMode === 'equilibrium') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderEquilibriumMode(time);
        return;
    }
    if (currentSimMode === 'thermo') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderThermoMode(time);
        return;
    }
    if (currentSimMode === 'periodic') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderPeriodicMode(time);
        return;
    }

    // 1. Animation Modes
    if (vibrationMode) {
        const freqValue = document.getElementById('vib-freq')?.value || 1000;
        const amplitude = 3 * (freqValue / 1000);
        atoms.forEach((atom, index) => {
            const phase = index * 0.5;
            atom.y += Math.sin(time * 5 + phase) * amplitude;
        });
    }

    if (reactionMode) {
        atoms.forEach((atom, index) => {
            const shift = Math.sin(time * 2 + index) * 2;
            atom.x += shift;
        });
    }

    // 2. Thermal Effects (Brownian Motion)
    if (temperature > 0) {
        const kineticEnergy = (temperature / 500) * 0.5;
        atoms.forEach(atom => {
            atom.x += (Math.random() - 0.5) * kineticEnergy;
            atom.y += (Math.random() - 0.5) * kineticEnergy;
            atom.z = (atom.z || 0) + (Math.random() - 0.5) * kineticEnergy;
        });

        // 3. Thermal Decomposition
        if (thermalDecompEnabled && temperature > 1200) {
            // Chance increases with temperature
            const decompChance = (temperature - 1200) / 1000000;
            const originalBondCount = bonds.length;

            bonds = bonds.filter(bond => {
                const strength = (bond.order || 1) * 2000; // Bond strength heuristic
                if (Math.random() * strength < temperature * decompChance * 10) {
                    showNotification(`${bond.atom1.element.symbol}-${bond.atom2.element.symbol} bond thermally decomposed.`, 1500, 'warning');
                    return false;
                }
                return true;
            });

            if (bonds.length !== originalBondCount) {
                updateAllRealtime();
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50 * cameraZoom;
    const offsetX = cameraOffset.x % gridSize;
    const offsetY = cameraOffset.y % gridSize;

    for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    const showBonds = document.getElementById('show-bonds').checked;
    const showLabels = document.getElementById('show-labels').checked;
    const showElectrons = document.getElementById('show-electrons').checked;
    const showLonePairs = document.getElementById('show-lone-pairs') && document.getElementById('show-lone-pairs').checked;
    const showDipole = document.getElementById('show-dipole') && document.getElementById('show-dipole').checked;
    const showOxidation = document.getElementById('show-oxidation') && document.getElementById('show-oxidation').checked;
    const showAngles = document.getElementById('show-angles') && document.getElementById('show-angles').checked;
    const style = document.querySelector('input[name="style"]:checked').value;

    // Helper: 3D Projection (Pseudo-3D)
    function projectSimply(x, y, z) {
        // Simple perspective scaling based on Z
        // z > 0 (closer) -> scale > 1
        // z < 0 (farther) -> scale < 1
        const depthScale = 1 + (z || 0) / 1000;
        const p = worldToScreen(x, y);
        return { x: p.x, y: p.y, scale: Math.max(0.1, depthScale) };
    }

    // 1. Prepare Render List (Z-Sorting)
    const renderList = [];
    if (showBonds) {
        bonds.forEach(bond => {
            // Bond Z is average of atoms. Subtract 100 to draw bonds BEHIND atoms when Z is similar.
            const z = ((bond.atom1.z || 0) + (bond.atom2.z || 0)) / 2 - 100;
            renderList.push({ type: 'bond', z: z, obj: bond });
        });
    }
    atoms.forEach(atom => {
        renderList.push({ type: 'atom', z: atom.z || 0, obj: atom });
    });
    // Sort by Z (ascending: back to front? or descending?)
    // In viewer coordinates, assume +Z is towards camera.
    // If Pseudo-3D Z is world Z. 
    // Standard painter's algorithm: draw farthest first.
    // If +Z is 'up/out', draw minimum Z first?
    // Let's assume standard right-hand system: Z is depth.
    renderList.sort((a, b) => (a.z - b.z));

    // 2. Main Draw Loop
    renderList.forEach(item => {
        if (item.type === 'bond') {
            const bond = item.obj;
            const p1 = projectSimply(bond.atom1.x, bond.atom1.y, bond.atom1.z);
            const p2 = projectSimply(bond.atom2.x, bond.atom2.y, bond.atom2.z);

            const order = bond.order || 1;
            // Scale line width by average depth
            const avgScale = (p1.scale + p2.scale) / 2;
            const lineWidth = (style === 'wireframe' ? 1 : 3) * avgScale * cameraZoom;

            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = lineWidth;

            if (order === 1) {
                ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
            } else {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > 0.1) {
                    const px = -dy / len * 4 * avgScale * cameraZoom;
                    const py = dx / len * 4 * avgScale * cameraZoom;
                    for (let i = 0; i < order; i++) {
                        const offset = (i - (order - 1) / 2);
                        ctx.beginPath();
                        ctx.moveTo(p1.x + px * offset, p1.y + py * offset);
                        ctx.lineTo(p2.x + px * offset, p2.y + py * offset);
                        ctx.stroke();
                    }
                }
            }
        } else {
            const atom = item.obj;
            const p = projectSimply(atom.x, atom.y, atom.z);

            // Draw Surface Overlays first if requested
            const showVDW = document.getElementById('show-vdw') && document.getElementById('show-vdw').checked;
            const showESP = document.getElementById('show-electrostatic') && document.getElementById('show-electrostatic').checked;
            const showDensity = document.getElementById('show-electron-density') && document.getElementById('show-electron-density').checked;

            if (showVDW || showESP || showDensity) {
                const surfaceRadius = atom.element.radius * 2.5 * cameraZoom * p.scale;
                let surfaceColor = 'rgba(200, 200, 255, 0.1)';
                if (showESP) {
                    // ESP: Blue for high electronegativity (δ-), Red for low (δ+)
                    const en = atom.element.electroneg || 2.0;
                    const intensity = (en - 0.7) / (4.0 - 0.7); // Normalize Pauling scale approx 0.7-4.0
                    surfaceColor = `rgba(${255 * (1 - intensity)}, 50, ${255 * intensity}, 0.2)`;
                } else if (showDensity) {
                    surfaceColor = 'rgba(100, 255, 100, 0.15)';
                }

                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, surfaceRadius, 0, Math.PI * 2);
                ctx.fillStyle = surfaceColor;
                ctx.fill();
                if (showESP) {
                    ctx.strokeStyle = surfaceColor.replace('0.2', '0.4');
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                ctx.restore();
            }

            drawAtomAt(ctx, atom, p.x, p.y, p.scale, {
                style, showLabels, showElectrons, showLonePairs, showOxidation,
                isSelected: atom === selectedAtom
            });
        }
    });

    // 3. Overlays (Angles, Measurements, Ghosts, Dipoles)

    // Ghost Bond (Building)
    if (isDrawingBond && bondSourceAtom && currentTool === 'build') {
        const p1 = worldToScreen(bondSourceAtom.x, bondSourceAtom.y);
        const p2 = worldToScreen(mouseWorldPos.x, mouseWorldPos.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]); ctx.lineWidth = 2 * cameraZoom;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);

        const ghostR = selectedElement.radius * cameraZoom * 0.8;
        ctx.beginPath(); ctx.arc(p2.x, p2.y, ghostR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = `bold ${Math.max(10, 14 * cameraZoom)}px Inter, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(selectedElement.symbol, p2.x, p2.y);
    }

    // Dipole Moment
    if (showDipole && bonds.length > 0) {
        // Simple 2D projection of dipole for visibility
        let dx = 0, dy = 0;
        bonds.forEach(bond => {
            const diff = bond.atom2.element.electroneg - bond.atom1.element.electroneg;
            dx += (bond.atom2.x - bond.atom1.x) * diff;
            dy += (bond.atom2.y - bond.atom1.y) * diff;
        });
        const mag = Math.sqrt(dx * dx + dy * dy);
        if (mag > 10) { // Limit threshold
            // Draw from center
            let cx = 0, cy = 0; atoms.forEach(a => { cx += a.x; cy += a.y }); cx /= atoms.length; cy /= atoms.length;
            const c = worldToScreen(cx, cy);
            const end = worldToScreen(cx + dx * 0.5, cy + dy * 0.5); // Scaled

            ctx.strokeStyle = '#06FFA5'; ctx.fillStyle = '#06FFA5'; ctx.lineWidth = 3 * cameraZoom;
            ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(end.x, end.y); ctx.stroke();
            // Arrowhead
            const ang = Math.atan2(end.y - c.y, end.x - c.x);
            const headLen = 15 * cameraZoom;
            ctx.beginPath(); ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - headLen * Math.cos(ang - Math.PI / 6), end.y - headLen * Math.sin(ang - Math.PI / 6));
            ctx.lineTo(end.x - headLen * Math.cos(ang + Math.PI / 6), end.y - headLen * Math.sin(ang + Math.PI / 6));
            ctx.fill();
        }
    }

    // Angles Overlay
    if (showAngles && atoms.length > 2) {
        atoms.forEach(centralAtom => {
            const connected = bonds
                .filter(b => b.atom1 === centralAtom || b.atom2 === centralAtom)
                .map(b => b.atom1 === centralAtom ? b.atom2 : b.atom1);

            if (connected.length >= 2) {
                // Show angle for first pair (Simplified for UI)
                for (let i = 0; i < Math.min(connected.length - 1, 3); i++) {
                    for (let j = i + 1; j < Math.min(connected.length, 3); j++) {
                        const a1 = connected[i];
                        const a2 = connected[j];

                        // Use calculated 3D angle
                        const angle = calculateAngle(a1, centralAtom, a2);

                        const pC = projectSimply(centralAtom.x, centralAtom.y, centralAtom.z);
                        // Draw text near center
                        ctx.fillStyle = '#00FFAA';
                        ctx.font = `${Math.max(10, 12 * cameraZoom)}px Inter`;
                        ctx.textAlign = 'center';
                        ctx.fillText(angle.toFixed(0) + '°', pC.x, pC.y - 25 * cameraZoom);

                        // Draw small arc
                        const p1 = projectSimply(a1.x, a1.y, a1.z);
                        const p2 = projectSimply(a2.x, a2.y, a2.z);
                        const v1x = p1.x - pC.x, v1y = p1.y - pC.y;
                        const v2x = p2.x - pC.x, v2y = p2.y - pC.y;
                        const ang1 = Math.atan2(v1y, v1x);
                        const ang2 = Math.atan2(v2y, v2x);

                        ctx.strokeStyle = 'rgba(0, 255, 170, 0.5)';
                        ctx.lineWidth = 2 * cameraZoom;
                        ctx.beginPath();
                        ctx.arc(pC.x, pC.y, 20 * cameraZoom, ang1, ang2, false); // Direction might be wrong but it's visual hint
                        ctx.stroke();
                    }
                }
            }
        });
    }

    // Measurement Overlay
    if (measurePoints.length > 0) {
        measurePoints.forEach((atom, idx) => {
            const p = worldToScreen(atom.x, atom.y);
            ctx.strokeStyle = '#FF00FF'; ctx.lineWidth = 3 * cameraZoom;
            ctx.beginPath(); ctx.arc(p.x, p.y, atom.element.radius * cameraZoom + 10, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#FF00FF'; ctx.font = `bold ${16 * cameraZoom}px Inter`;
            ctx.fillText((idx + 1).toString(), p.x, p.y - atom.element.radius * cameraZoom - 20);
        });
        if (measureMode === 'distance' && measurePoints.length === 2) {
            const pa = worldToScreen(measurePoints[0].x, measurePoints[0].y);
            const pb = worldToScreen(measurePoints[1].x, measurePoints[1].y);
            ctx.strokeStyle = '#FF00FF'; ctx.setLineDash([5, 5]); ctx.beginPath();
            ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.setLineDash([]);
        }
    }
}

// Atom Drawing Helper
function drawAtomAt(ctx, atom, x, y, scale, options) {
    let radius = atom.element.radius * cameraZoom * scale;
    if (options.style === 'spacefill') radius *= 1.5;
    else if (options.style === 'wireframe') radius *= 0.5;

    // Electron Shells
    if (options.showElectrons && cameraZoom * scale > 0.6) {
        atom.element.electrons.forEach((cnt, idx) => {
            const shellR = radius + (idx + 1) * 15 * cameraZoom * scale;
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)'; ctx.lineWidth = 1 * cameraZoom * scale;
            ctx.beginPath(); ctx.arc(x, y, shellR, 0, Math.PI * 2); ctx.stroke();

            for (let k = 0; k < Math.min(cnt, 8); k++) {
                const ang = (k / Math.min(cnt, 8)) * Math.PI * 2;
                const ex = x + Math.cos(ang) * shellR;
                const ey = y + Math.sin(ang) * shellR;
                ctx.fillStyle = '#4A9EFF'; ctx.beginPath(); ctx.arc(ex, ey, 2 * cameraZoom * scale, 0, Math.PI * 2); ctx.fill();
            }
        });
    }

    // Shadow (Only for neutral atoms)
    if (!atom.charge) {
        ctx.beginPath(); ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
    }

    // Sphere (Gradient)
    const gradient = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, 0, x, y, radius);
    gradient.addColorStop(0, lightenColor(atom.element.color, 40));
    gradient.addColorStop(1, atom.element.color);

    ctx.save();
    // Ion Glow Effect (User Request: +Red, -Blue)
    if (atom.charge) {
        ctx.shadowBlur = 20 * cameraZoom * scale;
        ctx.shadowColor = atom.charge > 0 ? '#FF3333' : '#3388FF';
    }

    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = options.style === 'wireframe' ? 'transparent' : gradient;
    ctx.fill();
    ctx.restore();

    // Outline
    ctx.strokeStyle = options.isSelected ? '#06FFA5' : darkenColor(atom.element.color, 20);
    ctx.lineWidth = (options.isSelected ? 4 : 1) * cameraZoom * scale;
    ctx.stroke();

    // Label
    if (options.showLabels && radius > 8) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${radius * 0.7}px Inter, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(atom.element.symbol, x, y);
    }

    // Oxidation State
    if (options.showOxidation) {
        const ox = calculateOxidationState(atom);
        if (ox !== 0) {
            ctx.fillStyle = ox > 0 ? '#4A9EFF' : '#FF5555';
            ctx.font = `bold ${radius * 0.6}px Inter`;
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText((ox > 0 ? '+' : '') + ox, x + radius * 0.7, y - radius * 0.7);
        }
    }

    // Lone Pairs
    if (options.showLonePairs) {
        const lp = calculateLonePairs(atom, countBonds(atom));
        if (lp > 0) {
            const pairR = radius + 5 * cameraZoom * scale; // Just outside
            for (let i = 0; i < lp; i++) {
                const ang = (i / lp) * Math.PI * 2 + Math.PI / 4;
                const lx = x + Math.cos(ang) * pairR;
                const ly = y + Math.sin(ang) * pairR;
                ctx.fillStyle = '#FFA500';
                ctx.beginPath(); ctx.ellipse(lx, ly, 3 * cameraZoom * scale, 5 * cameraZoom * scale, ang, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
}

// Color utilities
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
        (G > 0 ? G : 0) * 0x100 +
        (B > 0 ? B : 0)).toString(16).slice(1);
}

// Bond Details Tooltip
function showBondDetails(bond, screenX, screenY) {
    const el1 = bond.atom1.element;
    const el2 = bond.atom2.element;
    const diff = Math.abs(el1.electroneg - el2.electroneg).toFixed(2);
    let type = bond.type || getBondType(el1, el2);

    // Add translation for type
    const typeMap = { 'covalent': 'Non-polar Covalent', 'polar': 'Polar Covalent', 'ionic': 'Ionic Bond' };
    const typeName = typeMap[type] || type;

    // Ionic Character Calculation (Pauling's Equation)
    // % Ionic = 100 * (1 - e^(-(diff^2)/4))
    const percentIonic = (100 * (1 - Math.exp(-(Math.pow(diff, 2)) / 4))).toFixed(1);

    const lengthPm = calculateDistance(bond.atom1, bond.atom2).toFixed(1);

    const tooltip = document.createElement('div');
    tooltip.className = 'bond-tooltip';
    tooltip.innerHTML = `
        <div style="font-weight:bold; margin-bottom:4px; color:#4A9EFF">Bond Information Analysis</div>
        <div style="font-size:0.9em">
            • <b>${el1.name}-${el2.name}</b> Bond<br>
            • Electronegativity Diff: <b>${diff}</b><br>
            • Bond Type: <b style="color:#06FFA5">${typeName}</b><br>
            • Ionic Character: <b>${percentIonic}%</b><br>
            • Bond Length: <b>${lengthPm} pm</b>
        </div>
        <div style="margin-top:4px; font-size:0.8em; color:#aaa">
            ※ Based on Pauling Scale
        </div>
    `;
    tooltip.style.cssText = `
        position: fixed; left: ${screenX + 15}px; top: ${screenY + 15}px;
        background: rgba(15, 17, 21, 0.95); border: 1px solid #4A9EFF;
        padding: 12px; border-radius: 8px; z-index: 2000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5); pointer-events: none;
        backdrop-filter: blur(5px);
    `;

    hideBondDetails(); // Clear existing
    tooltip.id = 'current-bond-tooltip';
    document.body.appendChild(tooltip);

    // Auto hide after 4 seconds
    setTimeout(hideBondDetails, 4000);
}

function hideBondDetails() {
    const existing = document.getElementById('current-bond-tooltip');
    if (existing) existing.remove();
}

// Helper functions
function calculateDistance(atom1, atom2) {
    const dx = atom1.x - atom2.x;
    const dy = atom1.y - atom2.y;
    // Assuming 100px = 154pm (C-C bond length approx)
    const refPixels = 100;
    const refPicometers = 154;
    return (Math.sqrt(dx * dx + dy * dy) / refPixels * refPicometers);
}

// Variables restoration if needed
if (typeof currentMoleculeType === 'undefined') {
    var currentMoleculeType = 'water'; // Use var for safety or let if scope allows
}

// Inject consolidated styles for notifications
const styleSheet = document.createElement("style");
styleSheet.textContent = `
    .notification-toast {
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: rgba(30, 41, 59, 0.85); color: #fff; padding: 12px 24px;
        border-radius: 50px; z-index: 9999; font-size: 0.95rem; font-weight: 500;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.1) inset;
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        display: flex; align-items: center; gap: 8px;
        animation: toastSlideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        pointer-events: none; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    @keyframes toastSlideDown {
        from { opacity: 0; transform: translate(-50%, -20px) scale(0.95); }
        to { opacity: 1; transform: translate(-50%, 0) scale(1); }
    }
`;
document.head.appendChild(styleSheet);

// Delete function to fix missing reference
function deleteSelectedAtom() {
    if (!selectedAtom) {
        showNotification('Select an atom to delete first.', 2000, 'error');
        return;
    }

    currentMoleculeType = 'custom';
    const atomName = selectedAtom.element.name;

    // Remove bonds connected to this atom
    bonds = bonds.filter(bond => bond.atom1 !== selectedAtom && bond.atom2 !== selectedAtom);

    // Remove atom
    atoms = atoms.filter(atom => atom !== selectedAtom);

    selectedAtom = null;
    bondSourceAtom = null;

    // Reset UI Elements Safely
    const chemInfo = document.getElementById('chemical-info');
    if (chemInfo && atoms.length === 0) chemInfo.innerHTML = '<div class="empty-state">Select a compound.</div>';

    // If it's the last atom deleted, clear VSEPR immediately
    if (atoms.length === 0) {
        const vsepr = document.getElementById('vsepr-geometry');
        if (vsepr) vsepr.innerHTML = '<div class="empty-state">Waiting for analysis...</div>';
    }

    updateAllRealtime();
    render();

    showNotification(`${atomName} atom has been deleted.`, 1500);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Change viewport background color based on temperature (Visual Feedback)
 */
function updateTemperatureBackground(temp) {
    let r, g, b;

    if (temp <= 300) {
        // 0K (Cold Blue) -> 300K (Default Dark)
        // 0K: rgb(0, 30, 60)
        // 300K: rgb(27, 30, 38)
        const t = temp / 300;
        r = Math.floor(0 + (27 - 0) * t);
        g = Math.floor(30 + (30 - 30) * t);
        b = Math.floor(60 + (38 - 60) * t);
    } else {
        // 300K -> 5000K (Hot Red/Orange glow)
        // 5000K: rgb(80, 20, 10)
        const t = Math.min((temp - 300) / 4700, 1);
        r = Math.floor(27 + (100 - 27) * t); // Red increases significantly
        g = Math.floor(30 + (10 - 30) * t);
        b = Math.floor(38 + (10 - 38) * t);
    }

    const canvasContainer = document.querySelector('.viewport-canvas');
    if (canvasContainer) {
        const color1 = `rgb(${r}, ${g}, ${b})`;
        const color2 = `rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`;
        canvasContainer.style.background = `radial-gradient(circle at center, ${color1} 0%, ${color2} 100%)`;
    }
}
