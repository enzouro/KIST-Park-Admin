// server\controllers\highlights.controller.js

import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

import Highlight from '../mongodb/models/highlights.js';
import Category from '../mongodb/models/category.js'; // Add this import


dotenv.config();

// Enhanced Cloudinary configuration with proxy support
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Proxy configuration - will be ignored if not needed (like on Render)
  proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || undefined,
  // Additional network configurations for better reliability
  timeout: 60000, // 60 seconds timeout
  // Enable secure connections
  secure: true,
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
            return null;
          }

          const uploadResult = await cloudinary.uploader.upload(image, uploadOptions);
          return uploadResult.url;
        } catch (error) {
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
      .select('_id seq title sdg date location status createdAt category images') // Include seq in selection
      .populate('category', 'category') // Only get the category name
      .populate('sdg')
      .limit(_end ? parseInt(_end, 10) : undefined)
      .skip(_start ? parseInt(_start, 10) : 0)
      .sort(_sort ? { [_sort]: _order } : { createdAt: -1 });
      

    res.header('x-total-count', count);
    res.header('Access-Control-Expose-Headers', 'x-total-count');

    res.status(200).json(highlights);
  } catch (err) {
    res.status(500).json({ message: 'Fetching highlights failed, please try again later' });
  }
};

// Get highlight by ID for editing
// In getHighlightById function, replace the formattedHighlight creation with:

const getHighlightById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid highlight ID format' });
    }
    
    const highlight = await Highlight
      .findById(id)
      .populate('category')
      .select('_id seq title sdg date location content status createdAt images category');

    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    // Format the highlight data
    const formattedHighlight = {
      ...highlight.toObject(),
      // Handle date strings properly
      date: highlight.date || null,
      createdAt: highlight.createdAt || null,
      category: highlight.category || null
    };
  
    res.status(200).json(formattedHighlight);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get highlight details' });
  }
};


// Create a new highlight
const createHighlight = async (req, res) => {
  try {
    const {
      title, sdg, date, location, content, images, status, seq, email, category
    } = req.body;

    const formattedDate = date ? date.split('T')[0] : null;
    const today = new Date().toISOString().split('T')[0];


    // Parallel processing with timeout
    const createHighlightWithTimeout = async () => {
      // Start image processing
      const imageProcessingPromise = processImages(images);

      if (category) {
        try {
          if (!mongoose.Types.ObjectId.isValid(category)) {
            throw new Error('Invalid category ID format');
          }
          
          const categoryExists = await Category.findById(category); // Changed from category to Category
          if (!categoryExists) {
            throw new Error('Category not found');
          }
        } catch (error) {
          throw new Error(`Category validation failed: ${error.message}`);
        }
      }

      // Add category validation
  if (category) {
    try {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        throw new Error('Invalid category ID format');
      }
      
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        throw new Error('Category not found');
      }
    } catch (error) {
      throw new Error(`Category validation failed: ${error.message}`);
    }
  }

      // Create highlight document
      const highlightData = {
        title,
        sdg,
        date: formattedDate,
        location,
        content,
        status: status || 'draft',
        seq,
        email,
        createdAt: today,
        category,
      };

      // Wait for both operations with a timeout
      const [processedImages, highlight] = await Promise.all([
        Promise.race([
          imageProcessingPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image processing timeout')), 130000)
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
    const { title, sdg, date, location, content, images, status, seq, email, category } = req.body;
    const formattedDate = date ? date.split('T')[0] : null;

    const updateHighlightWithTimeout = async () => {
      // Get existing highlight
      const existingHighlight = await Highlight.findById(id);
      if (!existingHighlight) {
        throw new Error('Highlight not found');
      }

      // Only process new images if they're different from existing ones
      const existingImages = existingHighlight.images || [];
      const newImages = images || [];
      
      // Find images that need to be deleted (exist in old but not in new)
      const imagesToDelete = existingImages.filter(oldImage => 
        !newImages.includes(oldImage) && oldImage.startsWith('http')
      );

      // Find images that need to be uploaded (new base64 images)
      const imagesToUpload = newImages.filter(img => 
        img.startsWith('data:') && !existingImages.includes(img)
      );

      // Keep existing URLs that are still needed
      const remainingImages = newImages.filter(img => 
        !img.startsWith('data:') && existingImages.includes(img)
      );

      // Process operations in parallel
      const [processedNewImages] = await Promise.all([
        imagesToUpload.length > 0 ? processImages(imagesToUpload) : [],
        // Delete old images
        Promise.all(imagesToDelete.map(imageUrl => deleteImageFromCloudinary(imageUrl)))
      ]);

      // Combine remaining and new images
      const finalImages = [...remainingImages, ...processedNewImages];

      // Update highlight with new data
      const updatedHighlight = await Highlight.findByIdAndUpdate(
        id,
        {
          title,
          sdg,
          date: formattedDate,
          location,
          content,
          images: finalImages,
          status,
          seq,
          email,
          category
        },
        { new: true }
      ).populate('category');

      return updatedHighlight;
    };

    const updatedHighlight = await updateHighlightWithTimeout();

    res.status(200).json({
      message: 'Highlight updated successfully',
      highlight: updatedHighlight
    });
  } catch (err) {
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
    
    // Handle comma-separated IDs for multiple deletions
    const ids = id.split(',');
    
    for (const singleId of ids) {
      const highlightToDelete = await Highlight.findById(singleId);
      
      if (!highlightToDelete) {
        continue; // Skip to next ID if this one isn't found
      }

      // Delete images from Cloudinary if they exist
      if (highlightToDelete.images && highlightToDelete.images.length > 0) {
        const deletePromises = highlightToDelete.images.map(imageUrl => 
          deleteImageFromCloudinary(imageUrl)
        );
        
        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled(deletePromises);
        const failures = results.filter(r => r.status === 'rejected');
        
        if (failures.length > 0) {
          res.status(500).json({
            message: `Failed to delete some images for highlight ${singleId}`,
          });
        }
      }

      // Delete the highlight from MongoDB
      await Highlight.findByIdAndDelete(singleId);
    }

    res.status(200).json({ 
      message: `Successfully deleted ${ids.length} ${ids.length === 1 ? 'highlight' : 'highlights'}` 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to delete one or more highlights' 
    });
  }
};
const getDashboardHighlights = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const highlights = await Highlight
      .find({ status: 'published' })
      .select('_id title location status date category images') // Include images field
      .populate('category', 'category') // Populate category field
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean()
      .then(docs => docs.map(doc => ({
        ...doc,
        featuredImage: doc.images?.[0]?.url || null, // Add the first image as featuredImage
      })));

    res.status(200).json(highlights);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch dashboard highlights' 
    });
  }
};

export {
  getHighlights,
  getHighlightById,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getDashboardHighlights,
}