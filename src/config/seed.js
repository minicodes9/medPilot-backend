require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const connectDB = require('./db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const existing = await User.findOne({ email: 'admin@medpilot.com' });
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    await User.create({
      name: 'MedPilot Admin',
      email: 'admin@medpilot.com',
      password: 'Admin@1234',
      role: 'admin',
      isVerified: true,
    });

    console.log('Admin created successfully');
    console.log('Email: admin@medpilot.com');
    console.log('Password: Admin@1234');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seedAdmin();