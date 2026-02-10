const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    workspace: {
        type: String,
        enum: ['chemistry', 'engineering', 'biology', 'medical', 'earthscience', 'math', 'general'],
        default: 'general'
    },
    messages: [{
        role: {
            type: String,
            enum: ['user', 'assistant', 'system'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    title: {
        type: String,
        default: ''
    },
    isPinned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
chatHistorySchema.index({ userId: 1, workspace: 1, updatedAt: -1 });
chatHistorySchema.index({ userId: 1, projectId: 1 });
chatHistorySchema.index({ isPinned: -1, updatedAt: -1 });

// Auto-generate title from first user message if not set
chatHistorySchema.pre('save', function (next) {
    if (!this.title && this.messages.length > 0) {
        const firstUserMsg = this.messages.find(m => m.role === 'user');
        if (firstUserMsg) {
            this.title = firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
        }
    }
    next();
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
