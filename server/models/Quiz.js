const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    noteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Note',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number, // Index of the correct option
        explanation: String
    }],
    userAnswers: [Number], // Indicies of user selected options
    score: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

quizSchema.index({ userId: 1, noteId: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
