import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ProblemStatement, IProblemStatement } from '../models/Problem';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import csv from 'csv-parser';
import { Readable } from 'stream';
import multer from 'multer';

// @desc    Get all problems
// @route   GET /api/v1/problems
// @access  Public
export const getProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain, difficulty, status, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter: any = {};
    if (domain) filter.domain = domain;
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const problems = await ProblemStatement.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ProblemStatement.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: problems.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: problems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single problem
// @route   GET /api/v1/problems/:id
// @access  Public
export const getProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const problem = await ProblemStatement.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!problem) {
      res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new problem
// @route   POST /api/v1/problems
// @access  Private
export const createProblem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array()
      });
      return;
    }

    const problemData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const problem = await ProblemStatement.create(problemData);

    const populatedProblem = await ProblemStatement.findById(problem._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Problem created successfully',
      data: populatedProblem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update problem
// @route   PUT /api/v1/problems/:id
// @access  Private
export const updateProblem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let problem = await ProblemStatement.findById(req.params.id);

    if (!problem) {
      res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
      return;
    }

    // Check if user is the creator or admin
    if (problem.createdBy.toString() !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this problem'
      });
      return;
    }

    problem = await ProblemStatement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Problem updated successfully',
      data: problem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete problem
// @route   DELETE /api/v1/problems/:id
// @access  Private/Admin
export const deleteProblem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const problem = await ProblemStatement.findById(req.params.id);

    if (!problem) {
      res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
      return;
    }

    await ProblemStatement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Problem deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get problems by domain
// @route   GET /api/v1/problems/domain/:domain
// @access  Public
export const getProblemsByDomain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { domain } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const problems = await ProblemStatement.find({ 
      domain: domain.replace(/-/g, ' '),
      status: 'Active'
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ProblemStatement.countDocuments({ 
      domain: domain.replace(/-/g, ' '),
      status: 'Active'
    });

    res.status(200).json({
      success: true,
      count: problems.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: problems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured problems
// @route   GET /api/v1/problems/featured
// @access  Public
export const getFeaturedProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 6 } = req.query;

    const problems = await ProblemStatement.find({ 
      featured: true,
      status: 'Active'
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get problem by custom ID (AIM001, IOT002, etc.)
// @route   GET /api/v1/problems/custom/:id
// @access  Public
export const getProblemByCustomId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const problem = await ProblemStatement.findOne({ id: id.toUpperCase() })
      .populate('createdBy', 'name email');

    if (!problem) {
      res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
      return;
    }

    // Increment view count
    await ProblemStatement.findByIdAndUpdate(problem._id, { $inc: { viewCount: 1 } });

    res.status(200).json({
      success: true,
      data: problem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search problems
// @route   GET /api/v1/problems/search
// @access  Public
export const searchProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q, domain, difficulty, category, page = 1, limit = 10 } = req.query;
    
    // Build search query
    const searchQuery: any = { status: 'Active' };
    
    if (q) {
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { abstract: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q as string, 'i')] } }
      ];
    }
    
    if (domain) searchQuery.domain = domain;
    if (difficulty) searchQuery.difficulty = difficulty;
    if (category) searchQuery.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    const problems = await ProblemStatement.find(searchQuery)
      .populate('createdBy', 'name email')
      .sort({ viewCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ProblemStatement.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: problems.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: problems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update problem status
// @route   PUT /api/v1/problems/:id/status
// @access  Private
export const updateProblemStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    
    if (!['Active', 'Draft', 'Archived'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Draft, or Archived'
      });
      return;
    }

    const problem = await ProblemStatement.findById(req.params.id);

    if (!problem) {
      res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
      return;
    }

    // Check authorization
    if (problem.createdBy.toString() !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this problem'
      });
      return;
    }

    problem.status = status;
    await problem.save();

    res.status(200).json({
      success: true,
      message: `Problem status updated to ${status}`,
      data: problem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle featured status
// @route   PUT /api/v1/problems/:id/featured
// @access  Private/Admin
export const toggleFeatured = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const problem = await ProblemStatement.findById(req.params.id);

    if (!problem) {
      res.status(404).json({
        success: false,
        message: 'Problem not found'
      });
      return;
    }

    problem.featured = !problem.featured;
    await problem.save();

    res.status(200).json({
      success: true,
      message: `Problem ${problem.featured ? 'featured' : 'unfeatured'} successfully`,
      data: problem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular problems
// @route   GET /api/v1/problems/popular
// @access  Public
export const getPopularProblems = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const problems = await ProblemStatement.find({ 
      status: 'Active',
      viewCount: { $gt: 0 }
    })
      .populate('createdBy', 'name email')
      .sort({ viewCount: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: problems.length,
      data: problems
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get problem statistics (public version)
// @route   GET /api/v1/public/problems/stats
// @access  Public
export const getPublicProblemStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await ProblemStatement.aggregate([
      {
        $match: { status: 'Active' } // Only count active problems for public stats
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          featured: { $sum: { $cond: ['$featured', 1, 0] } },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    const domainStats = await ProblemStatement.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const difficultyStats = await ProblemStatement.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, featured: 0, totalViews: 0 },
        domainDistribution: domainStats,
        difficultyDistribution: difficultyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get problem statistics (admin version)
// @route   GET /api/v1/problems/stats
// @access  Private/Admin
export const getProblemStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await ProblemStatement.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } },
          archived: { $sum: { $cond: [{ $eq: ['$status', 'Archived'] }, 1, 0] } },
          featured: { $sum: { $cond: ['$featured', 1, 0] } },
          totalViews: { $sum: '$viewCount' }
        }
      }
    ]);

    const domainStats = await ProblemStatement.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$domain', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const difficultyStats = await ProblemStatement.aggregate([
      { $match: { status: 'Active' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, active: 0, draft: 0, archived: 0, featured: 0, totalViews: 0 },
        domainDistribution: domainStats,
        difficultyDistribution: difficultyStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk upload problems from CSV
// @route   POST /api/v1/problems/bulk-upload
// @access  Private/Admin
export const bulkUploadProblems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No CSV file uploaded'
      });
      return;
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as Array<{ row: number; field: string; message: string; }>
    };

    const problems: any[] = [];
    const errors: Array<{ row: number; field: string; message: string; }> = [];

    // Parse CSV file
    const stream = Readable.from(req.file.buffer.toString());
    
    await new Promise<void>((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row: any) => {
          problems.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // Validate and process each row
    for (let i = 0; i < problems.length; i++) {
      const row = problems[i];
      const rowNumber = i + 2; // +2 because CSV starts from row 2 (row 1 is header)

      try {
        // Validate required fields
        const validationErrors: string[] = [];

        if (!row.title || row.title.trim() === '') {
          validationErrors.push('Title is required');
        }
        if (!row.abstract || row.abstract.trim() === '') {
          validationErrors.push('Abstract is required');
        }
        if (!row.domain || row.domain.trim() === '') {
          validationErrors.push('Domain is required');
        }
        if (!row.category || row.category.trim() === '') {
          validationErrors.push('Category is required');
        }
        if (!row.difficulty || row.difficulty.trim() === '') {
          validationErrors.push('Difficulty is required');
        }
        if (!row.duration || row.duration.trim() === '') {
          validationErrors.push('Duration is required');
        }

        // Validate domain
        const validDomains = [
          'AI & Machine Learning',
          'IoT & Embedded Systems',
          'Cloud Computing',
          'Web & Mobile Applications',
          'Cybersecurity & Blockchain',
          'Data Science & Analytics',
          'Networking & Communication',
          'Mechanical / ECE Projects'
        ];
        if (row.domain && !validDomains.includes(row.domain.trim())) {
          validationErrors.push(`Invalid domain. Must be one of: ${validDomains.join(', ')}`);
        }

        // Validate category
        const validCategories = ['Major', 'Minor', 'Capstone'];
        if (row.category && !validCategories.includes(row.category.trim())) {
          validationErrors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
        }

        // Validate difficulty
        const validDifficulties = ['Beginner', 'Intermediate', 'Advanced'];
        if (row.difficulty && !validDifficulties.includes(row.difficulty.trim())) {
          validationErrors.push(`Invalid difficulty. Must be one of: ${validDifficulties.join(', ')}`);
        }

        if (validationErrors.length > 0) {
          validationErrors.forEach(error => {
            errors.push({
              row: rowNumber,
              field: 'validation',
              message: error
            });
          });
          results.failed++;
          continue;
        }

        // Parse array fields (separated by semicolons)
        const parseArrayField = (field: string): string[] => {
          if (!field || field.trim() === '') return [];
          return field.split(';').map(item => item.trim()).filter(item => item !== '');
        };

        // Create problem statement data
        const problemData = {
          title: row.title.trim(),
          abstract: row.abstract.trim(),
          domain: row.domain.trim(),
          category: row.category.trim(),
          difficulty: row.difficulty.trim(),
          duration: row.duration.trim(),
          technologies: parseArrayField(row.technologies || ''),
          deliverables: parseArrayField(row.deliverables || ''),
          prerequisites: parseArrayField(row.prerequisites || ''),
          learningOutcomes: parseArrayField(row.learningOutcomes || ''),
          tags: parseArrayField(row.tags || ''),
          status: row.status?.trim() || 'Draft',
          featured: row.featured?.toLowerCase() === 'true' || false,
          createdBy: req.user?.id
        };

        // Create the problem statement
        await ProblemStatement.create(problemData);
        results.imported++;

      } catch (error: any) {
        errors.push({
          row: rowNumber,
          field: 'database',
          message: error.message || 'Failed to create problem statement'
        });
        results.failed++;
      }
    }

    results.errors = errors;

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${results.imported} imported, ${results.failed} failed.`,
      data: results
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Download CSV template
// @route   GET /api/v1/problems/template
// @access  Private
export const downloadTemplate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const csvContent = `title,abstract,domain,category,difficulty,duration,technologies,deliverables,prerequisites,learningOutcomes,tags,status,featured
"AI-Powered Personal Finance Manager","Develop an intelligent personal finance management system that uses machine learning algorithms to analyze user spending patterns and provide personalized financial advice. The system will include features like budget tracking, expense categorization, investment recommendations, and financial goal setting.","AI & Machine Learning","Major","Advanced","12-16 weeks","Python;TensorFlow;React;Node.js;MongoDB","Complete source code;User interface;Documentation;Deployment guide","Strong programming skills;Basic ML knowledge;Web development experience","Implement ML algorithms;Design responsive web applications;Work with financial APIs","Machine Learning;Finance;Web Development;Data Analysis","Draft","false"
"IoT Smart Home System","Create a comprehensive IoT-based smart home automation system that allows users to control various home appliances and monitor environmental conditions remotely. The system will include sensors for temperature, humidity, motion detection, and smart switches for controlling lights and fans.","IoT & Embedded Systems","Major","Intermediate","10-14 weeks","Arduino;Raspberry Pi;Python;MQTT;React Native","Hardware prototype;Mobile app;Documentation;Circuit diagrams","Electronics basics;Programming skills;IoT concepts","Work with IoT devices;Develop mobile applications;Understand sensor integration","IoT;Smart Home;Automation;Mobile Development","Draft","false"
"Blockchain-Based Supply Chain Tracking","Implement a blockchain solution for tracking products throughout the supply chain, ensuring transparency and authenticity. The system will allow consumers to verify product origins and track the journey from manufacturer to retailer.","Cybersecurity & Blockchain","Major","Advanced","14-18 weeks","Solidity;Web3.js;React;Node.js;IPFS","Smart contracts;Web application;Documentation;Test cases","Blockchain fundamentals;Smart contract development;Web3 technologies","Develop smart contracts;Build decentralized applications;Understand supply chain processes","Blockchain;Supply Chain;Web3;Smart Contracts","Draft","false"
"Cloud-Based E-Learning Platform","Build a scalable e-learning platform using cloud technologies that supports video streaming, real-time collaboration, and progress tracking. The platform will include features like course creation, student enrollment, assignment submission, and performance analytics.","Cloud Computing","Major","Intermediate","12-16 weeks","AWS;React;Node.js;MongoDB;Docker","Cloud deployment;Web application;API documentation;Database schema","Cloud computing basics;Web development;Database design","Deploy applications to cloud;Implement real-time features;Design scalable architectures","Cloud Computing;E-Learning;Real-time Applications;Scalability","Draft","false"
"Cybersecurity Threat Detection System","Develop an AI-powered cybersecurity system that monitors network traffic and detects potential threats in real-time. The system will use machine learning algorithms to identify suspicious patterns and alert administrators about potential security breaches.","Cybersecurity & Blockchain","Major","Advanced","16-20 weeks","Python;TensorFlow;Kafka;Elasticsearch;React","Threat detection engine;Dashboard;Documentation;Test datasets","Cybersecurity knowledge;Machine learning;Network protocols","Implement ML-based threat detection;Build monitoring dashboards;Understand network security","Cybersecurity;Machine Learning;Network Security;Real-time Processing","Draft","false"`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="problem-statements-template.csv"');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};
