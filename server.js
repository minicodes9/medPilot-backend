require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 4000;

// 🔹 Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

const startServer = async () => {
  try {
    //  Connect DB first
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`🚀 MedPilot Server running on port ${PORT}`);
    });

    //  Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION:', err.message);
      server.close(() => process.exit(1));
    });

    //  Graceful Shutdown
    process.on('SIGINT', async () => {
      console.log('🛑 Gracefully shutting down...');
      await mongoose.connection.close();
      server.close(() => {
        console.log('💤 Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();