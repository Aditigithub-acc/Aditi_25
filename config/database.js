const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/backend";

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`Database connected successfully!... ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed!..", error.message);
    
    // Retry after 5 seconds instead of crashing
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
