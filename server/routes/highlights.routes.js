// server\routes\highlights.routes.js

import express from 'express';
import {
  getHighlights,
  getHighlightById,
  createHighlight,
  updateHighlight,
  updateHighlightStatus,
  deleteHighlight,
} from '../controllers/highlights.controller.js'

const router = express.Router();

router.get('/', getHighlights);
router.get('/:id', getHighlightById);
router.post('/', createHighlight);
router.patch('/:id', updateHighlight);
router.patch('/:id', updateHighlightStatus);
router.delete('/:id', deleteHighlight);



export default router;