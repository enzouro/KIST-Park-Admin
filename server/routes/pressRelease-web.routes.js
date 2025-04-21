//server\routes\pressRelease-web.routes.js
import express from 'express';
import {
  getPressReleaseById,
  getPressReleases,
} from '../controllers/pressrelease-web.controller.js';

const router = express.Router();

router.get('/', getPressReleases);
router.get('/:id', getPressReleaseById);

export default router;