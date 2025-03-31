
import express from 'express';
import {
    getPressReleases,
    getPressReleaseById,
    createPressRelease,
    updatePressRelease,
    deletePressRelease,
} from '../controllers/press-release.controller.js'

const router = express.Router();

router.get('/', getPressReleases);
router.get('/:id', getPressReleaseById);
router.post('/', createPressRelease);
router.patch('/:id', updatePressRelease);
router.delete('/:id', deletePressRelease);




export default router;