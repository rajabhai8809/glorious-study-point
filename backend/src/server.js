const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars before importing app
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB explicitly before starting server
mongoose.connect(process.env.MONGO_URI)
  .then((conn) => {
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`Access the app at http://localhost:${PORT}`);
    });

    process.on('unhandledRejection', (err, promise) => {
      console.log(`Error: ${err.message}`);
      server.close(() => process.exit(1));
    });
  })
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    if (err.message.includes('IP that isn\'t whitelisted')) {
      console.error('\n👉 SOLUTION: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0)');
    }
    process.exit(1);
  });