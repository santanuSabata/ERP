import express from 'express';
import { 
    getQuotations, 
    getQuotationById, 
    createQuotation, 
    updateQuotation, 
    deleteQuotation 
} from '../../controllers/sales/quotationController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getQuotations);
router.post('/', createQuotation);
router.get('/:id', getQuotationById);
router.put('/:id', updateQuotation);
router.delete('/:id', deleteQuotation);

export default router;