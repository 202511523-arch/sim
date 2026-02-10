"""
Chemical Search Engine Module
SciFinder Lite style compound search tool

Features:
- PubChem API integration (PubChemPy)
- Search by compound name
- Basic property info (Mol. Weight, Formula, IUPAC Name)
- 2D structure image display
- Isomer and synonym check
"""

import streamlit as st
import pubchempy as pcp
import requests
from PIL import Image
from io import BytesIO

def show():
    st.title("🔍 Chemical Search Engine")
    st.markdown("### PubChem-based Chemical Search")
    
    # Search bar
    col1, col2 = st.columns([4, 1])
    
    with col1:
        search_query = st.text_input(
            "Enter Chemical Name or CAS Number",
            placeholder="Ex: Aspirin, Caffeine, 50-78-2",
            help="Searching by English name is most accurate."
        )
    
    with col2:
        st.write("") # v-align
        st.write("")
        search_btn = st.button("Search 🚀", use_container_width=True)

    if search_btn and search_query:
        with st.spinner(f"Searching for '{search_query}'..."):
            try:
                # PubChem search
                compounds = pcp.get_compounds(search_query, 'name')
                
                if not compounds:
                    st.warning("❌ No results found. Check spelling or try IUPAC name.")
                else:
                    # Use the first result (most accurate)
                    compound = compounds[0]
                    cid = compound.cid
                    
                    st.success(f"✅ Search successful! (CID: {cid})")
                    
                    # Layout split
                    info_col, img_col = st.columns([2, 1])
                    
                    with img_col:
                        # Get PubChem image
                        img_url = f"https://pubchem.ncbi.nlm.nih.gov/image/imagefly.cgi?cid={cid}&width=400&height=400"
                        st.image(img_url, caption="2D Structure", use_column_width=True)
                        
                        # 3D Viewer Link
                        st.markdown(f"[🧬 View 3D Structure (PubChem)](https://pubchem.ncbi.nlm.nih.gov/compound/{cid}#section=3D-Conformer)")
                    
                    with info_col:
                        st.markdown(f"### **{compound.synonyms[0] if compound.synonyms else search_query}**")
                        
                        # Basic property table
                        properties = {
                            "Formula": compound.molecular_formula,
                            "Molecular Weight": f"{compound.molecular_weight} g/mol",
                            "IUPAC Name": compound.iupac_name,
                            "SMILES (Isomeric)": compound.isomeric_smiles,
                            "LogP (XLogP)": compound.xlogp,
                            "TPSA": f"{compound.tpsa} Å²",
                            "Charge": compound.charge
                        }
                        
                        for key, value in properties.items():
                            st.write(f"**{key}:** {value}")
                            
                    # Detailed Information Tabs
                    st.markdown("---")
                    tab1, tab1_2 = st.tabs(["Synonyms", "Download"])
                    
                    with tab1:
                        if compound.synonyms:
                            st.write(", ".join(compound.synonyms[:10]) + " ...")
                        else:
                            st.info("No synonym information available")
                            
                    with tab1_2:
                        col_d1, col_d2 = st.columns(2)
                        with col_d1:
                            st.download_button(
                                "📥 Download SDF File", 
                                data=requests.get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/SDF").content,
                                file_name=f"{cid}.sdf"
                            )
                        with col_d2:
                            st.download_button(
                                "📥 Download JSON Data",
                                data=requests.get(f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/{cid}/JSON").content,
                                file_name=f"{cid}.json"
                            )

            except Exception as e:
                st.error(f"❌ Error occurred during search: {e}")

    # Popular Searches
    st.markdown("---")
    st.markdown("#### 🔥 Popular Chemicals")
    popular_chemicals = ["Acetaminophen", "Ibuprofen", "Benzene", "Ethanol", "Glucose", "ATP"]
    
    cols_popular = st.columns(len(popular_chemicals))
    for i, chem in enumerate(popular_chemicals):
        if cols_popular[i].button(chem):
            # Message only due to Streamlit structure
            st.info(f"Enter '{chem}' in the search bar and click Search!")
