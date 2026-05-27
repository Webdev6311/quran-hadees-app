const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Page = require('../models/Page');
const pageMappings = require('./pageMappings.json');

// Configure dotenv
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Import page mappings
const importPageMappings = async () => {
  try {
    // Convert the pageMappings object to an array of page documents
    const pages = Object.entries(pageMappings).map(([pageNum, ranges]) => ({
      page: parseInt(pageNum, 10),
      ranges,
    }));

    // Clear existing data
    await Page.deleteMany({});
    console.log('Cleared existing page mappings');

    // Insert new data
    const result = await Page.insertMany(pages);
    console.log(`Successfully imported ${result.length} page mappings`);
  } catch (err) {
    console.error('Error importing page mappings:', err);
  } finally {
    mongoose.disconnect();
  }
};

// Run the import
connectDB()
  .then(() => importPageMappings())
  .then(() => {
    console.log('Import completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
