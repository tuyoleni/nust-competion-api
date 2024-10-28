import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/index.js';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();
const dbConnection = mysql.createPool(dbConfig);

// Create Blog
router.post('/blogs/create',
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('author_id').isNumeric().withMessage('Author ID must be a number'),
    body('image_id').optional().isNumeric().withMessage('Image ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { title, content, author_id, image_id } = req.body;

        try {
            const [result] = await dbConnection.execute(
                'INSERT INTO Blogs (title, content, author_id, image_id) VALUES (?, ?, ?, ?)',
                [title, content, author_id, image_id]
            );

            res.status(201).json({
                message: "Blog created successfully.",
                blog_id: result.insertId
            });
        } catch (error) {
            console.error('Error creating blog:', error);
            res.status(500).json({ message: 'Failed to create blog', error });
        }
    }
);

// Get All Blogs with Optional Images
router.get('/blogs', async (req, res) => {
    try {
        const [blogs] = await dbConnection.execute(`
            SELECT b.*, i.url as image_url 
            FROM Blogs b 
            LEFT JOIN Images i ON b.image_id = i.image_id
        `);
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error retrieving blogs:', error);
        res.status(500).json({ message: 'Failed to retrieve blogs', error });
    }
});

// Get Blog Details with Comments and Optional Image
router.get('/blogs/:blogId',
    param('blogId').isNumeric().withMessage('Blog ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const blogId = req.params.blogId;

        try {
            const [blogDetails] = await dbConnection.execute(`
                SELECT b.*, i.url as image_url 
                FROM Blogs b 
                LEFT JOIN Images i ON b.image_id = i.image_id 
                WHERE b.blog_id = ?
            `, [blogId]);

            if (blogDetails.length === 0) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            // Fetch comments related to the blog
            const [comments] = await dbConnection.execute(`
                SELECT c.*, i.url as image_url 
                FROM Comments c 
                LEFT JOIN Images i ON c.image_id = i.image_id 
                WHERE c.blog_id = ?
            `, [blogId]);

            res.status(200).json({ blog: blogDetails[0], comments });
        } catch (error) {
            console.error('Error retrieving blog:', error);
            res.status(500).json({ message: 'Failed to retrieve blog', error });
        }
    }
);

// Update Blog
router.patch('/blogs/:blogId/update',
    param('blogId').isNumeric().withMessage('Blog ID must be a number'),
    body('title').optional().isString().notEmpty().withMessage('Title must be a non-empty string'),
    body('content').optional().isString().notEmpty().withMessage('Content must be a non-empty string'),
    body('image_id').optional().isNumeric().withMessage('Image ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const blogId = req.params.blogId;
        const { title, content, image_id } = req.body;

        try {
            const updates = [];
            const params = [];

            if (title) {
                updates.push('title = ?');
                params.push(title);
            }

            if (content) {
                updates.push('content = ?');
                params.push(content);
            }

            if (image_id) {
                updates.push('image_id = ?');
                params.push(image_id);
            }

            if (updates.length > 0) {
                await dbConnection.execute(`UPDATE Blogs SET ${updates.join(', ')} WHERE blog_id = ?`, [...params, blogId]);
            }

            res.status(200).json({ message: 'Blog updated successfully.' });
        } catch (error) {
            console.error('Error updating blog:', error);
            res.status(500).json({ message: 'Failed to update blog', error });
        }
    }
);

// Delete Blog
router.delete('/blogs/:blogId',
    param('blogId').isNumeric().withMessage('Blog ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const blogId = req.params.blogId;

        try {
            const [result] = await dbConnection.execute('DELETE FROM Blogs WHERE blog_id = ?', [blogId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            res.status(200).json({ message: "Blog deleted successfully." });
        } catch (error) {
            console.error('Error deleting blog:', error);
            res.status(500).json({ message: 'Failed to delete blog', error });
        }
    }
);

export default router;
