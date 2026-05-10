const mongoose = require('mongoose');

const connectTestDb = async () => {
  if (mongoose.connection.readyState === 0 && process.env.MONGODB_URL) {
    await mongoose.connect(process.env.MONGODB_URL);
  }
};

const disconnectTestDb = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = {
  connectTestDb,
  disconnectTestDb,
};
