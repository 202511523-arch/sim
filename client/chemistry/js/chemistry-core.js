/**
 * Chemistry Core Module
 * Contains periodic table data, chemistry calculations, and molecular rendering
 */

// Export arrays that will be shared with app.js
export let atoms = [];
export let bonds = [];
export let selectedAtom = null;
export let currentTool = 'build';

// Store selected element in a wrapper object to make it mutable
export const state = {
    selectedElement: null
};

// Periodic table data (subset of common elements)
export const elements = [
    // Period 1
    { symbol: 'H', name: 'Hydrogen', number: 1, mass: 1.008, color: '#FFFFFF', radius: 25, electroneg: 2.20, valence: 1, maxBonds: 1, electrons: [1], category: 'nonmetal' },
    { symbol: 'He', name: 'Helium', number: 2, mass: 4.003, color: '#D9FFFF', radius: 28, electroneg: null, valence: 0, maxBonds: 0, electrons: [2], category: 'noble-gas' },

    // Period 2
    { symbol: 'C', name: 'Carbon', number: 6, mass: 12.011, color: '#909090', radius: 40, electroneg: 2.55, valence: 4, maxBonds: 4, electrons: [2, 4], category: 'nonmetal' },
    { symbol: 'N', name: 'Nitrogen', number: 7, mass: 14.007, color: '#3050F8', radius: 38, electroneg: 3.04, valence: 3, maxBonds: 4, electrons: [2, 5], category: 'nonmetal' },
    { symbol: 'O', name: 'Oxygen', number: 8, mass: 15.999, color: '#FF0D0D', radius: 37, electroneg: 3.44, valence: 2, maxBonds: 2, electrons: [2, 6], category: 'nonmetal' },
    { symbol: 'F', name: 'Fluorine', number: 9, mass: 18.998, color: '#90E050', radius: 35, electroneg: 3.98, valence: 1, maxBonds: 1, electrons: [2, 7], category: 'halogen' },

    // Period 3
    { symbol: 'Na', name: 'Sodium', number: 11, mass: 22.990, color: '#AB5CF2', radius: 50, electroneg: 0.93, valence: 1, maxBonds: 1, electrons: [2, 8, 1], category: 'alkali' },
    { symbol: 'Cl', name: 'Chlorine', number: 17, mass: 35.453, color: '#1FF01F', radius: 36, electroneg: 3.16, valence: 1, maxBonds: 1, electrons: [2, 8, 7], category: 'halogen' },

    // Additional common elements
    { symbol: 'S', name: 'Sulfur', number: 16, mass: 32.065, color: '#FFFF30', radius: 38, electroneg: 2.58, valence: 2, maxBonds: 6, electrons: [2, 8, 6], category: 'nonmetal' },
    { symbol: 'P', name: 'Phosphorus', number: 15, mass: 30.974, color: '#FF8000', radius: 39, electroneg: 2.19, valence: 3, maxBonds: 5, electrons: [2, 8, 5], category: 'nonmetal' },
    { symbol: 'Br', name: 'Bromine', number: 35, mass: 79.904, color: '#A62929', radius: 39, electroneg: 2.96, valence: 1, maxBonds: 1, electrons: [2, 8, 18, 7], category: 'halogen' },
    { symbol: 'I', name: 'Iodine', number: 53, mass: 126.90, color: '#940094', radius: 43, electroneg: 2.66, valence: 1, maxBonds: 1, electrons: [2, 8, 18, 18, 7], category: 'halogen' },
];

// Initialize chemistry core
export function initChemistryCore() {
    console.log('Chemistry core initialized');
    state.selectedElement = elements.find(e => e.symbol === 'C') || elements[2]; // Default to Carbon
    return state.selectedElement;
}

// Atom class
export class Atom {
    constructor(element, x, y) {
        this.element = element;
        this.x = x;
        this.y = y;
        this.id = `atom_${Date.now()}_${Math.random()}`;
    }
}

// Bond class
export class Bond {
    constructor(atom1, atom2, order = 1) {
        this.atom1 = atom1;
        this.atom2 = atom2;
        this.order = order; // 1 = single, 2 = double, 3 = triple
        this.id = `bond_${Date.now()}_${Math.random()}`;
    }
}

// Add atom at position
export function addAtom(x, y, element) {
    if (!element) element = state.selectedElement;
    if (!element) {
        console.error('No element selected!');
        return null;
    }
    const atom = new Atom(element, x, y);
    atoms.push(atom);
    console.log('Added atom:', element.symbol, 'at', x, y);
    return atom;
}

// Add bond between two atoms
export function addBond(atom1, atom2, order = 1) {
    // Check if bond already exists
    const existingBond = bonds.find(b =>
        (b.atom1 === atom1 && b.atom2 === atom2) ||
        (b.atom1 === atom2 && b.atom2 === atom1)
    );

    if (existingBond) {
        // Cycle bond order: 1 -> 2 -> 3 -> 1
        existingBond.order = (existingBond.order % 3) + 1;
        return existingBond;
    }

    const bond = new Bond(atom1, atom2, order);
    bonds.push(bond);
    return bond;
}

// Remove atom
export function removeAtom(atom) {
    // Remove bonds connected to this atom
    bonds = bonds.filter(b => b.atom1 !== atom && b.atom2 !== atom);

    // Remove atom
    const index = atoms.indexOf(atom);
    if (index > -1) {
        atoms.splice(index, 1);
    }
}

// Remove bond
export function removeBond(bond) {
    const index = bonds.indexOf(bond);
    if (index > -1) {
        bonds.splice(index, 1);
    }
}

// Get atom at position (with tolerance)
export function getAtomAtPosition(x, y, tolerance = 30) {
    for (let atom of atoms) {
        const dx = atom.x - x;
        const dy = atom.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < tolerance) {
            return atom;
        }
    }
    return null;
}

// Calculate molecular formula
export function calculateFormula() {
    const elementCounts = {};

    for (let atom of atoms) {
        const symbol = atom.element.symbol;
        elementCounts[symbol] = (elementCounts[symbol] || 0) + 1;
    }

    // Build formula string
    let formula = '';
    const elementOrder = ['C', 'H', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Br', 'I'];

    // Add elements in standard order
    for (let symbol of elementOrder) {
        if (elementCounts[symbol]) {
            formula += symbol;
            if (elementCounts[symbol] > 1) {
                formula += elementCounts[symbol];
            }
            delete elementCounts[symbol];
        }
    }

    // Add remaining elements alphabetically
    const remaining = Object.keys(elementCounts).sort();
    for (let symbol of remaining) {
        formula += symbol;
        if (elementCounts[symbol] > 1) {
            formula += elementCounts[symbol];
        }
    }

    return formula || '-';
}

// Calculate molecular weight
export function calculateMolecularWeight() {
    let weight = 0;
    for (let atom of atoms) {
        weight += atom.element.mass;
    }
    return weight.toFixed(2);
}

// Calculate formal charge
export function calculateFormalCharge() {
    // Simplified calculation
    let totalCharge = 0;

    for (let atom of atoms) {
        const bondCount = bonds.filter(b =>
            b.atom1 === atom || b.atom2 === atom
        ).reduce((sum, b) => sum + b.order, 0);

        const valence = atom.element.valence;
        const formalCharge = valence - bondCount;
        totalCharge += formalCharge;
    }

    return totalCharge;
}

// Drawing function (to  be called from app.js)
export function drawMolecule(ctx, cameraOffset, cameraZoom) {
    if (!ctx) return;

    // Draw bonds first (so they appear behind atoms)
    ctx.lineWidth = 3 / cameraZoom;

    for (let bond of bonds) {
        const atom1 = bond.atom1;
        const atom2 = bond.atom2;

        ctx.strokeStyle = '#60a5fa';
        ctx.beginPath();
        ctx.moveTo(atom1.x, atom1.y);
        ctx.lineTo(atom2.x, atom2.y);
        ctx.stroke();

        // Draw double/triple bonds
        if (bond.order > 1) {
            const dx = atom2.x - atom1.x;
            const dy = atom2.y - atom1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const offsetX = -dy / length * 5;
            const offsetY = dx / length * 5;

            ctx.beginPath();
            ctx.moveTo(atom1.x + offsetX, atom1.y + offsetY);
            ctx.lineTo(atom2.x + offsetX, atom2.y + offsetY);
            ctx.stroke();

            if (bond.order === 3) {
                ctx.beginPath();
                ctx.moveTo(atom1.x - offsetX, atom1.y - offsetY);
                ctx.lineTo(atom2.x - offsetX, atom2.y - offsetY);
                ctx.stroke();
            }
        }
    }

    // Draw atoms
    for (let atom of atoms) {
        const element = atom.element;
        const radius = element.radius * 0.5 / cameraZoom;

        // Draw atom circle
        ctx.fillStyle = element.color;
        ctx.beginPath();
        ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw atom border
        ctx.strokeStyle = atom === selectedAtom ? '#fbbf24' : '#1e293b';
        ctx.lineWidth = 2 / cameraZoom;
        ctx.stroke();

        // Draw element symbol
        ctx.fillStyle = '#000000';
        ctx.font = `${16 / cameraZoom}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(element.symbol, atom.x, atom.y);
    }
}

// Clear all atoms and bonds
export function clearMolecule() {
    atoms.length = 0;
    bonds.length = 0;
    selectedAtom = null;
}

// Export molecule data
export function exportMoleculeData() {
    return {
        atoms: atoms.map(a => ({
            element: a.element.symbol,
            x: a.x,
            y: a.y
        })),
        bonds: bonds.map(b => ({
            atom1: atoms.indexOf(b.atom1),
            atom2: atoms.indexOf(b.atom2),
            order: b.order
        }))
    };
}

// Import molecule data
export function importMoleculeData(data) {
    clearMolecule();

    // Recreate atoms
    for (let atomData of data.atoms) {
        const element = elements.find(e => e.symbol === atomData.element);
        if (element) {
            addAtom(atomData.x, atomData.y, element);
        }
    }

    // Recreate bonds
    for (let bondData of data.bonds) {
        const atom1 = atoms[bondData.atom1];
        const atom2 = atoms[bondData.atom2];
        if (atom1 && atom2) {
            addBond(atom1, atom2, bondData.order);
        }
    }
}
