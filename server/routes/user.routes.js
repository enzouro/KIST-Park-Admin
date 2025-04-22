import express from 'express';

import {
  createUser,
  getUserInfoByID
} from '../controllers/user.controller.js';

const router = express.Router();

// Combined the GET and POST methods for '/'
router.route('/')
  .post(createUser); // Handles creating a new user

// Route for getting a user by ID
router.route('/:id')
  .get(getUserInfoByID); // Handles fetching user info by their ID

export default router;
