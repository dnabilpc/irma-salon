// backend/src/routes/authRoutes.js
import express from 'express';
import { forgotPasswordOTP, verifyOTP, resetPasswordDB } from '../controllers/authController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/auth/forgot-password-otp', checkInternalApiKey, forgotPasswordOTP);
router.post('/auth/verify-otp', checkInternalApiKey, verifyOTP);
router.post('/auth/reset-password-db', checkInternalApiKey, resetPasswordDB);

export default router;
