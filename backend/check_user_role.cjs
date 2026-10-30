require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUserRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const email = 'arath@gmail.com'; // Change this to your email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log('\n📋 Current User Details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Department:', user.department || 'Not assigned');
    console.log('Designation:', user.designation || 'Not assigned');
    
    console.log('\n');
    console.log('🔍 To change role to admin, use the update_user_role.cjs script');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserRole();
