import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  name: string;
  email: string;
  phone: string;
  college: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'resubmitted';
  notes?: string;
  submissionCount?: number;
  lastSubmittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
    maxlength: 10
  },
  college: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  source: {
    type: String,
    default: 'website_popup',
    enum: ['website_popup', 'contact_form', 'referral', 'social_media', 'other']
  },
  status: {
    type: String,
    default: 'new',
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost', 'resubmitted']
  },
  notes: {
    type: String,
    maxlength: 500
  },
  submissionCount: {
    type: Number,
    default: 1,
    min: 1
  },
  lastSubmittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });

export default mongoose.model<ILead>('Lead', LeadSchema);
