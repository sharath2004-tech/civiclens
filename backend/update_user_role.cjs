require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateUserRole() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update user role
    const email = 'arath@gmail.com'; // Change this to your email
    const newRole = 'admin'; // Change to 'citizen', 'admin', or 'worker'

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { 
        role: newRole,
        department: newRole === 'admin' ? 'Municipal Administration' : undefined
      },
      { new: true }
    );

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log('\n✅ User role updated successfully!');
    console.log('\n📋 Updated User Details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Department:', user.department || 'Not assigned');
    
    console.log('\n🔓 You can now access admin features!');
    console.log('📱 Please log out and log in again to see the changes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

updateUserRole();
