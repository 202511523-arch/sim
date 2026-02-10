const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const invitationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        unique: true,
        default: () => uuidv4()
    },
    role: {
        type: String,
        enum: ['editor', 'viewer'],
        default: 'viewer'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'expired', 'cancelled'],
        default: 'pending'
    },
    message: {
        type: String,
        default: '',
        maxlength: 500
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    acceptedAt: {
        type: Date,
        default: null
    },
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, {
    timestamps: true
});

// Indexes
invitationSchema.index({ projectId: 1, email: 1 });
invitationSchema.index({ email: 1, status: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Check if invitation is valid
invitationSchema.methods.isValid = function () {
    return this.status === 'pending' && new Date() < this.expiresAt;
};

// Accept invitation
invitationSchema.methods.accept = async function (userId) {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    this.acceptedBy = userId;
    await this.save();
};

// Static method to find valid invitation by token
invitationSchema.statics.findValidByToken = async function (token) {
    return this.findOne({
        token,
        status: 'pending',
        expiresAt: { $gt: new Date() }
    })
        .populate('projectId', 'name category thumbnail')
        .populate('invitedBy', 'name email avatar');
};

// Static method to cleanup expired invitations
invitationSchema.statics.cleanupExpired = async function () {
    const result = await this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: new Date() }
        },
        {
            status: 'expired'
        }
    );
    return result.modifiedCount;
};

module.exports = mongoose.model('Invitation', invitationSchema);
