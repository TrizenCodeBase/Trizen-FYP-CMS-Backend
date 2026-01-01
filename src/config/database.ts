import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb+srv://user:user@cluster0.elcnkyi.mongodb.net/trizen_cms?retryWrites=true&w=majority&appName=Cluster0';
    
    const conn = await mongoose.connect(mongoURI, {
      // Connection pool settings for concurrency
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5, // Minimum number of connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      connectTimeoutMS: 10000, // How long to wait for initial connection
      retryWrites: true,
      w: 'majority' // Write concern
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('⚠️ Server will continue without database connection for development');
    // Don't exit the process in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export { connectDB };
