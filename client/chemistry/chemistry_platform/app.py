"""
All-in-One Chemistry Platform (All-in-One Chemistry Assistant)
Integrated chemistry tool for chemistry students

Author: Chemistry Platform Team
Version: 1.1.0
"""

import streamlit as st
from modules import calculator, molecular_editor, data_analyzer, visualizer_3d, chemical_search, study_notes

# Page configuration
st.set_page_config(
    page_title="ChemLab | Chemistry Platform",
    page_icon="⚗️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Minimal & Clean Dark Mode Styles
st.markdown("""
    <style>
    /* Default font and background */
    .main {
        background-color: #0E1117;
        font-family: 'Inter', sans-serif;
    }
    .stApp {
        background-color: #0E1117;
    }
    
    /* Simplified header style */
    h1, h2, h3 {
        color: #E6E6E6;
        font-weight: 600;
        letter-spacing: -0.5px;
    }
    h1 { font-size: 2.2rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.6rem; margin-top: 1rem; color: #A0A0A0; }
    h3 { font-size: 1.3rem; margin-top: 1rem; color: #4A9EFF; }

    /* Button style - flat and modern */
    .stButton>button {
        background-color: #262730;
        color: #E6E6E6;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    .stButton>button:hover {
        background-color: #363945;
        border-color: #4A9EFF;
        color: #4A9EFF;
        box-shadow: none;
        transform: none;
    }
    
    /* Sidebar style */
    .css-1d391kg {
        background-color: #161920;
    }
    
    /* Container box style */
    .css-1r6slb0, .css-12oz5g7 {
        background-color: #161920;
        border: 1px solid #30333D;
        border-radius: 8px;
        padding: 1.5rem;
    }
    
    /* Alert/Tip box style */
    .stAlert {
        background-color: #1C2029;
        border: 1px solid #30333D;
        color: #E6E6E6;
    }
    
    /* Divider */
    hr {
        border-color: #30333D;
        margin: 2rem 0;
    }
    </style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("## ⚗️ **ChemLab**")
    
    # Menu Selection
    menu = st.radio(
        "Menu",
        [
            "Home",
            "Calculator",
            "Molecular Editor",
            "Data Analyzer", 
            "3D Visualizer",
            "Chemical Search",
            "Study Notes"
        ],
        index=0,
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    st.caption("v1.1.0 | Student Edition")

# Main Content
if menu == "Home":
    st.title("Welcome to ChemLab")
    st.markdown("#### A minimal workspace for chemistry research and learning")
    
    st.markdown("---")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### 🧪 **Core Tools**
        
        **Calculator**
        Solve everything from simple calculations to complex chemical equilibrium.
        
        **Molecular Editor**
        Quickly draw and analyze 2D molecular structures with SMILES codes.
        
        **3D Visualizer**
        Load PDB files to explore proteins and molecules in 3D.
        """)
        
    with col2:
        st.markdown("""
        ### 📊 **Data & Notes**
        
        **Data Analyzer**
        Upload experimental data and gain insights through regression analysis.
        
        **Chemical Search**
        Instantly search for tens of millions of compounds on PubChem.
        
        **Study Notes**
        Record and manage your learning progress and experimental results.
        """)
    
    st.markdown("---")
    st.info("👈 Select a tool from the left sidebar to get started.")

elif menu == "Calculator":
    calculator.show()

elif menu == "Molecular Editor":
    molecular_editor.show()

elif menu == "Data Analyzer":
    data_analyzer.show()

elif menu == "3D Visualizer":
    visualizer_3d.show()

elif menu == "Chemical Search":
    chemical_search.show()

elif menu == "Study Notes":
    study_notes.show()
