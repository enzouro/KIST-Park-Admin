// sdg.js populating the database with SDg data
import mongoose from 'mongoose';
import SDG from './mongodb/models/sdg.js'; // Update this path as needed

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = 'mongodb+srv://lorenzodev:x0zQ1a62GXNc0L1p@kist-park.smnii.mongodb.net/?retryWrites=true&w=majority&appName=kist-park';

// SDG data to be inserted
const sdgData = [
  'SDG-1 No Poverty',
  'SDG-2 Zero Hunger',
  'SDG-3 Good Health and Well-being',
  'SDG-4 Quality Education',   
  'SDG-5 Gender Equality',
  'SDG-6 Clean Water and Sanitation',
  'SDG-7 Affordable and Clean Energy',
  'SDG-8 Decent Work and Economic Growth',
  'SDG-9 Industry, Innovation and Infrastructure',
  'SDG-10 Reduced Inequalities',
  'SDG-11 Sustainable Cities and Communities',
  'SDG-12 Responsible Consumption and Production',
  'SDG-13 Climate Action',
  'SDG-14 Life Below Water',
  'SDG-15 Life on Land',
  'SDG-16 Peace, Justice and Strong Institutions',
  'SDG-17 Partnerships for the Goals'
];

// Function to seed the database
async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Delete existing SDG entries if any
    await SDG.deleteMany({});
    console.log('Cleared existing SDG data');

    // Format the data for insertion
    const sdgsToInsert = sdgData.map(sdg => ({
      sdg: sdg
    }));

    // Insert the data
    const result = await SDG.insertMany(sdgsToInsert);
    console.log(`Successfully inserted ${result.length} SDG records`);

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seeder
seedDatabase();