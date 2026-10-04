import express from 'express';
import { 
    getEmployeeDashboardLogs, 
    getEmployeeDashboardLogById, 
    createEmployeeDashboardLog, 
    updateEmployeeDashboardLog, 
    deleteEmployeeDashboardLog 
} from '../../controllers/hr/employeeDashboardController.js';

const router = express.Router();

router.get('/', getEmployeeDashboardLogs);
router.get('/:id', getEmployeeDashboardLogById);
router.post('/', createEmployeeDashboardLog);
router.put('/:id', updateEmployeeDashboardLog);
router.delete('/:id', deleteEmployeeDashboardLog);

export default router;