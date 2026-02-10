const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Note = require('../models/Note');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/library/pdfs
 * List archived PDFs
 */
router.get('/pdfs', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const assets = await Asset.find({
            uploadedBy: userId,
            mimetype: 'application/pdf'
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Asset.countDocuments({
            uploadedBy: userId,
            mimetype: 'application/pdf'
        });

        res.json({
            success: true,
            data: {
                pdfs: assets,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Library PDF error:', error);
        res.status(500).json({ success: false, message: 'Failed to get PDFs' });
    }
});

/**
 * GET /api/library/notes
 * List all notes (replacing notepad view)
 */
router.get('/notes', authenticate, async (req, res) => {
    try {
        const userId = req.user._id;
        const { category } = req.query; // Optional filter

        const query = { userId };

        // If filtering by category, we need to populate generic logic or just simplistic one
        // For now list all, client can filter or we implement populate filter later.

        const notes = await Note.find(query)
            .populate('linkedProjectId', 'name category')
            .sort({ updatedAt: -1 })
            .limit(50); // initial limit

        res.json({
            success: true,
            data: { notes }
        });
    } catch (error) {
        console.error('Library Notes error:', error);
        res.status(500).json({ success: false, message: 'Failed to get notes' });
    }
});

module.exports = router;
