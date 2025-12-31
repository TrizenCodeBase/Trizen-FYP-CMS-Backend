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
  // Project funnel fields
  domain?: string;
  pdfToken?: string;
  pdfTokenExpiresAt?: Date;
  pdfDownloaded?: boolean;
  pdfDownloadedAt?: Date;
  whatsappSent?: boolean;
  whatsappSentAt?: Date;
  whatsappMessageId?: string;
  pdfLink?: string;
  campaignId?: string;
  ipAddress?: string;
  userAgent?: string;
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
    enum: ['website_popup', 'contact_form', 'referral', 'social_media', 'bulk_email_funnel', 'other']
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
  },
  // Project funnel fields
  domain: {
    type: String,
    trim: true
  },
  pdfToken: {
    type: String,
    unique: true,
    sparse: true
  },
  pdfTokenExpiresAt: {
    type: Date
  },
  pdfDownloaded: {
    type: Boolean,
    default: false
  },
  pdfDownloadedAt: {
    type: Date
  },
  whatsappSent: {
    type: Boolean,
    default: false
  },
  whatsappSentAt: {
    type: Date
  },
  whatsappMessageId: {
    type: String
  },
  pdfLink: {
    type: String
  },
  campaignId: {
    type: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
LeadSchema.index({ email: 1 });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ domain: 1 });
LeadSchema.index({ pdfToken: 1 });
LeadSchema.index({ whatsappSent: 1 });
LeadSchema.index({ pdfDownloaded: 1 });

export default mongoose.model<ILead>('Lead', LeadSchema);
