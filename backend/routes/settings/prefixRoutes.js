import express from 'express';
import { 
    getPrefixes, 
    createPrefix, 
    updatePrefix, 
    deletePrefix 
} from '../../controllers/settings/prefixController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getPrefixes);
router.post('/', createPrefix);
router.put('/:id', updatePrefix);
router.delete('/:id', deletePrefix);

export default router;