const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || "mongodb+srv://tauseefcalling_db_user:password123@cluster0.dybksgj.mongodb.net/glorious-study-point?retryWrites=true&w=majority";

console.log("Testing MongoDB Connection...");
console.log("URI:", uri.replace(/:([^:@]+)@/, ":****@")); // Hide password

mongoose.connect(uri)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection Failed:", err.message);
    process.exit(1);
  });