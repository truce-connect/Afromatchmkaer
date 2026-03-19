const mongoose = require('mongoose');

const MAX_RETRIES = Number(process.env.MONGO_MAX_RETRIES || 5);
const RETRY_DELAY_MS = Number(process.env.MONGO_RETRY_DELAY_MS || 5000);
const RETRY_DELAY_CAP_MS = Number(process.env.MONGO_RETRY_DELAY_CAP_MS || 30000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createConnectionOptions = () => ({
  dbName: process.env.MONGO_DB_NAME || 'afrimatchmaker',
  maxPoolSize: Number(process.env.MONGO_MAX_POOL || 10),
  retryReads: true,
  retryWrites: true,
  serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000),
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 60000),
  heartbeatFrequencyMS: Number(process.env.MONGO_HEARTBEAT_MS || 10000)
});

let connectingPromise = null;

const connectWithRetry = async (connectionUri, attempt = 1) => {
  if (connectingPromise) {
    return connectingPromise;
  }

  const connectionOptions = createConnectionOptions();

  connectingPromise = mongoose
    .connect(connectionUri, connectionOptions)
    .then(() => {
      console.log('MongoDB connected');
    })
    .catch(async (error) => {
      console.error(`MongoDB connection error (attempt ${attempt}):`, error.message);
      if (attempt >= MAX_RETRIES) {
        console.error('Max MongoDB connection attempts reached. Exiting.');
        process.exit(1);
      }

      const delay = Math.min(RETRY_DELAY_MS * attempt, RETRY_DELAY_CAP_MS);
      console.warn(`Retrying MongoDB connection in ${delay}ms...`);
      await wait(delay);
      connectingPromise = null;
      return connectWithRetry(connectionUri, attempt + 1);
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
};

const connectDB = async () => {
  const connectionUri = process.env.MONGO_URI;

  if (!connectionUri) {
    throw new Error('Missing MONGO_URI in environment.');
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting to reconnect...');
    connectWithRetry(connectionUri).catch((error) => {
      console.error('MongoDB reconnection failed:', error.message);
    });
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });

  return connectWithRetry(connectionUri);
};

module.exports = connectDB;
