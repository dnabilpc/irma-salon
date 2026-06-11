import express from 'express';
import { getOpeningTimes, updateOpeningTimes } from '../controllers/openingTimeController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/opening-time', checkInternalApiKey, getOpeningTimes);
router.patch('/admin/opening-time', checkInternalApiKey, updateOpeningTimes);

export default router;
