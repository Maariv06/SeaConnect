// testUser.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Remove deprecated options - they're not needed in newer versions
mongoose.connect(process.env.MONGO_URI)// Use 127.0.0.1 instead of localhost
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  process.exit(1);
});

// Define User Schema (matching your existing schema)
const UserSchema = new mongoose.Schema({
  fullName: String,
  name: String, // Some schemas use 'name' instead of 'fullName'
  email: { 
    type: String, 
    required: true,
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['admin', 'seller', 'buyer'],
    default: 'buyer' 
  },
  phone: String,
  location: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Use existing model or create new one
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createTestUser() {
  try {
    console.log('🔄 Checking for existing users...');
    
    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin user found:');
      console.log('   Name:', existingAdmin.fullName || existingAdmin.name);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
    } else {
      console.log('❌ No admin user found. Creating admin...');
      
      // Create admin user
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
      
      const admin = new User({
        fullName: 'Super Admin',
        name: 'Super Admin',
        email: 'admin@seaconnect.com',
        password: hashedPassword,
        role: 'admin',
        phone: '9999999999',
        location: 'Admin Office'
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }
    
    // Check/Create test user
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (testUser) {
      console.log('✅ Test user found:');
      console.log('   Name:', testUser.fullName || testUser.name);
      console.log('   Email:', testUser.email);
      console.log('   Role:', testUser.role);
      
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash(process.env.TEST_PASSWORD, 10);
      testUser.password = hashedPassword;
      await testUser.save();
      console.log('✅ Test user password updated');
    } else {
      console.log('❌ Test user not found. Creating...');
      
      const hashedPassword = await bcrypt.hash(process.env.TEST_PASSWORD, 10);
      
      const newTestUser = new User({
        fullName: 'Test User',
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'buyer',
        phone: '1234567890',
        location: 'Test City'
      });

      await newTestUser.save();
      console.log('✅ Test user created successfully!');
    }
    
    // List all users
    const users = await User.find({}).select('-password');
    console.log('\n📊 Current Users in Database:');
    console.log('===============================');
    users.forEach((user, index) => {
      console.log(`${index + 1}. Name: ${user.fullName || user.name || 'N/A'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Phone: ${user.phone || 'N/A'}`);
      console.log('---');
    });

    console.log('\n✅ Test credentials ready:');
    console.log('===========================');
    console.log('Admin Login:');
    console.log('  Email: admin@seaconnect.com');
    console.log('  Password: (set via environment variable)');
    console.log('\nTest User Login:');
    console.log('  Email: test@example.com');
    console.log('  Password: (set via environment variable)');
    console.log('===========================');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close connection after 2 seconds
    setTimeout(() => {
      mongoose.connection.close()
        .then(() => {
          console.log('📡 Database connection closed');
          process.exit(0);
        })
        .catch(err => {
          console.error('Error closing connection:', err);
          process.exit(1);
        });
    }, 2000);
  }
}

// Check database connection before running
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to DB');
  createTestUser();
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

// Run the function
createTestUser();