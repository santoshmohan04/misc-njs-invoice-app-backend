const mongoose = require("mongoose");

const mongodb_url = process.env.MONGODB_URL;

const connectDatabase = async () => {
  try {
    await mongoose.connect(mongodb_url);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB Error:", err);
    process.exit(1);
  }
};

connectDatabase();

module.exports = mongoose;
