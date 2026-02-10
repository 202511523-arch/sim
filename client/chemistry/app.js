/**
 * Chemistry Workspace - Main Application
 * Molecular visualization and chemistry simulation platform
 */

// Import chemistry core functionality
import * as ChemCore from './js/chemistry-core.js';

// Common workspace modules
import { createStateManager } from '../js/workspace-common/state-manager.js';
import { createNotesPanel } from '../js/workspace-common/notes-panel.js';
import { createAIAssistant } from '../js/workspace-common/ai-assistant.js';
import { createPDFExporter } from '../js/workspace-common/pdf-export.js';

// ============================================
// App State
// ============================================
const state = {
    currentProjectId: null,
    isRightPanelCollapsed: false
};

let canvas, ctx;
let cameraOffset = { x: 0, y: 0 };
let cameraZoom = 1;
let isDragging = false;
let dragStartPos = { x: 0, y: 0 };

// Common modules
let stateManager;
let notesPanel;
let aiAssistant;
let pdfExporter;

// ============================================
// Initialization
// ============================================
async function init() {
    console.log('Initializing Chemistry Workspace...');

    // Initialize chemistry core
    ChemCore.initChemistryCore();

    // Get project ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    state.currentProjectId = urlParams.get('id');

    // Setup canvas
    setupCanvas();

    // Initialize Common Components
    initComponents();

    // Setup event listeners
    setupEventListeners();

    // Initialize periodic table
    generatePeriodicTable();

    // Load state
    const loadedState = await stateManager.load();
    if (!loadedState && state.currentProjectId) {
        // Only load project if stateManager didn't load a local state (and we have an ID)
        await loadProject(state.currentProjectId);
    }

    // Start animation loop
    animate();

    console.log('Chemistry Workspace initialized');
}

function initComponents() {
    // 1. State Manager
    stateManager = createStateManager({
        projectId: state.currentProjectId,
        serialize: serializeState,
        deserialize: deserializeState,
        onSave: () => {
            updateLastSaved();
            setStatus('Project saved');
        }
    });

    // 2. Notes Panel
    notesPanel = createNotesPanel({
        containerId: 'notes-panel',
        textareaId: 'notepad',
        storageKey: `simvex_notes_chem_${state.currentProjectId || 'temp'}`
    });

    // 3. AI Assistant
    aiAssistant = createAIAssistant({
        containerId: 'ai-panel',
        workspaceContext: 'Chemistry (Molecular Simulation)',
        getContextData: () => ({
            formula: ChemCore.calculateFormula(),
            molecularWeight: ChemCore.calculateMolecularWeight(),
            atomCount: ChemCore.atoms.length,
            bondCount: ChemCore.bonds.length
        })
    });

    // 4. PDF Exporter
    pdfExporter = createPDFExporter({
        workspaceName: 'Chemistry Lab',
        getViewportElement: () => document.getElementById('viewport-container'),
        getStateData: () => ({
            formula: ChemCore.calculateFormula(),
            molecularWeight: ChemCore.calculateMolecularWeight()
        })
    });
}

function serializeState() {
    // Use ChemCore's export plus camera state
    const molData = ChemCore.exportMoleculeData();
    return {
        version: '1.0',
        atoms: molData.atoms,
        bonds: molData.bonds,
        camera: {
            offset: { ...cameraOffset },
            zoom: cameraZoom
        }
    };
}

function deserializeState(data) {
    if (!data) return;

    // Use ChemCore's import
    if (data.atoms && data.bonds) {
        ChemCore.importMoleculeData(data);
    }

    // Restore camera
    if (data.camera) {
        cameraOffset = data.camera.offset || { x: canvas.width / 2, y: canvas.height / 2 };
        cameraZoom = data.camera.zoom || 1;
    }

    updateStats();
}

// ============================================
// Canvas Setup (Preserved)
// ============================================
function setupCanvas() {
    canvas = document.getElementById('viewport');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    if (ChemCore.atoms.length === 0) {
        cameraOffset.x = canvas.width / 2;
        cameraOffset.y = canvas.height / 2;
    }
}

function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// ============================================
// Animation Loop (Preserved)
// ============================================
function animate() {
    requestAnimationFrame(animate);
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(cameraOffset.x, cameraOffset.y);
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate(-cameraOffset.x, -cameraOffset.y);

    ChemCore.drawMolecule(ctx, cameraOffset, cameraZoom);

    ctx.restore();
    updateStats();
}

// ============================================
// Stats Update (Preserved)
// ============================================
function updateStats() {
    const atomCountEl = document.getElementById('atom-count');
    const bondCountEl = document.getElementById('bond-count');
    const statsAtomsEl = document.getElementById('stats-atoms');
    const statsBondsEl = document.getElementById('stats-bonds');
    const formulaEl = document.getElementById('formula');
    const molWeightEl = document.getElementById('mol-weight');

    if (atomCountEl) atomCountEl.textContent = ChemCore.atoms.length;
    if (bondCountEl) bondCountEl.textContent = ChemCore.bonds.length;
    if (statsAtomsEl) statsAtomsEl.textContent = `Atoms: ${ChemCore.atoms.length}`;
    if (statsBondsEl) statsBondsEl.textContent = `Bonds: ${ChemCore.bonds.length}`;
    if (formulaEl) formulaEl.textContent = ChemCore.calculateFormula();
    if (molWeightEl) molWeightEl.textContent = ChemCore.calculateMolecularWeight() + ' g/mol';
}

// ============================================
// Periodic Table (Preserved)
// ============================================
function generatePeriodicTable() {
    const elementGrid = document.getElementById('element-grid');
    if (!elementGrid) return;
    elementGrid.innerHTML = '';

    ChemCore.elements.forEach(element => {
        const btn = document.createElement('button');
        btn.className = 'element-btn';
        btn.dataset.element = element.symbol;
        btn.style.color = element.color;
        if (ChemCore.state.selectedElement?.symbol === element.symbol) {
            btn.classList.add('selected');
        }
        btn.innerHTML = `
      <div class="element-symbol">${element.symbol}</div>
      <div class="element-number">${element.number}</div>
    `;
        btn.addEventListener('click', () => selectElement(element, btn));
        elementGrid.appendChild(btn);
    });
}

function selectElement(element, btn) {
    ChemCore.state.selectedElement = element;
    document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const selectedEl = document.getElementById('selected-element');
    if (selectedEl) selectedEl.textContent = `Selected Element: ${element.symbol}`;
    setStatus(`${element.name} (${element.symbol}) selected`);
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
    // Toolbar buttons
    document.getElementById('btn-new')?.addEventListener('click', newMolecule);
    // Use stateManager for save
    document.getElementById('btn-save')?.addEventListener('click', () => stateManager.save());
    document.getElementById('btn-load')?.addEventListener('click', () => console.log('Load not implemented yet')); // Could use file picker
    // Use pdfExporter
    document.getElementById('btn-export')?.addEventListener('click', async () => {
        setStatus('Generating PDF...');
        const result = await pdfExporter.generatePDF();
        setStatus(result ? 'PDF saved' : 'PDF generation failed');
    });

    // Tool buttons
    document.getElementById('tool-select')?.addEventListener('click', () => setTool('select'));
    document.getElementById('tool-build')?.addEventListener('click', () => setTool('build'));
    document.getElementById('tool-delete')?.addEventListener('click', () => setTool('delete'));
    document.getElementById('tool-bond')?.addEventListener('click', () => setTool('bond'));

    // View buttons
    document.getElementById('btn-reset-view')?.addEventListener('click', resetView);
    // document.getElementById('btn-screenshot')?.addEventListener('click', () => pdfExporter.generatePDF()); // Screenshot as PDF for now
    document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);

    // Canvas events (Preserved logic)
    if (canvas) {
        canvas.addEventListener('mousedown', onCanvasMouseDown);
        canvas.addEventListener('mousemove', onCanvasMouseMove);
        canvas.addEventListener('mouseup', onCanvasMouseUp);
        canvas.addEventListener('wheel', onCanvasWheel);
        canvas.addEventListener('click', onCanvasClick);
    }

    // Panel tabs (Common)
    document.querySelectorAll('.panel-tab').forEach(tab => {
        tab.addEventListener('click', () => switchPanel(tab.dataset.panel));
    });

    // Quick molecules
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => loadQuickMolecule(btn.dataset.molecule));
    });

    // Collapsible panels
    document.querySelectorAll('[data-toggle]').forEach(header => {
        header.addEventListener('click', () => toggleCollapsible(header));
    });

    // Right Panel Toggle
    document.getElementById('btn-toggle-right-panel')?.addEventListener('click', toggleRightPanel);

    // AI Actions
    document.getElementById('btn-ai-summarize')?.addEventListener('click', () => aiAssistant.summarize());
    document.getElementById('btn-ai-explain')?.addEventListener('click', () => aiAssistant.explain('current molecular structure'));
    document.getElementById('chat-send')?.addEventListener('click', () => {
        const input = document.getElementById('chat-input');
        aiAssistant.sendMessage(input.value);
        input.value = '';
    });
    document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            aiAssistant.sendMessage(e.target.value);
            e.target.value = '';
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', onKeyDown);
}

// ============================================
// UI Functions & Event Handlers
// ============================================
function toggleRightPanel() {
    const panel = document.getElementById('panel-right');
    const toggleBtn = document.getElementById('btn-toggle-right-panel');
    const icon = toggleBtn.querySelector('.material-icons-round');

    state.isRightPanelCollapsed = !state.isRightPanelCollapsed;

    // Default width relies on CSS, here we manipulate style directly or remove style to revert to CSS
    // Assuming CSS handles .collapsed class if we added it, but here we do manual width
    if (state.isRightPanelCollapsed) {
        panel.style.width = '32px';
        panel.querySelectorAll('.panel-tabs, .panel-content').forEach(el => el.style.display = 'none');
        icon.textContent = 'chevron_left';
    } else {
        panel.style.width = '320px'; // Approx width
        panel.querySelectorAll('.panel-tabs, .panel-content').forEach(el => el.style.display = '');

        const activeTab = document.querySelector('.panel-tab.active');
        if (activeTab) {
            switchPanel(activeTab.dataset.panel);
        }
        icon.textContent = 'chevron_right';
    }
}

function switchPanel(panelName) {
    if (state.isRightPanelCollapsed) toggleRightPanel();

    document.querySelectorAll('.tab-content').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${panelName}-panel`)?.classList.add('active');

    document.querySelectorAll('.panel-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.panel-tab[data-panel="${panelName}"]`)?.classList.add('active');
}

function toggleCollapsible(header) {
    const section = header.closest('.panel-section');
    if (section) section.classList.toggle('collapsed');
}

function updateLastSaved() {
    const lastSavedEl = document.getElementById('last-saved');
    if (lastSavedEl) lastSavedEl.textContent = stateManager.getLastSaveText();
}

function setStatus(message) {
    const statusEl = document.getElementById('status-message');
    if (statusEl) statusEl.textContent = message;
}

// ============================================
// Tool & Canvas Functions (Preserved)
// ============================================
function setTool(tool) {
    ChemCore.currentTool = tool;
    document.querySelectorAll('.sim-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tool-${tool}`)?.classList.add('active');
    setStatus(`Tool: ${tool}`);
}

function onCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    isDragging = true;
    dragStartPos = { x, y };
}

function onCanvasMouseMove(e) {
    if (!isDragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - dragStartPos.x;
    const dy = y - dragStartPos.y;

    cameraOffset.x += dx;
    cameraOffset.y += dy;
    dragStartPos = { x, y };
}

function onCanvasMouseUp() {
    isDragging = false;
}

function onCanvasWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = cameraZoom * zoomFactor;
    if (newZoom >= 0.1 && newZoom <= 10) cameraZoom = newZoom;
}

function onCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldX = (screenX - cameraOffset.x) / cameraZoom + cameraOffset.x;
    const worldY = (screenY - cameraOffset.y) / cameraZoom + cameraOffset.y;

    const clickedAtom = ChemCore.getAtomAtPosition(worldX, worldY, 30 / cameraZoom);

    if (ChemCore.currentTool === 'build') {
        if (!clickedAtom) {
            ChemCore.addAtom(worldX, worldY, ChemCore.state.selectedElement);
            stateManager.markDirty();
            updateStats();
            setStatus('Atom added');
        } else if (ChemCore.selectedAtom && ChemCore.selectedAtom !== clickedAtom) {
            ChemCore.addBond(ChemCore.selectedAtom, clickedAtom);
            ChemCore.selectedAtom = null;
            stateManager.markDirty();
            updateStats();
            setStatus('Bond created');
        } else {
            ChemCore.selectedAtom = clickedAtom;
            setStatus('Click an atom to bond');
        }
    } else if (ChemCore.currentTool === 'select') {
        if (clickedAtom) {
            ChemCore.selectedAtom = clickedAtom;
            updateAtomProperties(clickedAtom);
            setStatus(`${clickedAtom.element.name} selected`);
        } else {
            ChemCore.selectedAtom = null;
            resetAtomProperties();
        }
    } else if (ChemCore.currentTool === 'delete') {
        if (clickedAtom) {
            ChemCore.removeAtom(clickedAtom);
            stateManager.markDirty();
            updateStats();
            setStatus('Atom deleted');
        }
    }
}

function updateAtomProperties(atom) {
    const panel = document.getElementById('atom-properties');
    if (!panel) return;
    panel.innerHTML = `
    <div class="property-row">
      <label>Element</label>
      <span class="property-value">${atom.element.name} (${atom.element.symbol})</span>
    </div>
    <div class="property-row">
      <label>Mass</label>
      <span class="property-value">${atom.element.mass}</span>
    </div>
    <div class="property-row">
      <label>Electronegativity</label>
      <span class="property-value">${atom.element.electroneg || '-'}</span>
    </div>`;
}

function resetAtomProperties() {
    const panel = document.getElementById('atom-properties');
    if (panel) panel.innerHTML = '<div class="empty-state">Select an atom</div>';
}

function loadQuickMolecule(moleculeName) {
    console.log('Loading quick molecule:', moleculeName);
    setStatus(`${moleculeName} loaded (Mock)`);
    // Ideally this would clear and create atoms
    newMolecule();
    // Example: H2O
    if (moleculeName === 'water') {
        const o = ChemCore.addAtom(0, 0, ChemCore.elements.find(e => e.symbol === 'O'));
        const h1 = ChemCore.addAtom(-50, 50, ChemCore.elements.find(e => e.symbol === 'H'));
        const h2 = ChemCore.addAtom(50, 50, ChemCore.elements.find(e => e.symbol === 'H'));
        ChemCore.addBond(o, h1);
        ChemCore.addBond(o, h2);
    }
    stateManager.markDirty();
    updateStats();
    resetView();
}

function loadProject(projectId) {
    // Placeholder - loading happens via stateManager
    console.log('Legacy loadProject called, ignored favouring stateManager');
}

function newMolecule() {
    if (ChemCore.atoms.length > 0) {
        if (!confirm('Clear current molecule and start new?')) return;
    }
    ChemCore.clearMolecule();
    resetView();
    stateManager.markDirty();
    setStatus('New molecule started');
}

function resetView() {
    cameraOffset.x = canvas.width / 2;
    cameraOffset.y = canvas.height / 2;
    cameraZoom = 1;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
}

function onKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        stateManager.save();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        newMolecule();
    }
}

init();
