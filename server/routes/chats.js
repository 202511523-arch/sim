const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const ChatHistory = require('../models/ChatHistory');
const { authenticate } = require('../middleware/auth');

// Validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/chats
 * Get all chat histories for current user
 * Query params: workspace, projectId, limit
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { workspace, projectId, limit = 20, page = 1 } = req.query;

        const query = { userId: req.user._id };
        if (workspace) query.workspace = workspace;
        if (projectId) query.projectId = projectId;

        const chats = await ChatHistory.find(query)
            .select('-messages') // Don't load full messages in list view
            .sort({ isPinned: -1, updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await ChatHistory.countDocuments(query);

        res.json({
            success: true,
            data: {
                chats,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({ success: false, message: 'Failed to get chat histories' });
    }
});

/**
 * GET /api/chats/:id
 * Get specific chat history with full messages
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const chat = await ChatHistory.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat history not found' });
        }

        res.json({
            success: true,
            data: { chat }
        });
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to get chat history' });
    }
});

/**
 * POST /api/chats
 * Create new chat history or update existing one
 */
router.post('/', authenticate, [
    body('workspace').optional().isIn(['chemistry', 'engineering', 'biology', 'medical', 'earthscience', 'math', 'general']),
    body('projectId').optional().isMongoId(),
    body('messages').isArray().withMessage('Messages must be an array'),
    body('title').optional().isString(),
    validate
], async (req, res) => {
    try {
        const { workspace = 'general', projectId, messages, title, chatId } = req.body;

        // If chatId provided, update existing chat
        if (chatId) {
            const chat = await ChatHistory.findOne({
                _id: chatId,
                userId: req.user._id
            });

            if (!chat) {
                return res.status(404).json({ success: false, message: 'Chat history not found' });
            }

            // Append new messages
            chat.messages.push(...messages);
            if (title) chat.title = title;
            await chat.save();

            return res.json({
                success: true,
                data: { chat }
            });
        }

        // Create new chat history
        const chat = await ChatHistory.create({
            userId: req.user._id,
            workspace,
            projectId: projectId || null,
            messages,
            title: title || ''
        });

        res.status(201).json({
            success: true,
            data: { chat }
        });
    } catch (error) {
        console.error('Save chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to save chat history' });
    }
});

/**
 * PUT /api/chats/:id
 * Update chat history (title, pin status)
 */
router.put('/:id', authenticate, [
    body('title').optional().isString(),
    body('isPinned').optional().isBoolean(),
    body('messages').optional().isArray(),
    validate
], async (req, res) => {
    try {
        const { title, isPinned, messages } = req.body;

        const chat = await ChatHistory.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat history not found' });
        }

        if (title !== undefined) chat.title = title;
        if (isPinned !== undefined) chat.isPinned = isPinned;
        if (messages) chat.messages = messages;

        await chat.save();

        res.json({
            success: true,
            data: { chat }
        });
    } catch (error) {
        console.error('Update chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to update chat history' });
    }
});

/**
 * DELETE /api/chats/:id
 * Delete chat history
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const result = await ChatHistory.deleteOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Chat history not found' });
        }

        res.json({
            success: true,
            message: 'Chat history deleted successfully'
        });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete chat history' });
    }
});

module.exports = router;
