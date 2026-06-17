// backend/src/routes/tryonRoutes.js
import express from 'express';
import multer from 'multer';
import { handleVirtualTryOn, getVtoTaskStatus } from '../controllers/tryonController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer to store uploaded files in memory buffers
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the POST endpoint for the tryon task
// It expects two files named 'person' and 'clothes'
router.post(
    '/virtual-tryon', 
    checkInternalApiKey,
    upload.fields([
        { name: 'person', maxCount: 1 },
        { name: 'clothes', maxCount: 1 }
    ]), 
    handleVirtualTryOn
);

// Define the GET endpoint for polling tryon task status
router.get('/vto/task/:id', checkInternalApiKey, getVtoTaskStatus);

export default router;