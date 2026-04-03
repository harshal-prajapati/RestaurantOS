const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  }
}, { timestamps: true });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
