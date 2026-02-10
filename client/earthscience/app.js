import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- Configuration & Constants ---
const TEXTURE_PATH = './planets/';
let TIME_STEP = 1.0;

// --- State Management ---
let scene, camera, renderer, controls;
let planets = [];
let minorBodies = []; // Array for asteroids and ice rocks
let shootingStars = []; // Array for meteors
let bgSphere;
let orbitsVisible = true;
let focusedObject = null;
let placementMode = false;
let previewMesh = null;
let pendingPlacementPos = null;
let structureMode = false;
let isPaused = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

// Smooth Zoom Variables
let isZooming = false;
let targetCameraPos = new THREE.Vector3();
let zoomTargetObject = null;

// --- Initialization ---
async function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 500, 2000);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', precision: 'highp', preserveDrawingBuffer: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.zoomSpeed = 5.0; // Very snappy zoom
    controls.rotateSpeed = 1.0;
    controls.enableDamping = true;
    controls.dampingFactor = 0.15;
    controls.minDistance = 20;

    // Enhanced Lighting for 3D Models
    const sunLight = new THREE.PointLight(0xffffff, 3.0, 0, 0);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // Better base lighting for GLB models
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    // Simple Background
    const loader = new THREE.TextureLoader();
    loader.load(TEXTURE_PATH + 'milkyway.jpg', (texture) => {
        const bgGeometry = new THREE.SphereGeometry(50000, 64, 64);
        const bgMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.3
        });
        bgSphere = new THREE.Mesh(bgGeometry, bgMaterial);
        scene.add(bgSphere);
    });

    await createSolarSystem();

    // Event Listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('mousemove', onMouseMove);

    // Prevent text selection and dragging
    document.addEventListener('selectstart', (e) => e.preventDefault());
    document.addEventListener('dragstart', (e) => e.preventDefault());
    renderer.domElement.addEventListener('selectstart', (e) => e.preventDefault());
    renderer.domElement.addEventListener('dragstart', (e) => e.preventDefault());

    // UI Controls
    document.getElementById('speed-slider').addEventListener('input', (e) => {
        TIME_STEP = parseFloat(e.target.value);
        document.getElementById('speed-value').innerText = TIME_STEP.toFixed(1) + 'x';
    });

    // Simplified Professional Loader
    const subtitleEl = document.querySelector('.loader-subtitle');
    if (subtitleEl) subtitleEl.innerText = "SYSTEM INITIALIZING...";

    setTimeout(() => {
        const loaderEl = document.getElementById('loader');
        if (loaderEl) {
            loaderEl.style.opacity = '0';
            setTimeout(() => loaderEl.style.display = 'none', 1000);
        }
    }, 2000);

    animate();
}

// --- Content Creation ---
function createPlanetMesh(data, loader) {
    const group = new THREE.Group();
    group.userData = { ...data, type: 'planet', collisionRadius: data.radius };

    const geom = new THREE.SphereGeometry(data.radius, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
        map: loader.load(TEXTURE_PATH + data.texture),
        roughness: 0.7,
        metalness: 0.2
    });
    const planet = new THREE.Mesh(geom, mat);
    planet.name = "Surface";
    group.add(planet);
    group.userData.surfaceMesh = planet;

    // Internal Structure (Detailed Visualization)
    const structureGroup = new THREE.Group();
    structureGroup.visible = false;

    // --- Scientifically Accurate Internal Structure System ---
    let layers = [];
    switch (data.name) {
        case "Mercury":
            layers = [
                { name: "Iron Core", radius: data.radius * 0.75, color: 0x999999, emissive: 0x222222, desc: "An unusually large metal core accounting for 75% of the planet's volume" },
                { name: "Silicate Mantle", radius: data.radius * 0.9, color: 0x664422, desc: "A rocky layer surrounding the iron core" },
                { name: "Crust", radius: data.radius * 0.98, map: data.texture, desc: "A surface covered in numerous impact craters" }
            ];
            break;
        case "Venus":
            layers = [
                { name: "Metal Core", radius: data.radius * 0.5, color: 0xffaa00, emissive: 0x442200, desc: "Iron and nickel core similar in size to Earth's" },
                { name: "Silicate Mantle", radius: data.radius * 0.9, color: 0x884422, desc: "Hot rocky layer supporting the weight of the planet" },
                { name: "Crust", radius: data.radius * 0.98, map: data.texture, desc: "High-temperature crust beneath thick sulfuric acid clouds" }
            ];
            break;
        case "Earth":
            layers = [
                { name: "Innermost Core", radius: data.radius * 0.15, color: 0xffffff, emissive: 0xffffff, desc: "Hot center estimated to be in a pure crystalline state" },
                { name: "Inner Core", radius: data.radius * 0.35, color: 0xffcc00, emissive: 0xff6600, desc: "Solid metal core hardened by enormous pressure" },
                { name: "Outer Core", radius: data.radius * 0.6, color: 0xff3300, emissive: 0xaa2200, desc: "Liquid metal core that generates the magnetic field" },
                { name: "Mantle", radius: data.radius * 0.9, color: 0x882200, emissive: 0x331100, desc: "Rocky fluid layer that causes plate tectonics" },
                { name: "Crust", radius: data.radius * 0.98, map: data.texture, desc: "Thin, hard surface where life resides" }
            ];
            break;
        case "Mars":
            layers = [
                { name: "Iron Core", radius: data.radius * 0.45, color: 0x441100, emissive: 0x220500, desc: "Core composed of iron, nickel, and sulfur" },
                { name: "Mantle", radius: data.radius * 0.92, color: 0x663300, desc: "Rocky layer that formed Olympus Mons and other features" },
                { name: "Crust", radius: data.radius * 0.98, map: data.texture, desc: "Crust that appears red due to iron oxide" }
            ];
            break;
        case "Jupiter":
            layers = [
                { name: "Rocky/Ice Core", radius: data.radius * 0.15, color: 0x555555, emissive: 0x111111, desc: "Rocky and icy core several times larger than Earth" },
                { name: "Metallic Hydrogen", radius: data.radius * 0.75, color: 0x3366ff, emissive: 0x112244, desc: "Hydrogen layer exhibiting metallic properties under extreme pressure" },
                { name: "Atmosphere", radius: data.radius * 0.98, map: data.texture, desc: "Massive gas layer composed of hydrogen and helium" }
            ];
            break;
        case "Saturn":
            layers = [
                { name: "Rocky/Ice Core", radius: data.radius * 0.2, color: 0x555555, emissive: 0x111111, desc: "Rocky and icy mass located at the center of Saturn" },
                { name: "Metallic Hydrogen", radius: data.radius * 0.6, color: 0x3366ff, emissive: 0x112244, desc: "Liquid hydrogen that generates the magnetic field" },
                { name: "Atmosphere", radius: data.radius * 0.98, map: data.texture, desc: "Massive gas layer with very low density" }
            ];
            break;
        case "Uranus":
        case "Neptune":
            layers = [
                { name: "Rocky Core", radius: data.radius * 0.2, color: 0x333333, emissive: 0x000000, desc: "Solid core composed of rock and iron" },
                { name: "Icy Mantle", radius: data.radius * 0.8, color: 0x00ccff, desc: "Hot liquid ice mixture of water, methane, and ammonia" },
                { name: "Atmosphere", radius: data.radius * 0.98, map: data.texture, desc: "Atmosphere appearing blue due to methane" }
            ];
            break;
    }

    layers.forEach((layer, index) => {
        const prevRadius = (index > 0) ? layers[index - 1].radius : 0;

        // 90-degree Slice (0 to 270 degrees)
        const layerGeom = new THREE.SphereGeometry(layer.radius, 64, 32, 0, Math.PI * 1.5);
        const layerMat = new THREE.MeshStandardMaterial({
            color: layer.color || 0x888888,
            emissive: layer.emissive || 0x000000,
            emissiveIntensity: layer.emissive ? 1.0 : 0,
            map: layer.map ? loader.load(TEXTURE_PATH + layer.map) : null,
            side: THREE.DoubleSide,
            transparent: layer.radius < data.radius, // Transparency for inner layers if needed
            polygonOffset: true,
            polygonOffsetFactor: -index * 2, // Pull inner layers forward in depth buffer
            polygonOffsetUnits: 1
        });
        const mesh = new THREE.Mesh(layerGeom, layerMat);
        mesh.userData = {
            isLayer: true,
            layerIndex: index,
            layerName: layer.name,
            layerDesc: layer.desc,
            layerColor: layer.color || 0x888888,
            layerEmissive: layer.emissive || 0x000000
        };
        structureGroup.add(mesh);

        // Face 1: At 0 degrees (XY plane)
        const capGeom = new THREE.RingGeometry(prevRadius, layer.radius, 64);
        const cap1 = new THREE.Mesh(capGeom, layerMat);
        cap1.rotation.set(0, 0, 0);
        structureGroup.add(cap1);

        // Face 2: At 270 degrees (YZ plane)
        const cap2 = new THREE.Mesh(capGeom, layerMat);
        cap2.rotation.set(0, -Math.PI / 2, 0);
        structureGroup.add(cap2);

        // --- Scientific Diagram Callouts ---
        if (data.name === "Earth") {
            // Precise vertical spacing: Crust at top, Core at bottom
            const lineY = (index - 2) * (data.radius * 0.45);
            const startX = layer.radius * 0.6; // Start slightly inside the cut
            const startZ = -layer.radius * 0.2; // Move start point towards the -Z face

            // RELOCATION: Move labels to the RIGHT side of the planet (from camera's POV at +X, +Z)
            // Camera is at (4r, 1.5r, 4r). To be on the right, we move towards -Z and +X.
            const labelPos = new THREE.Vector3(data.radius * 0.8, lineY, -data.radius * 2.5);
            const midPoint = new THREE.Vector3(data.radius * 1.2, lineY, -data.radius * 1.5);

            // 1. Sleek Diagram Line (Clean Path)
            const linePoints = [
                new THREE.Vector3(startX, lineY, startZ),
                midPoint,
                labelPos
            ];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
            const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({
                color: 0x3b82f6,
                transparent: true,
                opacity: 0.4,
                depthTest: false
            }));
            line.renderOrder = 50;
            line.name = `line-${index}`;
            structureGroup.add(line);

            // 2. High-Resolution Text Label
            const label = createDiagramLabel(layer.name);
            label.position.copy(labelPos).add(new THREE.Vector3(data.radius * 0.3, 0, 0));
            label.name = `label-${index}`;
            structureGroup.add(label);
        }
    });

    // --- 3D Floating Label (Single focused one) ---
    const activeLabel = create3DLabel("", "");
    activeLabel.visible = false;
    activeLabel.name = "activeLabel";
    structureGroup.add(activeLabel);

    group.add(structureGroup);
    group.userData.structureGroup = structureGroup;
    group.userData.layers = layers;

    return group;
}

// Utility to create a 3D Sprite Label
function create3DLabel(title, desc) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // Solid SIMVEX Theme Background
    ctx.fillStyle = 'rgba(10, 11, 16, 0.98)';
    ctx.roundRect(0, 0, 512, 128, 12);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6; // Thicker border for clarity
    ctx.stroke();

    // Title
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 38px Pretendard'; // Slightly larger
    ctx.fillText(title, 30, 55);

    // Description
    ctx.fillStyle = '#ffffff'; // Pure white for better contrast
    ctx.font = '24px Pretendard';
    ctx.fillText(desc, 30, 95);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false, // CRITICAL: Prevents planet clipping UI
        depthWrite: false,
        sizeAttenuation: true
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(32, 8, 1);
    sprite.renderOrder = 999; // Topmost

    // Helper to update the label content
    sprite.updateContent = (newTitle, newDesc) => {
        ctx.clearRect(0, 0, 512, 128);
        ctx.fillStyle = 'rgba(10, 11, 16, 0.95)';
        ctx.roundRect(0, 0, 512, 128, 12);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#3b82f6';
        ctx.fillText(newTitle, 30, 55);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(newDesc, 30, 95);
        texture.needsUpdate = true;
    };

    return sprite;
}

// Utility to create a clean scientific diagram label
function createDiagramLabel(text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 64;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Pretendard';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(18, 2.2, 1); // Slimmer, more technical look
    sprite.renderOrder = 100;
    return sprite;
}

async function createSolarSystem() {
    const loader = new THREE.TextureLoader();

    // Original Sun
    const sunGeom = new THREE.SphereGeometry(150, 64, 64);
    const sunMat = new THREE.MeshBasicMaterial({
        map: loader.load(TEXTURE_PATH + 'sun.jpg')
    });
    const sun = new THREE.Mesh(sunGeom, sunMat);
    sun.userData = { name: "Sun", radius: "696,340 km", mass: "333,000", collisionRadius: 150, type: 'sun' };
    scene.add(sun);
    planets.push({ mesh: sun, velocity: new THREE.Vector3(0, 0, 0), radius: 150, isStatic: true });

    const planetData = [
        { name: "Mercury", texture: "mercury.jpg", radius: 8, dist: 350, speed: 0.002, desc: "The closest planet to the Sun, with extreme temperature differences between day and night due to almost no atmosphere.", mass: "3.285 × 10^23 kg", realRadius: "2,440 km" },
        { name: "Venus", texture: "venus_surface.jpg", radius: 15, dist: 500, speed: 0.0016, desc: "The hottest planet in the solar system, with surface temperatures reaching 460 degrees due to a thick carbon dioxide atmosphere.", mass: "4.867 × 10^24 kg", realRadius: "6,052 km" },
        { name: "Earth", texture: "earth1.jpg", radius: 16, dist: 700, speed: 0.00132, desc: "Our precious planet with blue oceans and life.", mass: "5.972 × 10^24 kg", realRadius: "6,371 km" },
        { name: "Mars", texture: "mars.jpg", radius: 10, dist: 900, speed: 0.00104, desc: "Features a thin atmosphere and a red surface covered with iron oxide, with evidence of ancient flowing water.", mass: "6.39 × 10^23 kg", realRadius: "3,390 km" },
        { name: "Jupiter", texture: "jupiter.jpg", radius: 55, dist: 1300, speed: 0.00064, desc: "The largest planet in the solar system, a gas giant with a massive Great Red Spot and a powerful magnetic field.", mass: "1.898 × 10^27 kg", realRadius: "69,911 km" },
        { name: "Saturn", texture: "saturn.jpg", radius: 48, dist: 1700, speed: 0.0004, desc: "A planet with beautiful rings, so light it could float on water due to its low density.", ring: true, mass: "5.683 × 10^26 kg", realRadius: "58,232 km" },
        { name: "Uranus", texture: "uranuos.jpg", radius: 25, dist: 2100, speed: 0.00024, desc: "A mysterious planet with a tilted axis of rotation, appearing turquoise due to methane.", mass: "8.681 × 10^25 kg", realRadius: "25,362 km" },
        { name: "Neptune", texture: "neptune.jpg", radius: 24, dist: 2500, speed: 0.00012, desc: "The outermost planet of the solar system, an ice giant with super-strong storms exceeding 2,000 km/h.", mass: "1.024 × 10^26 kg", realRadius: "24,622 km" }
    ];

    planetData.forEach(data => {
        const mesh = createPlanetMesh(data, loader);
        const angle = Math.random() * Math.PI * 2;
        mesh.position.set(Math.cos(angle) * data.dist, 0, Math.sin(angle) * data.dist);

        const orbitLine = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, data.dist, data.dist).getPoints(128)),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
        );
        orbitLine.rotation.x = Math.PI / 2;
        scene.add(orbitLine);
        scene.add(mesh);

        planets.push({
            mesh, radius: data.radius, orbitLine, dist: data.dist,
            angle: angle, orbitSpeed: data.speed, isFixedOrbit: true,
            velocity: new THREE.Vector3(0, 0, 0)
        });

        if (data.ring) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.2, 64),
                new THREE.MeshBasicMaterial({ map: loader.load(TEXTURE_PATH + 'saturn_ring.png'), side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
            );
            ring.rotation.x = Math.PI / 2;
            mesh.add(ring);
        }

        // --- Earth Special: Moon & Satellites ---
        if (data.name === "Earth") {
            // 1. The Moon
            const moonGeo = new THREE.SphereGeometry(data.radius * 0.27, 32, 32);
            const moonMat = new THREE.MeshStandardMaterial({
                map: loader.load(TEXTURE_PATH + 'moon.jpg'),
                roughness: 0.9
            });
            const moon = new THREE.Mesh(moonGeo, moonMat);
            const moonOrbit = new THREE.Group();
            mesh.add(moonOrbit);
            moonOrbit.add(moon);
            moon.position.set(data.radius * 2.5, 0, 0);

            // 2. ISS Style Satellite
            const satGroup = new THREE.Group();
            const satBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 2), new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }));
            const panel = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), new THREE.MeshStandardMaterial({ color: 0x3b82f6, side: THREE.DoubleSide, emissive: 0x1d4ed8 }));
            panel.rotation.x = Math.PI / 2;
            satGroup.add(satBody, panel);
            const satOrbit = new THREE.Group();
            mesh.add(satOrbit);
            satOrbit.add(satGroup);
            satGroup.position.set(data.radius * 1.4, data.radius * 0.4, 0);

            // Store for animation
            const pObj = planets[planets.length - 1];
            pObj.moon = { orbit: moonOrbit, self: moon, speed: 0.02 };
            pObj.satellite = { orbit: satOrbit, speed: 0.08 };
        }
    });

    // --- Add Minor Bodies (Asteroids & Ice) ---
    createAsteroidBelt();
    createKuiperBelt();
    createShootingStarSystem();
}

function createShootingStarSystem() {
    const starCount = 8;
    const textureLoader = new THREE.TextureLoader();
    const spriteMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png');

    for (let i = 0; i < starCount; i++) {
        const group = new THREE.Group();

        // Head
        const head = new THREE.Sprite(new THREE.SpriteMaterial({
            map: spriteMap, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
        }));
        head.scale.set(20, 20, 1);

        // Long Trail
        const trailGeo = new THREE.CylinderGeometry(0.1, 4, 600, 8, 1, true);
        trailGeo.rotateX(Math.PI / 2);
        trailGeo.translate(0, 0, 300); // Offset so it trails behind
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0x3b82f6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);

        group.add(head, trail);
        scene.add(group);

        shootingStars.push({
            mesh: group, head, trail,
            active: false,
            timer: Math.random() * 800,
            speed: 0,
            direction: new THREE.Vector3()
        });
    }
}

function createAsteroidBelt() {
    const asteroidCount = 400;
    const innerRadius = 1000;
    const outerRadius = 1150;

    // Shared geometry for performance
    const geom = new THREE.IcosahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8b8b8b, roughness: 0.9 });

    for (let i = 0; i < asteroidCount; i++) {
        const asteroid = new THREE.Mesh(geom, mat);
        const dist = innerRadius + Math.random() * (outerRadius - innerRadius);
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.002 + Math.random() * 0.001);

        asteroid.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 30, Math.sin(angle) * dist);
        asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const s = 1.5 + Math.random() * 3.5;
        asteroid.scale.set(s, s * 0.8, s * 1.2); // Irregular shapes

        scene.add(asteroid);
        minorBodies.push({ mesh: asteroid, dist, angle, speed, rotationSpeed: Math.random() * 0.02 });
    }
}

function createKuiperBelt() {
    const iceCount = 300;
    const innerRadius = 2800;
    const outerRadius = 3500;

    const geom = new THREE.IcosahedronGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({
        color: 0xadd8e6,
        roughness: 0.3,
        metalness: 0.5,
        transparent: true,
        opacity: 0.8
    });

    for (let i = 0; i < iceCount; i++) {
        const ice = new THREE.Mesh(geom, mat);
        const dist = innerRadius + Math.random() * (outerRadius - innerRadius);
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.0001 + Math.random() * 0.0002);

        ice.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 100, Math.sin(angle) * dist);
        ice.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        const s = 2.0 + Math.random() * 5.0;
        ice.scale.set(s, s, s);

        scene.add(ice);
        minorBodies.push({ mesh: ice, dist, angle, speed, rotationSpeed: Math.random() * 0.01 });
    }
}


function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
        planets.forEach(p => {
            if (p.isStatic) return;

            // LATEST FIX: Stop planet movement/rotation in structure mode for stability
            if (structureMode && focusedObject && p.mesh === focusedObject) {
                // Do not update position or rotation while exploring internal structure
                return;
            }

            if (p.isFixedOrbit) {
                p.angle += p.orbitSpeed * TIME_STEP;
                p.mesh.position.x = Math.cos(p.angle) * p.dist;
                p.mesh.position.z = Math.sin(p.angle) * p.dist;
                p.mesh.rotation.y += 0.01 * TIME_STEP;

                // Update Moon & Satellite
                if (p.moon) {
                    p.moon.orbit.rotation.y += p.moon.speed * TIME_STEP;
                    p.moon.self.rotation.y += 0.01 * TIME_STEP;
                }
                if (p.satellite) {
                    p.satellite.orbit.rotation.y += p.satellite.speed * TIME_STEP;
                    p.satellite.orbit.rotation.z += 0.01 * TIME_STEP; // Polar orbit variation
                }
            }
        });

        // Rotate Minor Bodies
        minorBodies.forEach(b => {
            b.angle += b.speed * TIME_STEP;
            b.mesh.position.x = Math.cos(b.angle) * b.dist;
            b.mesh.position.z = Math.sin(b.angle) * b.dist;
            b.mesh.rotation.y += b.rotationSpeed * TIME_STEP;
            b.mesh.rotation.x += b.rotationSpeed * 0.5 * TIME_STEP;
        });

        // Update Shooting Stars (Cinematic Trails)
        shootingStars.forEach(s => {
            if (!s.active) {
                s.timer -= 1 * TIME_STEP;
                if (s.timer <= 0) {
                    s.active = true;
                    // Start far away
                    const dist = 6000;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = (Math.random() - 0.5) * Math.PI;
                    s.mesh.position.set(
                        dist * Math.cos(theta) * Math.cos(phi),
                        dist * Math.sin(phi),
                        dist * Math.sin(theta) * Math.cos(phi)
                    );
                    // Aim towards center-ish
                    s.direction.copy(s.mesh.position).multiplyScalar(-1).add(new THREE.Vector3((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000)).normalize();
                    s.speed = 60 + Math.random() * 100; // MUCH FASTER
                    s.head.material.opacity = 1.0;
                    s.trail.material.opacity = 0.6;
                    s.mesh.lookAt(s.mesh.position.clone().add(s.direction));
                }
            } else {
                s.mesh.position.addScaledVector(s.direction, s.speed * TIME_STEP);
                s.head.material.opacity -= 0.005 * TIME_STEP;
                s.trail.material.opacity -= 0.005 * TIME_STEP;

                if (s.head.material.opacity <= 0) {
                    s.active = false;
                    s.timer = 200 + Math.random() * 1500;
                }
            }
        });
    }

    if (isZooming) {
        camera.position.lerp(targetCameraPos, 0.09); // Smooth lerp (40% slower)
        if (zoomTargetObject) {
            const worldPos = new THREE.Vector3();
            zoomTargetObject.getWorldPosition(worldPos);
            controls.target.lerp(worldPos, 0.09);
        }
        if (camera.position.distanceTo(targetCameraPos) < 0.2) isZooming = false;
    }

    // Continuously track focused object and keep camera at proper distance
    if (zoomTargetObject && !structureMode) {
        const r = zoomTargetObject.userData.collisionRadius;
        const worldPos = new THREE.Vector3();
        zoomTargetObject.getWorldPosition(worldPos);

        // Always update desired camera position based on object's current location
        const offset = new THREE.Vector3(0, r * 3, r * 5);
        targetCameraPos.copy(worldPos).add(offset);

        // Slowly return camera to desired position to maintain distance
        // Zoom uses 0.09, normal follow uses smaller factor to be gentler
        const lerpFactor = isZooming ? 0.09 : 0.03;
        camera.position.lerp(targetCameraPos, lerpFactor);

        // Always update control target to follow the object
        controls.target.lerp(worldPos, 0.05);
    } else if (focusedObject && !isZooming && !structureMode) {
        const worldPos = new THREE.Vector3();
        focusedObject.getWorldPosition(worldPos);
        controls.target.lerp(worldPos, 0.05);
    }

    controls.update();
    renderer.render(scene, camera);
}

// Interactivity
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
function onDoubleClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent.type !== 'Scene') obj = obj.parent;
        if (obj.userData && obj.userData.name) {
            focusedObject = obj;
            zoomTargetObject = obj;
            const r = obj.userData.collisionRadius;
            targetCameraPos.copy(obj.position).add(new THREE.Vector3(0, r * 3, r * 5));
            isZooming = true;
            showPlanetInfo(obj.userData);
        }
    }
}
function onMouseClick() {
    if (placementMode && !pendingPlacementPos) {
        raycaster.setFromCamera(mouse, camera);
        const intersect = new THREE.Vector3();
        raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), intersect);
        pendingPlacementPos = intersect.clone();
        previewMesh.position.copy(pendingPlacementPos);
        document.getElementById('placement-panel').style.display = 'block';
    }
}
function showPlanetInfo(data) {
    document.getElementById('info-panel').style.display = 'block';
    document.getElementById('info-name').innerText = data.name;
    document.getElementById('info-desc').innerText = data.desc;
    document.getElementById('info-radius').innerText = data.realRadius || "N/A";
    document.getElementById('info-mass').innerText = data.mass || "N/A";
    document.getElementById('btn-structure').style.display = (data.type === 'planet') ? 'block' : 'none';
}
window.toggleStructure = function () {
    if (!focusedObject) return;
    structureMode = !structureMode;

    // UI Elements
    const btn = document.getElementById('btn-structure');
    const explorer = document.getElementById('structure-explorer');
    const structureGroup = focusedObject.userData.structureGroup;
    const surfaceMesh = focusedObject.userData.surfaceMesh;

    // Visibility
    if (structureGroup) structureGroup.visible = structureMode;
    if (surfaceMesh) surfaceMesh.visible = !structureMode;

    if (structureMode) {
        // --- PRO DIAGRAM POV ---
        const r = focusedObject.userData.collisionRadius;
        // Move camera to a perfect diagram angle: slightly offset to see the slice face-on
        const offset = new THREE.Vector3(r * 4.0, r * 1.5, r * 4.0);
        targetCameraPos.copy(focusedObject.position).add(offset);
        isZooming = true;
        zoomTargetObject = null; // Stop tracking during structure mode

        btn.innerText = "VIEW SURFACE";
        btn.classList.add('active');

        if (explorer) explorer.style.display = 'block';
        if (focusedObject.userData.layers) populateLayerList(focusedObject.userData.layers);
    } else {
        // --- Standard Planet View ---
        btn.innerText = "VIEW INTERNAL STRUCTURE";
        btn.classList.remove('active');
        if (explorer) explorer.style.display = 'none';
        resetLayerHighlight();

        // Return to normal planet view with re-enabled tracking
        const r = focusedObject.userData.collisionRadius;
        targetCameraPos.copy(focusedObject.position).add(new THREE.Vector3(0, r * 3, r * 5));
        zoomTargetObject = focusedObject; // Re-enable tracking
        isZooming = true;
    }
};

function populateLayerList(layers) {
    const list = document.getElementById('layer-list');
    if (!list) return;
    list.innerHTML = '';
    layers.forEach((layer, index) => {
        const item = document.createElement('div');
        item.className = 'simvex-btn';
        item.style.padding = '8px';
        item.style.fontSize = '12px';
        item.style.marginBottom = '2px';
        item.innerText = layer.name;
        item.onclick = () => selectLayer(index);
        list.appendChild(item);
    });
}

function selectLayer(index) {
    if (!focusedObject) return;
    const structureGroup = focusedObject.userData.structureGroup;
    const layerData = focusedObject.userData.layers[index];

    // Update Sidebar
    document.getElementById('layer-title').innerText = layerData.name;
    document.getElementById('layer-desc').innerText = layerData.desc;

    // Highlight selected layer in 3D
    structureGroup.children.forEach(child => {
        if (child.userData.isLayer) {
            if (child.userData.layerIndex === index) {
                child.material.emissive.set(0x3b82f6);
                child.material.emissiveIntensity = 2.5;
            } else {
                child.material.emissive.set(new THREE.Color(child.userData.layerEmissive));
                child.material.emissiveIntensity = child.userData.layerEmissive ? 1.0 : 0;
            }
        }

        // Highlight corresponding leader line
        if (child.name === `line-${index}`) {
            child.material.opacity = 0.9;
            child.material.color.set(0x3b82f6);
        } else if (child.name && child.name.startsWith('line-')) {
            child.material.opacity = 0.3;
            child.material.color.set(0xffffff);
        }
    });
}

function resetLayerHighlight() {
    if (!focusedObject) return;
    const structureGroup = focusedObject.userData.structureGroup;
    structureGroup.children.forEach(child => {
        if (child.userData.isLayer) {
            child.material.emissive.set(new THREE.Color(child.userData.layerEmissive));
            child.material.emissiveIntensity = child.userData.layerEmissive ? 1.0 : 0;
        }
    });
}
window.resetView = function () {
    focusedObject = null;
    zoomTargetObject = null;
    isZooming = false;
    document.getElementById('info-panel').style.display = 'none';
};

window.togglePause = () => { isPaused = !isPaused; };

init();
