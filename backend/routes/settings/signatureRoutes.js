import express from 'express';
import { getSignatures, addSignature, updateSignature, deleteSignature } from '../../controllers/settings/signatureController.js';
import upload from '../../middleware/uploadMiddleware.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getSignatures);
router.post('/', upload.single('signature_file'), addSignature);
router.put('/:id', upload.single('signature_file'), updateSignature);
router.delete('/:id', deleteSignature);

export default router;