const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure AWS
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-northeast-2'
});

const s3 = new AWS.S3();
const bucket = process.env.AWS_S3_BUCKET || 'simvex-assets';

/**
 * Upload file to S3
 */
const uploadFile = async (buffer, originalName, mimeType, projectId) => {
    const ext = path.extname(originalName);
    const key = `projects/${projectId}/${uuidv4()}${ext}`;

    const params = {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'public-read'
    };

    try {
        const result = await s3.upload(params).promise();

        // Generate thumbnail for images
        let thumbnailUrl = null;
        if (mimeType.startsWith('image/') && !mimeType.includes('svg')) {
            // For production, you would use Lambda or Sharp for thumbnail generation
            thumbnailUrl = result.Location; // Using same URL for now
        }

        return {
            url: result.Location,
            key: result.Key,
            thumbnailUrl,
            metadata: extractMetadata(buffer, mimeType)
        };
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload file');
    }
};

/**
 * Delete file from S3
 */
const deleteFile = async (url) => {
    try {
        // Extract key from URL
        const urlObj = new URL(url);
        const key = urlObj.pathname.substring(1); // Remove leading slash

        await s3.deleteObject({
            Bucket: bucket,
            Key: key
        }).promise();

        return true;
    } catch (error) {
        console.error('S3 delete error:', error);
        // Don't throw - file might already be deleted
        return false;
    }
};

/**
 * Get signed URL for private access
 */
const getSignedUrl = async (key, expiresIn = 3600) => {
    try {
        const url = await s3.getSignedUrlPromise('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: expiresIn
        });
        return url;
    } catch (error) {
        console.error('Get signed URL error:', error);
        throw new Error('Failed to generate signed URL');
    }
};

/**
 * Extract metadata from file
 */
const extractMetadata = (buffer, mimeType) => {
    const metadata = {};

    // For images, we could use sharp to get dimensions
    // For 3D files, we could parse vertices/faces
    // This is a placeholder - in production, use appropriate libraries

    if (mimeType.startsWith('image/')) {
        // Would use sharp here
        metadata.format = mimeType.split('/')[1];
    }

    return metadata;
};

/**
 * Copy file within S3
 */
const copyFile = async (sourceKey, destinationKey) => {
    try {
        await s3.copyObject({
            Bucket: bucket,
            CopySource: `${bucket}/${sourceKey}`,
            Key: destinationKey,
            ACL: 'public-read'
        }).promise();

        return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${destinationKey}`;
    } catch (error) {
        console.error('S3 copy error:', error);
        throw new Error('Failed to copy file');
    }
};

/**
 * List files in a project folder
 */
const listProjectFiles = async (projectId) => {
    try {
        const result = await s3.listObjectsV2({
            Bucket: bucket,
            Prefix: `projects/${projectId}/`
        }).promise();

        return result.Contents.map(item => ({
            key: item.Key,
            size: item.Size,
            lastModified: item.LastModified
        }));
    } catch (error) {
        console.error('S3 list error:', error);
        throw new Error('Failed to list files');
    }
};

/**
 * Delete all files in a project folder
 */
const deleteProjectFiles = async (projectId) => {
    try {
        const files = await listProjectFiles(projectId);

        if (files.length === 0) return;

        await s3.deleteObjects({
            Bucket: bucket,
            Delete: {
                Objects: files.map(f => ({ Key: f.key }))
            }
        }).promise();

        return files.length;
    } catch (error) {
        console.error('S3 bulk delete error:', error);
        throw new Error('Failed to delete project files');
    }
};

// Local storage fallback for development
const localUpload = async (buffer, originalName, mimeType, projectId) => {
    const fs = require('fs').promises;
    const uploadDir = path.join(__dirname, '../../uploads', projectId);

    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${uuidv4()}${path.extname(originalName)}`;
    const filepath = path.join(uploadDir, filename);

    await fs.writeFile(filepath, buffer);

    return {
        url: `/uploads/${projectId}/${filename}`,
        key: `${projectId}/${filename}`,
        thumbnailUrl: null,
        metadata: {}
    };
};

// Export based on environment
module.exports = {
    uploadFile: process.env.AWS_ACCESS_KEY_ID ? uploadFile : localUpload,
    deleteFile,
    getSignedUrl,
    copyFile,
    listProjectFiles,
    deleteProjectFiles
};
