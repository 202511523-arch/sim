/**
 * Workflow Node Definitions
 * Defines the structure, ports, and default data for each node type.
 */

const WorkflowNodeTypes = {
    // Input Nodes
    'input-data': {
        label: 'Data Source',
        category: 'input',
        icon: 'input',
        inputs: [],
        outputs: ['data'],
        properties: [
            { name: 'source_type', label: 'Source Type', type: 'select', options: ['CSV', 'Database', 'API'] },
            { name: 'path', label: 'File Path / URL', type: 'text' }
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

    // Processing Nodes
    'process-filter': {
        label: 'Filter',
        category: 'process',
        icon: 'filter_alt',
        inputs: ['data'],
        outputs: ['filtered_data'],
        properties: [
            { name: 'condition', label: 'Condition', type: 'select', options: ['Greater Than', 'Less Than', 'Equals'] },
            { name: 'threshold', label: 'Threshold', type: 'number' }
        ]
    },
    'process-analyze': {
        label: 'Analyze',
        category: 'process',
        icon: 'analytics',
        inputs: ['data'],
        outputs: ['results'],
        properties: [
            { name: 'algorithm', label: 'Algorithm', type: 'select', options: ['Regression', 'Clustering', 'FFT'] }
        ]
    },
    'process-simulate': {
        label: 'Simulate',
        category: 'process',
        icon: 'science',
        inputs: ['params', 'initial_state'],
        outputs: ['simulation_data'],
        properties: [
            { name: 'model', label: 'Simulation Model', type: 'select', options: ['Physics Engine', 'Chemical Reaction', 'Biological Growth'] },
            { name: 'steps', label: 'Time Steps', type: 'number', default: 100 }
        ]
    },
    'process-script': {
        label: 'Script / Logic',
        category: 'process',
        icon: 'code',
        inputs: ['input'],
        outputs: ['output'],
        properties: [
            { name: 'language', label: 'Language', type: 'select', options: ['JavaScript', 'Python (Mock)'] },
            { name: 'code', label: 'Code', type: 'textarea' }
        ]
    },

    // Output Nodes
    'output-chart': {
        label: 'Chart',
        category: 'output',
        icon: 'bar_chart',
        inputs: ['data'],
        outputs: [],
        properties: [
            { name: 'chart_type', label: 'Chart Type', type: 'select', options: ['Line', 'Bar', 'Scatter'] },
            { name: 'x_axis', label: 'X Axis Label', type: 'text' },
            { name: 'y_axis', label: 'Y Axis Label', type: 'text' }
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
            { name: 'include_charts', label: 'Include Charts', type: 'checkbox' }
        ]
    }
};

export default WorkflowNodeTypes;
