// server\controllers\highlights.controller.js

import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

import Highlight from '../mongodb/models/highlights.js';
import Category from '../mongodb/models/category.js';

dotenv.config();

// Enhanced Cloudinary configuration with proxy support
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  // Add these for better network handling
  secure: true,
  timeout: 120000, // 2 minutes
});

// ---------  Utility Functions -------------------//

// Image processing and uploading to Cloudinary
const processImages = async (images) => {
  if (!images || !images.length) return [];
  
  const uploadOptions = {
    resource_type: "auto",
    quality: "auto:good",
    fetch_format: "auto", 
    transformation: [
      { width: 1200, crop: "limit" },
      { quality: "auto:good" }
    ],
    timeout: 120000, // 2 minutes timeout
    chunk_size: 6000000, // 6MB chunks
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  const uploadPromises = images.slice(0, 10).map(async (image, index) => {
    if (image && typeof image === 'string') {
      if (image.startsWith('data:')) {
        try {
          // Check image size before processing
          const base64Size = image.length * (3/4);
          if (base64Size > 15 * 1024 * 1024) { // 15MB limit
            console.warn(`Image ${index} too large: ${base64Size} bytes`);
            return null;
          }

          console.log(`Starting upload for image ${index}`);
          const uploadResult = await cloudinary.uploader.upload(image, uploadOptions);
          console.log(`Upload successful for image ${index}:`, uploadResult.url);
          return uploadResult.url;
        } catch (error) {
          console.error(`Upload failed for image ${index}:`, error.message);
          return null;
        }
      }
      return image; // Return existing URL
    }
    return null;
  });
  
  try {
    const results = await Promise.allSettled(uploadPromises);
    const successfulUploads = results
      .filter(result => result.status === 'fulfilled' && result.value)
      .map(result => result.value);
    
    console.log(`Successfully processed ${successfulUploads.length} out of ${images.length} images`);
    return successfulUploads;
  } catch (error) {
    console.error('Error in processImages:', error);
    return [];
  }
};

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      return false;
    }
    
    // Extract the public ID from Cloudinary URL
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) {
      return false;
    }
    
    let publicIdWithPath = urlParts[1];
    publicIdWithPath = publicIdWithPath.replace(/^v\d+\//, '');
    publicIdWithPath = publicIdWithPath.replace(/\.[^/.]+$/, "");
    
    // Use cache to prevent duplicate deletions
    if (deleteImageFromCloudinary.deletedCache.has(publicIdWithPath)) {
      return true;
    }

    // Delete with timeout
    const deletePromise = cloudinary.uploader.destroy(publicIdWithPath);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Delete timeout')), 30000)
    );
    
    const result = await Promise.race([deletePromise, timeoutPromise]);
    
    deleteImageFromCloudinary.deletedCache.add(publicIdWithPath);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
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
      .select('_id seq title sdg date location status createdAt category images')
      .populate('category', 'category')
      .populate('sdg')
      .limit(_end ? parseInt(_end, 10) : undefined)
      .skip(_start ? parseInt(_start, 10) : 0)
      .sort(_sort ? { [_sort]: _order } : { createdAt: -1 });

    res.header('x-total-count', count);
    res.header('Access-Control-Expose-Headers', 'x-total-count');

    res.status(200).json(highlights);
  } catch (err) {
    console.error('Error fetching highlights:', err);
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
      .populate('category')
      .select('_id seq title sdg date location content status createdAt images category');

    if (!highlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    const formattedHighlight = {
      ...highlight.toObject(),
      date: highlight.date || null,
      createdAt: highlight.createdAt || null,
      category: highlight.category || null
    };
  
    res.status(200).json(formattedHighlight);
  } catch (err) {
    console.error('Error getting highlight:', err);
    res.status(500).json({ message: 'Failed to get highlight details' });
  }
};

// Create a new highlight
const createHighlight = async (req, res) => {
  let createdHighlight = null;
  
  try {
    const {
      title, sdg, date, location, content, images, status, seq, email, category
    } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ 
        message: 'Missing required fields: title and content are required' 
      });
    }

    const formattedDate = date ? date.split('T')[0] : null;
    const today = new Date().toISOString().split('T')[0];

    // Validate category if provided
    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: 'Invalid category ID format' });
      }
      
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    // Create highlight document first without images
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
      images: [], // Will be updated after processing
    };

    console.log('Creating highlight without images first...');
    createdHighlight = await Highlight.create(highlightData);
    console.log('Highlight created with ID:', createdHighlight._id);

    // Process images if provided
    if (images && images.length > 0) {
      console.log(`Processing ${images.length} images...`);
      
      try {
        const processedImages = await processImages(images);
        
        if (processedImages && processedImages.length > 0) {
          console.log(`Successfully processed ${processedImages.length} images`);
          createdHighlight.images = processedImages;
          await createdHighlight.save();
          console.log('Highlight updated with images');
        } else {
          console.warn('Image processing returned no results');
        }
      } catch (imageError) {
        console.error('Image processing failed:', imageError);
        // Don't fail the entire operation if image processing fails
      }
    }

    res.status(201).json({ 
      message: 'Highlight created successfully',
      highlight: createdHighlight
    });

  } catch (err) {
    console.error('Error creating highlight:', err);
    
    // If highlight was created but image processing failed, 
    // still return success but with a warning
    if (createdHighlight) {
      res.status(201).json({ 
        message: 'Highlight created successfully (image processing may have failed)',
        highlight: createdHighlight,
        warning: 'Some images may not have been processed correctly'
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to create highlight', 
        error: err.message 
      });
    }
  }
};

// Update a highlight
const updateHighlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, sdg, date, location, content, images, status, seq, email, category } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid highlight ID format' });
    }

    const formattedDate = date ? date.split('T')[0] : null;

    // Get existing highlight
    const existingHighlight = await Highlight.findById(id);
    if (!existingHighlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    // Validate category if provided
    if (category && category !== existingHighlight.category?.toString()) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        return res.status(400).json({ message: 'Invalid category ID format' });
      }
      
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Category not found' });
      }
    }

    const existingImages = existingHighlight.images || [];
    const newImages = images || [];
    
    // Find images that need to be deleted (exist in old but not in new)
    const imagesToDelete = existingImages.filter(oldImage => 
      !newImages.includes(oldImage) && oldImage.startsWith('http')
    );

    // Find images that need to be uploaded (new base64 images)
    const imagesToUpload = newImages.filter(img => 
      img.startsWith('data:')
    );

    // Keep existing URLs that are still needed
    const remainingImages = newImages.filter(img => 
      !img.startsWith('data:') && existingImages.includes(img)
    );

    let finalImages = [...remainingImages];

    // Process new images if any
    if (imagesToUpload.length > 0) {
      console.log(`Processing ${imagesToUpload.length} new images...`);
      
      try {
        const processedNewImages = await processImages(imagesToUpload);
        if (processedNewImages && processedNewImages.length > 0) {
          finalImages = [...finalImages, ...processedNewImages];
          console.log(`Successfully processed ${processedNewImages.length} new images`);
        }
      } catch (imageError) {
        console.error('Error processing new images:', imageError);
        // Continue with update even if image processing fails
      }
    }

    // Delete old images asynchronously (don't wait for completion)
    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} old images...`);
      Promise.allSettled(imagesToDelete.map(imageUrl => deleteImageFromCloudinary(imageUrl)))
        .catch(err => console.error('Error deleting old images:', err));
    }

    // Update highlight
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

    res.status(200).json({
      message: 'Highlight updated successfully',
      highlight: updatedHighlight
    });
  } catch (err) {
    console.error('Error updating highlight:', err);
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
    const ids = id.split(',').filter(Boolean);
    
    const highlightsToDelete = await Highlight.find({ _id: { $in: ids } });
    
    if (highlightsToDelete.length === 0) {
      return res.status(404).json({ message: 'No highlights found to delete' });
    }

    // Collect all images that need to be deleted
    const imagesToDelete = [];
    highlightsToDelete.forEach(highlight => {
      if (highlight.images && highlight.images.length > 0) {
        imagesToDelete.push(...highlight.images.filter(img => img.startsWith('http')));
      }
    });

    // Delete highlights from MongoDB first
    const deleteResult = await Highlight.deleteMany({ _id: { $in: ids } });

    // Delete images from Cloudinary asynchronously (don't wait for completion)
    if (imagesToDelete.length > 0) {
      console.log(`Deleting ${imagesToDelete.length} images from Cloudinary...`);
      Promise.allSettled(imagesToDelete.map(imageUrl => deleteImageFromCloudinary(imageUrl)))
        .catch(err => console.error('Error deleting images:', err));
    }

    res.status(200).json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} ${deleteResult.deletedCount === 1 ? 'highlight' : 'highlights'}` 
    });
  } catch (err) {
    console.error('Error deleting highlights:', err);
    res.status(500).json({ 
      message: 'Failed to delete one or more highlights',
      error: err.message 
    });
  }
};

const getDashboardHighlights = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const highlights = await Highlight
      .find({ status: 'published' })
      .select('_id title location status date category images')
      .populate('category', 'category')
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean()
      .then(docs => docs.map(doc => ({
        ...doc,
        featuredImage: doc.images?.[0] || null, // Add the first image as featuredImage
      })));

    res.status(200).json(highlights);
  } catch (err) {
    console.error('Error fetching dashboard highlights:', err);
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
};