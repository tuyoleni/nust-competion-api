import express from 'express';
import mysql from 'mysql2/promise';
import { s3Config, dbConfig } from './config/index.js';
import userRoutes from './routes/user.js';
import competitionRoutes from './routes/competition.js';
import teamRoutes from './routes/team.js';
import messageRoutes from './routes/message.js';
import imageRoutes from './routes/image.js';
import blogRoutes from './routes/blog.js';
import commentRoutes from './routes/comment.js';

const app = express();
app.use(express.json());

const dbConnection = mysql.createPool(dbConfig);

// Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/competitions', competitionRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/blogs', blogRoutes);
app.use('/api/v1/comments', commentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
