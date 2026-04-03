const Table = require('../models/Table');

exports.getTables = async (req, res, next) => {
  try {
    const tables = await Table.find()
      .populate('currentOrderId')
      .sort('tableNumber');
    res.status(200).json({ success: true, data: tables });
  } catch (error) { next(error); }
};

exports.createTable = async (req, res, next) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (error) { next(error); }
};

exports.updateTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    // Emit socket event
    const io = req.app.get('io');
    if (io) io.emit('tableUpdated', table);
    res.status(200).json({ success: true, data: table });
  } catch (error) { next(error); }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    if (table.status === 'occupied') {
      return res.status(400).json({ success: false, message: 'Cannot delete an occupied table' });
    }
    await Table.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Table deleted' });
  } catch (error) { next(error); }
};
