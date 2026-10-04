import express from 'express';
import { getBanks, addBank, updateBank, deleteBank } from '../../controllers/settings/bankController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getBanks);
router.post('/', addBank);
router.put('/:id', updateBank);
router.delete('/:id', deleteBank);

export default router;