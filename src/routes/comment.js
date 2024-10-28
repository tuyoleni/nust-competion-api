import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/index.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();
const dbConnection = mysql.createPool(dbConfig);

// Create Comment
router.post('/comments/create',
    body('blog_id').isNumeric().withMessage('Blog ID must be a number'),
    body('user_id').isNumeric().withMessage('User ID must be a number'),
    body('content').notEmpty().withMessage('Content is required'),
    body('image_id').optional().isNumeric().withMessage('Image ID must be a number'), // Optional image
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { blog_id, user_id, content, image_id } = req.body;

        try {
            const [result] = await dbConnection.execute(
                'INSERT INTO Comments (blog_id, user_id, content, image_id) VALUES (?, ?, ?, ?)',
                [blog_id, user_id, content, image_id]
            );

            res.status(201).json({
                message: "Comment created successfully.",
                comment_id: result.insertId
            });
        } catch (error) {
            console.error('Error creating comment:', error);
            res.status(500).json({ message: 'Failed to create comment', error });
        }
    }
);

// Get All Comments for a Blog
router.get('/comments',
    query('blog_id').isNumeric().withMessage('Blog ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const blogId = req.query.blog_id;

        try {
            const [comments] = await dbConnection.execute(`
                SELECT c.*, i.url as image_url 
                FROM Comments c 
                LEFT JOIN Images i ON c.image_id = i.image_id 
                WHERE c.blog_id = ?
            `, [blogId]);
            res.status(200).json(comments);
        } catch (error) {
            console.error('Error retrieving comments:', error);
            res.status(500).json({ message: 'Failed to retrieve comments', error });
        }
    }
);

// Get Comment Details
router.get('/comments/:commentId',
    param('commentId').isNumeric().withMessage('Comment ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const commentId = req.params.commentId;

        try {
            const [comments] = await dbConnection.execute(`
                SELECT c.*, i.url as image_url 
                FROM Comments c 
                LEFT JOIN Images i ON c.image_id = i.image_id 
                WHERE c.comment_id = ?
            `, [commentId]);

            if (comments.length === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            res.status(200).json(comments[0]);
        } catch (error) {
            console.error('Error retrieving comment:', error);
            res.status(500).json({ message: 'Failed to retrieve comment', error });
        }
    }
);

// Update Comment
router.patch('/comments/:commentId/update',
    param('commentId').isNumeric().withMessage('Comment ID must be a number'),
    body('content').optional().isString().notEmpty().withMessage('Content must be a non-empty string'),
    body('image_id').optional().isNumeric().withMessage('Image ID must be a number'), // Optional image
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const commentId = req.params.commentId;
        const { content, image_id } = req.body;

        try {
            const updates = [];
            const params = [];

            if (content) {
                updates.push('content = ?');
                params.push(content);
            }

            if (image_id) {
                updates.push('image_id = ?');
                params.push(image_id);
            }

            if (updates.length > 0) {
                await dbConnection.execute(`UPDATE Comments SET ${updates.join(', ')} WHERE comment_id = ?`, [...params, commentId]);
            }

            res.status(200).json({ message: 'Comment updated successfully.' });
        } catch (error) {
            console.error('Error updating comment:', error);
            res.status(500).json({ message: 'Failed to update comment', error });
        }
    }
);

// Delete Comment
router.delete('/comments/:commentId',
    param('commentId').isNumeric().withMessage('Comment ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const commentId = req.params.commentId;

        try {
            const [result] = await dbConnection.execute('DELETE FROM Comments WHERE comment_id = ?', [commentId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Comment not found' });
            }

            res.status(200).json({ message: "Comment deleted successfully." });
        } catch (error) {
            console.error('Error deleting comment:', error);
            res.status(500).json({ message: 'Failed to delete comment', error });
        }
    }
);

export default router;
