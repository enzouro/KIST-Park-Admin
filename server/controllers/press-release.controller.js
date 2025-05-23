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
    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
    
    // Parse the URL to get the complete path after /upload/
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

    // Delete the image
    const result = await cloudinary.uploader.destroy(publicIdWithPath);
    
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
    res.status(500).json({ message: 'Failed to get press release details' });
  }
};

// Create a new press release
const createPressRelease = async (req, res) => {
  try {
    const {
      title, publisher, date, link, image, seq
    } = req.body;

    const createPressReleaseWithTimeout = async () => {
      // Process image if provided - now required
      if (!image) {
        throw new Error('Image is required');
      }

      const imageProcessingPromise = processImages([image]);

      // Create press release document with required fields
      const pressReleaseData = {
        title,
        publisher,
        date,
        link,
        createdAt: new Date(), // Always set current date
        seq,
        image, // Temporary placeholder to be updated after processing
      };

      // Wait for both operations with timeout
      const [processedImage, pressRelease] = await Promise.all([
        Promise.race([
          imageProcessingPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Image processing timeout')), 60000)
          )
        ]),
        PressRelease.create(pressReleaseData)
      ]);

      // Update press release with processed image
      if (processedImage && processedImage[0]) {
        pressRelease.image = processedImage[0];
        await pressRelease.save();
      } else {
        throw new Error('Image processing failed');
      }

      return pressRelease;
    };

    const pressRelease = await createPressReleaseWithTimeout();

    res.status(201).json({ 
      message: 'Press release created successfully',
      pressRelease
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to create press release', 
      error: err.message 
    });
  }
};


// Update a press release
const updatePressRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, publisher, date, link, image, seq } = req.body;

    const existingPressRelease = await PressRelease.findById(id);
    if (!existingPressRelease) {
      return res.status(404).json({ message: 'Press release not found' });
    }

    let processedImage = existingPressRelease.image;
    
    // Handle image replacement
    if (image && image !== existingPressRelease.image) {
      // First delete the old image from Cloudinary if it exists
      if (existingPressRelease.image) {
        await deleteImageFromCloudinary(existingPressRelease.image);
      }
      
      // Process and upload the new image
      if (typeof image === 'string' && image.startsWith('data:')) {
        const processedImages = await processImages([image]);
        processedImage = processedImages[0] || existingPressRelease.image;
      } else {
        processedImage = image; // Keep the URL if it's already an URL
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
      const ids = id.split(',');
      
      // Find all press releases to get their images before deletion
      const pressReleasesToDelete = await PressRelease.find({ _id: { $in: ids } });
      
      if (pressReleasesToDelete.length === 0) {
        return res.status(404).json({ 
          message: 'No press releases found to delete' 
        });
      }
      
      // Delete all images from Cloudinary
      for (const pr of pressReleasesToDelete) {
        if (pr.image) {
          await deleteImageFromCloudinary(pr.image);
        }
      }
      
      // Delete all press releases in the list
      await PressRelease.deleteMany({ _id: { $in: ids } });
      
      return res.status(200).json({
        message: `${pressReleasesToDelete.length} press releases deleted successfully`
      });
    } 
    // Single ID deletion
    else {
      const pressReleaseToDelete = await PressRelease.findById(id);
      if (!pressReleaseToDelete) {
        return res.status(404).json({ message: 'Press release not found' });
      }
      
      // Delete the image from Cloudinary if it exists
      if (pressReleaseToDelete.image) {
        await deleteImageFromCloudinary(pressReleaseToDelete.image);
      }
      
      // Delete the press release from MongoDB
      await PressRelease.findByIdAndDelete(id);
      
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