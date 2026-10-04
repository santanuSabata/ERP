import express from 'express';
import { getVendors, addVendor, updateVendor, deleteVendor } from '../../controllers/purchase/vendorController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getVendors);
router.post('/', addVendor);
router.put('/:id', updateVendor);
router.delete('/:id', deleteVendor);

export default router;