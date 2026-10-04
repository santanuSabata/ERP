import express from 'express';
import {
    getPurchases,
    getPurchaseOrderByPoNo,
    addPurchase,
    updatePurchase,
    deletePurchase
} from '../../controllers/purchase/purchasesController.js'; // 👈 Updated from inventory to purchase

const router = express.Router();

router.get('/', getPurchases);
router.get('/po/:poNumber', getPurchaseOrderByPoNo);
router.post('/', addPurchase);
router.put('/:id', updatePurchase);
router.delete('/:id', deletePurchase);

export default router;