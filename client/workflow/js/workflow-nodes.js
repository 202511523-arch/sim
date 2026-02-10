/**
 * Workflow Node Definitions
 * ORANGE-like data processing & statistical analysis nodes.
 * Each node has: label, category, icon, inputs, outputs, properties
 */

const WorkflowNodeTypes = {
    // =============================================
    // INPUT NODES
    // =============================================
    'input-data': {
        label: 'CSV File',
        category: 'input',
        icon: 'upload_file',
        inputs: [],
        outputs: ['data'],
        properties: [
            { name: 'source_type', label: 'Source Type', type: 'select', options: ['CSV', 'TSV', 'JSON'] },
            { name: 'path', label: 'File Path / URL', type: 'text' },
            { name: 'has_header', label: 'Has Header Row', type: 'select', options: ['Yes', 'No'] }
        ]
    },
    'input-datatable': {
        label: 'Data Table',
        category: 'input',
        icon: 'table_chart',
        inputs: [],
        outputs: ['data'],
        properties: [
            { name: 'columns', label: 'Column Names (comma-separated)', type: 'text', placeholder: 'Name, Age, Score' },
            { name: 'rows', label: 'Data Rows (one per line, comma-separated)', type: 'textarea', placeholder: 'Alice, 25, 90\nBob, 30, 85' },
            { name: 'types', label: 'Column Types (comma-separated)', type: 'text', placeholder: 'string, number, number' }
        ]
    },
    'input-params': {
        label: 'Parameters',
        category: 'input',
        icon: 'tune',
        inputs: [],
        outputs: ['params'],
        properties: [
            { name: 'param_name', label: 'Parameter Name', type: 'text' },
            { name: 'default_value', label: 'Default Value', type: 'number' }
        ]
    },
    'input-random': {
        label: 'Random Data',
        category: 'input',
        icon: 'casino',
        inputs: [],
        outputs: ['data'],
        properties: [
            { name: 'distribution', label: 'Distribution', type: 'select', options: ['Normal', 'Uniform', 'Exponential', 'Poisson'] },
            { name: 'n_samples', label: 'Number of Samples', type: 'number', default: 100 },
            { name: 'n_features', label: 'Number of Features', type: 'number', default: 2 },
            { name: 'mean', label: 'Mean (Normal)', type: 'number', default: 0 },
            { name: 'std', label: 'Std Dev (Normal)', type: 'number', default: 1 }
        ]
    },

    // =============================================
    // DATA MANIPULATION NODES
    // =============================================
    'process-filter': {
        label: 'Filter Rows',
        category: 'process',
        icon: 'filter_alt',
        inputs: ['data'],
        outputs: ['filtered_data', 'rejected_data'],
        properties: [
            { name: 'column', label: 'Column Name', type: 'text' },
            { name: 'condition', label: 'Condition', type: 'select', options: ['Greater Than', 'Less Than', 'Equals', 'Not Equals', 'Contains', 'Between'] },
            { name: 'threshold', label: 'Value / Threshold', type: 'text' },
            { name: 'threshold2', label: 'Value 2 (for Between)', type: 'text' }
        ]
    },
    'process-select-columns': {
        label: 'Select Columns',
        category: 'process',
        icon: 'view_column',
        inputs: ['data'],
        outputs: ['data'],
        properties: [
            { name: 'columns', label: 'Columns to Keep (comma-separated)', type: 'text' },
            { name: 'mode', label: 'Mode', type: 'select', options: ['Keep', 'Remove'] }
        ]
    },
    'process-merge': {
        label: 'Merge Data',
        category: 'process',
        icon: 'merge',
        inputs: ['data_a', 'data_b'],
        outputs: ['merged_data'],
        properties: [
            { name: 'join_type', label: 'Join Type', type: 'select', options: ['Inner', 'Left', 'Right', 'Outer', 'Concatenate'] },
            { name: 'key_column', label: 'Key Column (for joins)', type: 'text' }
        ]
    },
    'process-sort': {
        label: 'Sort Data',
        category: 'process',
        icon: 'sort',
        inputs: ['data'],
        outputs: ['data'],
        properties: [
            { name: 'column', label: 'Sort by Column', type: 'text' },
            { name: 'order', label: 'Order', type: 'select', options: ['Ascending', 'Descending'] }
        ]
    },
    'process-formula': {
        label: 'Formula',
        category: 'process',
        icon: 'functions',
        inputs: ['data'],
        outputs: ['data'],
        properties: [
            { name: 'new_column', label: 'New Column Name', type: 'text', placeholder: 'computed' },
            { name: 'formula', label: 'Formula (use col names)', type: 'textarea', placeholder: 'Score * 2 + Age' }
        ]
    },
    'process-group': {
        label: 'Group By',
        category: 'process',
        icon: 'workspaces',
        inputs: ['data'],
        outputs: ['data'],
        properties: [
            { name: 'group_column', label: 'Group By Column', type: 'text' },
            { name: 'agg_column', label: 'Aggregate Column', type: 'text' },
            { name: 'aggregation', label: 'Aggregation', type: 'select', options: ['Sum', 'Mean', 'Count', 'Min', 'Max', 'Median', 'Std Dev'] }
        ]
    },

    // =============================================
    // STATISTICS & ANALYSIS NODES
    // =============================================
    'process-statistics': {
        label: 'Statistics',
        category: 'analysis',
        icon: 'analytics',
        inputs: ['data'],
        outputs: ['results'],
        properties: [
            { name: 'metrics', label: 'Metrics', type: 'select', options: ['Descriptive (Mean, Median, Std)', 'Correlation Matrix', 'Frequency Table', 'All'] }
        ]
    },
    'process-analyze': {
        label: 'Analyze',
        category: 'analysis',
        icon: 'insights',
        inputs: ['data'],
        outputs: ['results', 'model'],
        properties: [
            { name: 'algorithm', label: 'Algorithm', type: 'select', options: ['Linear Regression', 'Polynomial Regression', 'K-Means Clustering', 'PCA', 'FFT'] },
            { name: 'target_column', label: 'Target Column (for regression)', type: 'text' },
            { name: 'n_clusters', label: 'K (Clusters/Components)', type: 'number', default: 3 }
        ]
    },
    'process-distributions': {
        label: 'Distributions',
        category: 'analysis',
        icon: 'ssid_chart',
        inputs: ['data'],
        outputs: ['results'],
        properties: [
            { name: 'column', label: 'Column', type: 'text' },
            { name: 'bins', label: 'Number of Bins', type: 'number', default: 10 },
            { name: 'test', label: 'Normality Test', type: 'select', options: ['None', 'Shapiro-Wilk (approx)', 'Kolmogorov-Smirnov (approx)'] }
        ]
    },

    // =============================================
    // SIMULATION NODES
    // =============================================
    'process-simulate': {
        label: 'Simulate',
        category: 'process',
        icon: 'science',
        inputs: ['params', 'initial_state'],
        outputs: ['simulation_data'],
        properties: [
            { name: 'model', label: 'Simulation Model', type: 'select', options: ['Physics Engine', 'Chemical Reaction', 'Biological Growth', 'Monte Carlo'] },
            { name: 'steps', label: 'Time Steps', type: 'number', default: 100 },
            { name: 'dt', label: 'Time Delta', type: 'number', default: 0.01 }
        ]
    },
    'process-script': {
        label: 'Script / Logic',
        category: 'process',
        icon: 'code',
        inputs: ['input'],
        outputs: ['output'],
        properties: [
            { name: 'language', label: 'Language', type: 'select', options: ['JavaScript'] },
            { name: 'code', label: 'Code', type: 'textarea', placeholder: '// input is available as `data`\n// return your output\nreturn data;' }
        ]
    },

    // =============================================
    // OUTPUT / VISUALIZATION NODES
    // =============================================
    'output-chart': {
        label: 'Chart',
        category: 'output',
        icon: 'bar_chart',
        inputs: ['data'],
        outputs: [],
        properties: [
            { name: 'chart_type', label: 'Chart Type', type: 'select', options: ['Line', 'Bar', 'Scatter', 'Histogram', 'Pie'] },
            { name: 'x_column', label: 'X Column', type: 'text' },
            { name: 'y_column', label: 'Y Column', type: 'text' },
            { name: 'title', label: 'Chart Title', type: 'text' },
            { name: 'color', label: 'Color', type: 'text', placeholder: '#3b82f6' }
        ]
    },
    'output-boxplot': {
        label: 'Box Plot',
        category: 'output',
        icon: 'candlestick_chart',
        inputs: ['data'],
        outputs: [],
        properties: [
            { name: 'columns', label: 'Columns (comma-separated)', type: 'text' },
            { name: 'title', label: 'Chart Title', type: 'text' }
        ]
    },
    'output-table': {
        label: 'Data Table View',
        category: 'output',
        icon: 'table_view',
        inputs: ['data'],
        outputs: [],
        properties: [
            { name: 'max_rows', label: 'Max Rows to Display', type: 'number', default: 50 },
            { name: 'title', label: 'Table Title', type: 'text' }
        ]
    },
    'output-report': {
        label: 'Report',
        category: 'output',
        icon: 'description',
        inputs: ['results'],
        outputs: [],
        properties: [
            { name: 'format', label: 'Format', type: 'select', options: ['PDF', 'HTML', 'JSON'] },
            { name: 'include_charts', label: 'Include Charts', type: 'select', options: ['Yes', 'No'] }
        ]
    }
};

export default WorkflowNodeTypes;
