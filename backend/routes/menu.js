const express = require('express');
const router = express.Router();
const {
  getCategories, createCategory, updateCategory, deleteCategory,
  getMenuItems, createMenuItem, updateMenuItem, deleteMenuItem
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

// Categories
router.route('/categories')
  .get(protect, getCategories)
  .post(protect, authorize('admin'), createCategory);
router.route('/categories/:id')
  .put(protect, authorize('admin'), updateCategory)
  .delete(protect, authorize('admin'), deleteCategory);

// Menu Items
router.route('/menu')
  .get(protect, getMenuItems)
  .post(protect, authorize('admin'), createMenuItem);
router.route('/menu/:id')
  .put(protect, authorize('admin'), updateMenuItem)
  .delete(protect, authorize('admin'), deleteMenuItem);

module.exports = router;
