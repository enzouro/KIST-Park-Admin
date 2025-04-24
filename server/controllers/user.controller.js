/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
import User from '../mongodb/models/user.js';


export const createUser = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    let user = await User.findOne({ email });
    
    if (!user) {
      // Create a new user with isAllowed set to false
      user = await User.create({
        name,
        email,
        avatar,
        isAllowed: false,
      });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong, failed to create/fetch user' });
  }
};

export const getUserInfoByID = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Remove the populate call since it's not needed for the auth check
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return only the necessary fields for the authorization check
    res.status(200).json({
      _id: user._id,
      isAllowed: user.isAllowed,
      isAdmin: user.isAdmin,
      email: user.email,
      name: user.name
    });

  } catch (err) {
    // Improve error handling with more specific messages
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    res.status(500).json({ 
      message: 'Failed to get user properties, please try again later',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};