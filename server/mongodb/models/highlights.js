// server\mongodb\models\highlights.js
import mongoose from 'mongoose';

const HighlightSchema = new mongoose.Schema({
  seq: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  sdg: {
    type: [String], // Array of strings instead of ObjectIds
    required: false,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Catergory', // Reference to the Category model
    required: false,
  },
  date: {
    type: Date,
    required: false, // Optional as mentioned
  },
  location: {
    type: String,
    required: false,
  },
  images: {  // Changed from 'image' to 'images'
    type: [String],  // Changed to array of strings
    required: false,
  },
  content: {
    type: String, // Store as rich text (HTML or Markdown)
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'rejected'],
    default: 'draft',
    required: true
  }
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

const Highlight = mongoose.model('Highlight', HighlightSchema);

export default Highlight;