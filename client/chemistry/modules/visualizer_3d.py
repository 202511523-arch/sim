"""
3D Visualizer Module
PyMOL Lite style 3D structure visualization tool

Features:
- PDB file upload
- Fetch structure by PDB ID (RCSB PDB)
- Various rendering styles (Cartoon, Stick, Sphere)
- Surface visualization
- Rotation and zoom interaction
"""

import streamlit as st
import py3Dmol
from stmol import showmol
import requests

def show():
    st.title("🧬 3D Visualizer")
    st.markdown("### PyMOL Lite Style Structure Viewer")
    
    # Sidebar settings
    with st.sidebar:
        st.markdown("### ⚙️ Visualization Settings")
        
        style_options = st.selectbox(
            "Rendering Style",
            ["Cartoon (Protein)", "Stick (Compound)", "Sphere (Space Fill)", "Line (Line)"],
            index=0
        )
        
        color_scheme = st.selectbox(
            "Color Theme",
            ["spectrum (Rainbow)", "chain (By Chain)", "element (By Element)", "residue (By Residue)"],
            index=0
        )
        
        show_surface = st.checkbox("Show Surface", value=False)
        surface_opacity = st.slider("Surface Opacity", 0.0, 1.0, 0.8) if show_surface else 0.5
        
        spin = st.checkbox("Auto Spin", value=False)
        bgcolor = st.color_picker("Background Color", "#0e1117")

    # Input method selection (Tabs)
    tab1, tab2 = st.tabs(["Search PDB ID", "File Upload"])
    
    pdb_id = None
    uploaded_file = None
    pdb_data = None
    
    with tab1:
        col1, col2 = st.columns([3, 1])
        with col1:
            pdb_input = st.text_input(
                "Enter PDB ID (RCSB)", 
                placeholder="Ex: 1CRN, 6VXX (SARS-CoV-2)",
                max_chars=4
            )
        with col2:
            st.write("") # v-align
            st.write("") 
            if st.button("Get Structure", use_container_width=True):
                pdb_id = pdb_input

    with tab2:
        uploaded_file = st.file_uploader("Upload PDB/CIF/XYZ File", type=['pdb', 'cif', 'xyz'])

    # Rendering logic
    if pdb_id:
        try:
            url = f"https://files.rcsb.org/view/{pdb_id}.pdb"
            response = requests.get(url)
            if response.status_code == 200:
                pdb_data = response.text
                st.success(f"✅ Structure loaded successfully: **{pdb_id}**")
            else:
                st.error("❌ Invalid PDB ID.")
        except Exception as e:
            st.error(f"❌ Network error: {e}")
            
    elif uploaded_file:
        pdb_data = uploaded_file.getvalue().decode("utf-8")
        st.success(f"✅ File loaded successfully: **{uploaded_file.name}**")
    
    else:
        # Default example (DNA)
        if not pdb_data:
            st.info("👆 Enter PDB ID or upload a file. (Default example: DNA)")
            # Basic DNA structure example data
            pdb_id = "1BNA" # B-DNA
            try:
                pdb_data = requests.get(f"https://files.rcsb.org/view/{pdb_id}.pdb").text
            except:
                pass

    # Viewer rendering
    if pdb_data:
        try:
            # Viewer size setting
            view = py3Dmol.view(width=800, height=600)
            
            # Add structure data
            file_format = 'pdb'
            if uploaded_file and uploaded_file.name.endswith('.cif'):
                file_format = 'cif'
            elif uploaded_file and uploaded_file.name.endswith('.xyz'):
                file_format = 'xyz'
                
            view.addModel(pdb_data, file_format)
            
            # Apply style
            view.setStyle({'cartoon': {'color': 'spectrum'}}) # Init
            
            if style_options == "Cartoon (Protein)":
                view.setStyle({'cartoon': {'color': color_scheme}})
            elif style_options == "Stick (Compound)":
                view.setStyle({'stick': {'colorscheme': f'{color_scheme}Carbon' if color_scheme == 'element' else color_scheme}})
            elif style_options == "Sphere (Space Fill)":
                view.setStyle({'sphere': {'colorscheme': f'{color_scheme}Carbon' if color_scheme == 'element' else color_scheme}})
            elif style_options == "Line (Line)":
                view.setStyle({'line': {'colorscheme': f'{color_scheme}Carbon' if color_scheme == 'element' else color_scheme}})
                
            # Add surface
            if show_surface:
                view.addSurface(py3Dmol.VDW, {'opacity': surface_opacity, 'color': 'white'})
                
            # Apply settings
            view.setBackgroundColor(bgcolor)
            view.zoomTo()
            if spin:
                view.spin(True)
            else:
                view.spin(False)

            # Display in Streamlit
            showmol(view, height=600, width=800)
            
            # Download button
            st.download_button(
                label="📥 Download PDB File",
                data=pdb_data,
                file_name=f"{pdb_id if pdb_id else 'structure'}.pdb",
                mime="text/plain"
            )

        except Exception as e:
            st.error(f"❌ Rendering error: {e}")
            st.warning("Please check the file format.")

