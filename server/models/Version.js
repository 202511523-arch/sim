const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        default: function () {
            return `Version ${new Date().toLocaleString()}`;
        },
        maxlength: 100
    },
    description: {
        type: String,
        default: '',
        maxlength: 500
    },
    snapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    thumbnail: {
        type: String,
        default: null
    },
    size: {
        type: Number,
        default: 0
    },
    isAutoSave: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
versionSchema.index({ projectId: 1, createdAt: -1 });
versionSchema.index({ projectId: 1, isAutoSave: 1 });

// Pre-save to calculate size
versionSchema.pre('save', function (next) {
    if (this.isModified('snapshot')) {
        this.size = Buffer.byteLength(JSON.stringify(this.snapshot), 'utf8');
    }
    next();
});

// Static method to get latest version
versionSchema.statics.getLatest = async function (projectId) {
    return this.findOne({ projectId }).sort({ createdAt: -1 });
};

// Static method to cleanup old auto-saves (keep last 10)
versionSchema.statics.cleanupAutoSaves = async function (projectId, keepCount = 10) {
    const autoSaves = await this.find({ projectId, isAutoSave: true })
        .sort({ createdAt: -1 })
        .skip(keepCount)
        .select('_id');

    if (autoSaves.length > 0) {
        await this.deleteMany({
            _id: { $in: autoSaves.map(v => v._id) }
        });
    }

    return autoSaves.length;
};

module.exports = mongoose.model('Version', versionSchema);
