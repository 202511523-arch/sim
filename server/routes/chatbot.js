const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
    try {
        const { message, history, workspace = 'general' } = req.body;

        // Basic validation
        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Define system prompts based on workspace
        const systemPrompts = {
            biology: `You are a specialized Biology AI assistant for the SIMVEX platform.
            Your role is to help students understanding biological concepts, cellular structures, ecosystems, and human anatomy.
            
            Key responsibilities:
            1. Explain complex biological terms simply and clearly.
            2. Guide users through the virtual experiments (Cell Culture, Microscopy).
            3. Provide accurate scientific information.
            4. Use emojis (🧬, 🦠, 🌿, 🫀) to make the conversation engaging.
            
            Current context: The user is in the Biology Workspace.`,

            chemistry: `You are a specialized Chemistry AI assistant for the SIMVEX platform.
            Your role is to help students with chemical reactions, periodic table trends, and molecular structures.
            
            Key responsibilities:
            1. Explain reaction mechanisms and stoichiometry.
            2. Assist with virtual titration and flame tests.
            3. Emphasize laboratory safety.
            4. Use emojis (⚗️, 🧪, ⚛️, 🔥) appropriately.
            
            Current context: The user is in the Chemistry Workspace.`,

            engineering: `You are a specialized Engineering AI assistant for the SIMVEX platform.
            Your role is to assist with physics simulations, mechanics, and design problems.
            
            Key responsibilities:
            1. Help with calculations and physics principles.
            2. Guide users through engine assembly and drone flight simulations.
            3. Explain forces, aerodynamics, and structural integrity.
            4. Use emojis (⚙️, 🔧, 🚀, 📐) appropriately.
            
            Current context: The user is in the Engineering Workspace.`,

            earthscience: `You are a specialized Earth Science AI assistant for the SIMVEX platform.
            Your role is to explain geological processes, astronomy, and meteorology.
            
            Key responsibilities:
            1. Explain plate tectonics, weather patterns, and solar system dynamics.
            2. Assist with telescope and universe simulations.
            3. connect concepts to real-world environmental issues.
            4. Use emojis (🌍, 🌋, 🌌, 🌪️) appropriately.
            
            Current context: The user is in the Earth Science Workspace.`,

            math: `You are a specialized Mathematics AI assistant for the SIMVEX platform.
            Your role is to help with mathematical concepts, visualization, and problem-solving.
            
            Key responsibilities:
            1. Explain calculus, algebra, and geometry concepts.
            2. Help visualize functions and vectors.
            3. Provide step-by-step problem solving guidance.
            4. Use emojis (🔢, 📐, 📊, ♾️) appropriately.
            
            Current context: The user is in the Math Workspace.`,

            general: `You are 'DongDong', the general AI assistant for SIMVEX.
            Help the user navigate the platform and answer general questions.
            Always be polite, cheerful, and use emojis to create a friendly atmosphere.`
        };

        const systemContent = systemPrompts[workspace] || systemPrompts['general'];

        // Construct messages array from history + current message
        // History is expected to be an array of { role: 'user' | 'assistant', content: string }
        const messages = [
            {
                role: "system",
                content: systemContent
            },
            ...(history || []),
            { role: "user", content: message }
        ];

        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: messages,
            max_completion_tokens: 2048
        });

        const reply = completion.choices[0].message.content;

        res.json({
            success: true,
            data: {
                role: 'assistant',
                content: reply
            }
        });

    } catch (error) {
        console.error('Chatbot Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request',
            error: error.message
        });
    }
});

module.exports = router;
