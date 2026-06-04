// backend/src/routes/paymentRoutes.js
import express from 'express';
import {
    handleMidtransWebhook,
    getPaymentsForAdmin,
    confirmPayment
} from '../controllers/paymentController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public webhook (Midtrans snaps directly to this without auth headers)
router.post('/payments/midtrans-webhook', handleMidtransWebhook);

// Secured admin payments routes
router.get('/admin/payments', checkInternalApiKey, getPaymentsForAdmin);
router.patch('/admin/payments/:id/confirm', checkInternalApiKey, confirmPayment);

export default router;
