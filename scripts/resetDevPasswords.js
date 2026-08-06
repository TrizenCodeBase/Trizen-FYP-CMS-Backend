// Local dev only: set known passwords for existing accounts.
// Writes the bcrypt hash directly so the model's pre-save hook is not involved.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const targets = [
  { email: 'admin@trizenventures.com', password: 'Trizen@123' },
  { email: 'teststudent@gmail.com', password: 'Student@123' },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = mongoose.connection.db.collection('users');

  for (const target of targets) {
    const doc = await users.findOne({ email: target.email });
    if (!doc) {
      console.log(`MISSING ${target.email}`);
      continue;
    }

    const update = {
      password: await bcrypt.hash(target.password, 10),
      isActive: true,
    };
    if (!doc.name) update.name = 'System Administrator';
    if (!doc.phone) update.phone = '9999999999';
    if (!doc.course) update.course = 'Administration';

    const result = await users.updateOne({ _id: doc._id }, { $set: update });
    console.log(`reset ${target.email} role=${doc.role} modified=${result.modifiedCount}`);
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
