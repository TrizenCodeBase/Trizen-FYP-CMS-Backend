import { Request, Response } from 'express';
import Lead, { ILead } from '../models/Lead';

// Create a new lead
export const createLead = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, college, source = 'website_popup' } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !college) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if lead already exists with this email
    const existingLead = await Lead.findOne({ email });
    
    if (existingLead) {
      // Update existing lead with new submission data and increment submission count
      existingLead.name = name;
      existingLead.phone = phone;
      existingLead.college = college;
      existingLead.source = source;
      existingLead.submissionCount = (existingLead.submissionCount || 1) + 1;
      existingLead.lastSubmittedAt = new Date();
      existingLead.status = 'resubmitted'; // Mark as resubmitted to track interest
      
      await existingLead.save();
      
      console.log(`🔄 Lead resubmitted: ${name} (${email}) - Submission #${existingLead.submissionCount}`);
      
      return res.status(200).json({
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
    }

    // Create new lead
    const lead = new Lead({
      name,
      email,
      phone,
      college,
      source,
      status: 'new',
      submissionCount: 1,
      lastSubmittedAt: new Date()
    });

    await lead.save();

    console.log(`✅ New lead captured: ${name} (${email}) from ${college}`);

    return res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      data: {
        id: lead._id,
        name: lead.name,
        email: lead.email,
        college: lead.college,
        status: lead.status,
        createdAt: lead.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error creating lead:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors: { [key: string]: string } = {};
      Object.values(error.errors).forEach((err: any) => {
        validationErrors[err.path] = err.message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all leads (admin only)
export const getAllLeads = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
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
