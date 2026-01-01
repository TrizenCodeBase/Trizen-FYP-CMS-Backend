import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Lead, { ILead } from '../models/Lead';
import { getDomainByTitle, DOMAINS, getAllDomains, getDomainBySlug } from '../config/domains';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Create a new lead
export const createLead = async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, phone, college, source = 'website_popup' } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !college) {
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
      return;
    }

    // Use findOneAndUpdate for atomic upsert (prevents race conditions)
    const lead = await Lead.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name,
          email,
          phone,
          college,
          source,
          status: 'new',
          submissionCount: 1,
          lastSubmittedAt: new Date()
        },
        $set: {
          name,
          phone,
          college,
          source,
          lastSubmittedAt: new Date()
        },
        $inc: {
          submissionCount: 1
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        session
      }
    );

    // Check if this was a new lead or update
    const isNew = lead.submissionCount === 1;

    await session.commitTransaction();

    console.log(isNew 
      ? `✅ New lead captured: ${name} (${email}) from ${college}`
      : `🔄 Lead resubmitted: ${name} (${email}) - Submission #${lead.submissionCount}`
    );

    res.status(isNew ? 201 : 200).json({
      success: true,
      message: isNew ? 'Lead captured successfully' : 'Lead updated successfully (existing email)',
      data: {
        id: lead._id,
        name: lead.name,
        email: lead.email,
        college: lead.college,
        status: isNew ? 'new' : 'resubmitted',
        submissionCount: lead.submissionCount,
        createdAt: lead.createdAt,
        lastSubmittedAt: lead.lastSubmittedAt
      }
    });
    return;

  } catch (error: any) {
    await session.abortTransaction();
    console.error('Error creating lead:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      Object.values(error.errors).forEach((err: any) => {
        validationErrors[err.path] = err.message;
      });
      
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
      return;
    }

    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      // Retry with findOne
      try {
        const { name, email, phone, college, source = 'website_popup' } = req.body;
        const existingLead = await Lead.findOne({ email });
        
        if (existingLead) {
          existingLead.name = name;
          existingLead.phone = phone;
          existingLead.college = college;
          existingLead.source = source;
          existingLead.submissionCount = (existingLead.submissionCount || 1) + 1;
          existingLead.lastSubmittedAt = new Date();
          existingLead.status = 'resubmitted';
          await existingLead.save();
          
          res.status(200).json({
            success: true,
            message: 'Lead updated successfully (existing email)',
            data: {
              id: existingLead._id,
              name: existingLead.name,
              email: existingLead.email,
              college: existingLead.college,
              status: existingLead.status,
              submissionCount: existingLead.submissionCount,
              createdAt: existingLead.createdAt,
              lastSubmittedAt: existingLead.lastSubmittedAt
            }
          });
          return;
        }
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  } finally {
    await session.endSession();
  }
};

// Get all leads (public access)
export const getAllLeads = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search, domain, source } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (domain) filter.domain = domain;
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } }
      ];
    }

    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Lead.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        leads,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get lead by ID
export const getLeadById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    return res.json({
      success: true,
      data: lead
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update lead status
export const updateLeadStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await Lead.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    return res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete lead
export const deleteLead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByIdAndDelete(id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    return res.json({
      success: true,
      message: 'Lead deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get lead statistics
export const getLeadStats = async (req: Request, res: Response) => {
  try {
    const stats = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalLeads = await Lead.countDocuments();
    const recentLeads = await Lead.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    return res.json({
      success: true,
      data: {
        total: totalLeads,
        recent: recentLeads,
        byStatus: stats
      }
    });

  } catch (error) {
    console.error('Error fetching lead stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get today's lead count (public - for social proof)
export const getTodayLeadCount = async (req: Request, res: Response) => {
  try {
    // Get start of today in UTC
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    
    // Get end of today in UTC
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);
    
    // Count leads created today with source 'bulk_email_funnel'
    const todayCount = await Lead.countDocuments({
      source: 'bulk_email_funnel',
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });
    
    // Also get this week's count for additional social proof
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const weekCount = await Lead.countDocuments({
      source: 'bulk_email_funnel',
      createdAt: {
        $gte: startOfWeek
      }
    });
    
    return res.json({
      success: true,
      data: {
        today: todayCount,
        thisWeek: weekCount
      }
    });
  } catch (error) {
    console.error('Error fetching today lead count:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Generate secure token for PDF access
function generatePDFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create lead from project funnel
export const createProjectFunnelLead = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  console.log('\n=== 📝 PROJECT FUNNEL LEAD SUBMISSION START ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request Body:', JSON.stringify(req.body, null, 2));
  console.log('IP Address:', req.ip || req.headers['x-forwarded-for'] || 'unknown');
  console.log('User Agent:', req.headers['user-agent'] || 'unknown');
  
  // Start a MongoDB session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, phone, college, domain, source = 'bulk_email_funnel' } = req.body;
    
    console.log('\n[1/6] Validating input fields...');
    // Validate required fields
    if (!name || !phone || !college || !domain) {
      console.log('❌ Validation failed: Missing required fields');
      console.log('  - Name:', name ? '✓' : '✗');
      console.log('  - Phone:', phone ? '✓' : '✗');
      console.log('  - College:', college ? '✓' : '✗');
      console.log('  - Domain:', domain ? '✓' : '✗');
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'Name, phone, college, and domain are required'
      });
      return;
    }
    console.log('✅ All required fields present');
    
    console.log('\n[2/6] Validating domain...');
    // Validate domain
    const domainConfig = getDomainByTitle(domain);
    if (!domainConfig) {
      console.log('❌ Invalid domain:', domain);
      await session.abortTransaction();
      res.status(400).json({
        success: false,
        error: 'Invalid domain'
      });
      return;
    }
    console.log('✅ Domain valid:', domain);
    
    console.log('\n[3/6] Generating PDF token...');
    // Generate PDF token
    const pdfToken = generatePDFToken();
    const pdfTokenExpiresAt = new Date();
    pdfTokenExpiresAt.setDate(pdfTokenExpiresAt.getDate() + 7); // 7 days expiry
    console.log('✅ PDF token generated (expires in 7 days)');
    
    // Create temporary email if not provided
    const email = `${phone}@temp.trizenventures.com`;
    
    console.log('\n[4/6] Creating/updating lead in database (atomic operation)...');
    
    // Use findOneAndUpdate with upsert for atomic operation (prevents race conditions)
    const lead = await Lead.findOneAndUpdate(
      { phone, source: 'bulk_email_funnel' }, // Check for existing lead with same phone
      {
        $setOnInsert: { // Only set these on insert (new document)
          name,
          email,
          phone,
          college,
          domain,
          source,
          status: 'new',
          pdfToken,
          pdfTokenExpiresAt,
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown',
          submissionCount: 1,
          lastSubmittedAt: new Date()
        },
        $set: { // Always update these
          name,
          college,
          domain,
          lastSubmittedAt: new Date(),
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown',
          userAgent: req.headers['user-agent'] || 'unknown'
        },
        $inc: { // Increment submission count
          submissionCount: 1
        }
      },
      {
        upsert: true, // Create if doesn't exist
        new: true, // Return updated document
        runValidators: true,
        session // Use transaction session
      }
    );
    
    console.log('✅ Lead saved/updated in database');
    console.log('  - Lead ID:', lead._id);
    console.log('  - Name:', lead.name);
    console.log('  - Phone:', lead.phone);
    console.log('  - College:', lead.college);
    console.log('  - Domain:', lead.domain);
    console.log('  - Submission Count:', lead.submissionCount);
    console.log('  - Has PDF Token:', !!lead.pdfToken);
    
    console.log('\n[5/6] Generating PDF link...');
    // Generate PDF link with lead ID (use existing token if available, otherwise use new one)
    const frontendUrl = process.env.FRONTEND_URL || 'https://academy.projects.trizenventures.com';
    const leadId = String(lead._id);
    const tokenToUse = lead.pdfToken || pdfToken; // Use existing token if available
    const pdfLink = `${frontendUrl}/download/${leadId}?token=${tokenToUse}`;
    
    // Update PDF link and token if needed (only if not already set)
    if (!lead.pdfLink || !lead.pdfToken) {
      lead.pdfLink = pdfLink;
      if (!lead.pdfToken) {
        lead.pdfToken = pdfToken;
        lead.pdfTokenExpiresAt = pdfTokenExpiresAt;
      }
      await lead.save({ session });
      console.log('✅ PDF link and token saved to lead');
    } else {
      console.log('✅ PDF link already exists, using existing token');
    }
    
    // WhatsApp contact link (deep link to open WhatsApp chat)
    const whatsappContactNumber = process.env.WHATSAPP_CONTACT_NUMBER || '918247422730';
    const whatsappLink = `https://wa.me/${whatsappContactNumber}`;
    
    console.log('\n[6/6] Committing transaction...');
    // Commit transaction
    await session.commitTransaction();
    console.log('✅ Transaction committed');
    
    const duration = Date.now() - startTime;
    console.log('\n=== ✅ PROJECT FUNNEL LEAD SUBMISSION SUCCESS ===');
    console.log('Total time:', duration + 'ms');
    console.log('Response:', {
      success: true,
      leadId: lead._id,
      name: lead.name,
      domain: lead.domain,
      whatsappLink
    });
    console.log('================================================\n');
    
    res.json({
      success: true,
      lead: {
        id: lead._id,
        name: lead.name,
        domain: lead.domain,
        pdfLink: lead.pdfLink
      },
      whatsappLink: whatsappLink
    });
    return;
  } catch (error: any) {
    // Abort transaction on error
    await session.abortTransaction();
    
    const duration = Date.now() - startTime;
    console.error('\n=== ❌ PROJECT FUNNEL LEAD SUBMISSION ERROR ===');
    console.error('Error after:', duration + 'ms');
    console.error('Error type:', error.name || 'Unknown');
    console.error('Error code:', error.code || 'N/A');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('===============================================\n');
    
    // Handle duplicate key error (race condition caught)
    if (error.code === 11000) {
      console.log('🔄 Duplicate key error detected, retrying with findOne...');
      try {
        const { name, phone, college, domain, source = 'bulk_email_funnel' } = req.body;
        const existingLead = await Lead.findOne({ phone, source: 'bulk_email_funnel' });
        
        if (existingLead) {
          // Update existing lead
          existingLead.name = name;
          existingLead.college = college;
          existingLead.domain = domain;
          existingLead.submissionCount = (existingLead.submissionCount || 1) + 1;
          existingLead.lastSubmittedAt = new Date();
          
          // Generate PDF link if not exists
          if (!existingLead.pdfLink) {
            const frontendUrl = process.env.FRONTEND_URL || 'https://academy.projects.trizenventures.com';
            const leadId = String(existingLead._id);
            const pdfToken = existingLead.pdfToken || generatePDFToken();
            existingLead.pdfLink = `${frontendUrl}/download/${leadId}?token=${pdfToken}`;
          }
          
          await existingLead.save();
          
          const whatsappContactNumber = process.env.WHATSAPP_CONTACT_NUMBER || '918247422730';
          const whatsappLink = `https://wa.me/${whatsappContactNumber}`;
          
          console.log('✅ Retry successful - existing lead updated');
          
          res.json({
            success: true,
            lead: {
              id: existingLead._id,
              name: existingLead.name,
              domain: existingLead.domain,
              pdfLink: existingLead.pdfLink
            },
            whatsappLink: whatsappLink
          });
          return;
        }
      } catch (retryError: any) {
        console.error('❌ Retry failed:', retryError);
      }
    }
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      Object.values(error.errors).forEach((err: any) => {
        validationErrors[err.path] = err.message;
      });
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        errors: validationErrors
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
    return;
  } finally {
    // Always end session
    await session.endSession();
  }
};

// Get all domains
export const getDomains = async (req: Request, res: Response) => {
  try {
    const domains = getAllDomains().map(({ title, config }) => ({
      title,
      slug: config.slug,
      description: config.description
    }));
    
    return res.json({ success: true, domains });
  } catch (error: any) {
    console.error('Error fetching domains:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Get domain by slug
export const getDomainBySlugController = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const domainConfig = getDomainBySlug(slug);
    
    if (!domainConfig) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }
    
    // Find the title for this domain
    const domainEntry = Object.entries(DOMAINS).find(([_, config]) => config.slug === slug);
    const title = domainEntry ? domainEntry[0] : '';
    
    return res.json({
      success: true,
      domain: {
        title,
        slug: domainConfig.slug,
        description: domainConfig.description
      }
    });
  } catch (error: any) {
    console.error('Error fetching domain by slug:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

// Download PDF
export const downloadPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { leadId } = req.params;
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }
    
    // Find lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
      return;
    }
    
    // Verify token
    if (!lead.pdfToken || lead.pdfToken !== token) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }
    
    if (!lead.pdfTokenExpiresAt || lead.pdfTokenExpiresAt < new Date()) {
      res.status(401).json({
        success: false,
        error: 'Token has expired'
      });
      return;
    }
    
    // Get domain config
    if (!lead.domain) {
      res.status(400).json({
        success: false,
        error: 'Lead domain not found'
      });
      return;
    }
    
    const domainConfig = getDomainByTitle(lead.domain);
    if (!domainConfig) {
      res.status(404).json({
        success: false,
        error: 'Domain config not found'
      });
      return;
    }
    
    // Read PDF file
    const pdfPath = path.join(__dirname, '../../public', domainConfig.pdfPath);
    
    if (!fs.existsSync(pdfPath)) {
      console.error(`PDF file not found at: ${pdfPath}`);
      res.status(404).json({
        success: false,
        error: 'PDF file not found'
      });
      return;
    }
    
    // Mark as downloaded
    lead.pdfDownloaded = true;
    lead.pdfDownloadedAt = new Date();
    await lead.save();
    
    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${domainConfig.slug}-projects.pdf"`);
    res.sendFile(pdfPath);
  } catch (error: any) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};
