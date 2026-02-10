// ==========================================
// SIMVEX Biology - Main Application
// Lobby + Module Pages with Sketchfab Integration
// ==========================================

// Current module state
let currentModule = null;
let sketchfabApi = null;
let cultureControls = null;

// Body organ data - mapped by Sketchfab annotation name (English)
// This allows correct matching regardless of annotation index order
const bodyOrganelleData = {
    'brain': {
        name: 'Brain',
        description: 'The command center of the body, regulating all bodily functions.\n\n【Structure】Consists of the Cerebrum (thinking, sensation, movement), Cerebellum (balance, coordination), and Brainstem (life support). About 86 billion neurons and over 100 trillion synapses form a complex neural network.\n\n【Function】Responsible for sensory processing, motor control, memory and learning, emotional regulation, and hormone secretion control. The adult brain weighs about 1.4kg, roughly 2% of body weight, but consumes 20% of total energy.'
    },
    'cerebrum': {
        name: 'Cerebrum',
        description: 'The largest part of the brain, responsible for higher mental functions.\n\n【Structure】Divided into the left and right hemispheres, with surface folds (sulci and gyri) to increase surface area. Composed of four lobes: frontal, parietal, temporal, and occipital.\n\n【Function】The frontal lobe handles thinking and judgment, parietal handles sensory integration, temporal handles hearing and memory, and occipital handles vision. The left brain focuses on language and logic, while the right brain focuses on spatial recognition and creativity.'
    },
    'cerebellum': {
        name: 'Cerebellum',
        description: 'A key organ for motor control and maintaining balance.\n\n【Structure】Located at the back, below the cerebrum, with many surface folds. About 80% of all neurons in the brain are concentrated in the cerebellum.\n\n【Function】Responsible for posture maintenance, equilibrium control, fine motor coordination, and motor learning. It stores motor patterns like walking or writing for subconscious execution.'
    },
    'heart': {
        name: 'Heart',
        description: 'The center of the circulatory system, a muscular organ that pumps blood throughout the body.\n\n【Structure】Consists of four chambers (left/right atria and ventricles) and four valves. Composed of specialized cardiac muscle that beats via its own electrical signals.\n\n【Function】The right heart sends venous blood to the lungs for oxygen, while the left heart sends arterial blood to the entire body. Beats about 100,000 times a day, circulating about 7,500 liters of blood.'
    },
    'lungs': {
        name: 'Lungs',
        description: 'The core organ of the respiratory system, responsible for gas exchange.\n\n【Structure】Consists of the left lung (2 lobes) and right lung (3 lobes), containing about 300-600 million alveoli. Total surface area is about 70-100㎡, similar to a tennis court.\n\n【Function】Oxygen diffuses from alveoli to blood during inhalation, and carbon dioxide diffuses from blood to alveoli during exhalation. Adults breathe 12-20 times per minute, about 11,000 liters of air daily.'
    },
    'liver': {
        name: 'Liver',
        description: 'The largest internal organ, performing over 500 metabolic functions.\n\n【Structure】Weighs about 1.2-1.5kg and is composed of functional units called liver lobules. Receives nutrients from the digestive tract via the portal vein and oxygen via the hepatic artery.\n\n【Function】Responsible for bile production, glycogen storage, protein synthesis, detoxification, lipid metabolism, and storage of vitamins and iron. Highly regenerative, capable of recovering normal size even after 70% removal.'
    },
    'stomach': {
        name: 'Stomach',
        description: 'A reservoir for the digestive system and the site of primary chemical digestion.\n\n【Structure】A J-shaped muscular pouch with a capacity of about 1-1.5 liters. Folds (rugae) and gastric glands increase the surface area.\n\n【Function】Sterilizes food with gastric acid (HCl, pH 1-3) and breaks down proteins with pepsin. Peristalsis turns food into chyme before sending it to the small intestine. Food stays in the stomach for 2-6 hours.'
    },
    'kidneys': {
        name: 'Kidneys',
        description: 'Core organs of the urinary system, filtering blood to excrete waste.\n\n【Structure】Bean-shaped organs located on both sides, with each kidney containing about 1 million nephrons. Nephrons consist of a glomerulus and tubule.\n\n【Function】Filters 180 liters of blood daily to produce about 1.5 liters of urine. Regulates water and electrolyte balance, blood pressure (renin secretion), and red blood cell production (erythropoietin).'
    },
    'intestine': {
        name: 'Intestines',
        description: 'Core organs for digestion and absorption, consisting of the small and large intestines.\n\n【Structure】The small intestine is about 6-7m long (surface area ~250㎡ with villi), and the large intestine is about 1.5m. The small intestine is divided into the duodenum, jejunum, and ileum.\n\n【Function】Over 90% of nutrients are absorbed in the small intestine. The large intestine processes water absorption and vitamin synthesis by intestinal bacteria. Peristalsis moves the contents.'
    },
    'spine': {
        name: 'Spine',
        description: 'The central axis of the body, supporting the structure and protecting the spinal cord.\n\n【Structure】Consists of 33 vertebrae (7 cervical, 12 thoracic, 5 lumbar, 5 sacral, 4 coccygeal). Intervertebral discs between vertebrae absorb shock.\n\n【Function】Responsible for upright posture, supporting body weight, protecting the spinal cord, and providing range of motion. The S-curve structure distributes impact.'
    },
    'skeleton': {
        name: 'Skeleton',
        description: 'An organ system of 206 bones that form the framework of the body.\n\n【Structure】Divided into the axial skeleton (skull, spine, ribcage) and appendicular skeleton (limbs). Bones consist of periosteum, compact bone, and spongy bone.\n\n【Function】Responsible for support, protecting organs, movement (muscle attachment), hematopoiesis (red marrow), and mineral storage (calcium, phosphorus). Bones are remodeled every 7-10 years.'
    },
    'muscles': {
        name: 'Muscular System',
        description: 'The system responsible for body movement, consisting of about 600 skeletal muscles.\n\n【Structure】Three categories: skeletal (voluntary), cardiac, and smooth (involuntary). Skeletal muscles consist of bundles of muscle fibers, where actin and myosin proteins handle contraction.\n\n【Function】Maintains body temperature (85% of heat production), posture, and protects internal organs. Accompanies blood and lymph circulation, making up about 40% of body weight.'
    },
    'nervous system': {
        name: 'Nervous System',
        description: 'The system responsible for information transmission and regulation.\n\n【Structure】Consists of the central nervous system (brain, spinal cord) and peripheral nervous system (somatic and autonomic). Neurons consist of dendrites, a cell body, and an axon.\n\n【Function】Responsible for sensory reception, information integration, and motor response control. Transmits information at speeds up to 120 m/s via electro-chemical signals.'
    },
    'circulatory system': {
        name: 'Circulatory System',
        description: 'The system that circulates blood throughout the body.\n\n【Structure】Consists of the heart, blood vessels (arteries, veins, capillaries), and blood. Total vessel length is about 96,000km (2.5 times Earth\'s circumference).\n\n【Function】Transports oxygen/nutrients, removes CO2/waste, carries hormones, regulates temperature, and transports immune cells. Adults have about 5 liters of blood.'
    },
    'eye': {
        name: 'Eye',
        description: 'Sensory organ for vision, converting light into electrical signals.\n\n【Structure】Consists of the cornea, iris, lens, retina, and optic nerve. The retina has about 130 million photoreceptors (rods and cones).\n\n【Function】Light passes through the cornea and lens to form an image on the retina, where photoreceptors convert it into electrical signals for the brain. Processes 1 billion bits of information per second.'
    },
    'ear': {
        name: 'Ear',
        description: 'Organ for hearing and balance.\n\n【Structure】Consists of the outer ear (pinna, canal), middle ear (eardrum, ossicles), and inner ear (cochlea, vestibular system). The cochlea has 16,000 hair cells.\n\n【Function】Sound vibrations travel through the eardrum and ossicles to the cochlea to become electrical signals. The vestibular system senses head position and movement for balance.'
    },
    'skin': {
        name: 'Skin',
        description: 'The largest organ, covering ~2㎡ and weighing ~4kg.\n\n【Structure】Consists of epidermis (stratum corneum, basal layer), dermis (collagen, vessels), and subcutaneous tissue. Contains sensory receptors, sweat/oil glands, and follicles.\n\n【Function】Defense (pathogens, UV), temperature regulation (vessel constriction/dilation, sweating), sensation (touch, pain, temp), Vitamin D synthesis, and preventing water loss.'
    },
    'pancreas': {
        name: 'Pancreas',
        description: 'A mixed endocrine-exocrine gland that secretes digestive enzymes and hormones.\n\n【Structure】A 15cm organ located behind the stomach. Consists of an exocrine portion and endocrine islets of Langerhans.\n\n【Function】Exocrine function secretes pancreatic juice (amylase, lipase, trypsin) to digest carbs, fats, and proteins. Endocrine function secretes insulin and glucagon to regulate blood sugar.'
    },
    'bladder': {
        name: 'Bladder',
        description: 'A muscular pouch for storing urine.\n\n【Structure】Consists of a muscle layer (detrusor) and mucosa. Capacity is ~400-600mL, holding up to 800mL.\n\n【Function】Stores and excretes urine produced by the kidneys. One feels the urge to urinate around 200mL. Sphincters control the process.'
    },
    'thyroid': {
        name: 'Thyroid',
        description: 'A butterfly-shaped endocrine gland at the front of the neck.\n\n【Structure】Consists of two lobes connected by an isthmus. Weighs ~15-25g, composed of follicles (colloid storage) and parafollicular cells.\n\n【Function】Secretes thyroid hormones (T3, T4) to regulate metabolic rate, temperature, and growth. Secretes calcitonin to lower blood calcium levels.'
    },
    'spleen': {
        name: 'Spleen',
        description: 'A lymphatic organ acting as a blood reservoir.\n\n【Structure】Located on the upper left behind the stomach, size of a fist (~150g). Composed of white pulp (lymph tissue) and red pulp (blood spaces).\n\n【Function】Removes old RBCs, stores platelets (1/3 of total), handles immune responses (antibodies, macrophages), and provides emergency blood supply.'
    },
    'adrenal gland': {
        name: 'Adrenal Gland',
        description: 'Endocrine glands on top of the kidneys, secreting stress hormones.\n\n【Structure】Consists of a cortex and medulla. The cortex is divided into three layers (zona glomerulosa, fasciculata, reticularis).\n\n【Function】The medulla secretes adrenaline/noradrenaline (fight-or-flight), while the cortex secretes cortisol (stress), aldosterone (Na+ reabsorption), and sex hormones.'
    },
    'reproductive system': {
        name: 'Reproductive System',
        description: 'System responsible for reproduction and hormone secretion.\n\n【Structure】Male: testes, epididymis, vas deferens, prostate. Female: ovaries, fallopian tubes, uterus, vagina. Gonads are also endocrine organs.\n\n【Function】Produces gametes (sperm, eggs), secretes sex hormones (testosterone, estrogen), handles pregnancy and birth (female), and develops secondary sexual characteristics.'
    }
};

// Store annotation list for body module lookup
let bodyAnnotationList = [];

// Cell organelle data - mapped by Sketchfab annotation name (English)
// This allows correct matching regardless of annotation index order
const cellOrganelleData = {
    'cell membrane': {
        name: 'Cell Membrane',
        description: 'A thin film surrounding the cell, made of a phospholipid bilayer.\n\n【Structure】Phospholipid molecules form a bilayer with hydrophilic heads facing outward and hydrophobic tails inward. Membrane proteins and carbohydrates are embedded in this "Fluid Mosaic Model."\n\n【Function】Has selective permeability, allowing only necessary substances to pass. Membrane proteins act as transport channels, hormone receptors, and maintain the internal cell environment.'
    },
    'nucleus': {
        name: 'Nucleus',
        description: 'The largest and most important organelle in a cell, housing genetic material (DNA).\n\n【Structure】Surrounded by a double membrane (nuclear envelope), exchanging materials with the cytoplasm via nuclear pores. Contains chromatin (DNA + histone proteins) and the nucleolus, the site of ribosome synthesis.\n\n【Function】Directs protein synthesis by transcribing genetic information into mRNA. Acts as the "Control Center" for all cellular activities.'
    },
    'mitochondria': {
        name: 'Mitochondria',
        description: 'Known as the "Powerhouse of the Cell," the primary site for ATP production through cellular respiration.\n\n【Structure】A double-membrane structure with a smooth outer membrane and a folded inner membrane (cristae) to increase surface area. Contains its own DNA for cytoplasmic inheritance.\n\n【Function】Produces ATP by oxidizing glucose via the TCA cycle and electron transport chain. Abundant in cells with high energy demands, like muscle or nerve cells.'
    },
    'ribosome': {
        name: 'Ribosome',
        description: 'The organelle responsible for protein synthesis (translation), having a non-membrane structure.\n\n【Structure】Composed of rRNA and proteins, functioning through the binding of large and small subunits. Eukaryotic cells have 80S ribosomes, while prokaryotic cells have 70S.\n\n【Function】Connects amino acids via peptide bonds by reading mRNA codons and using tRNA. Found freely in the cytoplasm or attached to the Rough ER.'
    },
    'golgi apparatus': {
        name: 'Golgi Apparatus',
        description: 'The "Shipping Center of the Cell," responsible for processing, packaging, and sorting proteins and lipids.\n\n【Structure】A stack of flattened membrane sacs (cisternae). Receives material from the ER side (cis face) and processes it as it moves to the other side (trans face).\n\n【Function】Modifies proteins from the ER (e.g., glycosylation). Packages finished products into vesicles and sorts them for destinations like the cell membrane or lysosomes.'
    },
    'rough er': {
        name: 'Rough ER',
        description: 'Endoplasmic reticulum that appears rough due to attached ribosomes on its surface.\n\n【Structure】A membrane structure connected to the outer nuclear envelope, embedded with ribosomes.\n\n【Function】Synthesizes secretory proteins, membrane proteins, and lysosomal enzymes. Synthesized proteins undergo folding inside the ER before transport to the Golgi.'
    },
    'rough endoplasmic reticulum': {
        name: 'Rough ER',
        description: 'Endoplasmic reticulum that appears rough due to attached ribosomes on its surface.\n\n【Structure】A membrane structure connected to the outer nuclear envelope, embedded with ribosomes.\n\n【Function】Synthesizes secretory proteins, membrane proteins, and lysosomal enzymes. Synthesized proteins undergo folding inside the ER before transport to the Golgi.'
    },
    'smooth er': {
        name: 'Smooth ER',
        description: 'Endoplasmic reticulum with a smooth surface, lacking ribosomes.\n\n【Structure】A network of tubular membrane structures.\n\n【Function】Synthesizes phospholipids and steroid hormones. Handles detoxification in liver cells and calcium ion storage/release in muscle cells.'
    },
    'smooth endoplasmic reticulum': {
        name: 'Smooth ER',
        description: 'Endoplasmic reticulum with a smooth surface, lacking ribosomes.\n\n【Structure】A network of tubular membrane structures.\n\n【Function】Synthesizes phospholipids and steroid hormones. Handles detoxification in liver cells and calcium ion storage/release in muscle cells.'
    },
    'lysosome': {
        name: 'Lysosome',
        description: 'The "Janitor of the Cell," responsible for intracellular digestion.\n\n【Structure】Vesicles surrounded by a single membrane, with an acidic internal pH of ~5. Formed in the Golgi apparatus.\n\n【Function】Contains hydrolytic enzymes to break down old organelles, damaged cell structures, or invading pathogens. Involved in autophagy.'
    },
    'centrosome': {
        name: 'Centrosome',
        description: 'The center for spindle fiber formation during cell division.\n\n【Structure】Consists of two centrioles arranged at right angles, surrounded by pericentriolar material. Centrioles are made of microtubules in a 9+0 arrangement.\n\n【Function】Forms spindle fibers during cell division to pull chromosomes to opposite poles. Also acts as a basal body for cilia and flagella.'
    },
    'centriole': {
        name: 'Centriole',
        description: 'Cylindrical structures that compose the centrosome.\n\n【Structure】A 9+0 arrangement of nine microtubule triplets in a cylinder. Two are positioned at right angles.\n\n【Function】The center for spindle formation during division and the start point (basal body) for cilia and flagella.'
    },
    'cytoplasm': {
        name: 'Cytoplasm',
        description: 'The jelly-like substance filling the space between the cell membrane and the nucleus.\n\n【Structure】Organelles float in the cytosolic matrix. Composed of 70-80% water, with dissolved proteins, ions, and organic molecules.\n\n【Function】The site for glycolysis (glucose breakdown). Acts as a transport channel for substances between organelles and hosts various metabolic reactions.'
    }
};

// Store annotation list for lookup
let cellAnnotationList = [];

// ==========================================
// View Management
// ==========================================

function updateNavPills(activeId) {
    document.querySelectorAll('.nav-pill').forEach(pill => {
        pill.classList.remove('active');
        if (pill.id === 'pill-' + activeId) {
            pill.classList.add('active');
        }
    });
}

function showLobby() {
    // Hide all module views
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));

    // Show lobby
    const lobbyView = document.getElementById('lobby-view');
    if (lobbyView) lobbyView.style.display = 'flex';

    currentModule = null;
    updateNavPills('lobby');

    // Clean up if needed
    if (sketchfabApi) {
        sketchfabApi = null;
    }
}

function showModule(moduleName) {
    // Hide lobby
    const lobbyView = document.getElementById('lobby-view');
    if (lobbyView) lobbyView.style.display = 'none';

    // Hide all module views
    document.querySelectorAll('.module-view').forEach(v => v.classList.remove('active'));

    // Show selected module
    const moduleView = document.getElementById(moduleName + '-view');
    if (moduleView) {
        moduleView.classList.add('active');
    }

    currentModule = moduleName;
    updateNavPills(moduleName);

    // Initialize module
    switch (moduleName) {
        case 'body':
            initBodyModule();
            break;
        case 'cell':
            initCellModule();
            break;
        case 'culture':
            initCultureModule();
            break;
        case 'ecosystem':
            initEcosystemModule();
            break;
    }
}

// ==========================================
// Body Module (Sketchfab) - Annotation Based
// ==========================================

function initBodyModule() {
    const iframe = document.getElementById('sketchfab-frame');
    const uid = '2fbd4393056044e9ae4192832d862888'; // New Sem (EN) model

    // Set iframe src - annotations visible, all UI elements hidden, black background
    iframe.src = `https://sketchfab.com/models/${uid}/embed?autostart=1&preload=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_hint=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=1&transparent=0&dnt=1&ui_inspector=0&scrollwheel=1&autospin=0&camera=0&ui_general_controls=0&ui_loading=0&ui_start=0&ui_title=0&ui_author=0&ui_sound=0&ui_qr=0&ui_share=0&ui_buy=0&ui_animations=0&graph_optimizer=0&orbit_constraint_pan=0&internal=1&tracking=0&ui_fadeout=0&disable_video_texture_streaming=1`;

    // Initialize Sketchfab API
    const client = new Sketchfab(iframe);
    client.init(uid, {
        success: function (api) {
            sketchfabApi = api;
            api.start();

            api.addEventListener('viewerready', function () {
                console.log('Body Sketchfab viewer ready');

                // Set black background
                api.setBackground({ color: [0, 0, 0] }, function (err) {
                    if (!err) console.log('Background set to black');
                });

                // Get all annotations and store them
                api.getAnnotationList(function (err, annotations) {
                    if (err) {
                        console.error('Failed to get body annotations:', err);
                        return;
                    }

                    console.log('Body annotations found:', annotations.length);
                    bodyAnnotationList = annotations;

                    // Update each annotation with English text
                    annotations.forEach((ann, i) => {
                        console.log(`  [${i}] ${ann.name}`);

                        // Find English data for this annotation
                        const organData = findBodyOrganByName(ann.name);
                        if (organData) {
                            // Get short English description (first sentence only)
                            const shortDesc = organData.description.split('\n')[0];

                            // Update annotation with Korean title and short description
                            api.updateAnnotation(i, {
                                title: organData.name.replace(/^[^\s]+\s/, ''), // Remove emoji
                                content: shortDesc
                            }, function (updateErr) {
                                if (updateErr) {
                                    console.log('Could not update body annotation', i);
                                } else {
                                    console.log('Updated body annotation', i, 'to English');
                                }
                            });
                        }
                    });

                    // Build the right panel list
                    buildBodyOrganList(annotations);
                });

                // Listen for annotation clicks
                api.addEventListener('annotationSelect', function (index) {
                    console.log('annotationSelect event fired! Index:', index);
                    displayBodyOrganInfo(index);
                });

                api.addEventListener('annotationFocus', function (index) {
                    console.log('annotationFocus event fired! Index:', index);
                    displayBodyOrganInfo(index);
                });
            });
        },
        error: function (err) {
            console.error('Body Sketchfab API initialization failed:', err);
        }
    });
}

// Build the organ list in the right panel
function buildBodyOrganList(annotations) {
    const listEl = document.getElementById('organ-list');
    if (!listEl) {
        console.error('organ-list element not found!');
        return;
    }

    listEl.innerHTML = '<h4 style="margin-bottom:12px; color:var(--text-muted);">Human Organ List</h4>';

    annotations.forEach((ann, index) => {
        const organData = findBodyOrganByName(ann.name);
        const displayName = organData ? organData.name : ann.name;

        const item = document.createElement('div');
        item.style.cssText = 'padding:10px; margin-bottom:8px; background:var(--bg-elevated); border-radius:8px; cursor:pointer; transition:0.2s;';
        item.textContent = displayName;

        item.onclick = function () {
            console.log('Body list item clicked, index:', index);
            if (sketchfabApi) {
                sketchfabApi.gotoAnnotation(index);
            }
            displayBodyOrganInfo(index);
        };

        item.onmouseenter = function () { item.style.background = 'var(--accent-primary)'; };
        item.onmouseleave = function () { item.style.background = 'var(--bg-elevated)'; };

        listEl.appendChild(item);
    });

    console.log('Body organ list built with', annotations.length, 'items');
}

// Display organ information in the right panel
function displayBodyOrganInfo(index) {
    console.log('displayBodyOrganInfo called, index:', index);

    const infoBox = document.getElementById('organ-info');
    const nameEl = document.getElementById('organ-name');
    const descEl = document.getElementById('organ-description');
    const hintEl = document.getElementById('click-hint');

    if (!infoBox || !nameEl || !descEl || !hintEl) {
        console.error('Required body elements not found!', { infoBox, nameEl, descEl, hintEl });
        return;
    }

    // Get annotation from stored list
    const annotation = bodyAnnotationList[index];
    console.log('Body annotation at index', index, ':', annotation);

    let organData = null;
    if (annotation && annotation.name) {
        organData = findBodyOrganByName(annotation.name);
        console.log('Found organ:', organData ? organData.name : 'null');
    }

    if (organData) {
        nameEl.textContent = organData.name;
        descEl.innerHTML = organData.description.replace(/\\n/g, '<br>').replace(/\n/g, '<br>');
    } else if (annotation) {
        nameEl.textContent = annotation.name;
        descEl.innerHTML = 'Detailed information for this organ is being prepared.';
    } else {
        nameEl.textContent = `Organ #${index + 1}`;
        descEl.innerHTML = 'Information could not be loaded.';
    }

    // Show the info box, hide hint
    infoBox.classList.add('active');
    hintEl.style.display = 'none';

    console.log('Body info displayed successfully');
}

// Find body organ data by annotation name (case-insensitive)
function findBodyOrganByName(annotationName) {
    if (!annotationName) return null;

    const nameLower = annotationName.toLowerCase().trim();

    // Direct match
    if (bodyOrganelleData[nameLower]) {
        return bodyOrganelleData[nameLower];
    }

    // Partial match - check if annotation name contains any key
    for (const [key, data] of Object.entries(bodyOrganelleData)) {
        if (nameLower.includes(key) || key.includes(nameLower)) {
            return data;
        }
    }

    return null;
}

// ==========================================
// Cell Module (Sketchfab)
// ==========================================

let cellSketchfabApi = null;

function initCellModule() {
    const iframe = document.getElementById('cell-sketchfab-frame');
    const uid = '0d9f7f4257224975b2ef83a283709b2f';

    // Set iframe src - annotations visible
    iframe.src = `https://sketchfab.com/models/${uid}/embed?autostart=1&preload=1&ui_theme=dark&ui_infos=0&ui_controls=0&ui_hint=0&ui_stop=0&ui_watermark=0&ui_watermark_link=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=1&transparent=0&dnt=1&ui_inspector=0&scrollwheel=1&autospin=0&camera=0&ui_general_controls=0&ui_loading=0&ui_start=0&ui_title=0&ui_author=0&ui_sound=0&ui_qr=0&ui_share=0&ui_buy=0&ui_animations=0`;

    // Initialize Sketchfab API
    const client = new Sketchfab(iframe);
    client.init(uid, {
        success: function (api) {
            cellSketchfabApi = api;
            api.start();

            api.addEventListener('viewerready', function () {
                console.log('Cell Sketchfab viewer ready');

                // Set black background
                api.setBackground({ color: [0, 0, 0] }, function (err) {
                    if (!err) console.log('Cell background set to black');
                });

                // Get all annotations and store them
                api.getAnnotationList(function (err, annotations) {
                    if (err) {
                        console.error('Failed to get annotations:', err);
                        return;
                    }

                    console.log('Annotations found:', annotations.length);
                    cellAnnotationList = annotations;

                    // Update each annotation with English text
                    annotations.forEach((ann, i) => {
                        console.log(`  [${i}] ${ann.name}`);

                        // Find English data for this annotation
                        const organelle = findOrganelleByName(ann.name);
                        if (organelle) {
                            // Get short English description (first sentence only)
                            const shortDesc = organelle.description.split('\n')[0];

                            // Update annotation with Korean title and short description
                            api.updateAnnotation(i, {
                                title: organelle.name.replace(/^[^\s]+\s/, ''), // Remove emoji
                                content: shortDesc
                            }, function (updateErr) {
                                if (updateErr) {
                                    console.log('Could not update annotation', i);
                                } else {
                                    console.log('Updated annotation', i, 'to English');
                                }
                            });
                        }
                    });

                    // Build the right panel list
                    buildCellOrganelleList(annotations);
                });

                // Listen for annotation clicks
                api.addEventListener('annotationSelect', function (index) {
                    console.log('annotationSelect event fired! Index:', index);
                    displayOrganelleInfo(index);
                });

                api.addEventListener('annotationFocus', function (index) {
                    console.log('annotationFocus event fired! Index:', index);
                    displayOrganelleInfo(index);
                });
            });
        },
        error: function (err) {
            console.error('Cell Sketchfab API initialization failed:', err);
        }
    });
}

// Build the organelle list in the right panel
function buildCellOrganelleList(annotations) {
    const listEl = document.getElementById('cell-list');
    if (!listEl) {
        console.error('cell-list element not found!');
        return;
    }

    listEl.innerHTML = '<h4 style="margin-bottom:12px; color:var(--text-muted);">Cell Organelle List</h4>';

    annotations.forEach((ann, index) => {
        const organelle = findOrganelleByName(ann.name);
        const displayName = organelle ? organelle.name : ann.name;

        const item = document.createElement('div');
        item.style.cssText = 'padding:10px; margin-bottom:8px; background:var(--bg-elevated); border-radius:8px; cursor:pointer; transition:0.2s;';
        item.textContent = displayName;

        item.onclick = function () {
            console.log('List item clicked, index:', index);
            if (cellSketchfabApi) {
                cellSketchfabApi.gotoAnnotation(index);
            }
            displayOrganelleInfo(index);
        };

        item.onmouseenter = function () { item.style.background = 'var(--accent-primary)'; };
        item.onmouseleave = function () { item.style.background = 'var(--bg-elevated)'; };

        listEl.appendChild(item);
    });

    console.log('Cell organelle list built with', annotations.length, 'items');
}

// Display organelle information in the right panel
function displayOrganelleInfo(index) {
    console.log('displayOrganelleInfo called, index:', index);

    const infoBox = document.getElementById('cell-info');
    const nameEl = document.getElementById('cell-name');
    const descEl = document.getElementById('cell-description');
    const hintEl = document.getElementById('cell-hint');

    if (!infoBox || !nameEl || !descEl || !hintEl) {
        console.error('Required elements not found!', { infoBox, nameEl, descEl, hintEl });
        return;
    }

    // Get annotation from stored list
    const annotation = cellAnnotationList[index];
    console.log('Annotation at index', index, ':', annotation);

    let organelle = null;
    if (annotation && annotation.name) {
        organelle = findOrganelleByName(annotation.name);
        console.log('Found organelle:', organelle ? organelle.name : 'null');
    }

    if (organelle) {
        nameEl.textContent = organelle.name;
        descEl.innerHTML = organelle.description.replace(/\n/g, '<br>');
    } else if (annotation) {
        nameEl.textContent = annotation.name;
        descEl.innerHTML = 'Detailed information for this organelle is being prepared.';
    } else {
        nameEl.textContent = `Organelle #${index + 1}`;
        descEl.innerHTML = 'Information could not be loaded.';
    }

    // Show the info box, hide hint
    infoBox.classList.add('active');
    hintEl.style.display = 'none';

    console.log('Info displayed successfully');
}

// Find organelle data by annotation name (case-insensitive)
function findOrganelleByName(annotationName) {
    if (!annotationName) return null;

    const nameLower = annotationName.toLowerCase().trim();

    // Direct match
    if (cellOrganelleData[nameLower]) {
        return cellOrganelleData[nameLower];
    }

    // Partial match - check if annotation name contains any key
    for (const [key, data] of Object.entries(cellOrganelleData)) {
        if (nameLower.includes(key) || key.includes(nameLower)) {
            return data;
        }
    }

    return null;
}

// ==========================================
// ==========================================
// Culture Module - Cell Culture Simulation
// ==========================================

let cultureScene, cultureCamera, cultureRenderer;
let cultureCells = [];
let nutrientParticles = [];
let toxinZones = [];
let cultureData = {
    nutrients: 100,
    toxins: 0,
    speed: 1,
    temperature: 37,
    co2: 5,
    passageCount: 0,
    history: [],
    maxCells: 80,
    confluence: 0,
    isContaminated: false,
    startTime: 0
};

// Cell state configurations
const CELL_TYPES = {
    healthy: {
        color: 0x22c55e, // Green
        reproductionRate: 1.5,
        energyConsumption: 1,
        speed: 1.0,
        name: 'Healthy Cell'
    },
    stressed: {
        color: 0xfbbf24, // Yellow
        reproductionRate: 0.5,
        energyConsumption: 1.5,
        speed: 0.5,
        name: 'Stressed Cell'
    },
    dead: {
        color: 0x666666, // Gray
        reproductionRate: 0,
        energyConsumption: 0,
        speed: 0,
        name: 'Dead Cell'
    }
};

function initCultureModule() {
    const container = document.getElementById('culture-canvas-container');
    const canvas = document.getElementById('culture-canvas');

    // Scene
    cultureScene = new THREE.Scene();
    cultureScene.background = new THREE.Color(0x0a0f18);

    // Camera (top-down view)
    cultureCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    cultureCamera.position.set(0, 20, 0);
    cultureCamera.lookAt(0, 0, 0);

    // Renderer
    cultureRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    cultureRenderer.setSize(container.clientWidth, container.clientHeight);

    // Lights
    cultureScene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // Culture flask with grid
    createPetriDish();

    // Initial cells - Start with healthy cells
    cultureCells = [];
    for (let i = 0; i < 8; i++) spawnCultureCell('healthy');

    // Setup controls and mouse interaction
    setupCultureControls();
    setupCultureMouseInteraction(canvas);

    if (window.THREE && window.THREE.OrbitControls) {
        cultureControls = new THREE.OrbitControls(cultureCamera, cultureRenderer.domElement);
        cultureControls.enableDamping = true;
        cultureControls.dampingFactor = 0.05;
        cultureControls.enableRotate = false; // Keep it top-down
    }

    // Reset Data
    cultureData.startTime = Date.now();
    cultureData.history = [];
    cultureData.passageCount = 0;
    cultureData.isContaminated = false;
    cultureData.temperature = 37;
    cultureData.co2 = 5;

    // Animate
    animateCulture();
}

function createPetriDish() {
    // Main dish (culture flask bottom)
    const dishGeometry = new THREE.CylinderGeometry(10, 10, 0.3, 64);
    const dishMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.y = -0.3;
    cultureScene.add(dish);

    // Grid pattern
    const gridHelper = new THREE.GridHelper(18, 18, 0x333333, 0x222222);
    gridHelper.position.y = -0.1;
    cultureScene.add(gridHelper);

    // Dish rim
    const rimGeometry = new THREE.TorusGeometry(10, 0.2, 8, 64);
    const rimMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0;
    cultureScene.add(rim);
}

function spawnCultureCell(type = 'healthy', position = null) {
    const config = CELL_TYPES[type] || CELL_TYPES.healthy;

    // Size variation
    const size = 0.35 + Math.random() * 0.1;
    const geometry = new THREE.SphereGeometry(size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: config.color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(geometry, material);

    if (position) {
        mesh.position.copy(position);
        // Slight offset for reproduction
        mesh.position.x += (Math.random() - 0.5) * 1;
        mesh.position.z += (Math.random() - 0.5) * 1;
    } else {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 5; // Start in center
        mesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    // Keep within dish bounds
    const dist = Math.sqrt(mesh.position.x ** 2 + mesh.position.z ** 2);
    if (dist > 9) {
        const scale = 9 / dist;
        mesh.position.x *= scale;
        mesh.position.z *= scale;
    }

    const cell = {
        mesh: mesh,
        type: type,
        energy: 60 + Math.random() * 30,
        age: 0,
        state: type,
        baseColor: config.color,
        config: config
    };

    cultureScene.add(mesh);
    cultureCells.push(cell);
    return cell;
}

function setupCultureMouseInteraction(canvas) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Left click - add nutrients
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cultureCamera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);

        if (intersection.length() < 10) {
            addNutrientParticle(intersection);
        }
    });

    // Right click - add toxin
    canvas.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, cultureCamera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, intersection);

        if (intersection.length() < 10) {
            addToxinZone(intersection);
        }
    });
}

function addNutrientParticle(position) {
    // Create multiple small nutrient particles
    for (let i = 0; i < 8; i++) {
        const geometry = new THREE.SphereGeometry(0.15, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
        const particle = new THREE.Mesh(geometry, material);

        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 1.5;
        particle.position.z += (Math.random() - 0.5) * 1.5;
        particle.position.y = 0.1;

        cultureScene.add(particle);
        nutrientParticles.push({
            mesh: particle,
            life: 150,
            value: 15
        });
    }

    // Boost global nutrients slightly
    cultureData.nutrients = Math.min(100, cultureData.nutrients + 10);
    if (cultureData.nutrients > 100) cultureData.nutrients = 100;
}

function addToxinZone(position) {
    const geometry = new THREE.CylinderGeometry(2.0, 2.0, 0.1, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 });
    const zone = new THREE.Mesh(geometry, material);

    zone.position.copy(position);
    zone.position.y = 0;

    cultureScene.add(zone);
    toxinZones.push({
        mesh: zone,
        life: 200,
        radius: 2.0
    });

    // Increase global toxin level
    cultureData.toxins = Math.min(100, cultureData.toxins + 20);
}

function updateCellColor(cell) {
    const energyRatio = cell.energy / 100;
    let color;

    if (energyRatio > 0.6) {
        color = new THREE.Color(cell.baseColor);
        cell.state = 'healthy';
    } else if (energyRatio > 0.3) {
        // Blend to yellow
        const baseColor = new THREE.Color(cell.baseColor);
        const yellowColor = new THREE.Color(0xfbbf24);
        color = baseColor.lerp(yellowColor, 1 - (energyRatio - 0.3) / 0.3);
        cell.state = 'hungry';
    } else if (energyRatio > 0) {
        // Blend to gray (dying)
        const grayColor = new THREE.Color(0x666666);
        const baseColor = new THREE.Color(cell.baseColor);
        color = baseColor.lerp(grayColor, 1 - energyRatio / 0.3);
        cell.state = 'dying';
    } else {
        color = new THREE.Color(0x333333);
        cell.state = 'dead';
    }

    cell.mesh.material.color = color;
}

function setupCultureControls() {
    // Speed control
    document.getElementById('culture-speed').oninput = function () {
        cultureData.speed = parseFloat(this.value);
        document.getElementById('speed-val').textContent = this.value + 'x';
    };

    // Temperature control
    const tempSlider = document.getElementById('culture-temp');
    if (tempSlider) {
        tempSlider.oninput = function () {
            cultureData.temperature = parseFloat(this.value);
            document.getElementById('temp-val').textContent = this.value + '°C';
            updateConditionStatus();
        };
    }

    // CO2 control
    const co2Slider = document.getElementById('culture-co2');
    if (co2Slider) {
        co2Slider.oninput = function () {
            cultureData.co2 = parseFloat(this.value);
            document.getElementById('co2-val').textContent = this.value + '%';
            updateConditionStatus();
        };
    }
}

// Update environment condition status display
function updateConditionStatus() {
    const statusEl = document.getElementById('condition-status');
    if (!statusEl) return;

    const tempOptimal = Math.abs(cultureData.temperature - 37) <= 1;
    const co2Optimal = Math.abs(cultureData.co2 - 5) <= 1;

    if (tempOptimal && co2Optimal) {
        statusEl.textContent = 'Optimal Environment';
        statusEl.style.color = '#22c55e';
    } else if (tempOptimal || co2Optimal) {
        statusEl.textContent = 'Condition Warning';
        statusEl.style.color = '#fbbf24';
    } else {
        statusEl.textContent = 'Cell Stress Environment';
        statusEl.style.color = '#ef4444';
    }
}

// Calculate growth rate based on environment conditions
function getGrowthRateMultiplier() {
    const tempDiff = Math.abs(cultureData.temperature - 37);
    const co2Diff = Math.abs(cultureData.co2 - 5);

    // Optimal at 37°C and 5% CO2
    let multiplier = 1.0;

    // Temperature effect: reduce by 20% per degree off optimal
    multiplier *= Math.max(0.1, 1 - tempDiff * 0.15);

    // CO2 effect: reduce by 15% per % off optimal
    multiplier *= Math.max(0.1, 1 - co2Diff * 0.1);

    // Contamination severely reduces growth
    if (cultureData.isContaminated) {
        multiplier *= 0.2;
    }

    return multiplier;
}

// Passage (subculture) - split cells
function triggerPassage() {
    const healthyCells = cultureCells.filter(c => c.state === 'healthy' || c.type === 'healthy');
    if (healthyCells.length < 4) {
        showCultureMessage('Insufficient cells for subculturing');
        return;
    }

    // Remove 70% of cells (simulating cell splitting)
    const toRemove = Math.floor(cultureCells.length * 0.7);
    for (let i = 0; i < toRemove; i++) {
        const idx = Math.floor(Math.random() * cultureCells.length);
        const cell = cultureCells[idx];
        cultureScene.remove(cell.mesh);
        cultureCells.splice(idx, 1);
    }

    // Refresh nutrients, reduce toxins
    cultureData.nutrients = 100;
    cultureData.toxins = Math.max(0, cultureData.toxins - 50);
    cultureData.passageCount++;

    showCultureMessage('Subculture Complete!\\nCells split into new flask');
}

// Trigger contamination event
function triggerContamination() {
    if (cultureData.isContaminated) {
        showCultureMessage('Already contaminated!');
        return;
    }

    cultureData.isContaminated = true;
    cultureData.toxins = Math.min(100, cultureData.toxins + 40);

    // Add visual contamination (red particles)
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 8;
        const pos = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        addToxinZone(pos);
    }

    showCultureMessage('Contamination Detected!\\nMicrobial growth due to sterilization failure');
}

// Show culture message overlay
function showCultureMessage(msg) {
    const msgEl = document.getElementById('evolution-message');
    if (msgEl) {
        msgEl.innerHTML = msg.replace(/\\n/g, '<br>');
        msgEl.style.display = 'block';
        setTimeout(() => { msgEl.style.display = 'none'; }, 2500);
    }
}

function animateCulture() {
    if (currentModule !== 'culture') return;

    requestAnimationFrame(animateCulture);
    if (cultureControls) cultureControls.update();
    updateCultureSimulation();
    cultureRenderer.render(cultureScene, cultureCamera);
}

let lastCultureUpdate = 0;
function updateCultureSimulation() {
    const now = performance.now();
    if (now - lastCultureUpdate < 100 / cultureData.speed) return;
    lastCultureUpdate = now;

    const nutrientFactor = cultureData.nutrients / 100;
    const toxinFactor = cultureData.toxins / 100;
    const growthMultiplier = getGrowthRateMultiplier();

    // 1. Natural Resource Depletion & Toxin Accumulation
    const healthyCells = cultureCells.filter(c => c.state === 'healthy' || c.type === 'healthy');
    if (healthyCells.length > 0) {
        // Cells consume nutrients
        cultureData.nutrients -= (healthyCells.length * 0.05 * cultureData.speed);
        if (cultureData.nutrients < 0) cultureData.nutrients = 0;

        // Cells produce waste (toxins)
        cultureData.toxins += (healthyCells.length * 0.02 * cultureData.speed);
        if (cultureData.toxins > 100) cultureData.toxins = 100;
    }

    // 2. Update Particles & Zones
    nutrientParticles = nutrientParticles.filter(p => {
        p.life -= 1 * cultureData.speed;
        p.mesh.material.opacity = p.life / 150 * 0.8;
        if (p.life <= 0) {
            cultureScene.remove(p.mesh);
            return false;
        }
        return true;
    });

    toxinZones = toxinZones.filter(z => {
        z.life -= 1 * cultureData.speed;
        z.mesh.material.opacity = z.life / 200 * 0.3;
        if (z.life <= 0) {
            cultureScene.remove(z.mesh);
            return false;
        }
        return true;
    });

    // Process each cell
    const cellsToRemove = [];
    const cellsToAdd = [];

    cultureCells.forEach(cell => {
        if (cell.type === 'dead' || cell.state === 'dead') return; // Skip dead cells

        cell.age++;

        // Energy consumption based on environment
        const baseConsumption = 0.3 * (cell.config?.energyConsumption || 1);
        const toxinDamage = toxinFactor * 1.5;
        const environmentStress = (1 - growthMultiplier) * 0.5;

        // Check if in toxin zone
        toxinZones.forEach(zone => {
            const dist = cell.mesh.position.distanceTo(zone.mesh.position);
            if (dist < zone.radius) {
                cell.energy -= 3;
            }
        });

        // Energy gain from nutrients
        const nutrientGain = nutrientFactor * 0.4 * growthMultiplier;

        // Check if near nutrient particle (and consume it)
        nutrientParticles.forEach(p => {
            const dist = cell.mesh.position.distanceTo(p.mesh.position);
            if (dist < 1) {
                cell.energy += p.value * 0.5;
                p.life = 0; // Will be removed
            }
        });

        cell.energy += nutrientGain - baseConsumption - toxinDamage - environmentStress;
        cell.energy = Math.max(0, Math.min(100, cell.energy));

        // Update color and state based on energy
        updateCellColor(cell);

        // Movement - slight random movement
        let moveX = (Math.random() - 0.5) * 0.05 * (cell.config?.speed || 1);
        let moveZ = (Math.random() - 0.5) * 0.05 * (cell.config?.speed || 1);

        // Move towards nearest nutrient
        let nearestNutrient = null;
        let nearestDist = Infinity;
        nutrientParticles.forEach(p => {
            const dist = cell.mesh.position.distanceTo(p.mesh.position);
            if (dist < nearestDist && dist < 5) {
                nearestDist = dist;
                nearestNutrient = p;
            }
        });

        if (nearestNutrient) {
            const dir = new THREE.Vector3().subVectors(nearestNutrient.mesh.position, cell.mesh.position).normalize();
            moveX += dir.x * 0.03;
            moveZ += dir.z * 0.03;
        }

        // Move away from toxins
        toxinZones.forEach(zone => {
            const dist = cell.mesh.position.distanceTo(zone.mesh.position);
            if (dist < 3) {
                const dir = new THREE.Vector3().subVectors(cell.mesh.position, zone.mesh.position).normalize();
                moveX += dir.x * 0.05;
                moveZ += dir.z * 0.05;
            }
        });

        cell.mesh.position.x += moveX;
        cell.mesh.position.z += moveZ;

        // Keep in bounds
        const dist = Math.sqrt(cell.mesh.position.x ** 2 + cell.mesh.position.z ** 2);
        if (dist > 9) {
            const scale = 9 / dist;
            cell.mesh.position.x *= scale;
            cell.mesh.position.z *= scale;
        }

        // Death
        if (cell.energy <= 0) {
            cell.type = 'dead';
            cell.state = 'dead';
            cell.mesh.material.color.setHex(0x666666);
            cell.mesh.material.opacity = 0.5;
        }

        // Reproduction only for healthy cells with good conditions
        if (cell.energy > 75 && cell.state === 'healthy' && cultureCells.length < cultureData.maxCells) {
            const reproChance = 0.015 * (cell.config?.reproductionRate || 1) * nutrientFactor * growthMultiplier;
            if (Math.random() < reproChance) {
                cell.energy -= 35;
                cellsToAdd.push({ type: 'healthy', position: cell.mesh.position.clone() });
            }
        }
    });

    // Remove dead cells after a while
    cellsToRemove.forEach(cell => {
        cultureScene.remove(cell.mesh);
        cultureCells = cultureCells.filter(c => c !== cell);
    });

    // Add new cells
    cellsToAdd.forEach(data => {
        spawnCultureCell(data.type, data.position);
    });

    // Calculate confluence (density)
    cultureData.confluence = Math.min(100, (cultureCells.filter(c => c.type !== 'dead').length / cultureData.maxCells) * 100);

    updateCultureStats();

    // Update History for Graph
    if (Math.random() < 0.1) {
        const alive = cultureCells.filter(c => c.type !== 'dead').length;
        const dead = cultureCells.filter(c => c.type === 'dead').length;
        cultureData.history.push({
            healthy: alive,
            dead: dead,
            nutrients: cultureData.nutrients
        });
        if (cultureData.history.length > 300) cultureData.history.shift();
    }
    drawCultureGraph();
}

function updateCultureStats() {
    const total = cultureCells.length;
    const healthy = cultureCells.filter(c => c.type !== 'dead' && c.state !== 'dead').length;
    const dead = cultureCells.filter(c => c.type === 'dead' || c.state === 'dead').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-normal').textContent = healthy;
    document.getElementById('stat-generation').textContent = cultureData.passageCount;

    // Update dead count
    const deadEl = document.getElementById('stat-mutant');
    if (deadEl) deadEl.textContent = dead;

    // Update percentages
    const healthyPct = total > 0 ? Math.round((healthy / total) * 100) : 0;
    const deadPct = total > 0 ? Math.round((dead / total) * 100) : 0;

    const normalPctEl = document.getElementById('stat-normal-pct');
    const mutantPctEl = document.getElementById('stat-mutant-pct');
    if (normalPctEl) normalPctEl.textContent = healthyPct + '%';
    if (mutantPctEl) mutantPctEl.textContent = deadPct + '%';

    // Update confluence bar
    const confluenceBar = document.getElementById('evolution-bar-normal');
    if (confluenceBar) confluenceBar.style.width = cultureData.confluence + '%';

    // Update nutrients/toxins display
    const nutrientsVal = document.getElementById('nutrients-val');
    const toxinsVal = document.getElementById('toxins-val');
    const nutrientsBar = document.getElementById('nutrients-bar');
    const toxinsBar = document.getElementById('toxins-bar');

    if (nutrientsVal) nutrientsVal.textContent = Math.round(cultureData.nutrients) + '%';
    if (toxinsVal) toxinsVal.textContent = Math.round(cultureData.toxins) + '%';
    if (nutrientsBar) nutrientsBar.style.width = cultureData.nutrients + '%';
    if (toxinsBar) toxinsBar.style.width = cultureData.toxins + '%';

    // Update confluence status message
    const confluenceStatus = document.getElementById('evolution-status');
    if (confluenceStatus) {
        const conf = Math.round(cultureData.confluence);
        if (conf >= 90) {
            confluenceStatus.textContent = 'Overcrowded! Subculturing required';
            confluenceStatus.style.color = '#ef4444';
        } else if (conf >= 70) {
            confluenceStatus.textContent = 'Cells actively proliferating (' + conf + '%)';
            confluenceStatus.style.color = '#fbbf24';
        } else if (conf >= 30) {
            confluenceStatus.textContent = 'Normal growth (' + conf + '% Confluency)';
            confluenceStatus.style.color = '#22c55e';
        } else {
            confluenceStatus.textContent = 'Low cell density (' + conf + '%)';
            confluenceStatus.style.color = '#94a3b8';
        }
    }
}

function drawCultureGraph() {
    const canvas = document.getElementById('culture-chart');
    if (!canvas || cultureData.history.length < 2) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = 150;

    ctx.clearRect(0, 0, w, h);

    // Calculate max values for scaling
    const maxCells = Math.max(
        ...cultureData.history.map(d => (d.healthy || 0) + (d.dead || 0)),
        cultureData.maxCells,
        10
    );

    // Draw healthy cells line (green)
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    cultureData.history.forEach((pt, i) => {
        const x = (i / (cultureData.history.length - 1)) * w;
        const y = h - ((pt.healthy || 0) / maxCells) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dead cells line (red)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    cultureData.history.forEach((pt, i) => {
        const x = (i / (cultureData.history.length - 1)) * w;
        const y = h - ((pt.dead || 0) / maxCells) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw nutrients line (blue, scaled to 100)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    cultureData.history.forEach((pt, i) => {
        const x = (i / (cultureData.history.length - 1)) * w;
        const y = h - ((pt.nutrients || 0) / 100) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function addCellOfType(type) {
    if (cultureCells.length < cultureData.maxCells) {
        spawnCultureCell(type);
    }
}

function resetCulture() {
    // Remove all cells
    cultureCells.forEach(c => cultureScene.remove(c.mesh));
    cultureCells = [];

    // Remove particles and zones
    nutrientParticles.forEach(p => cultureScene.remove(p.mesh));
    nutrientParticles = [];
    toxinZones.forEach(z => cultureScene.remove(z.mesh));
    toxinZones = [];

    // Reset data
    cultureData = {
        nutrients: 100,
        toxins: 0,
        speed: 1,
        temperature: 37,
        co2: 5,
        passageCount: 0,
        history: [],
        maxCells: 80,
        confluence: 0,
        isContaminated: false,
        startTime: Date.now()
    };

    // Reset UI
    const speedSlider = document.getElementById('culture-speed');
    const tempSlider = document.getElementById('culture-temp');
    const co2Slider = document.getElementById('culture-co2');

    if (speedSlider) speedSlider.value = 1;
    if (tempSlider) tempSlider.value = 37;
    if (co2Slider) co2Slider.value = 5;

    const nutrientsVal = document.getElementById('nutrients-val');
    const toxinsVal = document.getElementById('toxins-val');
    const speedVal = document.getElementById('speed-val');
    const tempVal = document.getElementById('temp-val');
    const co2Val = document.getElementById('co2-val');

    if (nutrientsVal) nutrientsVal.textContent = '100%';
    if (toxinsVal) toxinsVal.textContent = '0%';
    if (speedVal) speedVal.textContent = '1x';
    if (tempVal) tempVal.textContent = '37°C';
    if (co2Val) co2Val.textContent = '5%';

    updateConditionStatus();

    // Spawn initial healthy cells
    for (let i = 0; i < 8; i++) spawnCultureCell('healthy');
}

// Event trigger functions for culture module
function triggerMediaRefresh() {
    cultureData.nutrients = 100;
    cultureData.toxins = Math.max(0, cultureData.toxins - 50);
    cultureData.isContaminated = false;

    // Show message
    showCultureMessage('Media Refresh Complete!\\nNutrients replenished and waste removed');
}

function addNewCell() {
    if (cultureCells.length < cultureData.maxCells) {
        spawnCultureCell('healthy');
    }
}

// ==========================================
// Ecosystem Module - Food Chain Simulation
// ==========================================

// ==========================================
// Ecosystem Configuration (User Settings)
// ==========================================
const ECO_CONFIG = {
    // 1. Map Size (World Area)
    MAP_SIZE: 45,

    // 2. Initial Population Counts
    INITIAL_POPULATION: {
        PLANT: 160,
        PRIMARY: 100,
        SECONDARY: 48,
        TERTIARY: 4
    },

    // 3. Movement Speed (Base Speed)
    SPEED: {
        PRIMARY: 0.15,
        SECONDARY: 0.2,
        TERTIARY: 0.25
    },

    // 4. Lifespan Factor (Aging Speed) - Lower = Longer Life
    LIFESPAN_DECAY: {
        PRIMARY: 0.15,
        SECONDARY: 0.15,
        TERTIARY: 0.15
    }
};

let ecoScene, ecoCamera, ecoRenderer, ecoControls, ecoAgents = [];
let ecoData = {
    weather: 'sunny',
    speed: 1,
    isRunning: false,
    history: [],
    initialCounts: {
        plant: ECO_CONFIG.INITIAL_POPULATION.PLANT,
        primary: ECO_CONFIG.INITIAL_POPULATION.PRIMARY,
        secondary: ECO_CONFIG.INITIAL_POPULATION.SECONDARY,
        tertiary: ECO_CONFIG.INITIAL_POPULATION.TERTIARY
    }
};

// Agent configurations (JavaLab Style)
const ECO_AGENT_TYPES = {
    plant: {
        color: 0x22c55e,
        size: 0.5,
        maxCount: 500,
        reproductionRate: 0.16,
        name: 'Plants'
    },
    primary: {
        color: 0x3b82f6,
        size: 0.5,
        maxCount: 250,
        prey: 'plant',
        staminaDecay: 0.5,
        healthDecay: ECO_CONFIG.LIFESPAN_DECAY.PRIMARY, // Aging
        reproduceAt: [80, 60, 50, 40, 20], // Reproduction milestones (Health %)
        name: 'Primary Consumer'
    },
    secondary: {
        color: 0xf97316,
        size: 0.6,
        maxCount: 120,
        prey: 'primary',
        staminaDecay: 0.6,
        healthDecay: ECO_CONFIG.LIFESPAN_DECAY.SECONDARY,
        reproduceAt: [60, 40],
        name: 'Secondary Consumer'
    },
    tertiary: {
        color: 0xef4444,
        size: 0.7,
        maxCount: 12,
        prey: 'secondary',
        staminaDecay: 0.7,
        healthDecay: ECO_CONFIG.LIFESPAN_DECAY.TERTIARY,
        reproduceAt: [60, 40],
        name: 'Tertiary Consumer'
    }
};

// Adjust initial count in setup screen
function adjustInitialCount(type, delta) {
    const config = ECO_AGENT_TYPES[type];
    const el = document.getElementById('init-' + type);
    let val = parseInt(el.textContent) + delta;

    // Clamp values
    if (type === 'plant') val = Math.max(10, Math.min(config.maxCount, val));
    else val = Math.max(0, Math.min(config.maxCount, val));

    el.textContent = val;
    ecoData.initialCounts[type] = val;
}

// Start simulation with configured counts
function startEcosystemSimulation() {
    // Hide setup overlay
    document.getElementById('eco-setup-overlay').style.display = 'none';

    // Spawn agents based on initial counts
    ecoAgents = [];
    for (let i = 0; i < ecoData.initialCounts.plant; i++) spawnEcoAgent('plant');
    for (let i = 0; i < ecoData.initialCounts.primary; i++) spawnEcoAgent('primary');
    for (let i = 0; i < ecoData.initialCounts.secondary; i++) spawnEcoAgent('secondary');
    for (let i = 0; i < ecoData.initialCounts.tertiary; i++) spawnEcoAgent('tertiary');

    ecoData.isRunning = true;
    ecoData.history = [];

    // Load memo from localStorage
    loadMemo('ecosystem');
}

function initEcosystemModule() {
    const container = document.getElementById('eco-canvas-container');
    const canvas = document.getElementById('eco-canvas');

    // Scene
    ecoScene = new THREE.Scene();
    ecoScene.background = new THREE.Color(0x1a2a1a);

    // Camera
    ecoCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    ecoCamera.position.set(0, 25, 25); // Zoomed in further
    ecoCamera.lookAt(0, 0, 0);

    // Renderer
    ecoRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    ecoRenderer.setSize(container.clientWidth, container.clientHeight);

    // Controls (OrbitControls)
    if (window.THREE && window.THREE.OrbitControls) {
        ecoControls = new THREE.OrbitControls(ecoCamera, ecoRenderer.domElement);
        ecoControls.enableDamping = true;
        ecoControls.dampingFactor = 0.05;
        ecoControls.maxPolarAngle = Math.PI / 2 - 0.1;
        ecoControls.minDistance = 10;
        ecoControls.maxDistance = 120;
    }

    // Lights
    ecoScene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    sunLight.position.set(20, 30, 20); // Higher light
    ecoScene.add(sunLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(ECO_CONFIG.MAP_SIZE, ECO_CONFIG.MAP_SIZE); // Configured Map Size
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x3d5c3d });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ecoScene.add(ground);

    // Show setup overlay
    document.getElementById('eco-setup-overlay').style.display = 'flex';
    ecoData.isRunning = false;
    ecoAgents = [];

    // Reset UI counts
    document.getElementById('init-plant').textContent = ecoData.initialCounts.plant;
    document.getElementById('init-primary').textContent = ecoData.initialCounts.primary;
    document.getElementById('init-secondary').textContent = ecoData.initialCounts.secondary;
    document.getElementById('init-tertiary').textContent = ecoData.initialCounts.tertiary;

    // Setup controls
    setupEcoControls();

    // Animate
    animateEcosystem();
}

function spawnEcoAgent(type, position = null) {
    const config = ECO_AGENT_TYPES[type];
    if (!config) return;

    // Check max count
    const currentCount = ecoAgents.filter(a => a.type === type).length;
    if (currentCount >= config.maxCount) return;

    let mesh;
    if (type === 'plant') {
        // Tree-like shape
        const geo = new THREE.ConeGeometry(0.5, 1.5, 8);
        const mat = new THREE.MeshLambertMaterial({ color: config.color });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.75;
    } else {
        // Animal shape (sphere for now)
        const geo = new THREE.SphereGeometry(config.size * 0.5, 12, 12);
        const mat = new THREE.MeshLambertMaterial({ color: config.color });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = config.size * 0.5;
    }

    if (position) {
        mesh.position.x = position.x + (Math.random() - 0.5) * 4;
        mesh.position.z = position.z + (Math.random() - 0.5) * 4;
    } else {
        const range = ECO_CONFIG.MAP_SIZE - 7;
        mesh.position.x = (Math.random() - 0.5) * range;
        mesh.position.z = (Math.random() - 0.5) * range;
    }

    ecoScene.add(mesh);

    // Agent Data (JavaLab Style)
    const agent = {
        mesh,
        type,
        // Stats
        health: 100,      // Life span
        stamina: 100,     // Hunger
        nextReproIdx: 0,  // Reproduction progress
    };

    ecoAgents.push(agent);
}

// Add agent during simulation
function addEcoAgent(type) {
    if (ecoData.isRunning) {
        spawnEcoAgent(type);
    }
}

function setupEcoControls() {
    const weatherEl = document.getElementById('eco-weather');
    if (weatherEl) {
        weatherEl.onchange = function () {
            ecoData.weather = this.value;
        };
    }

    const speedEl = document.getElementById('eco-speed');
    if (speedEl) {
        speedEl.oninput = function () {
            ecoData.speed = parseFloat(this.value);
            document.getElementById('eco-speed-val').textContent = this.value + 'x';
        };
    }
}

function animateEcosystem() {
    if (currentModule !== 'ecosystem') return;

    requestAnimationFrame(animateEcosystem);
    if (ecoControls) ecoControls.update();
    if (ecoData.isRunning) {
        updateEcosystemSimulation();
    }
    ecoRenderer.render(ecoScene, ecoCamera);
}

let lastEcoUpdate = 0;
function updateEcosystemSimulation() {
    const now = performance.now();
    if (now - lastEcoUpdate < 100 / ecoData.speed) return;
    lastEcoUpdate = now;

    // Weather affects plant growth (Doubled rate)
    let plantGrowRate = ecoData.weather === 'rain' ? 0.16 : ecoData.weather === 'drought' ? 0.02 : 0.10;

    const plants = ecoAgents.filter(a => a.type === 'plant');
    const primary = ecoAgents.filter(a => a.type === 'primary');
    const secondary = ecoAgents.filter(a => a.type === 'secondary');
    const tertiary = ecoAgents.filter(a => a.type === 'tertiary');

    // 1. Plant reproduction mechanism
    // Plants grow naturally based on weather and current population
    if (plants.length < 50 || (Math.random() < plantGrowRate && plants.length < ECO_AGENT_TYPES.plant.maxCount)) {
        if (plants.length > 10 && Math.random() > 0.2) {
            const parent = plants[Math.floor(Math.random() * plants.length)];
            spawnEcoAgent('plant', parent.mesh.position);
        } else {
            spawnEcoAgent('plant');
        }
    }

    // Process consumers (predator-prey dynamics)
    const processConsumer = (consumer, preyType, preyList) => {
        // [JavaLab Algorithm Implementation]
        const agent = consumer;
        const config = ECO_AGENT_TYPES[agent.type];

        // 1. Status Update
        agent.health -= config.healthDecay * ecoData.speed;
        agent.stamina -= config.staminaDecay * ecoData.speed;

        // 2. Death
        if (agent.health <= 0 || agent.stamina <= 0) {
            ecoScene.remove(agent.mesh);
            ecoAgents = ecoAgents.filter(a => a !== agent);
            return;
        }

        // 3. Behavior
        const isHungry = agent.stamina < 40;
        const sensingRange = isHungry ? 50 : 30;

        // Find prey
        let nearest = null, minDist = Infinity;
        preyList.forEach(prey => {
            const dist = agent.mesh.position.distanceTo(prey.mesh.position);
            if (dist < minDist) { minDist = dist; nearest = prey; }
        });

        if (nearest && minDist < sensingRange) {
            // Chase
            const dir = new THREE.Vector3().subVectors(nearest.mesh.position, agent.mesh.position).normalize();
            const speedMultiplier = isHungry ? 1.5 : 1.0;

            // Base speed logic
            let baseSpeed = ECO_CONFIG.SPEED.PRIMARY;
            if (agent.type === 'secondary') baseSpeed = ECO_CONFIG.SPEED.SECONDARY;
            if (agent.type === 'tertiary') baseSpeed = ECO_CONFIG.SPEED.TERTIARY;

            agent.mesh.position.add(dir.multiplyScalar(baseSpeed * speedMultiplier));
            agent.stamina -= 0.15;

            // Eat
            if (minDist < 1.5) {
                agent.stamina = Math.min(100, agent.stamina + 50);
                ecoScene.remove(nearest.mesh);
                ecoAgents = ecoAgents.filter(a => a !== nearest);
            }
        } else {
            // Wander
            agent.mesh.position.x += (Math.random() - 0.5) * 0.5;
            agent.mesh.position.z += (Math.random() - 0.5) * 0.5;
        }

        // Bounds
        const limit = ECO_CONFIG.MAP_SIZE / 2 - 2.5;
        if (Math.abs(agent.mesh.position.x) > limit) agent.mesh.position.x = Math.sign(agent.mesh.position.x) * limit;
        if (Math.abs(agent.mesh.position.z) > limit) agent.mesh.position.z = Math.sign(agent.mesh.position.z) * limit;

        // 4. Reproduction
        if (config.reproduceAt && agent.nextReproIdx < config.reproduceAt.length) {
            const nextPoint = config.reproduceAt[agent.nextReproIdx];
            if (agent.health <= nextPoint) {
                let canReproduce = (agent.type === 'primary') ? (agent.stamina >= 50) : true;
                if (canReproduce) spawnEcoAgent(agent.type, agent.mesh.position);
                agent.nextReproIdx++;
            }
        }

        return; // SKIP OLD LOGIC

        /* // Disabled Legacy Code
        // Higher energy consumption for higher tier
        const metabolism = consumer.type === 'tertiary' ? 0.8 : consumer.type === 'secondary' ? 0.6 : 0.4;
        consumer.energy -= metabolism;
        consumer.age++;

        // Find nearest prey
        let nearest = null, minDist = Infinity;
        preyList.forEach(prey => {
            const dist = consumer.mesh.position.distanceTo(prey.mesh.position);
            if (dist < minDist) { minDist = dist; nearest = prey; }
        });

        if (nearest && minDist < 35) { // Increased sensing range
            // Move towards prey
            const dir = new THREE.Vector3().subVectors(nearest.mesh.position, consumer.mesh.position).normalize();
            const speed = consumer.type === 'tertiary' ? 0.25 : consumer.type === 'secondary' ? 0.2 : 0.15;
            consumer.mesh.position.add(dir.multiplyScalar(speed));

            // Eat prey
            if (minDist < 1.5) {
                // Energy gain
                consumer.energy += preyType === 'plant' ? 40 : 70;
                // Cap energy
                consumer.energy = Math.min(consumer.energy, 200);

                ecoScene.remove(nearest.mesh);
                ecoAgents = ecoAgents.filter(a => a !== nearest);
            }
        } else {
            // Random movement when no prey nearby
            consumer.mesh.position.x += (Math.random() - 0.5) * 0.4;
            consumer.mesh.position.z += (Math.random() - 0.5) * 0.4;
        }

        // Keep in bounds (Extended map)
        if (Math.abs(consumer.mesh.position.x) > 38) consumer.mesh.position.x *= 0.95;
        if (Math.abs(consumer.mesh.position.z) > 38) consumer.mesh.position.z *= 0.95;

        // Death from starvation
        if (consumer.energy <= 0) {
            ecoScene.remove(consumer.mesh);
            ecoAgents = ecoAgents.filter(a => a !== consumer);
            return;
        }

        // Reproduction when well-fed
        const config = ECO_AGENT_TYPES[consumer.type];
        const currentCount = ecoAgents.filter(a => a.type === consumer.type).length;
        if (consumer.energy > 130 && currentCount < config.maxCount && Math.random() < config.reproductionRate) {
            consumer.energy -= 60; // Cost of reproduction
            spawnEcoAgent(consumer.type, consumer.mesh.position);
        }
        */
    };

    // Process each consumer type
    primary.forEach(p => processConsumer(p, 'plant', plants));
    secondary.forEach(s => processConsumer(s, 'primary', primary));
    tertiary.forEach(t => processConsumer(t, 'secondary', secondary));

    // Update UI
    updateEcoStats();

    // Record history
    if (Math.random() < 0.15) {
        ecoData.history.push({
            plant: plants.length,
            primary: primary.length,
            secondary: secondary.length,
            tertiary: tertiary.length
        });
        if (ecoData.history.length > 100) ecoData.history.shift();
    }
    drawEcoGraph();
}

function updateEcoStats() {
    const counts = {
        plant: ecoAgents.filter(a => a.type === 'plant').length,
        primary: ecoAgents.filter(a => a.type === 'primary').length,
        secondary: ecoAgents.filter(a => a.type === 'secondary').length,
        tertiary: ecoAgents.filter(a => a.type === 'tertiary').length
    };

    document.getElementById('plant-count').textContent = counts.plant;
    document.getElementById('primary-count').textContent = counts.primary;
    document.getElementById('secondary-count').textContent = counts.secondary;
    document.getElementById('tertiary-count').textContent = counts.tertiary;

    // Update ecosystem status
    const statusEl = document.getElementById('eco-status');
    if (statusEl) {
        const total = counts.plant + counts.primary + counts.secondary + counts.tertiary;
        if (total === 0) {
            statusEl.textContent = 'Ecosystem Collapse!';
            statusEl.style.color = '#ef4444';
        } else if (counts.plant < 5) {
            statusEl.textContent = 'Plant Shortage - Ecosystem at Risk';
            statusEl.style.color = '#f97316';
        } else if (counts.primary === 0 && (counts.secondary > 0 || counts.tertiary > 0)) {
            statusEl.textContent = 'Primary Consumers Extinct - Predators Starving';
            statusEl.style.color = '#f97316';
        } else if (counts.primary > 30 && counts.secondary < 3) {
            statusEl.textContent = 'Primary Consumer Excess - Predators Needed';
            statusEl.style.color = '#fbbf24';
        } else if (Math.abs(counts.primary - counts.plant * 0.4) < 10) {
            statusEl.textContent = 'Ecosystem in Balance';
            statusEl.style.color = '#22c55e';
        } else {
            statusEl.textContent = 'Ecosystem Adjusting...';
            statusEl.style.color = '#94a3b8';
        }
    }
}

function resetEcosystem() {
    // Clear all agents
    ecoAgents.forEach(a => ecoScene.remove(a.mesh));
    ecoAgents = [];
    ecoData.history = [];
    ecoData.isRunning = false;

    // Reset initial counts to defaults
    ecoData.initialCounts = { plant: 40, primary: 16, secondary: 8, tertiary: 4 };
    document.getElementById('init-plant').textContent = '40';
    document.getElementById('init-primary').textContent = '16';
    document.getElementById('init-secondary').textContent = '8';
    document.getElementById('init-tertiary').textContent = '4';

    // Show setup overlay
    document.getElementById('eco-setup-overlay').style.display = 'flex';
}

// ==========================================
// Graph Drawing
// ==========================================

function drawGraph(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = 150;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map(d => d.value), 10);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((pt, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - (pt.value / maxVal) * (h - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function drawEcoGraph() {
    const canvas = document.getElementById('eco-chart');
    if (!canvas || ecoData.history.length < 2) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = 150;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(
        ...ecoData.history.map(d => Math.max(d.plant, d.primary, d.secondary, d.tertiary)),
        10
    );

    const drawLine = (key, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ecoData.history.forEach((pt, i) => {
            const x = (i / (ecoData.history.length - 1)) * w;
            const y = h - ((pt[key] || 0) / maxVal) * (h - 10);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    };

    drawLine('plant', '#22c55e');
    drawLine('primary', '#3b82f6');
    drawLine('secondary', '#f97316');
    drawLine('tertiary', '#ef4444');
}

// ==========================================
// Utility Functions (PDF, Memo)
// ==========================================

function saveEcoGraphAsPDF() {
    const canvas = document.getElementById('eco-chart');
    if (!canvas) return;

    // Use jsPDF if available, otherwise fallback to image download
    if (window.jspdf) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('SIMVEX - Ecosystem Population Graph', 10, 10);

        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 10, 20, 190, 100);

        doc.setFontSize(10);
        doc.text('Timestamp: ' + new Date().toLocaleString(), 10, 130);

        const hist = ecoData.history[ecoData.history.length - 1] || {};
        const stats = `Current Stats: Plants: ${hist.plant || 0}, Primary: ${hist.primary || 0}, Secondary: ${hist.secondary || 0}, Tertiary: ${hist.tertiary || 0}`;
        doc.text(stats, 10, 140);

        doc.save('ecosystem_graph.pdf');
    } else {
        // Fallback: Save as Image
        const link = document.createElement('a');
        link.download = 'ecosystem_graph.png';
        link.href = canvas.toDataURL();
        link.click();
        alert('PDF library not loaded. Saved as image instead.');
    }
}


window.resetEcosystem = resetEcosystem;
window.saveEcoGraphAsPDF = saveEcoGraphAsPDF;

console.log('SIMVEX Biology Platform loaded');

// Bridge for index.html calls (switchPage -> showModule/showLobby)
window.switchPage = function (pageId) {
    console.log('Switching page to:', pageId);
    if (pageId === 'lobby') {
        if (typeof showLobby === 'function') showLobby();
    } else {
        if (typeof showModule === 'function') showModule(pageId);
    }
};
