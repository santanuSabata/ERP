import express from 'express';
import { 
    getDesignations, 
    getDesignationById, 
    createDesignation, 
    updateDesignation, 
    deleteDesignation 
} from '../../controllers/hr/designationController.js';

const router = express.Router();

router.get('/', getDesignations);
router.get('/:id', getDesignationById);
router.post('/', createDesignation);
router.put('/:id', updateDesignation);
router.delete('/:id', deleteDesignation);

export default router;