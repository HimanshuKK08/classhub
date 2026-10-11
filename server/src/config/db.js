import mongoose from 'mongoose';

/**
 * Connects to MongoDB using the MONGO_URI from environment variables.
 * Call this once from server.js before starting the HTTP server.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
