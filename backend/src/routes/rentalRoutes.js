// backend/src/routes/rentalRoutes.js
import express from 'express';
import {
    getRentalsForCustomer,
    getRentalsForAdmin,
    createRental,
    updateRentalStatus,
    cancelRental,
    syncLateRentals,
    getRentalById,
    updateRentalByCustomer,
    updateRentalByAdmin
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
router.put('/rentals/:id', checkInternalApiKey, updateRentalByCustomer);
router.put('/admin/rentals/:id', checkInternalApiKey, updateRentalByAdmin);

export default router;
