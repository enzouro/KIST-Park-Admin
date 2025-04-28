import express from 'express';
import {
  getAllSubscribers,
  createSubscriber,
  deleteSubscriber,
} from '../controllers/subscribers.controller.js';

const router = express.Router();

router.get('/', getAllSubscribers);
router.post('/', createSubscriber);
router.delete('/:id', deleteSubscriber); 

export default router;
// server\routes\subscribers.routes.js