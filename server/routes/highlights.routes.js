// server\routes\highlights.routes.js

import express from 'express';
import {
  getHighlights,
  getHighlightById,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getDashboardHighlights,
} from '../controllers/highlights.controller.js'

const router = express.Router();

router.get('/', getHighlights);
router.get('/dashboard-highlights', getDashboardHighlights);
router.get('/:id', getHighlightById);
router.post('/', createHighlight);
router.patch('/:id', updateHighlight);
router.delete('/:id', deleteHighlight);




export default router;