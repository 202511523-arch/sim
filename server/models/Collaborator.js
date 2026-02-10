const mongoose = require('mongoose');

/**
 * Collaborator Model
 * Represents a global collaborator relationship between users.
 * Once a user adds another user as a collaborator, they can easily 
 * invite them to any project across all subjects/workspaces.
 */
const collaboratorSchema = new mongoose.Schema({
    // The user who owns this collaborator relationship
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // The collaborator user
    collaboratorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Nickname for the collaborator (optional, for easier identification)
    nickname: {
        type: String,
        trim: true,
        maxlength: 50,
        default: null
    },
    // Status of the relationship
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending'
    },
    // Optional note about this collaborator
    note: {
        type: String,
        maxlength: 200,
        default: null
    },
    // Categories/tags for organization
    tags: [{
        type: String,
        trim: true,
        maxlength: 30
    }],
    // When the collaborator accepted the request
    acceptedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Compound unique index: A user can only have one relationship with each collaborator
collaboratorSchema.index({ userId: 1, collaboratorId: 1 }, { unique: true });
collaboratorSchema.index({ collaboratorId: 1, status: 1 });
collaboratorSchema.index({ userId: 1, status: 1 });

/**
 * Static method to check if two users are collaborators
 */
collaboratorSchema.statics.areCollaborators = async function(userId1, userId2) {
    const relationship = await this.findOne({
        $or: [
            { userId: userId1, collaboratorId: userId2, status: 'accepted' },
            { userId: userId2, collaboratorId: userId1, status: 'accepted' }
        ]
    });
    return !!relationship;
};

/**
 * Static method to get all collaborators for a user
 */
collaboratorSchema.statics.getCollaborators = async function(userId) {
    return this.find({
        userId: userId,
        status: 'accepted'
    }).populate('collaboratorId', 'name email avatar');
};

/**
 * Static method to get pending requests sent TO a user
 */
collaboratorSchema.statics.getPendingRequestsForUser = async function(userId) {
    return this.find({
        collaboratorId: userId,
        status: 'pending'
    }).populate('userId', 'name email avatar');
};

/**
 * Static method to get pending requests sent BY a user
 */
collaboratorSchema.statics.getPendingRequestsByUser = async function(userId) {
    return this.find({
        userId: userId,
        status: 'pending'
    }).populate('collaboratorId', 'name email avatar');
};

/**
 * Accept collaborator request
 */
collaboratorSchema.methods.accept = async function() {
    this.status = 'accepted';
    this.acceptedAt = new Date();
    await this.save();
    
    // Create bi-directional relationship
    const reverseRelationship = await this.constructor.findOne({
        userId: this.collaboratorId,
        collaboratorId: this.userId
    });
    
    if (!reverseRelationship) {
        await this.constructor.create({
            userId: this.collaboratorId,
            collaboratorId: this.userId,
            status: 'accepted',
            acceptedAt: new Date()
        });
    } else if (reverseRelationship.status !== 'accepted') {
        reverseRelationship.status = 'accepted';
        reverseRelationship.acceptedAt = new Date();
        await reverseRelationship.save();
    }
    
    return this;
};

module.exports = mongoose.model('Collaborator', collaboratorSchema);
