import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,  // Ensures that the email is unique
  },
  avatar: {
    type: String,
    required: true,
  },
  isAllowed: {  // Add this field to the schema
    type: Boolean,
    default: false,  // Default value for new users
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },

});

const User = mongoose.model('User', UserSchema);

export default User;
