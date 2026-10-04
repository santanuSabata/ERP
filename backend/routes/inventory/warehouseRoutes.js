import express from 'express';
import { getWarehouses, getWarehouseById, addWarehouse, updateWarehouse, deleteWarehouse } from '../../controllers/inventory/warehouseController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', addWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;