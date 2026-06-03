// backend/src/routes/registrationRoutes.js
import express from 'express';
import {
    registerCustomer,
    getPendingRegistrations,
    getActiveCustomers,
    getRejectedRegistrations,
    approveRegistration,
    rejectRegistration,
} from '../controllers/registrationController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public endpoint: register new customer (called from Next.js Server Action which has API key) ──
router.post('/auth/register', checkInternalApiKey, registerCustomer);

// ── Admin-only endpoints ──
router.get('/admin/registrations/pending',  checkInternalApiKey, getPendingRegistrations);
router.get('/admin/registrations/customers', checkInternalApiKey, getActiveCustomers);
router.get('/admin/registrations/rejected', checkInternalApiKey, getRejectedRegistrations);
router.patch('/admin/registrations/:id/approve', checkInternalApiKey, approveRegistration);
router.patch('/admin/registrations/:id/reject',  checkInternalApiKey, rejectRegistration);

export default router;
