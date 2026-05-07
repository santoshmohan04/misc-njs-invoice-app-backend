const mongoose = require("mongoose");

const mongodb_url = process.env.MONGODB_URL;

mongoose.connect(mongodb_url)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB Error:", err);
  });

module.exports = mongoose;
