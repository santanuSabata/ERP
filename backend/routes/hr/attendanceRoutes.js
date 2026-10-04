import express from 'express';
import { 
    getAttendanceLogs, 
    getAttendanceLogById, 
    createAttendanceLog, 
    updateAttendanceLog, 
    deleteAttendanceLog 
} from '../../controllers/hr/attendanceController.js';

const router = express.Router();

router.get('/', getAttendanceLogs);
router.get('/:id', getAttendanceLogById);
router.post('/', createAttendanceLog);
router.put('/:id', updateAttendanceLog);
router.delete('/:id', deleteAttendanceLog);

export default router;