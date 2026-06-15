// backend/src/routes/registrationRoutes.js
import express from 'express';
import {
    registerCustomer,
    getPendingRegistrations,
    getActiveCustomers,
    getRejectedRegistrations,
    approveRegistration,
    rejectRegistration,
    getSidebarCounts,
    sendRegistrationOTP,
    verifyRegistrationOTP,
    adminCreateCustomer,
} from '../controllers/registrationController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public endpoint: register new customer (called from Next.js Server Action which has API key) ──
router.post('/auth/register', checkInternalApiKey, registerCustomer);
router.post('/auth/send-registration-otp', checkInternalApiKey, sendRegistrationOTP);
router.post('/auth/verify-registration-otp', checkInternalApiKey, verifyRegistrationOTP);

// ── Admin-only endpoints ──
router.get('/admin/dashboard/sidebar-counts', checkInternalApiKey, getSidebarCounts);
router.get('/admin/registrations/pending',  checkInternalApiKey, getPendingRegistrations);
router.get('/admin/registrations/customers', checkInternalApiKey, getActiveCustomers);
router.get('/admin/registrations/rejected', checkInternalApiKey, getRejectedRegistrations);
router.patch('/admin/registrations/:id/approve', checkInternalApiKey, approveRegistration);
router.patch('/admin/registrations/:id/reject',  checkInternalApiKey, rejectRegistration);
router.post('/admin/customers/create', checkInternalApiKey, adminCreateCustomer);

export default router;
