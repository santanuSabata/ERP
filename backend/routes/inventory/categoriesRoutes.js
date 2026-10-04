import express from 'express';
import { getCategories, createCategory, deleteCategory } from '../../controllers/inventory/categoriesController.js';
const router = express.Router();

router.get('/', getCategories);
router.post('/', createCategory);
router.delete('/:id', deleteCategory); // 👈 Must match DELETE requests to /api/categories/:id
export default router;