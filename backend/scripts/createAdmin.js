// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/seaconnect', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  location: String
});

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists:');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      
      // Ask if you want to reset password
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Do you want to reset admin password? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          const newPassword = 'Admin@123';
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          
          existingAdmin.password = hashedPassword;
          await existingAdmin.save();
          
          console.log('✅ Password reset successfully!');
          console.log('New password:', newPassword);
        }
        readline.close();
        mongoose.disconnect();
      });
    } else {
      // Create new admin
      const password = 'Admin@123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const admin = new User({
        fullName: 'Super Admin',
        email: 'admin@seaconnect.com',
        password: hashedPassword,
        role: 'admin',
        phone: '9999999999',
        location: 'Admin Office'
      });

      await admin.save();
      
      console.log('✅ Admin created successfully!');
      console.log('📧 Email: admin@seaconnect.com');
      console.log('🔑 Password: Admin@123');
      console.log('\n⚠️  Please change the password after first login!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    setTimeout(() => mongoose.disconnect(), 2000);
  }
}

createAdmin();