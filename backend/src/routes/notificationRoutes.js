// backend/src/routes/notificationRoutes.js
import express from 'express';
import { getAdminNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../controllers/notificationController.js';
import { checkInternalApiKey } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/notifications', checkInternalApiKey, getAdminNotifications);
router.patch('/admin/notifications/:id/read', checkInternalApiKey, markNotificationAsRead);
router.post('/admin/notifications/read-all', checkInternalApiKey, markAllNotificationsAsRead);

export default router;
