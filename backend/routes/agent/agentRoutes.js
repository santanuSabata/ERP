import express from 'express';
import { agentLogin, getAgentLeads,  updateAgentLeadStatus } from '../../controllers/agent/agentController.js';

const router = express.Router();

router.post('/login', agentLogin);
router.get('/leads', getAgentLeads);
router.put('/leads/:id', updateAgentLeadStatus);

export default router;