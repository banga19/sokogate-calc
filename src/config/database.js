const mongoose = require('mongoose');
const config = require('./index.js');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || config.mongodb?.uri;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI not configured');
    }

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('MongoDB Disconnection Error:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
