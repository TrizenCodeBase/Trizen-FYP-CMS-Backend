import mongoose, { Document, Schema } from 'mongoose';

export interface IProblemStatement extends Document {
  id: string;                    // AIM001, AIM002, etc.
  title: string;                 // "AI-Powered Personal Finance Manager"
  abstract: string;              // Detailed description
  technologies: string[];        // ["HTML", "CSS", "JS", "Python"]
  domain: string;               // "AI & Machine Learning"
  category: 'Major' | 'Minor' | 'Capstone';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;             // "8-10 weeks"
  deliverables: string[];       // ["Source Code", "Documentation"]
  prerequisites: string[];      // Required knowledge
  learningOutcomes: string[];   // What students will learn
  status: 'Active' | 'Draft' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
  featured: boolean;            // For highlighting popular projects
  tags: string[];              // For better search/filtering
  createdBy: mongoose.Types.ObjectId;
  viewCount: number;           // Track popularity
}

const ProblemStatementSchema: Schema = new Schema({
  id: {
    type: String,
    required: false, // Auto-generated in pre-save hook
    unique: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v: string) {
        // Only validate if ID is provided and not empty
        // Accept both 2-letter (AI001) and 3-letter (AIM001) formats
        return !v || /^[A-Z]{2,3}\d{3}$/.test(v);
      },
      message: 'ID must be in format like AI001, AIM001, IOT002, etc.'
    }
  },
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  abstract: {
    type: String,
    required: [true, 'Please add an abstract'],
    maxlength: [5000, 'Abstract cannot be more than 5000 characters']
  },
  technologies: [{
    type: String,
    required: true,
    trim: true
  }],
  domain: {
    type: String,
    required: [true, 'Please add a domain'],
    enum: [
      'AI & Machine Learning',
      'IoT & Embedded Systems',
      'Cloud Computing',
      'Web & Mobile Applications',
      'Cybersecurity & Blockchain',
      'Data Science & Analytics',
      'Networking & Communication',
      'Mechanical / ECE Projects'
    ]
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Major', 'Minor', 'Capstone'],
    default: 'Major'
  },
  difficulty: {
    type: String,
    required: [true, 'Please add difficulty level'],
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  duration: {
    type: String,
    required: [true, 'Please add duration'],
    trim: true,
    maxlength: [50, 'Duration cannot be more than 50 characters']
  },
  deliverables: [{
    type: String,
    required: true,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  learningOutcomes: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['Active', 'Draft', 'Archived'],
    default: 'Draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  }
}, {
  timestamps: true
});

// Index for better query performance
ProblemStatementSchema.index({ domain: 1, status: 1 });
ProblemStatementSchema.index({ difficulty: 1, status: 1 });
ProblemStatementSchema.index({ featured: 1, status: 1 });
ProblemStatementSchema.index({ createdBy: 1 });
ProblemStatementSchema.index({ id: 1 });
ProblemStatementSchema.index({ tags: 1 });
ProblemStatementSchema.index({ viewCount: -1 }); // For popular problems

// Domain to prefix mapping
const domainPrefixMap: { [key: string]: string } = {
  'AI & Machine Learning': 'AIM',
  'IoT & Embedded Systems': 'IOT',
  'Cloud Computing': 'CLD',
  'Web & Mobile Applications': 'WEB',
  'Cybersecurity & Blockchain': 'CYS',
  'Data Science & Analytics': 'DAT',
  'Networking & Communication': 'NET',
  'Mechanical / ECE Projects': 'MEC'
};

// Pre-save middleware to generate ID if not provided or invalid
ProblemStatementSchema.pre('save', async function(next) {
  // Check if ID is missing or doesn't match the required format
  if (!this.id || !/^[A-Z]{2,3}\d{3}$/.test(this.id)) {
    // Generate ID based on domain
    const domainPrefix = domainPrefixMap[(this as any).domain] || 'GEN';
    const count = await ProblemStatement.countDocuments({ domain: (this as any).domain });
    (this as any).id = `${domainPrefix}${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

export const ProblemStatement = mongoose.model<IProblemStatement>('ProblemStatement', ProblemStatementSchema);
