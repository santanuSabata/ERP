import express from 'express';
import { 
    getBarcodeSettings, 
    saveBarcodeSettings, 
    deleteBarcodeSettings 
} from '../../controllers/settings/barcodeController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getBarcodeSettings);
router.put('/', saveBarcodeSettings); // Handles both create and update (upsert)
router.delete('/', deleteBarcodeSettings); // Resets settings

export default router;