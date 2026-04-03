const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  preparationStatus: {
    type: String,
    enum: ['pending', 'preparing', 'ready'],
    default: 'pending'
  }
});

const orderSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: [true, 'Table is required']
  },
  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Waiter is required']
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'partially_ready', 'ready', 'served', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, { timestamps: true });

// Auto-update order status based on item statuses
orderSchema.methods.updateOrderStatus = function() {
  const statuses = this.items.map(item => item.preparationStatus);
  if (statuses.every(s => s === 'ready')) {
    this.status = 'ready';
  } else if (statuses.some(s => s === 'preparing' || s === 'ready')) {
    this.status = statuses.some(s => s === 'ready') ? 'partially_ready' : 'preparing';
  }
};

module.exports = mongoose.model('Order', orderSchema);
