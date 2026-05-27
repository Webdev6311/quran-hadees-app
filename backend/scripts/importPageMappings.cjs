const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGODB_NAME
    });
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Read the JSON file
const pageMappings = JSON.parse(fs.readFileSync(path.join(__dirname, 'pageMappings.json'), 'utf-8'));


// Import page mappings
const importPageMappings = async () => {
  try {
    // Convert the pageMappings object to an array of page documents
    const pages = Object.entries(pageMappings).map(([pageNum, ranges]) => ({
      page: parseInt(pageNum, 10),
      ranges,
    }));

    // Clear existing data
    console.log('Clearing existing page mappings...');
    await mongoose.connection.db.collection('pages').deleteMany({});
    console.log('Successfully cleared existing page mappings');

    // Insert new data
    console.log('Inserting new page mappings...');
    const result = await mongoose.connection.db.collection('pages').insertMany(pages);
    console.log(`Successfully imported ${result.length} page mappings`);
  } catch (err) {
    console.error('Error importing page mappings:', err);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
};

// Run the import
connectDB()
  .then(() => importPageMappings())
  .then(() => {
    console.log('Import completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during import:', err);
    process.exit(1);
  });
