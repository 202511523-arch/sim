"""
Molecular Editor Module
ChemDraw-alternative Molecular Structure Editor

Features:
- SMILES Input/Output
- 2D structure visualization
- IUPAC Name generation
- Molecular weight calculation
- Structure validation
"""

import streamlit as st
try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, Draw, AllChem
    from rdkit.Chem.Draw import IPythonConsole
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False
    st.warning("⚠️ RDKit is not installed. Please run `pip install rdkit`.")

from PIL import Image
import io

def show():
    st.title("⚗️ Molecular Editor")
    st.markdown("### ChemDraw Style Molecular Editor")
    
    if not RDKIT_AVAILABLE:
        st.error("RDKit library is required")
        st.code("pip install rdkit", language="bash")
        return
    
    # Tab configuration
    tab1, tab1_2, tab2 = st.tabs(["SMILES Input", "Structure Info", "Similar Molecule Search"])
    
    # SMILES Input Tab
    with tab1:
        st.markdown("#### 📝 Enter Molecular Structure")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            smiles_input = st.text_input(
                "Enter SMILES Code",
                placeholder="Ex: CCO (Ethanol), c1ccccc1 (Benzene), CC(=O)O (Acetic Acid)",
                help="SMILES: Simplified Molecular Input Line Entry System"
            )
        
        with col2:
            # Common molecule examples
            example_mol = st.selectbox(
                "Example Molecules",
                {
                    "Select": "",
                    "Water (H₂O)": "O",
                    "Methanol": "CO",
                    "Ethanol": "CCO",
                    "Benzene": "c1ccccc1",
                    "Toluene": "Cc1ccccc1",
                    "Acetic Acid": "CC(=O)O",
                    "Aspirin": "CC(=O)Oc1ccccc1C(=O)O",
                    "Caffeine": "CN1C=NC2=C1C(=O)N(C(=O)N2C)C"
                }
            )
            
            if example_mol:
                smiles_input = example_mol
        
        if smiles_input:
            try:
                # Convert SMILES to molecule object
                mol = Chem.MolFromSmiles(smiles_input)
                
                if mol is None:
                    st.error("❌ Invalid SMILES code")
                else:
                    # Generate 2D coordinates
                    AllChem.Compute2DCoords(mol)
                    
                    # Generate molecular structure image
                    img = Draw.MolToImage(mol, size=(600, 400))
                    
                    # Display image
                    st.image(img, caption="Molecular Structure", use_column_width=True)
                    
                    # Basic information
                    st.success("✅ Valid molecular structure")
                    
                    info_col1, info_col2, info_col3 = st.columns(3)
                    
                    with info_col1:
                        mol_formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
                        st.metric("Formula", mol_formula)
                    
                    with info_col2:
                        mol_weight = Descriptors.MolWt(mol)
                        st.metric("Molecular Weight", f"{mol_weight:.2f} g/mol")
                    
                    with info_col3:
                        num_atoms = mol.GetNumAtoms()
                        st.metric("Atom Count", num_atoms)
                    
                    # Canonical SMILES
                    canonical_smiles = Chem.MolToSmiles(mol)
                    st.code(f"Canonical SMILES: {canonical_smiles}", language="text")
            
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
        else:
            st.info("👆 Enter a SMILES code or select an example")
    
    # Structure Info Tab
    with tab1_2:
        st.markdown("#### 🔬 Molecular Property Analysis")
        
        if smiles_input and mol:
            try:
                # Physicochemical properties
                st.markdown("##### 📊 Physicochemical Properties")
                
                prop_col1, prop_col2 = st.columns(2)
                
                with prop_col1:
                    # LogP
                    logp = Descriptors.MolLogP(mol)
                    st.metric("LogP (Lipophilicity)", f"{logp:.2f}")
                    
                    # H-Bond donor
                    hbd = Descriptors.NumHDonors(mol)
                    st.metric("H-Bond Donor", hbd)
                    
                    # Rotatable bonds
                    rot_bonds = Descriptors.NumRotatableBonds(mol)
                    st.metric("Rotatable Bonds", rot_bonds)
                
                with prop_col2:
                    # TPSA
                    tpsa = Descriptors.TPSA(mol)
                    st.metric("TPSA", f"{tpsa:.2f} Å²")
                    
                    # H-Bond acceptor
                    hba = Descriptors.NumHAcceptors(mol)
                    st.metric("H-Bond Acceptor", hba)
                    
                    # Aromatic rings
                    aromatic_rings = Descriptors.NumAromaticRings(mol)
                    st.metric("Aromatic Rings", aromatic_rings)
                
                # Lipinski's Rule of Five
                st.markdown("##### 💊 Lipinski's Rule of Five (Drug-likeness)")
                
                rules = {
                    "Molecular Weight ≤ 500": mol_weight <= 500,
                    "LogP ≤ 5": logp <= 5,
                    "H-Bond Donor ≤ 5": hbd <= 5,
                    "H-Bond Acceptor ≤ 10": hba <= 10
                }
                
                passed = sum(rules.values())
                total = len(rules)
                
                rule_col1, rule_col2 = st.columns(2)
                
                with rule_col1:
                    for rule, passed_rule in list(rules.items())[:2]:
                        status = "✅" if passed_rule else "❌"
                        st.write(f"{status} {rule}")
                
                with rule_col2:
                    for rule, passed_rule in list(rules.items())[2:]:
                        status = "✅" if passed_rule else "❌"
                        st.write(f"{status} {rule}")
                
                if passed == total:
                    st.success(f"🎉 All Lipinski rules passed! ({passed}/{total})")
                elif passed >= 3:
                    st.warning(f"⚠️ Lipinski rules partially passed ({passed}/{total})")
                else:
                    st.error(f"❌ Lipinski rules failed ({passed}/{total})")
                
                # Atom and bond details
                st.markdown("##### 🧪 Structural Details")
                
                detail_col1, detail_col2 = st.columns(2)
                
                with detail_col1:
                    st.write("**Atom Composition**")
                    atom_counts = {}
                    for atom in mol.GetAtoms():
                        symbol = atom.GetSymbol()
                        atom_counts[symbol] = atom_counts.get(symbol, 0) + 1
                    
                    for symbol, count in sorted(atom_counts.items()):
                        st.write(f"- {symbol}: {count}")
                
                with detail_col2:
                    st.write("**Bond Information**")
                    bond_types = {
                        'SINGLE': 0,
                        'DOUBLE': 0,
                        'TRIPLE': 0,
                        'AROMATIC': 0
                    }
                    
                    for bond in mol.GetBonds():
                        bond_type = str(bond.GetBondType())
                        if bond_type in bond_types:
                            bond_types[bond_type] += 1
                    
                    for bond_type, count in bond_types.items():
                        if count > 0:
                            st.write(f"- {bond_type}: {count}")
            
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
        else:
            st.info("Please enter a molecule in the 'SMILES Input' tab first")
    
    # Similar Molecule Search Tab
    with tab2:
        st.markdown("#### 🔍 Structure Similarity Analysis")
        
        if smiles_input and mol:
            st.markdown("##### 📐 Fingerprint Generation")
            
            try:
                # Generate Morgan Fingerprint
                from rdkit.Chem import AllChem
                
                fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=2, nBits=2048)
                
                st.success(f"✅ Fingerprint generated (2048 bits)")
                
                # Molecule for comparison
                st.markdown("##### 🔬 Similarity Comparison")
                
                compare_smiles = st.text_input(
                    "Enter SMILES for comparison",
                    placeholder="Ex: CCO"
                )
                
                if compare_smiles:
                    try:
                        compare_mol = Chem.MolFromSmiles(compare_smiles)
                        
                        if compare_mol:
                            compare_fp = AllChem.GetMorganFingerprintAsBitVect(compare_mol, radius=2, nBits=2048)
                            
                            # Tanimoto similarity calculation
                            from rdkit import DataStructs
                            similarity = DataStructs.TanimotoSimilarity(fp, compare_fp)
                            
                            # Comparison image
                            img1 = Draw.MolToImage(mol, size=(300, 200))
                            img2 = Draw.MolToImage(compare_mol, size=(300, 200))
                            
                            comp_col1, comp_col2 = st.columns(2)
                            
                            with comp_col1:
                                st.image(img1, caption="Original Molecule")
                            
                            with comp_col2:
                                st.image(img2, caption="Comparison Molecule")
                            
                            # Display similarity
                            st.metric("Tanimoto Similarity", f"{similarity:.3f}")
                            
                            if similarity > 0.8:
                                st.success("🎯 Very similar structure")
                            elif similarity > 0.5:
                                st.info("✅ Some degree of similarity")
                            else:
                                st.warning("⚠️ Structures are different")
                        else:
                            st.error("❌ Invalid SMILES code")
                    
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
            
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
        else:
            st.info("Please enter a molecule in the 'SMILES Input' tab first")
