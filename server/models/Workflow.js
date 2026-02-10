const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'Untitled Workflow'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    nodes: [{
        _id: false, // Disable auto _id for nodes
        id: String,
        type: { type: String },
        x: Number,
        y: Number,
        data: mongoose.Schema.Types.Mixed,
        documentation: { type: String, default: '' }
    }],
    connections: [{
        _id: false, // Disable auto _id for connections
        id: String,
        source: String,
        sourcePort: String,
        target: String,
        targetPort: String
    }],
    description: {
        type: String,
        default: ''
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Workflow', workflowSchema);
