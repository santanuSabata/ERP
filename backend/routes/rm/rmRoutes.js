import express from 'express';
import { rmLogin, getRmLeads, updateRmLeadStatus } from '../../controllers/rm/rmController.js';
const router = express.Router();

router.post('/login', rmLogin);
router.get('/leads', getRmLeads);
router.put('/leads/:id', updateRmLeadStatus);

export default router;