import express from 'express';
import { getAllUsers, updateUserAllowedStatus, deleteUser } from '../controllers/userManagement.controller.js';

const router = express.Router();

router.get('/', getAllUsers);
router.patch('/:id', updateUserAllowedStatus); // Changed this line
router.delete('/:id', deleteUser);

export default router;