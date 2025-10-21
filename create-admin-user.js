const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./trizen-cms-backend/dist/models/User').default;

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trizen-cms');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@trizenventures.com' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@trizenventures.com');
      console.log('🔑 Password: Trizen@123');
      process.exit(0);
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Trizen@123', saltRounds);
    
    // Create admin user
    const adminUser = new User({
      name: 'System Administrator',
      email: 'admin@trizenventures.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      phone: '+91-0000000000',
      college: 'Trizen Ventures'
    });
    
    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@trizenventures.com');
    console.log('🔑 Password: Trizen@123');
    console.log('👤 Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
