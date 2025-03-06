// server\mongodb\models\highlights.js
import mongoose from 'mongoose';

const HighlightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  sdg: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SDG',
      required: true
    }
  ],
  date: {
    type: Date,
    required: false, // Optional as mentioned
  },
  location: {
    type: String,
    required: false,
  },
  image: {
    type: String, // Store the URL to the image on Cloudinary
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