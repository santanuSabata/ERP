import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure 'uploads' directory exists in the backend root
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Check if the route is for CSV import
    if (req.originalUrl && req.originalUrl.includes('/import')) {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed for import!'), false);
        }
        return;
    }

    // Relaxed validation to accept standard image types from frontend FormData uploads
    const allowedTypes = /jpeg|jpg|png|webp|pdf|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (jpeg, jpg, png, webp) and PDF documents are allowed!'), false);
    }
};


const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
    fileFilter: fileFilter
});

// Dedicated export for Inventory Product Images (supports up to 10 images)
export const uploadProductImages = upload.array('images', 10);

// Comprehensive named export covering all customer documents and profile fields
export const uploadCustomerFiles = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'photo_url', maxCount: 1 },
    { name: 'pan_card', maxCount: 1 },
    { name: 'pan_card_url', maxCount: 1 },
    { name: 'adhaar_card', maxCount: 1 },
    { name: 'adhaar_card_url', maxCount: 1 },
    { name: 'warranty_certificate', maxCount: 1 },
    { name: 'meter_charging_document', maxCount: 1 },
    { name: 'electricity_bill', maxCount: 1 },
    { name: 'bankpass_book', maxCount: 1 },
    { name: 'agreement', maxCount: 1 },
    { name: 'house_patta_pannu', maxCount: 1 },
    { name: 'digital_certificate', maxCount: 1 }
]);

export default upload;