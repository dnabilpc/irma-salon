// backend/src/routes/bookingRoutes.js
import express from 'express';
import {
    getSalonServices,
    getAvailableSlots,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    getBookingsForAdmin,
    getBookingsForCustomer,
    getBookingById,
    triggerRemindersTest
} from '../controllers/bookingController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/bookings/test/reminders', triggerRemindersTest);
router.post('/bookings/test/reminders', triggerRemindersTest);

router.get('/bookings/services', checkInternalApiKey, getSalonServices);
router.get('/bookings/slots', checkInternalApiKey, getAvailableSlots);
router.get('/bookings', checkInternalApiKey, getBookingsForCustomer);
router.get('/bookings/:id', checkInternalApiKey, getBookingById);
router.get('/admin/bookings', checkInternalApiKey, getBookingsForAdmin);
router.post('/bookings', checkInternalApiKey, createBooking);
router.post('/bookings/:id/cancel', checkInternalApiKey, cancelBooking);
router.patch('/admin/bookings/:id/status', checkInternalApiKey, updateBookingStatus);

export default router;
