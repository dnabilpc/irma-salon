// backend/src/routes/vtoRoutes.js
import express from 'express';
import { getMyVtoStatus, resetVtoUsage, incrementVtoUsage } from '../controllers/vtoController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/vto/status', checkInternalApiKey, getMyVtoStatus);
router.post('/vto/reset', checkInternalApiKey, resetVtoUsage);
router.post('/vto/usage', checkInternalApiKey, incrementVtoUsage);

export default router;
