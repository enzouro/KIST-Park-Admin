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
    const highlight = await Highlight.findOne({ _id: id }).populate('sdg');

    if (highlight) res.status(200).json(highlight);
    else res.status(404).json({ message: 'Highlight not found' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get the highlight details, please try again later' });
  }
};

// Create a new highlight
const createHighlight = async (req, res) => {
  try {
    const {
      title, sdg, date, location, content, image, status,
    } = req.body;

    // Start a new session
    const session = await mongoose.startSession();
    session.startTransaction();

    let imageUrl = '';
    if (image) {
      const uploadResult = await cloudinary.uploader.upload(image);
      imageUrl = uploadResult.url;
    }

    // Create a new highlight
    const newHighlight = await Highlight.create({
      title,
      sdg,
      date,
      location,
      content,
      image: imageUrl,
      status: status || 'draft',
    });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Send response
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
    const {
      title, sdg, date, location, content, image, status,
    } = req.body;

    let imageUrl = '';
    if (image && image.startsWith('data:')) {
      // If image is a base64 string, upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(image);
      imageUrl = uploadResult.url;
    }

    // Update the highlight
    const updatedHighlight = await Highlight.findByIdAndUpdate(
      { _id: id },
      {
        title,
        sdg,
        date,
        location,
        content,
        image: imageUrl || image, // Use new upload or keep existing URL
        status,
      },
      { new: true } // Return the updated document
    );

    if (!updatedHighlight) {
      return res.status(404).json({ message: 'Highlight not found' });
    }

    // Send response
    res.status(200).json({ 
      message: 'Highlight updated successfully',
      highlight: updatedHighlight
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update highlight, please try again later' });
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

    // If there's an image, you may want to delete it from Cloudinary
    if (highlightToDelete.image) {
      // Extract public_id from the Cloudinary URL
      const publicId = highlightToDelete.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
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