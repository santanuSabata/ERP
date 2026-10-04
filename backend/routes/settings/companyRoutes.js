import express from 'express';
import { 
    getCompanyDetails, 
    saveCompanyDetails,
    updateCompanyDetails,
    getAllCompanies,
    switchDefaultCompany 
} from '../../controllers/settings/companyController.js';
import upload from '../../middleware/uploadMiddleware.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getCompanyDetails); 
router.get('/all', getAllCompanies);

// 👈 POST route for adding a new company with logo upload support
router.post('/', upload.single('company_logo'), saveCompanyDetails); 

router.put('/:id', upload.single('company_logo'), updateCompanyDetails);
router.patch('/:id/default', switchDefaultCompany);

export default router;