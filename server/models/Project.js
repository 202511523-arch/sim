const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        default: '',
        maxlength: 1000
    },
    category: {
        type: String,
        enum: ['chemistry', 'engineering', 'biology', 'medical', 'earthscience'],
        required: true
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    thumbnail: {
        type: String,
        default: null
    },
    canvasState: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            objects: [],
            background: '#ffffff',
            width: 1920,
            height: 1080
        }
    },
    settings: {
        isPublic: {
            type: Boolean,
            default: false
        },
        allowComments: {
            type: Boolean,
            default: true
        },
        autoSaveInterval: {
            type: Number,
            default: 30000 // 30 seconds
        }
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        lastEditedAt: {
            type: Date,
            default: Date.now
        },
        lastEditedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    tags: [{
        type: String,
        trim: true
    }],
    workspaceStates: {
        type: Map,
        of: {
            state: mongoose.Schema.Types.Mixed,
            lastModified: Date
        },
        default: new Map()
    }
}, {
    timestamps: true
});

// Indexes
projectSchema.index({ ownerId: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ 'settings.isPublic': 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Virtual for members count
projectSchema.virtual('membersCount', {
    ref: 'ProjectMember',
    localField: '_id',
    foreignField: 'projectId',
    count: true
});

// Virtual for versions count
projectSchema.virtual('versionsCount', {
    ref: 'Version',
    localField: '_id',
    foreignField: 'projectId',
    count: true
});

// Virtual for assets count
projectSchema.virtual('assetsCount', {
    ref: 'Asset',
    localField: '_id',
    foreignField: 'projectId',
    count: true
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);
