// backend/src/routes/tryonRoutes.js
import express from 'express';
import multer from 'multer';
import { handleVirtualTryOn } from '../controllers/tryonController.js';

const router = express.Router();

// Configure multer to store uploaded files in memory buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the POST endpoint for the tryon task
// It expects two files named 'person' and 'clothes'
router.post(
    '/virtual-tryon', 
    upload.fields([
        { name: 'person', maxCount: 1 },
        { name: 'clothes', maxCount: 1 }
    ]), 
    handleVirtualTryOn
);

export default router;