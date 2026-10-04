import express from 'express';
import {
    getStocks,
    getStockSummary,
    getStockById,
    addStock,
    updateStock,
    deleteStock,
    uploadStocksCsv
} from '../../controllers/inventory/stocksController.js';

// Change this line to match your actual middleware filename in backend/middleware/
import upload from '../../middleware/uploadMiddleware.js'; 
// OR import upload from '../../middleware/upload.js';

const router = express.Router();

router.get('/', getStocks);
router.get('/summary', getStockSummary);
router.get('/:id', getStockById);
router.post('/', addStock);
router.post('/upload-csv', upload.single('file'), uploadStocksCsv);
router.put('/:id', updateStock);
router.delete('/:id', deleteStock);

export default router;