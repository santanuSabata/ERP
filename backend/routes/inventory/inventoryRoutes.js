import express from 'express';
import { 
    getInventories, 
    getInventoryById, 
    addInventoryStock, 
    updateInventory, 
    deleteInventory 
} from '../../controllers/inventory/inventoryController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getInventories);
router.post('/', addInventoryStock);
router.get('/:id', getInventoryById); // 👈 Ensure this matches
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;