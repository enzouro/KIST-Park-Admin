import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

import PressRelease from '../mongodb/models/press-release.js';

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
    quality: "auto:good",  // Better quality
    fetch_format: "auto", 
    transformation: [
      { width: 1200, crop: "limit" }, // Slightly larger size
      { quality: "auto:good" }
    ],
    timeout: 120000, // 2 minutes timeout
    chunk_size: 6000000, // 6MB chunks for better upload reliability
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  };

  const uploadPromises = images.slice(0, 5).map(async (image, index) => {
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
      return image;
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
    // Handle case where imageUrl is an array
    if (Array.isArray(imageUrl)) {
      if (imageUrl.length === 0) return false;
      imageUrl = imageUrl[0]; // Take the first element
    }
    
    // Exit early if no image URL provided
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      return false;
    }
    
    // Extract the public ID from Cloudinary URL
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) {
      return false;
    }
    
    // Extract everything after the /upload/ part, removing version if present
    let publicIdWithPath = urlParts[1];
    
    // Remove version number if present (v1234567890/)
    publicIdWithPath = publicIdWithPath.replace(/^v\d+\//, '');
    
    // Remove file extension
    publicIdWithPath = publicIdWithPath.replace(/\.[^/.]+$/, "");
    
    // Use a simple in-memory cache to track deleted images
    if (deleteImageFromCloudinary.deletedCache.has(publicIdWithPath)) {
      return true;
    }

    // Delete the image with timeout
    const deletePromise = cloudinary.uploader.destroy(publicIdWithPath);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Delete timeout')), 30000)
    );
    
    const result = await Promise.race([deletePromise, timeoutPromise]);
    
    // Mark as deleted in cache
    deleteImageFromCloudinary.deletedCache.add(publicIdWithPath);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
};

deleteImageFromCloudinary.deletedCache = new Set();

// ------- End of Utility Functions --------------///

// Get all press releases with filtering and pagination
const getPressReleases = async (req, res) => {
  const {
    _end, _order, _start, _sort, title_like = '', publisher = '',
  } = req.query;

  const query = {};

  if (publisher !== '') {
    query.publisher = publisher;
  }

  if (title_like) {
    query.title = { $regex: title_like, $options: 'i' };
  }

  try {
    const count = await PressRelease.countDocuments(query);

    const pressReleases = await PressRelease
      .find(query)
      .select('_id seq title publisher date link image createdAt')
      .limit(_end ? parseInt(_end, 10) : undefined)
      .skip(_start ? parseInt(_start, 10) : 0)
      .sort(_sort ? { [_sort]: _order } : { createdAt: -1 });

    res.header('x-total-count', count);
    res.header('Access-Control-Expose-Headers', 'x-total-count');

    res.status(200).json(pressReleases);
  } catch (err) {
    console.error('Error fetching press releases:', err);
    res.status(500).json({ message: 'Fetching press releases failed, please try again later' });
  }
};

// Get press release by ID
const getPressReleaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid press release ID format' });
    }
    
    const pressRelease = await PressRelease.findById(id);

    if (pressRelease) {
      const formattedPressRelease = {
        ...pressRelease.toObject(),
        date: pressRelease.date ? pressRelease.date.toISOString().split('T')[0] : null,
        createdAt: pressRelease.createdAt ? pressRelease.createdAt.toISOString() : null
      };
      
      res.status(200).json(formattedPressRelease);
    } else {
      res.status(404).json({ message: 'Press release not found' });
    }
  } catch (err) {
    console.error('Error getting press release:', err);
    res.status(500).json({ message: 'Failed to get press release details' });
  }
};

// Create a new press release
const createPressRelease = async (req, res) => {
  let createdPressRelease = null;
  
  try {
    const {
      title, publisher, date, link, image, seq
    } = req.body;

    // Validate required fields
    if (!title || !publisher || !date || !link) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, publisher, date, and link are required' 
      });
    }

    // Create press release document first without image
    const pressReleaseData = {
      title,
      publisher,
      date,
      link,
      createdAt: new Date(),
      seq,
      image: null, // Will be updated after processing
    };

    console.log('Creating press release without image first...');
    createdPressRelease = await PressRelease.create(pressReleaseData);
    console.log('Press release created with ID:', createdPressRelease._id);

    // Process image if provided
    if (image && typeof image === 'string' && image.startsWith('data:')) {
      console.log('Processing image...');
      
      try {
        const processedImages = await processImages([image]);
        
        if (processedImages && processedImages.length > 0) {
          console.log('Image processed successfully:', processedImages[0]);
          createdPressRelease.image = processedImages[0];
          await createdPressRelease.save();
          console.log('Press release updated with image');
        } else {
          console.warn('Image processing returned no results');
          // Don't fail the entire operation if image processing fails
        }
      } catch (imageError) {
        console.error('Image processing failed:', imageError);
        // Don't fail the entire operation if image processing fails
      }
    } else if (image && typeof image === 'string' && image.startsWith('http')) {
      // If it's already a URL, just save it
      createdPressRelease.image = image;
      await createdPressRelease.save();
    }

    res.status(201).json({ 
      message: 'Press release created successfully',
      pressRelease: createdPressRelease
    });

  } catch (err) {
    console.error('Error creating press release:', err);
    
    // If press release was created but image processing failed, 
    // still return success but with a warning
    if (createdPressRelease) {
      res.status(201).json({ 
        message: 'Press release created successfully (image processing may have failed)',
        pressRelease: createdPressRelease,
        warning: 'Image may not have been processed correctly'
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to create press release', 
        error: err.message 
      });
    }
  }
};

// Update a press release
const updatePressRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, publisher, date, link, image, seq } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid press release ID format' });
    }

    const existingPressRelease = await PressRelease.findById(id);
    if (!existingPressRelease) {
      return res.status(404).json({ message: 'Press release not found' });
    }

    let processedImage = existingPressRelease.image;
    
      // Handle image replacement
    if (image !== undefined && image !== existingPressRelease.image) {
      if (image && typeof image === 'string' && image.startsWith('data:')) {
        console.log('Processing new image for update...');
        
        try {
          const processedImages = await processImages([image]);
          
          if (processedImages && processedImages.length > 0) {
            console.log('New image processed successfully');
            
            // Delete old image if it exists and is different
            if (existingPressRelease.image && 
                typeof existingPressRelease.image === 'string' && 
                existingPressRelease.image.startsWith('http')) {
              console.log('Deleting old image...');
              await deleteImageFromCloudinary(existingPressRelease.image);
            }
            
            processedImage = processedImages[0];
          } else {
            console.warn('Image processing failed, keeping existing image');
          }
        } catch (imageError) {
          console.error('Image processing error during update:', imageError);
          // Keep existing image if processing fails
        }
      } else if (image && typeof image === 'string' && image.startsWith('http')) {
        // If it's already a URL, use it
        processedImage = image;
      } else if (image === null || image === '') {
        // If explicitly setting to null/empty, delete old image
        if (existingPressRelease.image && 
            typeof existingPressRelease.image === 'string' && 
            existingPressRelease.image.startsWith('http')) {
          await deleteImageFromCloudinary(existingPressRelease.image);
        }
        processedImage = null;
      }
    }

    const updatedPressRelease = await PressRelease.findByIdAndUpdate(
      id,
      {
        title,
        publisher,
        date,
        link,
        image: processedImage,
        seq
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Press release updated successfully',
      pressRelease: updatedPressRelease
    });
  } catch (err) {
    console.error('Error updating press release:', err);
    res.status(500).json({ 
      message: 'Failed to update press release',
      error: err.message 
    });
  }
};

// Delete a press release
const deletePressRelease = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if we have multiple IDs (comma-separated)
    if (id.includes(',')) {
      const ids = id.split(',').filter(Boolean);
      
      // Find all press releases to get their images before deletion
      const pressReleasesToDelete = await PressRelease.find({ _id: { $in: ids } });
      
      if (pressReleasesToDelete.length === 0) {
        return res.status(404).json({ 
          message: 'No press releases found to delete' 
        });
      }
      
      // Delete all images from Cloudinary (don't wait for completion)
      const imageDeletePromises = pressReleasesToDelete
        .filter(pr => pr.image && pr.image.startsWith('http'))
        .map(pr => deleteImageFromCloudinary(pr.image));
      
      // Start image deletion but don't wait for it
      if (imageDeletePromises.length > 0) {
        Promise.allSettled(imageDeletePromises).catch(err => {
          console.error('Error deleting images:', err);
        });
      }
      
      // Delete all press releases in the list
      const deleteResult = await PressRelease.deleteMany({ _id: { $in: ids } });
      
      return res.status(200).json({
        message: `${deleteResult.deletedCount} press releases deleted successfully`
      });
    } 
    // Single ID deletion
    else {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid press release ID format' });
      }

      const pressReleaseToDelete = await PressRelease.findById(id);
      if (!pressReleaseToDelete) {
        return res.status(404).json({ message: 'Press release not found' });
      }
      
      // Delete the press release from MongoDB first
      await PressRelease.findByIdAndDelete(id);
      
      // Delete the image from Cloudinary asynchronously
      if (pressReleaseToDelete.image && pressReleaseToDelete.image.startsWith('http')) {
        deleteImageFromCloudinary(pressReleaseToDelete.image).catch(err => {
          console.error('Error deleting image:', err);
        });
      }
      
      return res.status(200).json({ 
        message: 'Press release deleted successfully' 
      });
    }
  } catch (err) {
    console.error('Error deleting press release:', err);
    res.status(500).json({ 
      message: 'Failed to delete press release',
      error: err.message 
    });
  }
};

export {
  getPressReleases,
  getPressReleaseById,
  createPressRelease,
  updatePressRelease,
  deletePressRelease,
};