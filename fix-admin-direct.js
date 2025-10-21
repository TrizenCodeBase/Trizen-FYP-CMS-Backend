// Direct database fix for admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function fixAdminUser() {
  try {
    await mongoose.connect('mongodb://localhost:27017/trizen-cms');
    console.log('🔗 Connected to MongoDB');
    
    // Import User model
    const User = require('./trizen-cms-backend/dist/models/User').default;
    
    // Find the existing admin user
    const existingUser = await User.findOne({ email: 'admin@trizenventures.com' });
    
    if (existingUser) {
      console.log('👤 Found existing admin user:', existingUser.email);
      console.log('📋 Current fields:', {
        name: existingUser.name,
        email: existingUser.email,
        phone: existingUser.phone,
        course: existingUser.course,
        role: existingUser.role
      });
      
      // Update the user with missing fields
      existingUser.phone = '9999999999';
      existingUser.course = 'Administration';
      existingUser.college = 'Trizen Ventures';
      
      await existingUser.save();
      console.log('✅ Admin user updated successfully!');
      
      // Test login
      console.log('🧪 Testing login...');
      const loginData = {
        email: 'admin@trizenventures.com',
        password: 'Trizen@123'
      };
      
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      const result = await response.json();
      console.log('🔐 Login test result:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Login test successful!');
        console.log('📧 Email: admin@trizenventures.com');
        console.log('🔑 Password: Trizen@123');
      } else {
        console.log('❌ Login test failed:', result.message || result.error);
      }
      
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixAdminUser();
