const mongoose = require('mongoose');

async function main() {
  const uri = 'mongodb+srv://2004sharath:LCjk7u6ZQYcuPHJl@cluster0.15o2inv.mongodb.net/civiclens?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  const User = require('./models/User');
  const user = await User.findOneAndUpdate(
    { email: '2004sharath@gmail.com' },
    { role: 'admin' },
    { new: true }
  );
  console.log('User updated:', user?.email, 'Role:', user?.role);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
