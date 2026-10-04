import express from 'express';
import { 
    getProducts, 
    getProductById, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    getProductImages, 
    deleteProductImage,
    setPrimaryProductImage 
} from '../../controllers/inventory/productController.js';
import { uploadProductImages } from '../../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/:id/images', getProductImages);

router.post('/', uploadProductImages, addProduct);
router.put('/:id', uploadProductImages, updateProduct);

router.delete('/images/:imageId', deleteProductImage);
router.delete('/:id', deleteProduct);
router.put('/:productId/images/:imageId/primary', setPrimaryProductImage);


export default router;