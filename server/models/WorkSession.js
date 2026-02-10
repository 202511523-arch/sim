const mongoose = require('mongoose');

const workSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    category: {
        type: String,
        enum: ['chemistry', 'mechanical', 'biology', 'medicine', 'earth', 'engineering'],
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: Date.now
    },
    duration: {
        type: Number, // in minutes
        default: 0
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying by user and date
workSessionSchema.index({ userId: 1, startTime: -1 });
workSessionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('WorkSession', workSessionSchema);
