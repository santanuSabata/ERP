import express from 'express';
import { 
    getMetaItems, 
    addMetaItem, 
    updateMetaItem, 
    reorderMetaItems,
    deleteMetaItem 
} from '../../controllers/crm/crmSettingsController.js';

const router = express.Router();

router.get('/meta/:tab', getMetaItems);
router.post('/meta/:tab', addMetaItem);
router.put('/meta/:tab/reorder', reorderMetaItems); // Matches frontend PUT request
router.put('/meta/:tab/:id', updateMetaItem);
router.delete('/meta/:tab/:id', deleteMetaItem);

export default router;