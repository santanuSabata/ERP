import express from 'express';
import { 
    getDepartments, 
    getDepartmentById, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
} from '../../controllers/hr/departmentController.js'; // Adjust path as needed

const router = express.Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;