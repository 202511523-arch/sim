const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Quiz = require('../models/Quiz');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * POST /api/quizzes/generate
 * Generate AI-powered quiz from note content
 */
router.post('/generate', authenticate, [
    body('noteId').isMongoId(),
    body('count').optional().isInt({ min: 1, max: 20 }),
    validate
], async (req, res) => {
    try {
        const { noteId, count = 5 } = req.body;

        // Get note
        const note = await Note.findOne({ _id: noteId, userId: req.user._id });
        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        if (!note.content || note.content.trim().length < 50) {
            return res.status(400).json({ success: false, message: 'Note content too short to generate quiz' });
        }

        // Generate quiz using AI
        const prompt = `Based on the following content, generate ${count} multiple-choice quiz questions. Each question must have 4 options and be written in English.
 
Content:
${note.content.substring(0, 3000)}
 
Respond in the following JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Explanation of the correct answer"
    }
  ]
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: [
                { role: 'system', content: 'You are an educational expert. Generate high-quality quizzes that facilitate learning based on the provided content.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
        });

        const quizData = JSON.parse(response.choices[0].message.content);

        // Save quiz
        const quiz = await Quiz.create({
            userId: req.user._id,
            noteId: note._id,
            projectId: note.linkedProjectId,
            questions: quizData.questions.map(q => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation || ''
            })),
            totalQuestions: quizData.questions.length
        });

        res.json({
            success: true,
            data: { quiz }
        });
    } catch (error) {
        console.error('Generate quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate quiz' });
    }
});

/**
 * GET /api/quizzes
 * Get user's quizzes
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { projectId, limit = 10 } = req.query;

        const query = { userId: req.user._id };
        if (projectId) query.projectId = projectId;

        const quizzes = await Quiz.find(query)
            .populate('noteId', 'title')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: { quizzes }
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ success: false, message: 'Failed to get quizzes' });
    }
});

/**
 * GET /api/quizzes/:id
 * Get specific quiz
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id })
            .populate('noteId', 'title');

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        res.json({
            success: true,
            data: { quiz }
        });
    } catch (error) {
        console.error('Get quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to get quiz' });
    }
});

/**
 * POST /api/quizzes/:id/submit
 * Submit quiz answers
 */
router.post('/:id/submit', authenticate, [
    body('answers').isArray(),
    validate
], async (req, res) => {
    try {
        const { answers } = req.body; // Array of answer indices

        const quiz = await Quiz.findOne({ _id: req.params.id, userId: req.user._id });
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // Calculate score
        let correctCount = 0;
        const results = quiz.questions.map((q, idx) => {
            const userAnswer = answers[idx];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) correctCount++;

            return {
                questionIndex: idx,
                userAnswer,
                correctAnswer: q.correctAnswer,
                isCorrect,
                explanation: q.explanation
            };
        });

        const score = (correctCount / quiz.totalQuestions) * 100;

        // Update quiz
        quiz.isCompleted = true;
        quiz.score = score;
        quiz.completedAt = new Date();
        await quiz.save();

        res.json({
            success: true,
            data: {
                score,
                correctCount,
                totalQuestions: quiz.totalQuestions,
                results
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit quiz' });
    }
});

/**
 * DELETE /api/quizzes/:id
 * Delete quiz
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const result = await Quiz.deleteOne({ _id: req.params.id, userId: req.user._id });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete quiz' });
    }
});

module.exports = router;
