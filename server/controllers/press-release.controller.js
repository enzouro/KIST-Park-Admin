import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

import PressRelease from '../mongodb/models/press-release.js';

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
    console.error('Fetch error:', err);
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
    console.error("Error fetching press release:", err);
    res.status(500).json({ message: 'Failed to get press release details' });
  }
};

// Create a new press release
// Update the createPressRelease function
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
    console.error('Create error:', err);
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
    if (image && image !== existingPressRelease.image) {
      const processedImages = await processImages([image]);
      processedImage = processedImages[0] || existingPressRelease.image;
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
    console.error('Update error:', err);
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
      
      // Validate that all IDs exist
      const existingPressReleases = await PressRelease.find({ _id: { $in: ids } });
      if (existingPressReleases.length !== ids.length) {
        return res.status(404).json({ 
          message: 'One or more press releases not found' 
        });
      }
      
      // Delete all press releases in the list
      await PressRelease.deleteMany({ _id: { $in: ids } });
      
      return res.status(200).json({
        message: `${ids.length} press releases deleted successfully`
      });
    } 
    // Single ID deletion
    else {
      const pressReleaseToDelete = await PressRelease.findById(id);
      if (!pressReleaseToDelete) {
        return res.status(404).json({ message: 'Press release not found' });
      }
      
      await PressRelease.findByIdAndDelete(id);
      
      return res.status(200).json({ 
        message: 'Press release deleted successfully' 
      });
    }
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ 
      message: 'Failed to delete press release' 
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