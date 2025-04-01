import express from 'express';
import { getAllHighlights, getHighlightById } from '../controllers/highlights-web.controller.js';

const router = express.Router();

// Route to fetch all highlights
router.get('/', getAllHighlights);

// Route to fetch a single highlight by ID
router.get('/:id', getHighlightById);

export default router;