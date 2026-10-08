import express from 'express';
import { 
    getLeads, 
    getLeadById, // 👈 Import this
    createLead, 
    updateLead, 
    deleteLead, 
    bulkUploadLeads,
    getLeadMetricsSummary 
} from '../../controllers/crm/leadsController.js';

const router = express.Router();

router.get('/', getLeads);
router.get('/:id', getLeadById); // 👈 Add this route definition
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/bulk-upload', bulkUploadLeads);
router.get('/metrics/summary', getLeadMetricsSummary);

export default router;