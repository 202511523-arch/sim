const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'Untitled Note',
        maxlength: 200
    },
    content: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        default: '#ffffff'
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    linkedProjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    tags: [{
        type: String,
        trim: true
    }],
    type: {
        type: String,
        enum: ['general', 'concept', 'experiment', 'design', 'summary'],
        default: 'general'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    quizScore: {
        type: Number,
        default: null
    },
    workspace: {
        type: String,
        enum: ['chemistry', 'biology', 'medical', 'mechanical', 'earthscience', 'engineering', 'general'],
        default: 'general'
    },
    attachments: [{
        url: {
            type: String,
            required: true
        },
        filename: String,
        mimetype: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });
noteSchema.index({ userId: 1, linkedProjectId: 1 });
noteSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Note', noteSchema);
