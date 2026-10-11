import express from 'express';
import { logEmployeeActivity } from '../../controllers/hr/employeeActivityController.js';

const router = express.Router();

// POST: Log employee activity
router.post('/', logEmployeeActivity);

export default router;