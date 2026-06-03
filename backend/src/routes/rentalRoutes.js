// backend/src/routes/rentalRoutes.js
import express from 'express';
import {
    getRentalsForCustomer,
    getRentalsForAdmin,
    createRental,
    updateRentalStatus,
    cancelRental,
    syncLateRentals,
    getRentalById
} from '../controllers/rentalController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/rentals', checkInternalApiKey, getRentalsForCustomer);
router.get('/admin/rentals', checkInternalApiKey, getRentalsForAdmin);
router.post('/rentals', checkInternalApiKey, createRental);
router.get('/rentals/:id', checkInternalApiKey, getRentalById);
router.patch('/admin/rentals/:id/status', checkInternalApiKey, updateRentalStatus);
router.post('/rentals/:id/cancel', checkInternalApiKey, cancelRental);
router.post('/admin/rentals/sync-late', checkInternalApiKey, syncLateRentals);

export default router;
