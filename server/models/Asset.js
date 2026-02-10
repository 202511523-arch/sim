const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    originalName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['image', '3d', 'data', 'document', 'video', 'audio', 'other'],
        default: 'other'
    },
    mimeType: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    thumbnailUrl: {
        type: String,
        default: null
    },
    size: {
        type: Number,
        required: true
    },
    metadata: {
        width: Number,
        height: Number,
        duration: Number,
        format: String,
        // For 3D models
        vertices: Number,
        faces: Number,
        // For data files
        rowCount: Number,
        columns: [String]
    },
    tags: [{
        type: String,
        trim: true
    }],
    isUsedInCanvas: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes
assetSchema.index({ projectId: 1 });
assetSchema.index({ projectId: 1, type: 1 });
assetSchema.index({ uploadedBy: 1 });

// Helper to determine type from mimetype
assetSchema.statics.getTypeFromMime = function (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return 'data';
    if (mimeType.includes('gltf') || mimeType.includes('obj') || mimeType.includes('fbx') || mimeType.includes('stl')) return '3d';
    return 'other';
};

// Format file size for display
assetSchema.methods.getFormattedSize = function () {
    const bytes = this.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

module.exports = mongoose.model('Asset', assetSchema);
