import express from 'express';
import { 
    getMonthlyAttendanceSheet
 } from '../../controllers/hr/attendanceSheetController.js';

const router = express.Router();

 
router.get('/', getMonthlyAttendanceSheet); // Handles GET /api/attendance-sheets/monthly with query params (month, year, role)

export default router;