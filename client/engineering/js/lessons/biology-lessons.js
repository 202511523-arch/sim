/**
 * Biology Lessons Module
 * 3D models and visualizations for biology education
 */

import * as THREE from 'three';

export const BiologyLessons = {
  // Animal Cell Structure
  animalCell: {
    id: 'animal-cell',
    name: 'Animal Cell Structure',
    subject: 'biology',
    topic: 'cell',
    description: 'Learn about the structure of an animal cell and the function of each organelle.',
    concepts: ['Cell Membrane', 'Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'AnimalCell';

      // Cell membrane (outer sphere)
      const membraneGeo = new THREE.SphereGeometry(3, 64, 64);
      const membraneMat = new THREE.MeshStandardMaterial({
        color: 0xfcd34d,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const membrane = new THREE.Mesh(membraneGeo, membraneMat);
      membrane.name = 'Cell Membrane';
      membrane.userData.info = 'A thin membrane surrounding the cell that regulates the entry and exit of substances.';
      group.add(membrane);

      // Nucleus (center sphere)
      const nucleusGeo = new THREE.SphereGeometry(1, 32, 32);
      const nucleusMat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        metalness: 0.2,
        roughness: 0.6
      });
      const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
      nucleus.name = 'Nucleus';
      nucleus.userData.info = 'Contains genetic information (DNA) and regulates the cell\'s activities.';
      group.add(nucleus);

      // Nucleolus
      const nucleolusGeo = new THREE.SphereGeometry(0.3, 16, 16);
      const nucleolusMat = new THREE.MeshStandardMaterial({
        color: 0x4c1d95
      });
      const nucleolus = new THREE.Mesh(nucleolusGeo, nucleolusMat);
      nucleolus.position.set(0.3, 0.2, 0.4);
      nucleolus.name = 'Nucleolus';
      nucleolus.userData.info = 'The site where ribosomal RNA is synthesized.';
      group.add(nucleolus);

      // Mitochondria (multiple)
      for (let i = 0; i < 5; i++) {
        const mitoGeo = new THREE.CapsuleGeometry(0.2, 0.5, 8, 16);
        const mitoMat = new THREE.MeshStandardMaterial({
          color: 0xef4444
        });
        const mito = new THREE.Mesh(mitoGeo, mitoMat);
        const angle = (i / 5) * Math.PI * 2;
        mito.position.set(
          Math.cos(angle) * 2,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * 2
        );
        mito.rotation.set(Math.random(), Math.random(), Math.random());
        mito.name = 'Mitochondria';
        mito.userData.info = 'The powerhouses of the cell that generate ATP (energy) through cellular respiration.';
        group.add(mito);
      }

      // Endoplasmic Reticulum (rough)
      const erGroup = new THREE.Group();
      erGroup.name = 'Endoplasmic Reticulum';
      for (let i = 0; i < 8; i++) {
        const erGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 16);
        const erMat = new THREE.MeshStandardMaterial({
          color: 0x3b82f6
        });
        const er = new THREE.Mesh(erGeo, erMat);
        er.position.set(
          1.5 + Math.random() * 0.5,
          -1 + i * 0.25,
          0.5
        );
        er.rotation.y = Math.PI / 2;
        er.userData.info = 'Involved in protein synthesis and transport.';
        erGroup.add(er);
      }
      group.add(erGroup);

      // Golgi apparatus
      const golgiGroup = new THREE.Group();
      golgiGroup.name = 'Golgi Apparatus';
      for (let i = 0; i < 4; i++) {
        const golgiGeo = new THREE.TorusGeometry(0.5 - i * 0.08, 0.06, 8, 32, Math.PI);
        const golgiMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e
        });
        const golgi = new THREE.Mesh(golgiGeo, golgiMat);
        golgi.position.set(-1.5, i * 0.15 - 0.3, 1);
        golgi.userData.info = 'Processes and secretes proteins.';
        golgiGroup.add(golgi);
      }
      group.add(golgiGroup);

      // Ribosomes (small dots)
      for (let i = 0; i < 20; i++) {
        const riboGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const riboMat = new THREE.MeshStandardMaterial({
          color: 0xf97316
        });
        const ribo = new THREE.Mesh(riboGeo, riboMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 1.5 + Math.random() * 1;
        ribo.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        ribo.name = 'Ribosome';
        ribo.userData.info = 'Synthesizes proteins by reading mRNA.';
        group.add(ribo);
      }

      group.position.y = 3;
      scene.add(group);

      return { objects: [group], mainObject: group };
    },

    getOrganelles: () => [
      { name: 'Cell Membrane', color: '#fcd34d' },
      { name: 'Nucleus', color: '#7c3aed' },
      { name: 'Mitochondria', color: '#ef4444' },
      { name: 'Endoplasmic Reticulum', color: '#3b82f6' },
      { name: 'Golgi Apparatus', color: '#22c55e' },
      { name: 'Ribosome', color: '#f97316' }
    ]
  },

  // DNA Structure
  dnaStructure: {
    id: 'dna-structure',
    name: 'DNA Structure',
    subject: 'biology',
    topic: 'genetics',
    description: 'Learn about the DNA double helix structure and base pairs.',
    concepts: ['Double Helix', 'Base Pair', 'A-T', 'G-C', 'Nucleotide'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'DNA';

      const basePairColors = {
        AT: [0xef4444, 0x22c55e], // Adenine-Thymine
        GC: [0x3b82f6, 0xf59e0b]  // Guanine-Cytosine
      };

      const turns = 3;
      const pointsPerTurn = 20;
      const totalPoints = turns * pointsPerTurn;
      const radius = 1;
      const height = 8;

      for (let i = 0; i < totalPoints; i++) {
        const t = i / totalPoints;
        const angle = t * Math.PI * 2 * turns;
        const y = t * height - height / 2;

        // Strand 1 backbone
        const backbone1Geo = new THREE.SphereGeometry(0.1, 8, 8);
        const backbone1Mat = new THREE.MeshStandardMaterial({ color: 0x64748b });
        const backbone1 = new THREE.Mesh(backbone1Geo, backbone1Mat);
        backbone1.position.set(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        );
        group.add(backbone1);

        // Strand 2 backbone (opposite)
        const backbone2 = backbone1.clone();
        backbone2.position.set(
          Math.cos(angle + Math.PI) * radius,
          y,
          Math.sin(angle + Math.PI) * radius
        );
        group.add(backbone2);

        // Base pairs (every other point)
        if (i % 2 === 0) {
          const pairType = Math.random() > 0.5 ? 'AT' : 'GC';
          const colors = basePairColors[pairType];

          // Base 1
          const base1Geo = new THREE.CylinderGeometry(0.08, 0.08, radius * 0.8, 8);
          const base1Mat = new THREE.MeshStandardMaterial({ color: colors[0] });
          const base1 = new THREE.Mesh(base1Geo, base1Mat);
          base1.position.set(
            Math.cos(angle) * radius * 0.6,
            y,
            Math.sin(angle) * radius * 0.6
          );
          base1.rotation.z = Math.PI / 2;
          base1.rotation.y = angle;
          base1.name = pairType[0];
          group.add(base1);

          // Base 2
          const base2Geo = new THREE.CylinderGeometry(0.08, 0.08, radius * 0.8, 8);
          const base2Mat = new THREE.MeshStandardMaterial({ color: colors[1] });
          const base2 = new THREE.Mesh(base2Geo, base2Mat);
          base2.position.set(
            Math.cos(angle + Math.PI) * radius * 0.6,
            y,
            Math.sin(angle + Math.PI) * radius * 0.6
          );
          base2.rotation.z = Math.PI / 2;
          base2.rotation.y = angle + Math.PI;
          base2.name = pairType[1];
          group.add(base2);
        }
      }

      group.position.y = 4;
      scene.add(group);

      // Animation data
      group.userData.animate = (delta) => {
        group.rotation.y += delta * 0.5;
      };

      return { objects: [group], mainObject: group };
    },

    getBasePairs: () => [
      { pair: 'A-T', colors: ['#ef4444', '#22c55e'], description: 'Adenine-Thymine (2 hydrogen bonds)' },
      { pair: 'G-C', colors: ['#3b82f6', '#f59e0b'], description: 'Guanine-Cytosine (3 hydrogen bonds)' }
    ]
  }
};

// Get all biology lessons
export function getAllBiologyLessons() {
  return Object.values(BiologyLessons);
}

// Get lesson by ID
export function getBiologyLessonById(id) {
  return Object.values(BiologyLessons).find(lesson => lesson.id === id);
}
