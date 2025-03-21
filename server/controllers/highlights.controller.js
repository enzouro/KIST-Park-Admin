// server\controllers\highlights.controller.js

import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

import Highlight from '../mongodb/models/highlights.js';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});




// Add this utility function at the top of the file after imports
const processSdgData = (sdg) => {
  if (!sdg) return [];
  
  if (typeof sdg === 'string') {
    if (sdg.startsWith('[') && sdg.endsWith(']')) {
      try {
        return JSON.parse(sdg.replace(/'/g, '"'));
      } catch (e) {
        return sdg.split(',').map(s => s.trim());
      }
    }
    return [sdg];
  }
  
  if (Array.isArray(sdg)) {
    return sdg;
  }
  
  return [sdg];
};


// Add this utility function
const processImages = async (images) => {
  if (!images || !images.length) return [];
  
  const uploadPromises = images.map(async (image) => {
    if (image && typeof image === 'string') {
      if (image.startsWith('data:')) {
        const uploadResult = await cloudinary.uploader.upload(image);
        return uploadResult.url;
      }
      return image; // Keep existing URL
    }
    return null;
  });
  
  const results = await Promise.all(uploadPromises);
  return results.filter(Boolean);
};

// Get all highlights with filtering and pagination
const getHighlights = async (req, res) => {
  const {
    _end, _order, _start, _sort, title_like = '', status = '',
  } = req.query;

  const query = {};

  if (status !== '') {
    query.status = status;
  }

  if (title_like) {
    query.title = { $regex: title_like, $options: 'i' };
  }

  try {
    const count = await Highlight.countDocuments(query);

    const highlights = await Highlight
      .find(query)
      .select('_id seq title sdg date location status createdAt') // Include seq in selection
      .populate('sdg')
      .limit(_end ? parseInt(_end, 10) : undefined)
      .skip(_start ? parseInt(_start, 10) : 0)
      .sort(_sort ? { [_sort]: _order } : { createdAt: -1 });

    res.header('x-total-count', count);
    res.header('Access-Control-Expose-Headers', 'x-total-count');

    res.status(200).json(highlights);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Fetching highlights failed, please try again later' });
  }
};

// Get highlight by ID
const getHighlightById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid highlight ID format' });
    }
    
    const highlight = await Highlight
      .findById(id)
      .select('_id seq title sdg date location content status createdAt images'); // Include seq in selection

    if (highlight) {
      const formattedHighlight = {
        ...highlight.toObject(),
        date: highlight.date ? highlight.date.toISOString().split('T')[0] : null,
        createdAt: highlight.createdAt ? highlight.createdAt.toISOString() : null
      };
      
      res.status(200).json(formattedHighlight);
    } else {
      res.status(404).json({ message: 'Highlight not found' });
    }
  } catch (err) {
    console.error("Error fetching highlight:", err);
    res.status(500).json({ message: 'Failed to get highlight details' });
  }
};

// Create a new highlight
const createHighlight = async (req, res) => {
  try {
    const {
      title, sdg, date, location, content, images, status, seq, email // Add seq to destructuring
    } = req.body;

    // Create a new highlight with seq
    const newHighlight = await Highlight.create({
      title,
      sdg,
      date,
      location,
      content,
      images,
      status: status || 'draft',
      seq, // Include seq in creation
      email
    });

    res.status(201).json({ 
      message: 'Highlight created successfully',
      highlight: newHighlight
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to create highlight, please try again later' });
  }
};

// Update a highlight
const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, sdg, date, location, content, images, status, seq, email } = req.body; // Add seq to destructuring

    const updatedHighlight = await Highlight.findByIdAndUpdate(
      { _id: id },
      {
        title,
        sdg,
        date,
        location,
        content,
        images,
        status,
        seq, // Include seq in update
        email
      },
      { new: true }
    );

    if (!updatedHighlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    res.status(200).json({ 
      message: 'Highlight updated successfully',
      highlight: updatedHighlight
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update highlight' });
  }
};



// Delete a highlight
const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    const highlightToDelete = await Highlight.findById({ _id: id });
    if (!highlightToDelete) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    // Delete multiple images from Cloudinary if they exist
    if (highlightToDelete.images && highlightToDelete.images.length > 0) {
      const deletePromises = highlightToDelete.images.map(async (imageUrl) => {
        if (imageUrl) {
          // Extract public_id from the Cloudinary URL
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
      });
      
      await Promise.all(deletePromises);
    }

    await Highlight.findByIdAndDelete({ _id: id });

    res.status(200).json({ message: 'Highlight deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete highlight, please try again later' });
  }
};

// Update highlight status
const updateHighlightStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['draft', 'published', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    

    const updatedHighlight = await Highlight.findByIdAndUpdate(
      { _id: id },
      { status },
      { new: true }
    );

    if (!updatedHighlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    res.status(200).json({
      message: 'Status updated successfully',
      highlight: updatedHighlight
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status, please try again later' });
  }
};

export {
  getHighlights,
  getHighlightById,
  createHighlight,
  updateHighlight,
  updateHighlightStatus,
  deleteHighlight,
}