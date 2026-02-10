/**
 * Chemistry Lessons Module
 * Molecular structures and chemical visualizations
 */

import * as THREE from 'three';

export const ChemistryLessons = {
  // Water Molecule (H2O)
  waterMolecule: {
    id: 'water-molecule',
    name: 'Water Molecule (H₂O)',
    subject: 'chemistry',
    topic: 'molecular',
    description: 'Learn about the structure and polarity of a water molecule.',
    concepts: ['Covalent Bond', 'Polarity', 'Bond Angle 104.5°'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'H2O';

      const bondAngle = 104.5 * Math.PI / 180;
      const bondLength = 1;

      // Oxygen (center)
      const oxygenGeo = new THREE.SphereGeometry(0.6, 32, 32);
      const oxygenMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.3,
        roughness: 0.4
      });
      const oxygen = new THREE.Mesh(oxygenGeo, oxygenMat);
      oxygen.name = 'Oxygen (O)';
      oxygen.userData.info = 'Oxygen Atom: High electronegativity results in a partial negative charge.';
      group.add(oxygen);

      // Hydrogen 1
      const hydrogen1Geo = new THREE.SphereGeometry(0.35, 32, 32);
      const hydrogen1Mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.3
      });
      const hydrogen1 = new THREE.Mesh(hydrogen1Geo, hydrogen1Mat);
      hydrogen1.position.set(
        bondLength * Math.sin(bondAngle / 2),
        bondLength * Math.cos(bondAngle / 2),
        0
      );
      hydrogen1.name = 'Hydrogen (H)';
      hydrogen1.userData.info = 'Hydrogen Atom: Carries a partial positive charge.';
      group.add(hydrogen1);

      // Hydrogen 2
      const hydrogen2 = hydrogen1.clone();
      hydrogen2.position.set(
        -bondLength * Math.sin(bondAngle / 2),
        bondLength * Math.cos(bondAngle / 2),
        0
      );
      group.add(hydrogen2);

      // Bonds
      const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

      [hydrogen1, hydrogen2].forEach(h => {
        const bondLength = oxygen.position.distanceTo(h.position);
        const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, bondLength, 8);
        const bond = new THREE.Mesh(bondGeo, bondMat);
        bond.position.copy(oxygen.position).add(h.position).multiplyScalar(0.5);
        bond.lookAt(h.position);
        bond.rotateX(Math.PI / 2);
        bond.name = 'Covalent Bond';
        group.add(bond);
      });

      group.position.y = 3;
      group.scale.setScalar(1.5);
      scene.add(group);

      return { objects: [group], mainObject: group };
    }
  },

  // Methane Molecule (CH4)
  methaneMolecule: {
    id: 'methane-molecule',
    name: 'Methane Molecule (CH₄)',
    subject: 'chemistry',
    topic: 'molecular',
    description: 'Learn about the tetrahedral structure of methane.',
    concepts: ['Tetrahedral', 'Bond Angle 109.5°', 'sp³ Hybridization'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'CH4';

      // Tetrahedral positions
      const tetrahedralAngle = 109.5 * Math.PI / 180;
      const bondLength = 1.2;

      // Carbon (center)
      const carbonGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const carbonMat = new THREE.MeshStandardMaterial({
        color: 0x374151,
        metalness: 0.3,
        roughness: 0.5
      });
      const carbon = new THREE.Mesh(carbonGeo, carbonMat);
      carbon.name = 'Carbon (C)';
      group.add(carbon);

      // Hydrogen positions (tetrahedral)
      const hydrogenPositions = [
        [0, 1, 0],
        [0.943, -0.333, 0],
        [-0.471, -0.333, 0.816],
        [-0.471, -0.333, -0.816]
      ];

      const hydrogenGeo = new THREE.SphereGeometry(0.35, 32, 32);
      const hydrogenMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.3
      });
      const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

      hydrogenPositions.forEach((pos, i) => {
        const hydrogen = new THREE.Mesh(hydrogenGeo, hydrogenMat);
        hydrogen.position.set(
          pos[0] * bondLength,
          pos[1] * bondLength,
          pos[2] * bondLength
        );
        hydrogen.name = `Hydrogen ${i + 1} (H)`;
        group.add(hydrogen);

        // Bond
        const bLen = carbon.position.distanceTo(hydrogen.position);
        const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, bLen, 8);
        const bond = new THREE.Mesh(bondGeo, bondMat);
        bond.position.copy(carbon.position).add(hydrogen.position).multiplyScalar(0.5);
        bond.lookAt(hydrogen.position);
        bond.rotateX(Math.PI / 2);
        group.add(bond);
      });

      group.position.y = 3;
      group.scale.setScalar(1.5);
      scene.add(group);

      group.userData.animate = (delta) => {
        group.rotation.y += delta * 0.3;
      };

      return { objects: [group], mainObject: group };
    }
  },

  // Benzene Ring (C6H6)
  benzeneMolecule: {
    id: 'benzene-molecule',
    name: 'Benzene Molecule (C₆H₆)',
    subject: 'chemistry',
    topic: 'molecular',
    description: 'Learn about the planar hexagonal ring structure of benzene.',
    concepts: ['Aromatic', 'Resonance Structure', 'π Bond'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'C6H6';

      const radius = 1.5;
      const carbonGeo = new THREE.SphereGeometry(0.35, 32, 32);
      const carbonMat = new THREE.MeshStandardMaterial({
        color: 0x374151,
        metalness: 0.3,
        roughness: 0.5
      });

      const hydrogenGeo = new THREE.SphereGeometry(0.25, 32, 32);
      const hydrogenMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.1,
        roughness: 0.3
      });

      const bondMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const doubleBondMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed });

      const carbons = [];

      // 6 carbon atoms in hexagonal arrangement
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;

        // Carbon
        const carbon = new THREE.Mesh(carbonGeo, carbonMat);
        carbon.position.set(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        );
        carbon.name = `Carbon ${i + 1}`;
        group.add(carbon);
        carbons.push(carbon);

        // Hydrogen
        const hydrogen = new THREE.Mesh(hydrogenGeo, hydrogenMat);
        hydrogen.position.set(
          Math.cos(angle) * (radius + 0.8),
          0,
          Math.sin(angle) * (radius + 0.8)
        );
        hydrogen.name = `Hydrogen ${i + 1}`;
        group.add(hydrogen);

        // C-H bond
        const chBondGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8);
        const chBond = new THREE.Mesh(chBondGeo, bondMat);
        chBond.position.copy(carbon.position).add(hydrogen.position).multiplyScalar(0.5);
        chBond.lookAt(hydrogen.position);
        chBond.rotateX(Math.PI / 2);
        group.add(chBond);
      }

      // C-C bonds (alternating single and double)
      for (let i = 0; i < 6; i++) {
        const c1 = carbons[i];
        const c2 = carbons[(i + 1) % 6];
        const dist = c1.position.distanceTo(c2.position);

        if (i % 2 === 0) {
          // Double bond
          const bondGeo = new THREE.CylinderGeometry(0.08, 0.08, dist - 0.4, 8);
          const bond1 = new THREE.Mesh(bondGeo, doubleBondMat);
          const bond2 = new THREE.Mesh(bondGeo, doubleBondMat);

          const mid = c1.position.clone().add(c2.position).multiplyScalar(0.5);
          bond1.position.copy(mid).add(new THREE.Vector3(0, 0.1, 0));
          bond2.position.copy(mid).add(new THREE.Vector3(0, -0.1, 0));

          [bond1, bond2].forEach(b => {
            b.lookAt(c2.position);
            b.rotateX(Math.PI / 2);
            group.add(b);
          });
        } else {
          // Single bond
          const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, dist - 0.4, 8);
          const bond = new THREE.Mesh(bondGeo, bondMat);
          bond.position.copy(c1.position).add(c2.position).multiplyScalar(0.5);
          bond.lookAt(c2.position);
          bond.rotateX(Math.PI / 2);
          group.add(bond);
        }
      }

      // Pi electron cloud (torus)
      const piCloudGeo = new THREE.TorusGeometry(radius, 0.15, 16, 32);
      const piCloudMat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
        transparent: true,
        opacity: 0.3
      });
      const piCloud = new THREE.Mesh(piCloudGeo, piCloudMat);
      piCloud.rotation.x = Math.PI / 2;
      piCloud.name = 'π Electron Cloud';
      group.add(piCloud);

      group.position.y = 3;
      group.rotation.x = -Math.PI / 6;
      scene.add(group);

      group.userData.animate = (delta) => {
        group.rotation.y += delta * 0.3;
      };

      return { objects: [group], mainObject: group };
    }
  },

  // Bohr Atomic Model
  bohrModel: {
    id: 'bohr-model',
    name: 'Bohr Atomic Model',
    subject: 'chemistry',
    topic: 'atomic',
    description: 'Learn about electron orbits using Bohr\'s atomic model.',
    concepts: ['Electron Shell', 'Energy Level', 'Quantization'],

    setup: (scene, physics, THREE) => {
      const group = new THREE.Group();
      group.name = 'BohrModel';

      // Nucleus
      const nucleusGeo = new THREE.SphereGeometry(0.5, 32, 32);
      const nucleusMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        metalness: 0.4,
        roughness: 0.3
      });
      const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
      nucleus.name = 'Nucleus';
      group.add(nucleus);

      // Electron shells
      const shellColors = [0x3b82f6, 0x22c55e, 0xf59e0b];
      const electronCounts = [2, 8, 8]; // Like Argon

      shellColors.forEach((color, shellIndex) => {
        const shellRadius = 1.5 + shellIndex * 1.2;

        // Orbit ring
        const orbitGeo = new THREE.TorusGeometry(shellRadius, 0.02, 8, 64);
        const orbitMat = new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.5
        });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        orbit.name = `Electron Shell ${shellIndex + 1}`;
        group.add(orbit);

        // Electrons
        const electronGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const electronMat = new THREE.MeshStandardMaterial({
          color: color,
          emissive: color,
          emissiveIntensity: 0.3
        });

        for (let i = 0; i < electronCounts[shellIndex]; i++) {
          const angle = (i / electronCounts[shellIndex]) * Math.PI * 2;
          const electron = new THREE.Mesh(electronGeo, electronMat);
          electron.position.set(
            Math.cos(angle) * shellRadius,
            0,
            Math.sin(angle) * shellRadius
          );
          electron.name = 'Electron';
          electron.userData.shell = shellIndex + 1;
          electron.userData.angle = angle;
          electron.userData.radius = shellRadius;
          group.add(electron);
        }
      });

      group.position.y = 3;
      scene.add(group);

      // Animate electrons
      group.userData.animate = (delta) => {
        group.children.forEach(child => {
          if (child.name === 'Electron') {
            const speed = 1 / child.userData.shell; // Outer shells move slower
            child.userData.angle += delta * speed * 2;
            child.position.set(
              Math.cos(child.userData.angle) * child.userData.radius,
              0,
              Math.sin(child.userData.angle) * child.userData.radius
            );
          }
        });
      };

      return { objects: [group], mainObject: group };
    }
  }
};

// Get all chemistry lessons
export function getAllChemistryLessons() {
  return Object.values(ChemistryLessons);
}

// Get lesson by ID
export function getChemistryLessonById(id) {
  return Object.values(ChemistryLessons).find(lesson => lesson.id === id);
}
