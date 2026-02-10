const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Workspace-specific system prompts
const WORKSPACE_PROMPTS = {
    chemistry: `You are an AI assistant who is an expert in Chemistry. 
When users ask questions about molecular structures, chemical reactions, the periodic table, or compound properties, 
please provide professional and friendly answers. Please respond in English.`,

    mechanical: `You are an AI assistant who is an expert in Mechanical Engineering.
Please provide professional and practical advice on questions regarding CAD design, mechanical simulation, 3D modeling, and engineering calculations. Please respond in English.`,

    engineering: `You are an AI assistant who is an expert in Engineering.
Please provide professional and practical advice on questions regarding CAD design, mechanical simulation, 3D modeling, physics, aerodynamics, and engineering calculations. Please respond in English.`,

    biology: `You are an AI assistant who is an expert in Life Sciences.
Please explain questions about cell biology, genetics, ecology, and biochemistry in a scientifically accurate and easy-to-understand manner. Please respond in English.`,

    medicine: `You are an AI assistant who is an expert in the medical field.
Please provide accurate and careful answers to educational questions about human anatomy, physiology, pathology, and diagnosis. Please respond in English.
Note: You do not provide actual medical diagnosis or treatment advice.`,

    medical: `You are an AI assistant who is an expert in the medical field.
Please provide accurate and careful answers to educational questions about human anatomy, physiology, pathology, and diagnosis. Please respond in English.
Note: You do not provide actual medical diagnosis or treatment advice.`,

    earthscience: `You are an AI assistant who is an expert in Earth Science.
Please explain questions about astronomy, geology, meteorology, and oceanography in a scientific and interesting way. Please respond in English.`,

    math: `You are an AI assistant who is an expert in Mathematics.
Please explain questions about calculus, algebra, geometry, statistics, and mathematical concepts clearly with step-by-step solutions. Please respond in English.`,

    general: `You are 'DongDong', a friendly AI assistant for the SIMVEX platform.
You help with a variety of science and engineering topics.
Please explain in a friendly and easy-to-understand way. Please respond in English.`
};

/**
 * POST /api/chat
 * Chat with AI assistant
 * Body: { message, history?, workspace? }
 */
router.post('/', async (req, res) => {
    try {
        const { message, history = [], workspace = 'general' } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Please enter a message.'
            });
        }

        // Get workspace-specific system prompt
        const systemPrompt = WORKSPACE_PROMPTS[workspace] || WORKSPACE_PROMPTS.general;

        // Build messages array
        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Add history (limit to last 10 messages for context)
        const recentHistory = history.slice(-10);
        messages.push(...recentHistory);

        // Add current message
        messages.push({ role: 'user', content: message });

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-5-mini',
            messages: messages,
            max_completion_tokens: 2048
        });

        const reply = completion.choices[0].message.content;

        res.json({
            success: true,
            data: {
                content: reply,
                model: completion.model,
                usage: completion.usage
            }
        });

    } catch (error) {
        console.error('Chat API Error:', error);

        // Handle specific OpenAI errors
        if (error.code === 'insufficient_quota') {
            return res.status(429).json({
                success: false,
                message: 'OpenAI API quota has been exceeded.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while generating the chat response.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
