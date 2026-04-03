const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTable, deleteTable } = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(protect, getTables)
  .post(protect, authorize('admin'), createTable);
router.route('/:id')
  .patch(protect, updateTable)
  .delete(protect, authorize('admin'), deleteTable);

module.exports = router;
