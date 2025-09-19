const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://user:user@cluster0.elcnkyi.mongodb.net/trizen_cms?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Domain to prefix mapping
const domainPrefixMap = {
  'AI & Machine Learning': 'AIM',
  'IoT & Embedded Systems': 'IOT',
  'Cloud Computing': 'CLD',
  'Web & Mobile Applications': 'WEB',
  'Cybersecurity & Blockchain': 'CYS',
  'Data Science & Analytics': 'DAT',
  'Networking & Communication': 'NET',
  'Mechanical / ECE Projects': 'MEC'
};

// Problem Statement Schema (simplified for migration)
const ProblemStatementSchema = new mongoose.Schema({
  id: String,
  title: String,
  domain: String,
  category: String,
  difficulty: String,
  status: String,
  featured: Boolean,
  viewCount: Number,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  updatedAt: Date
}, { timestamps: true });

const ProblemStatement = mongoose.model('ProblemStatement', ProblemStatementSchema);

// Migration function
const migrateIds = async () => {
  try {
    console.log('🔄 Starting ID migration...');
    
    // Get all problems
    const problems = await ProblemStatement.find({});
    console.log(`📊 Found ${problems.length} problems to migrate`);
    
    for (const problem of problems) {
      const domainPrefix = domainPrefixMap[problem.domain] || 'GEN';
      
      // Check if ID needs updating
      if (!problem.id || !/^[A-Z]{2,3}\d{3}$/.test(problem.id)) {
        // Generate new ID
        const count = await ProblemStatement.countDocuments({ 
          domain: problem.domain,
          _id: { $lt: problem._id } // Count problems created before this one
        });
        const newId = `${domainPrefix}${String(count + 1).padStart(3, '0')}`;
        
        console.log(`🔄 Updating ${problem.title}: ${problem.id || 'NO_ID'} → ${newId}`);
        
        // Update the problem
        await ProblemStatement.findByIdAndUpdate(problem._id, { id: newId });
      } else {
        console.log(`✅ ${problem.title}: ${problem.id} (already valid)`);
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run migration
connectDB().then(() => {
  migrateIds();
});
