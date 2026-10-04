import express from 'express';
import { getPreferences, updatePreferences } from '../../controllers/settings/preferencesController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getPreferences);
router.put('/', updatePreferences);

export default router;