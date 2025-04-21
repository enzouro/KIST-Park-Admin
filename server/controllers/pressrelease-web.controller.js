// server\controllers\pressrelease-web.controller.js
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

import PressRelease from '../mongodb/models/press-release.js';


dotenv.config();
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

export {
  getPressReleases,
  getPressReleaseById,
}