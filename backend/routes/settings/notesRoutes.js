import express from 'express';
import { getNotesTerms, addNoteTerm, updateNoteTerm, deleteNoteTerm } from '../../controllers/settings/notesController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getNotesTerms);
router.post('/', addNoteTerm);
router.put('/:id', updateNoteTerm);
router.delete('/:id', deleteNoteTerm);

export default router;