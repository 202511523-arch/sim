"""
Data Analyzer Module
Origin-alternative Data Analysis Tool

Features:
- CSV/Excel file upload
- Scatter plot generation
- Linear/Non-linear regression analysis
- R-squared calculation
- Trendline display
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from scipy import stats
from scipy.optimize import curve_fit
import io

def show():
    st.title("📊 Data Analyzer")
    st.markdown("### Origin Style Data Analysis Tool")
    
    # File upload
    uploaded_file = st.file_uploader(
        "Upload CSV or Excel file",
        type=['csv', 'xlsx', 'xls'],
        help="Upload your experimental data"
    )
    
    # Sample data generation option
    use_sample = st.checkbox("Use Sample Data")
    
    df = None
    
    if use_sample:
        # Generate sample data
        np.random.seed(42)
        x_sample = np.linspace(0, 10, 50)
        y_sample = 2.5 * x_sample + 5 + np.random.normal(0, 2, 50)
        df = pd.DataFrame({'X': x_sample, 'Y': y_sample})
        st.info("📊 Sample data loaded")
    
    elif uploaded_file is not None:
        try:
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            else:
                df = pd.read_excel(uploaded_file)
            
            st.success(f"✅ File uploaded: {uploaded_file.name}")
        
        except Exception as e:
            st.error(f"❌ File reading error: {str(e)}")
    
    if df is not None:
        # Tab configuration
        tab1, tab1_2, tab2 = st.tabs(["Data Preview", "Scatter Plot & Regression", "Statistical Analysis"])
        
        # Data Preview Tab
        with tab1:
            st.markdown("#### 📋 Data Preview")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.metric("Row Count", len(df))
            with col2:
                st.metric("Column Count", len(df.columns))
            with col3:
                st.metric("Missing Values", df.isnull().sum().sum())
            
            st.dataframe(df.head(10), use_container_width=True)
            
            # Descriptive statistics
            st.markdown("#### 📈 Descriptive Statistics")
            st.dataframe(df.describe(), use_container_width=True)
        
        # Scatter Plot & Regression Tab
        with tab1_2:
            st.markdown("#### 📊 Regression Analysis")
            
            # X, Y Axis Selection
            col1, col2 = st.columns(2)
            
            with col1:
                x_column = st.selectbox("X-axis Variable", df.columns, index=0)
            
            with col2:
                y_column = st.selectbox("Y-axis Variable", df.columns, index=min(1, len(df.columns)-1))
            
            # Regression Type Selection
            regression_type = st.selectbox(
                "Select Regression Model",
                [
                    "Linear",
                    "Polynomial",
                    "Exponential",
                    "Logarithmic",
                    "Power"
                ]
            )
            
            try:
                X = df[x_column].values
                Y = df[y_column].values
                
                # Remove NaN
                mask = ~(np.isnan(X) | np.isnan(Y))
                X_clean = X[mask]
                Y_clean = Y[mask]
                
                if len(X_clean) < 2:
                    st.error("Insufficient valid data points")
                    return
                
                # Perform regression analysis
                if regression_type == "Linear":
                    # Linear regression
                    slope, intercept, r_value, p_value, std_err = stats.linregress(X_clean, Y_clean)
                    
                    # Prediction values
                    X_fit = np.linspace(X_clean.min(), X_clean.max(), 100)
                    Y_fit = slope * X_fit + intercept
                    
                    equation = f"y = {slope:.4f}x + {intercept:.4f}"
                    r_squared = r_value ** 2
                
                elif regression_type == "Polynomial":
                    degree = st.slider("Polynomial Degree", 2, 5, 2)
                    
                    # Polynomial regression
                    coeffs = np.polyfit(X_clean, Y_clean, degree)
                    poly = np.poly1d(coeffs)
                    
                    X_fit = np.linspace(X_clean.min(), X_clean.max(), 100)
                    Y_fit = poly(X_fit)
                    
                    # R-squared calculation
                    Y_pred = poly(X_clean)
                    ss_res = np.sum((Y_clean - Y_pred) ** 2)
                    ss_tot = np.sum((Y_clean - np.mean(Y_clean)) ** 2)
                    r_squared = 1 - (ss_res / ss_tot)
                    
                    equation = str(poly).replace('\n', '')
                
                elif regression_type == "Exponential":
                    # y = a * exp(b * x)
                    def exp_func(x, a, b):
                        return a * np.exp(b * x)
                    
                    popt, _ = curve_fit(exp_func, X_clean, Y_clean, p0=(1, 0.1))
                    
                    X_fit = np.linspace(X_clean.min(), X_clean.max(), 100)
                    Y_fit = exp_func(X_fit, *popt)
                    
                    # R-squared
                    Y_pred = exp_func(X_clean, *popt)
                    ss_res = np.sum((Y_clean - Y_pred) ** 2)
                    ss_tot = np.sum((Y_clean - np.mean(Y_clean)) ** 2)
                    r_squared = 1 - (ss_res / ss_tot)
                    
                    equation = f"y = {popt[0]:.4f} * exp({popt[1]:.4f} * x)"
                
                elif regression_type == "Logarithmic":
                    # y = a + b * log(x)
                    X_log = np.log(X_clean[X_clean > 0])
                    Y_log = Y_clean[X_clean > 0]
                    
                    slope, intercept, r_value, _, _ = stats.linregress(X_log, Y_log)
                    
                    X_fit = np.linspace(X_clean[X_clean > 0].min(), X_clean.max(), 100)
                    Y_fit = intercept + slope * np.log(X_fit)
                    
                    r_squared = r_value ** 2
                    equation = f"y = {intercept:.4f} + {slope:.4f} * log(x)"
                
                else:  # Power
                    # y = a * x^b
                    X_power = X_clean[X_clean > 0]
                    Y_power = Y_clean[X_clean > 0]
                    
                    log_x = np.log(X_power)
                    log_y = np.log(Y_power)
                    
                    slope, intercept, r_value, _, _ = stats.linregress(log_x, log_y)
                    
                    a = np.exp(intercept)
                    b = slope
                    
                    X_fit = np.linspace(X_power.min(), X_clean.max(), 100)
                    Y_fit = a * X_fit ** b
                    
                    r_squared = r_value ** 2
                    equation = f"y = {a:.4f} * x^{b:.4f}"
                
                # Plotly Plot
                fig = go.Figure()
                
                # Original Data
                fig.add_trace(go.Scatter(
                    x=X_clean,
                    y=Y_clean,
                    mode='markers',
                    name='Data',
                    marker=dict(size=8, color='#4A9EFF', opacity=0.7)
                ))
                
                # Trendline
                fig.add_trace(go.Scatter(
                    x=X_fit,
                    y=Y_fit,
                    mode='lines',
                    name='Trendline',
                    line=dict(color='#06FFA5', width=3)
                ))
                
                fig.update_layout(
                    title=f"{regression_type} Regression Analysis",
                    xaxis_title=x_column,
                    yaxis_title=y_column,
                    template="plotly_dark",
                    hovermode='closest',
                    height=500
                )
                
                st.plotly_chart(fig, use_container_width=True)
                
                # Regression Info
                st.markdown("#### 📈 Regression Results")
                
                result_col1, result_col2 = st.columns(2)
                
                with result_col1:
                    st.code(equation, language="text")
                
                with result_col2:
                    st.metric("R² (Coefficient of Determination)", f"{r_squared:.6f}")
                
                # R² Interpretation
                if r_squared > 0.9:
                    st.success("🎯 Very strong correlation (R² > 0.9)")
                elif r_squared > 0.7:
                    st.info("✅ Strong correlation (0.7 < R² < 0.9)")
                elif r_squared > 0.5:
                    st.warning("⚠️ Moderate correlation (0.5 < R² < 0.7)")
                else:
                    st.error("❌ Weak correlation (R² < 0.5)")
                
                # Residual Plot
                if st.checkbox("Show Residual Plot"):
                    residuals = Y_clean - (slope * X_clean + intercept if regression_type == "Linear" else Y_pred)
                    
                    fig_residuals = go.Figure()
                    fig_residuals.add_trace(go.Scatter(
                        x=X_clean,
                        y=residuals,
                        mode='markers',
                        name='Residuals',
                        marker=dict(size=6, color='#9D4EDD')
                    ))
                    
                    fig_residuals.add_hline(y=0, line_dash="dash", line_color="white")
                    
                    fig_residuals.update_layout(
                        title="Residual Plot",
                        xaxis_title=x_column,
                        yaxis_title="Residuals",
                        template="plotly_dark",
                        height=400
                    )
                    
                    st.plotly_chart(fig_residuals, use_container_width=True)
            
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
        
        # Statistical Analysis Tab
        with tab2:
            st.markdown("#### 📊 Statistical Analysis")
            
            selected_columns = st.multiselect(
                "Select Columns to Analyze",
                df.columns,
                default=list(df.columns[:min(3, len(df.columns))])
            )
            
            if selected_columns:
                # Correlation Matrix
                st.markdown("##### 📈 Correlation Matrix")
                
                corr_matrix = df[selected_columns].corr()
                
                fig_corr = go.Figure(data=go.Heatmap(
                    z=corr_matrix.values,
                    x=corr_matrix.columns,
                    y=corr_matrix.columns,
                    colorscale='RdBu',
                    zmid=0,
                    text=corr_matrix.values.round(3),
                    texttemplate='%{text}',
                    textfont={"size": 10},
                    colorbar=dict(title="Correlation")
                ))
                
                fig_corr.update_layout(
                    title="Pearson Correlation Coefficient",
                    template="plotly_dark",
                    height=500
                )
                
                st.plotly_chart(fig_corr, use_container_width=True)
                
                # Histogram
                st.markdown("##### 📊 Distribution Histogram")
                
                hist_column = st.selectbox("Histogram Variable", selected_columns)
                
                fig_hist = px.histogram(
                    df,
                    x=hist_column,
                    nbins=30,
                    template="plotly_dark",
                    color_discrete_sequence=['#4A9EFF']
                )
                
                fig_hist.update_layout(
                    title=f"{hist_column} Distribution",
                    xaxis_title=hist_column,
                    yaxis_title="Frequency",
                    height=400
                )
                
                st.plotly_chart(fig_hist, use_container_width=True)
    
    else:
        st.info("👆 Upload a data file or use sample data")
        
        # Sample CSV Download
        st.markdown("### 📥 Download Sample Data")
        
        sample_data = pd.DataFrame({
            'Time (min)': [0, 5, 10, 15, 20, 25, 30],
            'Concentration (mM)': [10.0, 8.5, 7.2, 6.1, 5.3, 4.6, 4.1],
            'Temperature (°C)': [25, 28, 31, 34, 37, 40, 43]
        })
        
        csv = sample_data.to_csv(index=False)
        
        st.download_button(
            label="📄 Download sample_data.csv",
            data=csv,
            file_name="sample_data.csv",
            mime="text/csv"
        )
