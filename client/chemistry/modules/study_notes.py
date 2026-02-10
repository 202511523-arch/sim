"""
Study Notes Module
Note-taking feature for recording study content

Features:
- Note creation, modification, deletion (CRUD)
- Category tag support
- Sorting by date
- Auto-save based on JSON file
"""

import streamlit as st
import json
import os
from datetime import datetime

NOTES_FILE = "study_notes.json"

def load_notes():
    if os.path.exists(NOTES_FILE):
        with open(NOTES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_notes(notes):
    with open(NOTES_FILE, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)

def show():
    st.title("📝 Study Notes")
    st.markdown("### My Chemistry Study Notes")
    
    # Load notes data
    if 'notes' not in st.session_state:
        st.session_state.notes = load_notes()
    
    # New note writing area (Expandable)
    with st.expander("✍️ Write New Note", expanded=False):
        with st.form("new_note_form"):
            new_title = st.text_input("Title")
            new_category = st.selectbox("Category", ["General Chemistry", "Organic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Experiment", "Other"])
            new_content = st.text_area("Content", height=150)
            submitted = st.form_submit_button("Save")
            
            if submitted and new_title and new_content:
                new_note = {
                    "id": datetime.now().strftime("%Y%m%d%H%M%S"),
                    "title": new_title,
                    "category": new_category,
                    "content": new_content,
                    "date": datetime.now().strftime("%Y-%m-%d %H:%M")
                }
                st.session_state.notes.insert(0, new_note) # Add latest at top
                save_notes(st.session_state.notes)
                st.success("Note saved successfully!")
                st.rerun()

    st.markdown("---")
    
    # Note filtering
    col1, col2 = st.columns([3, 1])
    with col2:
        filter_cat = st.selectbox(
            "Filter Category", 
            ["All"] + ["General Chemistry", "Organic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Experiment", "Other"]
        )
    
    # Display note list
    filtered_notes = st.session_state.notes
    if filter_cat != "All":
        filtered_notes = [n for n in st.session_state.notes if n['category'] == filter_cat]

    if not filtered_notes:
        st.info("No notes written yet.")
    else:
        for i, note in enumerate(filtered_notes):
            with st.container():
                # Card style container
                st.markdown(f"""
                <div style="
                    background-color: #262730;
                    padding: 1.5rem;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                    border-left: 5px solid #4A9EFF;
                ">
                    <h4 style="margin-top: 0; color: #FFFFFF;">{note['title']}</h4>
                    <span style="
                        background-color: #4A9EFF;
                        color: white;
                        padding: 0.2rem 0.6rem;
                        border-radius: 15px;
                        font-size: 0.8rem;
                        margin-right: 0.5rem;
                    ">{note['category']}</span>
                    <span style="color: #aaaaaa; font-size: 0.8rem;">{note['date']}</span>
                    <hr style="margin: 0.5rem 0; border-color: #444;">
                    <p style="white-space: pre-wrap; color: #dddddd;">{note['content']}</p>
                </div>
                """, unsafe_allow_html=True)
                
                # Delete button
                col_del, _ = st.columns([1, 10])
                with col_del:
                    if st.button("Delete", key=f"del_{note['id']}"):
                        st.session_state.notes = [n for n in st.session_state.notes if n['id'] != note['id']]
                        save_notes(st.session_state.notes)
                        st.rerun()
