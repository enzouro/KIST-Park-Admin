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

console.log('🔧 Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);

// ---------  Utility Functions -------------------//

// Image processing and uploading to Cloudinary
const processImages = async (images) => {
  console.log('📸 processImages called with:', images?.length || 0, 'images');
  
  if (!images || !images.length) {
    console.log('⚠️ No images provided to processImages');
    return [];
  }
  
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

  console.log('📸 Upload options:', uploadOptions);

  // Use a rate-limited, concurrent upload strategy
  const uploadPromises = images.slice(0, 5).map(async (image, index) => {
    console.log(`📸 Processing image ${index + 1}/${Math.min(images.length, 5)}`);
    
    if (image && typeof image === 'string') {
      if (image.startsWith('data:')) {
        try {
          // Check image size before processing
          const base64Size = image.length * (3/4);
          console.log(`📸 Image ${index + 1} base64 size:`, (base64Size / 1024 / 1024).toFixed(2), 'MB');
          
          if (base64Size > 10 * 1024 * 1024) { // 10MB limit
            console.log(`❌ Image ${index + 1} too large (${(base64Size / 1024 / 1024).toFixed(2)}MB), skipping`);
            return null;
          }

          console.log(`📤 Uploading image ${index + 1} to Cloudinary...`);
          const uploadStart = Date.now();
          const uploadResult = await cloudinary.uploader.upload(image, uploadOptions);
          const uploadTime = Date.now() - uploadStart;
          
          console.log(`✅ Image ${index + 1} uploaded successfully in ${uploadTime}ms:`, uploadResult.url);
          return uploadResult.url;
        } catch (error) {
          console.error(`❌ Error uploading image ${index + 1}:`, error.message);
          return null;
        }
      }
      console.log(`📸 Image ${index + 1} is already a URL:`, image.substring(0, 100) + '...');
      return image;
    }
    console.log(`⚠️ Image ${index + 1} is invalid or empty`);
    return null;
  });
  
  console.log('📸 Waiting for all image uploads to complete...');
  const uploadStart = Date.now();
  
  // Use Promise.allSettled for more robust handling
  const results = await Promise.allSettled(uploadPromises);
  const uploadTime = Date.now() - uploadStart;
  
  console.log(`📸 All image uploads completed in ${uploadTime}ms`);
  
  const processedImages = results
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value);
    
  console.log('📸 Successfully processed', processedImages.length, 'out of', images.length, 'images');
  
  return processedImages;
};

// Delete image from Cloudinary
const deleteImageFromCloudinary = async (imageUrl) => {
  console.log('🗑️ Attempting to delete image from Cloudinary:', imageUrl);
  
  try {
    // Handle case where imageUrl is an array
    if (Array.isArray(imageUrl)) {
      console.log('🗑️ Image URL is an array with', imageUrl.length, 'items');
      if (imageUrl.length === 0) {
        console.log('⚠️ Empty image URL array, nothing to delete');
        return false;
      }
      imageUrl = imageUrl[0]; // Take the first element
      console.log('🗑️ Using first array element:', imageUrl);
    }
    
    // Exit early if no image URL provided
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
      console.log('⚠️ Invalid or missing image URL, skipping deletion');
      return false;
    }
    
    // Extract the public ID from Cloudinary URL
    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.jpg
    
    // Parse the URL to get the complete path after /upload/
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length < 2) {
      console.log('❌ Invalid Cloudinary URL format, cannot extract public ID');
      return false;
    }
    
    // Extract everything after the /upload/ part, removing version if present
    let publicIdWithPath = urlParts[1];
    console.log('🗑️ Raw public ID path:', publicIdWithPath);
    
    // Remove version number if present (v1234567890/)
    publicIdWithPath = publicIdWithPath.replace(/^v\d+\//, '');
    console.log('🗑️ Public ID after version removal:', publicIdWithPath);
    
    // Remove file extension
    publicIdWithPath = publicIdWithPath.replace(/\.[^/.]+$/, "");
    console.log('🗑️ Final public ID:', publicIdWithPath);
    
    // Use a simple in-memory cache to track deleted images
    if (deleteImageFromCloudinary.deletedCache.has(publicIdWithPath)) {
      console.log('✅ Image already deleted (found in cache)');
      return true;
    }

    console.log('🗑️ Deleting image from Cloudinary...');
    const deleteStart = Date.now();
    
    // Delete the image
    const result = await cloudinary.uploader.destroy(publicIdWithPath);
    const deleteTime = Date.now() - deleteStart;
    
    console.log(`🗑️ Cloudinary deletion result in ${deleteTime}ms:`, result);
    
    // Mark as deleted in cache
    deleteImageFromCloudinary.deletedCache.add(publicIdWithPath);
    
    const success = result.result === 'ok';
    console.log(success ? '✅ Image deleted successfully' : '⚠️ Image deletion failed or not found');
    
    return success;
  } catch (error) {
    console.error('❌ Error deleting image from Cloudinary:', error.message);
    return false;
  }
};

deleteImageFromCloudinary.deletedCache = new Set();

// ------- End of Utility Functions --------------///
// Get all press releases with filtering and pagination
const getPressReleases = async (req, res) => {
  console.log('📚 GET /press-releases called');
  console.log('📚 Query parameters:', req.query);
  
  const {
    _end, _order, _start, _sort, title_like = '', publisher = '',
  } = req.query;

  const query = {};

  if (publisher !== '') {
    query.publisher = publisher;
    console.log('📚 Filtering by publisher:', publisher);
  }

  if (title_like) {
    query.title = { $regex: title_like, $options: 'i' };
    console.log('📚 Filtering by title pattern:', title_like);
  }

  console.log('📚 Final MongoDB query:', query);

  try {
    console.log('📚 Counting documents...');
    const countStart = Date.now();
    const count = await PressRelease.countDocuments(query);
    const countTime = Date.now() - countStart;
    console.log(`📚 Found ${count} documents in ${countTime}ms`);

    console.log('📚 Fetching press releases...');
    const fetchStart = Date.now();
    
    const pressReleases = await PressRelease
      .find(query)
      .select('_id seq title publisher date link image createdAt')
      .limit(_end ? parseInt(_end, 10) : undefined)
      .skip(_start ? parseInt(_start, 10) : 0)
      .sort(_sort ? { [_sort]: _order } : { createdAt: -1 });
    
    const fetchTime = Date.now() - fetchStart;
    console.log(`📚 Fetched ${pressReleases.length} press releases in ${fetchTime}ms`);

    res.header('x-total-count', count);
    res.header('Access-Control-Expose-Headers', 'x-total-count');

    console.log('✅ Successfully returning press releases');
    res.status(200).json(pressReleases);
  } catch (err) {
    console.error('❌ Error fetching press releases:', err.message);
    res.status(500).json({ message: 'Fetching press releases failed, please try again later' });
  }
};

// Get press release by ID
const getPressReleaseById = async (req, res) => {
  console.log('📖 GET /press-releases/:id called');
  console.log('📖 Request params:', req.params);
  
  try {
    const { id } = req.params;
    console.log('📖 Looking for press release with ID:', id);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('❌ Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid press release ID format' });
    }
    
    console.log('📖 Querying database...');
    const queryStart = Date.now();
    const pressRelease = await PressRelease.findById(id);
    const queryTime = Date.now() - queryStart;
    
    console.log(`📖 Database query completed in ${queryTime}ms`);

    if (pressRelease) {
      console.log('✅ Press release found:', pressRelease.title);
      
      const formattedPressRelease = {
        ...pressRelease.toObject(),
        date: pressRelease.date ? pressRelease.date.toISOString().split('T')[0] : null,
        createdAt: pressRelease.createdAt ? pressRelease.createdAt.toISOString() : null
      };
      
      console.log('📖 Returning formatted press release');
      res.status(200).json(formattedPressRelease);
    } else {
      console.log('❌ Press release not found with ID:', id);
      res.status(404).json({ message: 'Press release not found' });
    }
  } catch (err) {
    console.error('❌ Error getting press release by ID:', err.message);
    res.status(500).json({ message: 'Failed to get press release details' });
  }
};

// Create a new press release
const createPressRelease = async (req, res) => {
  console.log('➕ POST /press-releases called');
  console.log('➕ Request body keys:', Object.keys(req.body));
  console.log('➕ Has image:', !!req.body.image);
  
  try {
    const {
      title, publisher, date, link, image, seq
    } = req.body;

    console.log('➕ Press release data:');
    console.log('   - Title:', title);
    console.log('   - Publisher:', publisher);
    console.log('   - Date:', date);
    console.log('   - Link:', link);
    console.log('   - Seq:', seq);
    console.log('   - Image type:', typeof image, image ? '(provided)' : '(missing)');

    const createPressReleaseWithTimeout = async () => {
      // Process image if provided - now required
      if (!image) {
        console.log('❌ No image provided - image is required');
        throw new Error('Image is required');
      }

      console.log('📸 Starting image processing...');
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

      console.log('💾 Creating press release document in database...');
      const dbStart = Date.now();

      // Wait for both operations with timeout
      const [processedImage, pressRelease] = await Promise.all([
        Promise.race([
          imageProcessingPromise,
          new Promise((_, reject) => 
            setTimeout(() => {
              console.log('⏰ Image processing timeout (60s)');
              reject(new Error('Image processing timeout'));
            }, 60000)
          )
        ]),
        PressRelease.create(pressReleaseData)
      ]);

      const dbTime = Date.now() - dbStart;
      console.log(`💾 Press release created in database in ${dbTime}ms`);

      // Update press release with processed image
      if (processedImage && processedImage[0]) {
        console.log('💾 Updating press release with processed image URL...');
        const updateStart = Date.now();
        
        pressRelease.image = processedImage[0];
        await pressRelease.save();
        
        const updateTime = Date.now() - updateStart;
        console.log(`💾 Press release updated with image in ${updateTime}ms`);
        console.log('✅ Final image URL:', processedImage[0]);
      } else {
        console.log('❌ Image processing failed - no processed image returned');
        throw new Error('Image processing failed');
      }

      return pressRelease;
    };

    console.log('⏱️ Starting press release creation with timeout...');
    const totalStart = Date.now();
    
    const pressRelease = await createPressReleaseWithTimeout();
    
    const totalTime = Date.now() - totalStart;
    console.log(`✅ Press release created successfully in ${totalTime}ms`);
    console.log('✅ Created press release ID:', pressRelease._id);

    res.status(201).json({ 
      message: 'Press release created successfully',
      pressRelease
    });
  } catch (err) {
    console.error('❌ Error creating press release:', err.message);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Failed to create press release', 
      error: err.message 
    });
  }
};


// Update a press release
const updatePressRelease = async (req, res) => {
  console.log('✏️ PUT /press-releases/:id called');
  console.log('✏️ Request params:', req.params);
  console.log('✏️ Request body keys:', Object.keys(req.body));
  
  try {
    const { id } = req.params;
    const { title, publisher, date, link, image, seq } = req.body;

    console.log('✏️ Update data:');
    console.log('   - ID:', id);
    console.log('   - Title:', title);
    console.log('   - Publisher:', publisher);
    console.log('   - Date:', date);
    console.log('   - Link:', link);
    console.log('   - Seq:', seq);
    console.log('   - Image changed:', !!image);

    console.log('🔍 Finding existing press release...');
    const findStart = Date.now();
    const existingPressRelease = await PressRelease.findById(id);
    const findTime = Date.now() - findStart;
    
    console.log(`🔍 Database lookup completed in ${findTime}ms`);
    
    if (!existingPressRelease) {
      console.log('❌ Press release not found with ID:', id);
      return res.status(404).json({ message: 'Press release not found' });
    }

    console.log('✅ Found existing press release:', existingPressRelease.title);
    console.log('🖼️ Current image:', existingPressRelease.image);

    let processedImage = existingPressRelease.image;
    
    // Handle image replacement
    if (image && image !== existingPressRelease.image) {
      console.log('🔄 Image needs to be replaced');
      
      // First delete the old image from Cloudinary if it exists
      if (existingPressRelease.image) {
        console.log('🗑️ Deleting old image from Cloudinary...');
        const deleteStart = Date.now();
        await deleteImageFromCloudinary(existingPressRelease.image);
        const deleteTime = Date.now() - deleteStart;
        console.log(`🗑️ Old image deletion completed in ${deleteTime}ms`);
      }
      
      // Process and upload the new image
      if (typeof image === 'string' && image.startsWith('data:')) {
        console.log('📸 Processing new base64 image...');
        const processStart = Date.now();
        const processedImages = await processImages([image]);
        const processTime = Date.now() - processStart;
        
        console.log(`📸 New image processing completed in ${processTime}ms`);
        processedImage = processedImages[0] || existingPressRelease.image;
        console.log('📸 New processed image URL:', processedImage);
      } else {
        console.log('📸 Using provided image URL directly:', image);
        processedImage = image; // Keep the URL if it's already an URL
      }
    } else {
      console.log('📸 No image change required');
    }

    console.log('💾 Updating press release in database...');
    const updateStart = Date.now();
    
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

    const updateTime = Date.now() - updateStart;
    console.log(`💾 Database update completed in ${updateTime}ms`);
    console.log('✅ Press release updated successfully');

    res.status(200).json({
      message: 'Press release updated successfully',
      pressRelease: updatedPressRelease
    });
  } catch (err) {
    console.error('❌ Error updating press release:', err.message);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Failed to update press release',
      error: err.message 
    });
  }
};

// Delete a press release
const deletePressRelease = async (req, res) => {
  console.log('🗑️ DELETE /press-releases/:id called');
  console.log('🗑️ Request params:', req.params);
  
  try {
    const { id } = req.params;
    console.log('🗑️ Processing deletion for ID(s):', id);
    
    // Check if we have multiple IDs (comma-separated)
    if (id.includes(',')) {
      const ids = id.split(',');
      console.log('🗑️ Multiple IDs detected:', ids.length, 'items');
      console.log('🗑️ IDs to delete:', ids);
      
      // Find all press releases to get their images before deletion
      console.log('🔍 Finding press releases to delete...');
      const findStart = Date.now();
      const pressReleasesToDelete = await PressRelease.find({ _id: { $in: ids } });
      const findTime = Date.now() - findStart;
      
      console.log(`🔍 Found ${pressReleasesToDelete.length} press releases in ${findTime}ms`);
      
      if (pressReleasesToDelete.length === 0) {
        console.log('❌ No press releases found to delete');
        return res.status(404).json({ 
          message: 'No press releases found to delete' 
        });
      }
      
      // Delete all images from Cloudinary
      console.log('🗑️ Deleting images from Cloudinary...');
      const imageDeleteStart = Date.now();
      
      for (const [index, pr] of pressReleasesToDelete.entries()) {
        console.log(`🗑️ Processing image ${index + 1}/${pressReleasesToDelete.length} for PR: ${pr.title}`);
        if (pr.image) {
          await deleteImageFromCloudinary(pr.image);
        } else {
          console.log('⚠️ No image to delete for this press release');
        }
      }
      
      const imageDeleteTime = Date.now() - imageDeleteStart;
      console.log(`🗑️ All images processed in ${imageDeleteTime}ms`);
      
      // Delete all press releases in the list
      console.log('💾 Deleting press releases from database...');
      const dbDeleteStart = Date.now();
      await PressRelease.deleteMany({ _id: { $in: ids } });
      const dbDeleteTime = Date.now() - dbDeleteStart;
      
      console.log(`💾 Database deletion completed in ${dbDeleteTime}ms`);
      console.log(`✅ Successfully deleted ${pressReleasesToDelete.length} press releases`);
      
      return res.status(200).json({
        message: `${pressReleasesToDelete.length} press releases deleted successfully`
      });
    } 
    // Single ID deletion
    else {
      console.log('🗑️ Single ID deletion');
      
      console.log('🔍 Finding press release to delete...');
      const findStart = Date.now();
      const pressReleaseToDelete = await PressRelease.findById(id);
      const findTime = Date.now() - findStart;
      
      console.log(`🔍 Database lookup completed in ${findTime}ms`);
      
      if (!pressReleaseToDelete) {
        console.log('❌ Press release not found with ID:', id);
        return res.status(404).json({ message: 'Press release not found' });
      }
      
      console.log('✅ Found press release to delete:', pressReleaseToDelete.title);
      
      // Delete the image from Cloudinary if it exists
      if (pressReleaseToDelete.image) {
        console.log('🗑️ Deleting image from Cloudinary...');
        const imageDeleteStart = Date.now();
        await deleteImageFromCloudinary(pressReleaseToDelete.image);
        const imageDeleteTime = Date.now() - imageDeleteStart;
        console.log(`🗑️ Image deletion completed in ${imageDeleteTime}ms`);
      } else {
        console.log('⚠️ No image to delete for this press release');
      }
      
      // Delete the press release from MongoDB
      console.log('💾 Deleting press release from database...');
      const dbDeleteStart = Date.now();
      await PressRelease.findByIdAndDelete(id);
      const dbDeleteTime = Date.now() - dbDeleteStart;
      
      console.log(`💾 Database deletion completed in ${dbDeleteTime}ms`);
      console.log('✅ Press release deleted successfully');
      
      return res.status(200).json({ 
        message: 'Press release deleted successfully' 
      });
    }
  } catch (err) {
    console.error('❌ Error deleting press release:', err.message);
    console.error('❌ Error stack:', err.stack);
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