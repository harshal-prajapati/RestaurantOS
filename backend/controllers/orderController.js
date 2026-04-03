const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');

exports.createOrder = async (req, res, next) => {
  try {
    const { tableId, items, notes } = req.body;
    // Validate table
    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    // Enrich items with current prices
    let totalAmount = 0;
    const enrichedItems = await Promise.all(items.map(async (item) => {
      const menuItem = await MenuItem.findById(item.itemId);
      if (!menuItem) throw new Error(`Menu item ${item.itemId} not found`);
      if (!menuItem.availability) throw new Error(`${menuItem.name} is not available`);
      totalAmount += menuItem.price * item.quantity;
      return {
        itemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        preparationStatus: 'pending'
      };
    }));

    const order = await Order.create({
      tableId,
      waiterId: req.user._id,
      items: enrichedItems,
      totalAmount,
      notes
    });

    // Mark table as occupied
    await Table.findByIdAndUpdate(tableId, { status: 'occupied', currentOrderId: order._id });

    const populated = await Order.findById(order._id)
      .populate('tableId', 'tableNumber capacity')
      .populate('waiterId', 'name');

    // Emit to kitchen
    const io = req.app.get('io');
    if (io) {
      io.emit('orderPlaced', populated);
      io.emit('tableUpdated', { tableId, status: 'occupied' });
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.tableId) filter.tableId = req.query.tableId;
    if (req.query.waiterId) filter.waiterId = req.query.waiterId;
    // Date range for reports
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate + 'T23:59:59');
    }
    const orders = await Order.find(filter)
      .populate('tableId', 'tableNumber capacity')
      .populate('waiterId', 'name email')
      .sort('-createdAt')
      .limit(req.query.limit ? parseInt(req.query.limit) : 500);
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) { next(error); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, itemIndex, itemStatus } = req.body;
    const order = await Order.findById(req.params.id)
      .populate('tableId', 'tableNumber capacity')
      .populate('waiterId', 'name');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Update individual item status
    if (itemIndex !== undefined && itemStatus) {
      order.items[itemIndex].preparationStatus = itemStatus;
      // Auto-update overall order status
      const allStatuses = order.items.map(i => i.preparationStatus);
      if (allStatuses.every(s => s === 'ready')) {
        order.status = 'ready';
      } else if (allStatuses.some(s => s === 'ready')) {
        order.status = 'partially_ready';
      } else if (allStatuses.some(s => s === 'preparing')) {
        order.status = 'preparing';
      }
    }

    // Update overall status directly
    if (status) order.status = status;

    await order.save();

    // If served or cancelled, free table
    if (order.status === 'served' || order.status === 'cancelled') {
      await Table.findByIdAndUpdate(order.tableId._id, {
        status: 'available',
        currentOrderId: null
      });
      const io = req.app.get('io');
      if (io) io.emit('tableUpdated', { tableId: order.tableId._id, status: 'available' });
    }

    const io = req.app.get('io');
    if (io) {
      if (itemStatus === 'preparing') io.emit('orderPreparing', order);
      if (itemStatus === 'ready' || order.status === 'ready') io.emit('orderReady', order);
      io.emit('orderStatusUpdated', order);
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) { next(error); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalOrders, servedOrders, cancelledOrders, tableStats, topItems] = await Promise.all([
      Order.countDocuments(),
      Order.find({ status: 'served' }),
      Order.countDocuments({ status: 'cancelled' }),
      Table.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: 'served' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalOrdered: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalOrdered: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalRevenue = servedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const avgRevenue = servedOrders.length > 0 ? totalRevenue / servedOrders.length : 0;
    const availableTables = tableStats.find(s => s._id === 'available')?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        servedOrders: servedOrders.length,
        cancelledOrders,
        avgRevenue: Math.round(avgRevenue * 100) / 100,
        availableTables,
        topItems
      }
    });
  } catch (error) { next(error); }
};

exports.getCategorySales = async (req, res, next) => {
  try {
    const MenuItem = require('../models/MenuItem');
    const data = await Order.aggregate([
      { $match: { status: 'served' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'menuItem'
        }
      },
      { $unwind: { path: '$menuItem', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'menucategories',
          localField: 'menuItem.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.categoryName',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          totalItems: { $sum: '$items.quantity' }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);
    res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};
