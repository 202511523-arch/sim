const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * GET /api/notes
 * Get all notes for current user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { projectId, search, page = 1, limit = 50 } = req.query;

        const query = { userId: req.user._id };

        if (projectId) {
            query.linkedProjectId = projectId;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const notes = await Note.find(query)
            .populate('linkedProjectId', 'name category')
            .sort({ isPinned: -1, updatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Note.countDocuments(query);

        res.json({
            success: true,
            data: {
                notes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get notes error:', error);
        res.status(500).json({ success: false, message: 'Failed to get notes' });
    }
});

/**
 * POST /api/notes
 * Create new note
 */
router.post('/', authenticate, [
    body('title').optional().trim().isLength({ max: 200 }),
    body('content').optional(),
    body('color').optional().isHexColor(),
    body('linkedProjectId').optional().isMongoId(),
    validate
], async (req, res) => {
    try {
        const { title, content, color, linkedProjectId, tags } = req.body;

        const note = await Note.create({
            userId: req.user._id,
            title: title || 'Untitled Note',
            content: content || '',
            color: color || '#ffffff',
            linkedProjectId: linkedProjectId || null,
            tags: tags || []
        });

        await note.populate('linkedProjectId', 'name category');

        res.status(201).json({
            success: true,
            data: { note }
        });
    } catch (error) {
        console.error('Create note error:', error);
        res.status(500).json({ success: false, message: 'Failed to create note' });
    }
});

/**
 * GET /api/notes/:id
 * Get single note
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.user._id
        }).populate('linkedProjectId', 'name category');

        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        res.json({
            success: true,
            data: { note }
        });
    } catch (error) {
        console.error('Get note error:', error);
        res.status(500).json({ success: false, message: 'Failed to get note' });
    }
});

/**
 * PUT /api/notes/:id
 * Update note
 */
router.put('/:id', authenticate, [
    body('title').optional().trim().isLength({ max: 200 }),
    body('color').optional().isHexColor(),
    validate
], async (req, res) => {
    try {
        const { title, content, color, isPinned, linkedProjectId, tags } = req.body;

        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;
        if (color !== undefined) note.color = color;
        if (isPinned !== undefined) note.isPinned = isPinned;
        if (linkedProjectId !== undefined) note.linkedProjectId = linkedProjectId;
        if (tags !== undefined) note.tags = tags;

        await note.save();
        await note.populate('linkedProjectId', 'name category');

        res.json({
            success: true,
            data: { note }
        });
    } catch (error) {
        console.error('Update note error:', error);
        res.status(500).json({ success: false, message: 'Failed to update note' });
    }
});

/**
 * DELETE /api/notes/:id
 * Delete note
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const result = await Note.deleteOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete note' });
    }
});

/**
 * PUT /api/notes/:id/pin
 * Toggle note pin status
 */
router.put('/:id/pin', authenticate, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        note.isPinned = !note.isPinned;
        await note.save();

        res.json({
            success: true,
            data: { note }
        });
    } catch (error) {
        console.error('Pin note error:', error);
        res.status(500).json({ success: false, message: 'Failed to pin note' });
    }
});

module.exports = router;
