const express = require('express');
const router = express.Router();
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const { authenticate } = require('../middleware/auth');
const { hasProjectAccess, canEditProject } = require('../middleware/permission');
const storageService = require('../services/storage');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept most file types for engineering assets
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'video/mp4', 'video/webm',
            'audio/mpeg', 'audio/wav',
            'application/pdf',
            'text/csv', 'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'model/gltf-binary', 'model/gltf+json',
            'application/octet-stream' // For .obj, .stl, .fbx files
        ];

        if (allowedMimes.includes(file.mimetype) ||
            file.originalname.match(/\.(obj|stl|fbx|step|stp|iges|igs|3ds|blend|dae)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

/**
 * GET /api/projects/:projectId/assets
 * Get all assets for a project
 */
router.get('/projects/:projectId/assets', authenticate, hasProjectAccess, async (req, res) => {
    try {
        const { type, page = 1, limit = 50 } = req.query;

        const query = { projectId: req.params.projectId };
        if (type) query.type = type;

        const assets = await Asset.find(query)
            .populate('uploadedBy', 'name avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Asset.countDocuments(query);

        res.json({
            success: true,
            data: {
                assets,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get assets error:', error);
        res.status(500).json({ success: false, message: 'Failed to get assets' });
    }
});

/**
 * POST /api/projects/:projectId/assets
 * Upload new asset
 */
router.post('/projects/:projectId/assets',
    authenticate,
    canEditProject,
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const { name, tags } = req.body;

            // Upload to storage (S3)
            const uploadResult = await storageService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype,
                req.params.projectId
            );

            // Create asset record
            const asset = await Asset.create({
                projectId: req.params.projectId,
                uploadedBy: req.user._id,
                name: name || req.file.originalname,
                originalName: req.file.originalname,
                type: Asset.getTypeFromMime(req.file.mimetype),
                mimeType: req.file.mimetype,
                url: uploadResult.url,
                thumbnailUrl: uploadResult.thumbnailUrl,
                size: req.file.size,
                metadata: uploadResult.metadata || {},
                tags: tags ? JSON.parse(tags) : []
            });

            await asset.populate('uploadedBy', 'name avatar');

            res.status(201).json({
                success: true,
                data: { asset }
            });
        } catch (error) {
            console.error('Upload asset error:', error);
            res.status(500).json({ success: false, message: 'Failed to upload asset' });
        }
    }
);

/**
 * POST /api/projects/:projectId/assets/bulk
 * Upload multiple assets
 */
router.post('/projects/:projectId/assets/bulk',
    authenticate,
    canEditProject,
    upload.array('files', 10), // Max 10 files at once
    async (req, res) => {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'No files uploaded' });
            }

            const assets = [];

            for (const file of req.files) {
                const uploadResult = await storageService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    req.params.projectId
                );

                const asset = await Asset.create({
                    projectId: req.params.projectId,
                    uploadedBy: req.user._id,
                    name: file.originalname,
                    originalName: file.originalname,
                    type: Asset.getTypeFromMime(file.mimetype),
                    mimeType: file.mimetype,
                    url: uploadResult.url,
                    thumbnailUrl: uploadResult.thumbnailUrl,
                    size: file.size,
                    metadata: uploadResult.metadata || {}
                });

                assets.push(asset);
            }

            await Asset.populate(assets, { path: 'uploadedBy', select: 'name avatar' });

            res.status(201).json({
                success: true,
                data: { assets }
            });
        } catch (error) {
            console.error('Bulk upload error:', error);
            res.status(500).json({ success: false, message: 'Failed to upload assets' });
        }
    }
);

/**
 * GET /api/assets/:id
 * Get single asset
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate('uploadedBy', 'name avatar')
            .populate('projectId', 'name');

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Check access (simplified - should check project membership)
        res.json({
            success: true,
            data: { asset }
        });
    } catch (error) {
        console.error('Get asset error:', error);
        res.status(500).json({ success: false, message: 'Failed to get asset' });
    }
});

/**
 * PUT /api/assets/:id
 * Update asset metadata
 */
router.put('/:id', authenticate, [
    body('name').optional().trim().notEmpty(),
    body('tags').optional().isArray(),
], async (req, res) => {
    try {
        const { name, tags, isUsedInCanvas } = req.body;

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        if (name) asset.name = name;
        if (tags) asset.tags = tags;
        if (isUsedInCanvas !== undefined) asset.isUsedInCanvas = isUsedInCanvas;

        await asset.save();

        res.json({
            success: true,
            data: { asset }
        });
    } catch (error) {
        console.error('Update asset error:', error);
        res.status(500).json({ success: false, message: 'Failed to update asset' });
    }
});

/**
 * DELETE /api/assets/:id
 * Delete asset
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        // Delete from storage
        await storageService.deleteFile(asset.url);
        if (asset.thumbnailUrl) {
            await storageService.deleteFile(asset.thumbnailUrl);
        }

        await asset.deleteOne();

        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });
    } catch (error) {
        console.error('Delete asset error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete asset' });
    }
});

module.exports = router;
