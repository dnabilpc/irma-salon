// backend/src/routes/paymentRoutes.js
import express from 'express';
import multer from 'multer';
import {
    getPaymentsForAdmin,
    confirmPayment,
    uploadPaymentProof
} from '../controllers/paymentController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // limit to 10MB
});

const router = express.Router();

// Secured admin payments routes
router.get('/admin/payments', checkInternalApiKey, getPaymentsForAdmin);
router.patch('/admin/payments/:id/confirm', checkInternalApiKey, confirmPayment);

// Public/customer upload proof route
router.post('/payments/upload-proof', checkInternalApiKey, upload.single('screenshot'), uploadPaymentProof);

export default router;
