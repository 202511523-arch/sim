"""
Smart Calculator Module
Engineering Calculator + Chemical Equilibrium Solver

Features:
- Basic arithmetic operations
- Log, exponential, trigonometric functions
- SymPy-based equation solving
- Chemical equilibrium constant calculation
"""

import streamlit as st
import sympy as sp
from sympy import symbols, Eq, solve, log, exp, sin, cos, tan, sqrt
import numpy as np

def show():
    st.title("🔢 Smart Calculator")
    st.markdown("### Casio fx-991 Style Engineering Calculator")
    
    # Tab configuration
    tab1, tab1_2, tab2 = st.tabs(["Basic Calculation", "Equation Solver", "Chemical Equilibrium Solver"])
    
    # Basic Calculation Tab
    with tab1:
        st.markdown("#### Pager Basic Calculator")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            expression = st.text_input(
                "Enter expression",
                placeholder="Ex: 2*3 + 5**2 - sqrt(16)",
                help="Available: +, -, *, /, **, sqrt(), log(), sin(), cos(), tan()"
            )
        
        with col2:
            if st.button("Calculate ▶️", use_container_width=True):
                if expression:
                    try:
                        # Calculate with SymPy
                        result = sp.sympify(expression)
                        result_numeric = float(result.evalf())
                        
                        st.success(f"### Result: `{result_numeric}`")
                        
                        # Detailed info
                        with st.expander("Detailed Information"):
                            st.write(f"**Input Expression**: {expression}")
                            st.write(f"**Exact Value**: {result}")
                            st.write(f"**Approximate Value**: {result_numeric}")
                    except Exception as e:
                        st.error(f"❌ Error: {str(e)}")
                else:
                    st.warning("Please enter an expression")
        
        # Quick function buttons
        st.markdown("#### 🎯 Quick Functions")
        func_col1, func_col2, func_col3, func_col4 = st.columns(4)
        
        with func_col1:
            st.code("sqrt(x)", language="python")
            st.caption("Square Root")
        with func_col2:
            st.code("log(x)", language="python")
            st.caption("Natural Log")
        with func_col3:
            st.code("exp(x)", language="python")
            st.caption("Exponential Function")
        with func_col4:
            st.code("sin(x)", language="python")
            st.caption("Trigonometric Function")
    
    # Equation Solver Tab
    with tab1_2:
        st.markdown("#### 🎯 Equation Solver")
        st.info("**TIP**: Enter 'x' for the unknown variable")
        
        col1, col2 = st.columns(2)
        
        with col1:
            left_side = st.text_input(
                "Left Side",
                placeholder="Ex: 2*x + 5",
                key="left"
            )
        
        with col2:
            right_side = st.text_input(
                "Right Side", 
                placeholder="Ex: 15",
                key="right"
            )
        
        if st.button("🔍 Solve", use_container_width=True):
            if left_side and right_side:
                try:
                    x = symbols('x')
                    equation = Eq(sp.sympify(left_side), sp.sympify(right_side))
                    solution = solve(equation, x)
                    
                    st.success(f"### Solution: x = {solution}")
                    
                    # Verification
                    with st.expander("Solution Process"):
                        st.write(f"**Equation**: {left_side} = {right_side}")
                        st.write(f"**Simplified**: {equation}")
                        st.write(f"**Solution**: {solution}")
                        
                        if solution:
                            x_val = float(solution[0])
                            left_check = sp.sympify(left_side).subs(x, x_val)
                            right_check = sp.sympify(right_side).subs(x, x_val)
                            st.write(f"**Verification**: {left_check} = {right_check}")
                            st.write(f"**Check**: {'✅ Correct' if abs(float(left_check - right_check)) < 1e-10 else '❌ Error'}")
                
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
            else:
                st.warning("Please enter both left and right sides")
        
        # Examples
        with st.expander("📝 Examples"):
            st.code("""
# Linear Equation
Left: 2*x + 5
Right: 15
Solution: x = [5]

# Quadratic Equation
Left: x**2 - 4*x + 3
Right: 0
Solution: x = [1, 3]

# Logarithmic Equation
Left: log(x)
Right: 2
Solution: x = [exp(2)]
            """)
    
    # Chemical Equilibrium Solver Tab
    with tab2:
        st.markdown("#### ⚗️ Chemical Equilibrium Solver")
        st.info("**Equilibrium Equation**: aA + bB ⇌ cC + dD")
        
        # Select target equilibrium constant
        equilibrium_type = st.selectbox(
            "Equilibrium Constant Type",
            ["Kc (Concentration)", "Kp (Pressure)", "Ka (Acid Dissociation)", "Kb (Base Dissociation)"]
        )
        
        st.markdown("---")
        
        # Kc example
        if equilibrium_type == "Kc (Concentration)":
            st.markdown("##### Example: N₂ + 3H₂ ⇌ 2NH₃")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                n2_initial = st.number_input("Initial [N₂] (M)", value=1.0, min_value=0.0)
                h2_initial = st.number_input("Initial [H₂] (M)", value=3.0, min_value=0.0)
            
            with col2:
                nh3_initial = st.number_input("Initial [NH₃] (M)", value=0.0, min_value=0.0)
                kc_value = st.number_input("Kc Value", value=0.5, min_value=0.0)
            
            with col3:
                st.markdown("**Change at Equilibrium**")
                st.latex(r"[N_2] = 1.0 - x")
                st.latex(r"[H_2] = 3.0 - 3x")
                st.latex(r"[NH_3] = 2x")
            
            if st.button("Calculate Equilibrium Concentration", use_container_width=True):
                try:
                    x = symbols('x', positive=True, real=True)
                    
                    # Kc = [NH3]^2 / ([N2] * [H2]^3)
                    n2_eq = n2_initial - x
                    h2_eq = h2_initial - 3*x
                    nh3_eq = nh3_initial + 2*x
                    
                    kc_equation = Eq(
                        (nh3_eq**2) / (n2_eq * h2_eq**3),
                        kc_value
                    )
                    
                    solutions = solve(kc_equation, x)
                    
                    # Select physically meaningful solutions
                    valid_solutions = [sol for sol in solutions if sol.is_real and sol > 0 and sol < n2_initial]
                    
                    if valid_solutions:
                        x_val = float(valid_solutions[0])
                        
                        st.success(f"### Change: x = {x_val:.4f} M")
                        
                        # Display equilibrium concentrations
                        result_col1, result_col2, result_col3 = st.columns(3)
                        
                        with result_col1:
                            st.metric("Equilibrium [N₂]", f"{n2_initial - x_val:.4f} M")
                        with result_col2:
                            st.metric("Equilibrium [H₂]", f"{h2_initial - 3*x_val:.4f} M")
                        with result_col3:
                            st.metric("Equilibrium [NH₃]", f"{nh3_initial + 2*x_val:.4f} M")
                        
                        # Kc verification
                        kc_check = ((nh3_initial + 2*x_val)**2) / ((n2_initial - x_val) * (h2_initial - 3*x_val)**3)
                        st.info(f"**Kc Verification**: {kc_check:.6f} ≈ {kc_value}")
                    else:
                        st.error("❌ No valid solution found")
                
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        
        # Ka example
        elif equilibrium_type == "Ka (Acid Dissociation)":
            st.markdown("##### Example: HA ⇌ H⁺ + A⁻")
            
            col1, col2 = st.columns(2)
            
            with col1:
                ha_initial = st.number_input("Initial [HA] (M)", value=0.1, min_value=0.0)
                ka_value = st.number_input("Ka Value", value=1.8e-5, format="%.2e")
            
            with col2:
                st.markdown("**Equilibrium Expression**")
                st.latex(r"[HA] = C_0 - x")
                st.latex(r"[H^+] = x")
                st.latex(r"[A^-] = x")
                st.latex(r"K_a = \frac{x^2}{C_0 - x}")
            
            if st.button("Calculate pH", use_container_width=True):
                try:
                    x = symbols('x', positive=True, real=True)
                    
                    # Ka = x^2 / (C0 - x)
                    # Approx: Ka ≈ x^2 / C0 (if x << C0)
                    x_approx = sqrt(ka_value * ha_initial)
                    
                    # Exact solution
                    ka_equation = Eq(x**2 / (ha_initial - x), ka_value)
                    solutions = solve(ka_equation, x)
                    valid = [sol for sol in solutions if sol.is_real and sol > 0 and sol < ha_initial]
                    
                    if valid:
                        x_exact = float(valid[0])
                        pH = -np.log10(x_exact)
                        
                        st.success(f"### pH = {pH:.2f}")
                        
                        result_col1, result_col2 = st.columns(2)
                        
                        with result_col1:
                            st.metric("[H⁺] (Approx)", f"{float(x_approx):.2e} M")
                            st.metric("pH (Approx)", f"{-np.log10(float(x_approx)):.2f}")
                        
                        with result_col2:
                            st.metric("[H⁺] (Exact)", f"{x_exact:.2e} M")
                            st.metric("pH (Exact)", f"{pH:.2f}")
                
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
