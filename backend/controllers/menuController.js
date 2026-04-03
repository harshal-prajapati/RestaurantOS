const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await MenuCategory.find().sort('categoryName');
    res.status(200).json({ success: true, data: categories });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.create({ categoryName: req.body.categoryName });
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(
      req.params.id, { categoryName: req.body.categoryName }, { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const itemCount = await MenuItem.countDocuments({ categoryId: req.params.id });
    if (itemCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${itemCount} menu items use this category` });
    }
    const category = await MenuCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
};

// Menu Items
exports.getMenuItems = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.categoryId = req.query.category;
    if (req.query.available !== undefined) filter.availability = req.query.available === 'true';
    const items = await MenuItem.find(filter).populate('categoryId', 'categoryName').sort('name');
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) { next(error); }
};

exports.createMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    const populated = await MenuItem.findById(item._id).populate('categoryId', 'categoryName');
    res.status(201).json({ success: true, data: populated });
  } catch (error) { next(error); }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('categoryId', 'categoryName');
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.status(200).json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) { next(error); }
};
