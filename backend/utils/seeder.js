require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');

const connectDB = require('../config/db');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    User.deleteMany(),
    MenuCategory.deleteMany(),
    MenuItem.deleteMany(),
    Table.deleteMany()
  ]);

  // Create users
  await User.create([
    { name: 'Admin User', email: 'admin@admin.com', password: 'admin123', role: 'admin' },
    { name: 'John Waiter', email: 'waiter@waiter.com', password: 'waiter123', role: 'waiter' },
    { name: 'Chef Mike', email: 'kitchen@kitchen.com', password: 'kitchen123', role: 'kitchen' }
  ]);

  // Create categories
  const [starters, mains, desserts, drinks] = await MenuCategory.create([
    { categoryName: 'Starters' },
    { categoryName: 'Main Course' },
    { categoryName: 'Desserts' },
    { categoryName: 'Beverages' }
  ]);

  // Create menu items
  await MenuItem.create([
    { name: 'Spring Rolls', categoryId: starters._id, price: 8.99, availability: true },
    { name: 'Soup of the Day', categoryId: starters._id, price: 6.50, availability: true },
    { name: 'Caesar Salad', categoryId: starters._id, price: 9.99, availability: true },
    { name: 'Grilled Chicken', categoryId: mains._id, price: 18.99, availability: true },
    { name: 'Beef Steak', categoryId: mains._id, price: 28.99, availability: true },
    { name: 'Pasta Carbonara', categoryId: mains._id, price: 15.99, availability: true },
    { name: 'Veggie Burger', categoryId: mains._id, price: 13.99, availability: true },
    { name: 'Fish & Chips', categoryId: mains._id, price: 16.99, availability: true },
    { name: 'Chocolate Cake', categoryId: desserts._id, price: 7.99, availability: true },
    { name: 'Ice Cream', categoryId: desserts._id, price: 5.99, availability: true },
    { name: 'Tiramisu', categoryId: desserts._id, price: 8.99, availability: true },
    { name: 'Soft Drink', categoryId: drinks._id, price: 2.99, availability: true },
    { name: 'Fresh Juice', categoryId: drinks._id, price: 4.99, availability: true },
    { name: 'Coffee', categoryId: drinks._id, price: 3.50, availability: true },
    { name: 'Mineral Water', categoryId: drinks._id, price: 1.99, availability: true }
  ]);

  // Create tables
  await Table.create([
    { tableNumber: 1, capacity: 2 },
    { tableNumber: 2, capacity: 2 },
    { tableNumber: 3, capacity: 4 },
    { tableNumber: 4, capacity: 4 },
    { tableNumber: 5, capacity: 6 },
    { tableNumber: 6, capacity: 6 },
    { tableNumber: 7, capacity: 8 },
    { tableNumber: 8, capacity: 8 }
  ]);

  console.log('Database seeded successfully!');
  console.log('Admin: admin@admin.com / admin123');
  console.log('Waiter: waiter@waiter.com / waiter123');
  console.log('Kitchen: kitchen@kitchen.com / kitchen123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
