import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import problemRoutes from './routes/problems';
import analyticsRoutes from './routes/analytics';
import publicRoutes from './routes/public';
import leadRoutes from './routes/leadRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
}));

// CORS configuration - HARDCODED for production (ignores env vars)
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:8080',
  'http://localhost:8084',  // Academy frontend local development
  'https://projects.trizenventures.com',
  'https://fyrcmsfrontend.llp.trizenventures.com',
  'https://fypcms.trizenventures.com',
  'https://academy.trizenventures.com',
  'https://final-frontier-projects.vercel.app',
  'https://trizenfypcmsbackend.llp.trizenventures.com'
];

console.log('🔐 CORS Allowed Origins (HARDCODED):', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in our hardcoded list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ CORS: Allowing request from origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`❌ CORS: BLOCKING request from origin: ${origin}`);
      console.warn(`❌ CORS: Allowed origins are:`, allowedOrigins);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600, // Cache preflight requests for 10 minutes
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// CORS debugging middleware
app.use((req: any, res: any, next: any) => {
  if (req.method === 'OPTIONS') {
    console.log(`🔍 CORS Preflight: ${req.method} ${req.path} from origin: ${req.headers.origin || 'no-origin'}`);
  }
  if (req.headers.origin) {
    console.log(`🌐 Request from origin: ${req.headers.origin} to ${req.method} ${req.path}`);
  }
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Root endpoint
app.get('/', (req: any, res: any) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to TRIZEN CMS Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
      problems: '/api/v1/problems',
      analytics: '/api/v1/analytics',
      public: '/api/v1/public'
    }
  });
});

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  res.status(200).json({
    status: 'success',
    message: 'TRIZEN CMS Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CORS test endpoint
app.get('/cors-test', (req: any, res: any) => {
  res.status(200).json({
    status: 'success',
    message: 'CORS is working!',
    origin: req.headers.origin || 'no-origin',
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/leads', leadRoutes);

// API documentation endpoint
app.get('/api/v1', (req: any, res: any) => {
  res.json({
    message: 'TRIZEN CMS Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      problems: '/api/v1/problems',
      analytics: '/api/v1/analytics',
      public: '/api/v1/public',
      leads: '/api/v1/leads'
    },
    documentation: 'https://github.com/trizen/cms-backend'
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 TRIZEN CMS Backend Server Started!
📍 Server running on port ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Health check: http://localhost:${PORT}/health
📚 API docs: http://localhost:${PORT}/api/v1
  `);
});

export default app;
