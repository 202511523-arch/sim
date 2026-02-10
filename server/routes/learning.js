const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Note = require('../models/Note');
const Quiz = require('../models/Quiz');
const auth = require('../middleware/auth');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Generate Quiz from Note
router.post('/quiz/generate', auth, async (req, res) => {
    try {
        const { noteId } = req.body;
        const note = await Note.findById(noteId);

        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        if (note.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const prompt = `
        Based on the following study note content, generate 3 multiple-choice quiz questions.
        Provide the output in strictly valid JSON format without markdown code blocks.
        The JSON should be an array of objects, where each object has:
        - "question": string
        - "options": array of 4 strings
        - "correctAnswer": number (0-3 index of the correct option)
        - "explanation": string (brief explanation of the answer)

        Note Content:
        ${note.content}
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
                { role: "system", content: "You are a helpful educational AI that generates quizzes from study notes." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: "json_object" }
        });

        let questions = [];
        try {
            // Sometimes OpenAI wraps the array in a key like "questions": [...]
            const parsed = JSON.parse(completion.choices[0].message.content);
            questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        } catch (e) {
            console.error('JSON Parse Error:', e);
            return res.status(500).json({ success: false, message: 'Failed to parse AI response' });
        }

        // Save generated quiz (placeholder, strictly we might want to store it temporarily or overwrite old one)
        // For simplicity, we create a new quiz entry
        const quiz = new Quiz({
            userId: req.user.id,
            noteId: note._id,
            projectId: note.linkedProjectId,
            questions: questions
        });

        await quiz.save();

        res.json({
            success: true,
            data: { quizId: quiz._id, questions }
        });

    } catch (error) {
        console.error('Quiz Generation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate quiz' });
    }
});

// Submit Quiz
router.post('/quiz/submit', auth, async (req, res) => {
    try {
        const { quizId, answers } = req.body;
        const quiz = await Quiz.findById(quizId);

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        if (quiz.userId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let correctCount = 0;
        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.correctAnswer) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);

        quiz.userAnswers = answers;
        quiz.score = score;
        quiz.isCompleted = true;
        await quiz.save();

        // Update Note Progress based on score
        const note = await Note.findById(quiz.noteId);
        if (note) {
            // Simple logic: if score > 80, marked as 100% progress. Else proportional.
            note.quizScore = score;
            note.progress = score >= 80 ? 100 : score;
            await note.save();
        }

        res.json({
            success: true,
            data: {
                score,
                correctCount,
                total: quiz.questions.length,
                results: quiz.questions.map((q, i) => ({
                    correct: answers[i] === q.correctAnswer,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                }))
            }
        });

    } catch (error) {
        console.error('Quiz Submission Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit quiz' });
    }
});

module.exports = router;
