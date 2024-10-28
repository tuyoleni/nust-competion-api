import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../config/index.js';
import { body, param, query, validationResult } from 'express-validator';

const router = express.Router();
const dbConnection = mysql.createPool(dbConfig);

// Create Message
router.post('/messages/create',
    body('sender_id').isNumeric().withMessage('Sender ID must be a number'),
    body('recipient_group').isIn(['all', 'admin', 'users']).withMessage('Recipient group must be either "all", "admin", or "users"'),
    body('content').notEmpty().withMessage('Content is required'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const { sender_id, recipient_group, content } = req.body;

        try {
            const [result] = await dbConnection.execute(
                'INSERT INTO Messages (sender_id, recipient_group, content) VALUES (?, ?, ?)',
                [sender_id, recipient_group, content]
            );

            res.status(201).json({
                message: "Message sent successfully.",
                message_id: result.insertId
            });
        } catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ message: 'Failed to send message', error });
        }
    }
);

// Get All Messages
router.get('/messages', async (req, res) => {
    try {
        const [messages] = await dbConnection.execute('SELECT * FROM Messages ORDER BY sent_date DESC');
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ message: 'Failed to retrieve messages', error });
    }
});

// Get Message Details
router.get('/messages/:messageId',
    param('messageId').isNumeric().withMessage('Message ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const messageId = req.params.messageId;

        try {
            const [messages] = await dbConnection.execute('SELECT * FROM Messages WHERE message_id = ?', [messageId]);

            if (messages.length === 0) {
                return res.status(404).json({ message: 'Message not found' });
            }

            res.status(200).json(messages[0]);
        } catch (error) {
            console.error('Error retrieving message:', error);
            res.status(500).json({ message: 'Failed to retrieve message', error });
        }
    }
);

// Update Message
router.patch('/messages/:messageId/update',
    param('messageId').isNumeric().withMessage('Message ID must be a number'),
    body('content').optional().isString().notEmpty().withMessage('Content must be a non-empty string'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const messageId = req.params.messageId;
        const { content } = req.body;

        try {
            if (content) {
                await dbConnection.execute('UPDATE Messages SET content = ? WHERE message_id = ?', [content, messageId]);
            }

            res.status(200).json({ message: 'Message updated successfully.' });
        } catch (error) {
            console.error('Error updating message:', error);
            res.status(500).json({ message: 'Failed to update message', error });
        }
    }
);

// Delete Message
router.delete('/messages/:messageId',
    param('messageId').isNumeric().withMessage('Message ID must be a number'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validation failed", errors: errors.array() });
        }

        const messageId = req.params.messageId;

        try {
            const [result] = await dbConnection.execute('DELETE FROM Messages WHERE message_id = ?', [messageId]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Message not found' });
            }

            res.status(200).json({ message: "Message deleted successfully." });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ message: 'Failed to delete message', error });
        }
    }
);

export default router;
