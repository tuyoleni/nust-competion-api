// src/routes/image.js
import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { dbConfig, s3Config } from '../config/index.js';
import mysql from 'mysql2/promise';
import fs from 'fs'; // Importing fs module
import { v4 as uuidv4 } from 'uuid'; // To generate unique filenames

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files

const dbConnection = mysql.createPool(dbConfig);
const s3 = new S3Client(s3Config);

// Image upload endpoint
router.post('/upload', upload.single('image'), async (req, res) => {
    const { uploader_id } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // Upload file to S3
        const fileContent = fs.readFileSync(req.file.path);
        const bucketName = 'nust-competition-images';
        const fileName = `${uuidv4()}_${req.file.originalname}`; // Unique filename
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: fileContent,
            ContentType: req.file.mimetype,
        });

        await s3.send(command);

        // Store image URL in the database
        const imageUrl = `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${fileName}`;
        await dbConnection.execute(
            'INSERT INTO Images (url, uploader_id) VALUES (?, ?)',
            [imageUrl, uploader_id]
        );

        // Clean up the temporary file
        fs.unlinkSync(req.file.path);

        res.status(201).json({ message: 'Image uploaded successfully', imageUrl });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ message: 'Image upload failed', error });
    }
});

export default router;
