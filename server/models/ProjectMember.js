const mongoose = require('mongoose');

const projectMemberSchema = new mongoose.Schema({
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
    role: {
        type: String,
        enum: ['owner', 'editor', 'viewer'],
        default: 'viewer'
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound unique index
projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index({ userId: 1 });
projectMemberSchema.index({ projectId: 1, role: 1 });

// Static method to check user's role in a project
projectMemberSchema.statics.getUserRole = async function (projectId, userId) {
    const member = await this.findOne({ projectId, userId });
    return member ? member.role : null;
};

// Static method to check if user can edit
projectMemberSchema.statics.canEdit = async function (projectId, userId) {
    const member = await this.findOne({ projectId, userId });
    return member && (member.role === 'owner' || member.role === 'editor');
};

// Static method to check if user is owner
projectMemberSchema.statics.isOwner = async function (projectId, userId) {
    const member = await this.findOne({ projectId, userId });
    return member && member.role === 'owner';
};

module.exports = mongoose.model('ProjectMember', projectMemberSchema);
