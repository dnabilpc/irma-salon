// backend/src/routes/adminRoutes.js
import express from 'express';
import { getDashboardStats, uploadImage } from '../controllers/adminController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/dashboard', checkInternalApiKey, getDashboardStats);
router.post('/admin/upload-image', checkInternalApiKey, uploadImage);

export default router;
