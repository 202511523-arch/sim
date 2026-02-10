const mongoose = require('mongoose');

const workflowEventSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        enum: [
            'join', 'leave',
            'edit', 'save', 'comment',
            'file_upload', 'file_delete',
            'member_add', 'member_remove',
            'chat_message', 'note_create', 'note_edit',
            'quiz_create', 'quiz_complete',
            'other'
        ],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Indexes
workflowEventSchema.index({ projectId: 1, createdAt: -1 });
workflowEventSchema.index({ userId: 1, projectId: 1 });

module.exports = mongoose.model('WorkflowEvent', workflowEventSchema);
