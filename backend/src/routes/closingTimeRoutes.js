import express from 'express';
import { getClosingTimes, createClosingTime, deleteClosingTime } from '../controllers/closingTimeController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/closing-time', checkInternalApiKey, getClosingTimes);
router.post('/admin/closing-time', checkInternalApiKey, createClosingTime);
router.delete('/admin/closing-time/:id', checkInternalApiKey, deleteClosingTime);

export default router;
