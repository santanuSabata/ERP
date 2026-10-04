import express from 'express';
import {
    getPurchaseOrders,
    addPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder
} from '../../controllers/purchase/purchaseOrdersController.js';

const router = express.Router();

router.get('/', getPurchaseOrders);
router.post('/', addPurchaseOrder);
router.put('/:id', updatePurchaseOrder);
router.delete('/:id', deletePurchaseOrder);

export default router;