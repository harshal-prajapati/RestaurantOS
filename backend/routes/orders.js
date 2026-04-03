const express = require('express');
const router = express.Router();
const { createOrder, getOrders, updateOrderStatus, getAnalytics, getCategorySales } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getOrders)
  .post(protect, authorize('waiter', 'admin'), createOrder);
router.route('/:id/status')
  .patch(protect, updateOrderStatus);
router.get('/analytics/summary', protect, authorize('admin'), getAnalytics);
router.get('/analytics/category-sales', protect, authorize('admin'), getCategorySales);

module.exports = router;
