// backend/src/routes/paymentRoutes.js
import express from 'express';
import {
    getPaymentsForAdmin,
    confirmPayment
} from '../controllers/paymentController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// Secured admin payments routes
router.get('/admin/payments', checkInternalApiKey, getPaymentsForAdmin);
router.patch('/admin/payments/:id/confirm', checkInternalApiKey, confirmPayment);

export default router;
