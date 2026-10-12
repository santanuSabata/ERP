import express from 'express';
import { 
    getAttendanceLogs, 
    getAttendanceLogById, 
    createAttendanceLog, 
    updateAttendanceLog,
    clockAttendance, 
    deleteAttendanceLog 
} from '../../controllers/hr/attendanceController.js';

const router = express.Router();

router.get('/', getAttendanceLogs);
router.get('/:id', getAttendanceLogById);
router.post('/', createAttendanceLog);
router.put('/:id', updateAttendanceLog);
router.delete('/:id', deleteAttendanceLog);
router.post('/clock', clockAttendance);

export default router;