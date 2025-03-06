/* eslint-disable linebreak-style */
/* eslint-disable no-underscore-dangle */
import * as dotenv from 'dotenv';

import mongoose from 'mongoose';
import Procurement from '../mongodb/models/procurement.js';
import User from '../mongodb/models/user.js';

dotenv.config();

const getAllProcurements = async (req, res) => {
  const {
    _end, _order, _start, _sort, title_like = '', procurementType = '',
  } = req.query;

  const query = {};

  if (procurementType !== '') {
    query.procurementType = procurementType;
  }

  if (title_like) {
    query.title = { $regex: title_like, $options: 'i' };
  }

  try {
    const count = await Procurement.countDocuments({ query });

    const procurements = await Procurement
      .find(query)
      .limit(_end)
      .skip(_start)
      .sort({ [_sort]: _order });

    res.header('x-total-count', count);
    res.header('Access-Control-Expose-Headers', 'x-total-count');

    res.status(200).json(procurements);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: 'Fetching procurements failed, please try again later' });
  }
};

const getProcurementDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const procurementExists = await Procurement.findOne({ _id: id }).populate('creator');

    if (procurementExists) res.status(200).json(procurementExists);
    else res.status(404).json({ message: 'Procurement does not exist' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get the procurement details, please try again later' });
  }
};

const createProcurement = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      title, description, procurementType, location, price, email,
    } = req.body;

    // Retrieve user by email
    const user = await User.findOne({ email }).session(session);
    if (!user) {
      throw new Error('User not found');
    }

    // Create a new procurement
    const newProcurement = await Procurement.create([
      {
        title,
        description,
        procurementType,
        location,
        price,
        creator: user._id,
      },
    ], { session });

    // Ensure user.allProcurements exists and is an array
    if (!Array.isArray(user.allProcurements)) {
      user.allProcurements = [];
    }

    // Update the user's allProcurements field with the new procurement
    user.allProcurements.push(newProcurement[0]._id);
    await user.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    // Send response
    res.status(200).json({ message: 'Procurement created successfully', procurement: newProcurement[0] });
  } catch (err) {
    // If an error occurs, abort the transaction
    await session.abortTransaction();
    console.error('Error in createProcurement:', err);
    res.status(500).json({ message: 'Failed to create procurement, please try again later', error: err.message });
  } finally {
    // End the session
    session.endSession();
  }
};

const updateProcurement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, procurementType, location, price,
    } = req.body;

    // Update a new procurement
    await Procurement.findByIdAndUpdate({ _id: id }, {
      title,
      description,
      procurementType,
      location,
      price,
    });

    // Send response
    res.status(200).json({ message: 'Procurement updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update procurement, please try again later' });
  }
};

const deleteProcurement = async (req, res) => {
  let toDeleteProcurement;

  try {
    const { id } = req.params;

    // Fetch the procurement to be deleted
    toDeleteProcurement = await Procurement.findById(id).populate('creator');
    if (!toDeleteProcurement) {
      return res.status(404).json({ message: 'Procurement not found' }); // Return 404 for not found
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    // Remove the procurement and update the creator
    await toDeleteProcurement.remove({ session });
    toDeleteProcurement.creator.allProperties.pull(toDeleteProcurement._id); // Ensure you use _id here

    await toDeleteProcurement.creator.save({ session });
    await session.commitTransaction();
    session.endSession(); // End the session

    res.status(200).json({ message: 'Procurement deleted successfully' });
  } catch (err) {
    console.error(err); // Log the error for debugging
    res.status(500).json({ message: 'Failed to delete procurement, please try again later' });
  }
};

export {
  getAllProcurements,
  getProcurementDetail,
  createProcurement,
  updateProcurement,
  deleteProcurement,
};
