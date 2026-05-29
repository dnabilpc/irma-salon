// backend/src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tryonRoutes from './routes/tryonRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); 
app.use(express.json());

// Mount our AI routes
app.use('/api', tryonRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "healthy", message: "Try-on backend is active!" });
});

app.listen(PORT, () => {
    console.log(`🚀 AI Backend running on http://localhost:${PORT}`);
});