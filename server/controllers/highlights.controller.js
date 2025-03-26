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



// ---------  Utility Functions -------------------//


// Image processing and uploading to Cloudinary
const processImages = async (images) => {
  if (!images || !images.length) return [];
  
  // Improved upload options
  const uploadOptions = {
    resource_type: "auto",
    quality: "auto:low",  // Lower quality for faster uploads
    fetch_format: "auto", 
    transformation: [
      { width: 1024, crop: "limit" }, // Resize large images
      { quality: "auto:low" } // Compress images
    ],
    timeout: 60000, // Reduced timeout
    max_results: 10 // Limit concurrent uploads
  };

  // Use a rate-limited, concurrent upload strategy
  const uploadPromises = images.slice(0, 5).map(async (image) => {
    if (image && typeof image === 'string') {
      if (image.startsWith('data:')) {
        try {
          // Check image size before processing
          const base64Size = image.length * (3/4);
          if (base64Size > 10 * 1024 * 1024) { // 10MB limit
            console.warn('Image too large, skipping');
            return null;
          }

          const uploadResult = await cloudinary.uploader.upload(image, uploadOptions);
          return uploadResult.url;
        } catch (error) {
          console.error('Lightweight upload error:', error);
          return null;
        }
      }
      return image;
    }
    return null;
  });
  
  // Use Promise.allSettled for more robust handling
  const results = await Promise.allSettled(uploadPromises);
  
  return results
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);
};

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    // Implement a simple caching mechanism to prevent repeated deletions
    const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
    
    // Use a simple in-memory cache to track deleted images
    if (deleteImageFromCloudinary.deletedCache.has(publicId)) {
      return true;
    }

    await cloudinary.uploader.destroy(publicId);
    
    // Mark as deleted in cache
    deleteImageFromCloudinary.deletedCache.add(publicId);
    return true;
  } catch (error) {
    console.error('Lightweight delete error:', error);
    return false;
  }
};

deleteImageFromCloudinary.deletedCache = new Set();
// --------- End of Utility Functions -------------------//


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

// Get highlight by ID for editing
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
      title, sdg, date, location, content, images, status, seq, email
    } = req.body;

    // Parallel processing with timeout
    const createHighlightWithTimeout = async () => {
      // Start image processing
      const imageProcessingPromise = processImages(images);

      // Create highlight document
      const highlightData = {
        title,
        sdg,
        date,
        location,
        content,
        status: status || 'draft',
        seq,
        email
      };

      // Wait for both operations with a timeout
      const [processedImages, highlight] = await Promise.all([
        Promise.race([
          imageProcessingPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image processing timeout')), 30000)
          )
        ]),
        Highlight.create(highlightData)
      ]);

      // Update highlight with processed images
      highlight.images = processedImages;
      await highlight.save();

      return highlight;
    };

    const highlight = await createHighlightWithTimeout();

    res.status(201).json({ 
      message: 'Highlight created successfully',
      highlight
    });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ 
      message: 'Failed to create highlight', 
      error: err.message 
    });
  }
};


// Update a highlight
const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, sdg, date, location, content, images, status, seq, email } = req.body;

    const updateHighlightWithTimeout = async () => {
      // Get existing highlight
      const existingHighlight = await Highlight.findById(id);
      if (!existingHighlight) {
        throw new Error('Highlight not found');
      }

      // Start parallel processes
      const processPromises = [
        // Process 1: Handle image deletions
        (async () => {
          const removedImages = existingHighlight.images.filter(
            oldImage => !images.includes(oldImage)
          );
          if (removedImages.length > 0) {
            const deletePromises = removedImages.map(imageUrl => 
              deleteImageFromCloudinary(imageUrl)
            );
            await Promise.all(deletePromises);
          }
        })(),

        // Process 2: Handle new image processing
        Promise.race([
          processImages(images),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image processing timeout')), 30000)
          )
        ])
      ];

      // Wait for all processes to complete
      const [_, processedImages] = await Promise.all(processPromises);

      // Update highlight with new data
      const updatedHighlight = await Highlight.findByIdAndUpdate(
        id,
        {
          title,
          sdg,
          date,
          location,
          content,
          images: processedImages,
          status,
          seq,
          email
        },
        { new: true }
      );

      return updatedHighlight;
    };

    const updatedHighlight = await updateHighlightWithTimeout();

    res.status(200).json({
      message: 'Highlight updated successfully',
      highlight: updatedHighlight
    });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ 
      message: 'Failed to update highlight',
      error: err.message 
    });
  }
};


// Delete a highlight
const deleteHighlight = async (req, res) => {
  try {
    const { id } = req.params;

    const highlightToDelete = await Highlight.findById(id);
    if (!highlightToDelete) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    // Delete images from Cloudinary if they exist
    if (highlightToDelete.images && highlightToDelete.images.length > 0) {
      const deletePromises = highlightToDelete.images.map(imageUrl => 
        deleteImageFromCloudinary(imageUrl)
      );
      
      await Promise.all(deletePromises);
    }

    // Delete the highlight from MongoDB
    await Highlight.findByIdAndDelete(id);

    res.status(200).json({ 
      message: 'Highlight and associated images deleted successfully' 
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      message: 'Failed to delete highlight and images' 
    });
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