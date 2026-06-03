// backend/src/routes/authRoutes.js
import express from 'express';
import { forgotPasswordOTP, verifyOTP, resetPasswordDB, updateProfile, resolveEmailByPhone } from '../controllers/authController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/auth/forgot-password-otp', checkInternalApiKey, forgotPasswordOTP);
router.post('/auth/verify-otp', checkInternalApiKey, verifyOTP);
router.post('/auth/reset-password-db', checkInternalApiKey, resetPasswordDB);
router.patch('/auth/profile', checkInternalApiKey, updateProfile);
router.get('/auth/resolve-email', checkInternalApiKey, resolveEmailByPhone);

export default router;
