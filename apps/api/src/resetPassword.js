// resetPassword.js
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path (e.g., apps/api/src/models/User.js)

async function resetPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/your_database', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const newPassword = '123456';
    // Use the provided hash directly to avoid re-hashing
    const hashedPassword = '$2b$10$9rXDFswymyMT5mvQNbcA5.oDEvWisJBPRJbpISxvrRerlV/axuZyq';
    const result = await User.updateOne(
      { email: 'admin@gmail.com' },
      { $set: { password: hashedPassword, isAdmin: true } }
    );
    console.log('Password reset result:', result);
    console.log('New hashed password:', hashedPassword);
  } catch (err) {
    console.error('Error resetting password:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetPassword();