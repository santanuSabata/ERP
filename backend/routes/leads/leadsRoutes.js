import express from 'express';
import { getLeads, createLead, updateLead, deleteLead, bulkUploadLeads } from '../../controllers/leads/leadsController.js';
const router = express.Router();

router.get('/', getLeads);
router.post('/', createLead);
router.post('/bulk-upload', bulkUploadLeads);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;