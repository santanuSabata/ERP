// controllers/settings/companyController.js
import pool from '../../db.js';

export const getCompanyDetails = async (req, res) => {
    try {
        // SQL query filtering by is_default = TRUE (support optional companyId query parameter if provided)
        const { companyId } = req.query;
        let query = 'SELECT * FROM company_details WHERE is_default = TRUE ORDER BY id ASC LIMIT 1';
        let values = [];

        if (companyId) {
            query = 'SELECT * FROM company_details WHERE id = $1 LIMIT 1';
            values = [companyId];
        }
        
        console.log('🔍 Executing SQL Query:', query, values);

        // Execute query against PostgreSQL
        const { rows } = await pool.query(query, values);
        
        console.log('📊 Database Rows Found:', rows);

        if (rows.length === 0) {
            // Fallback: If no company is explicitly found, fetch the first record available
            const fallbackQuery = 'SELECT * FROM company_details ORDER BY id ASC LIMIT 1';
            const fallbackResult = await pool.query(fallbackQuery);
            
            if (fallbackResult.rows.length === 0) {
                return res.status(200).json({
                    brandName: '',
                    companyName: '',
                    phone: '',
                    email: '',
                    gstin: '',
                    pan: '',
                    fssai: '',
                    msmeNo: '',
                    dlNo: '',
                    businessType: 'Manufacturing',
                    altPhone: '',
                    website: '',
                    billingAddress1: '',
                    billingAddress2: '',
                    billingPincode: '',
                    billingCity: '',
                    billingState: '',
                    billingCountry: 'India',
                    shippingAddress1: '',
                    shippingAddress2: '',
                    shippingPincode: '',
                    shippingCity: '',
                    shippingState: '',
                    shippingCountry: 'India',
                    isDefault: true,
                    logoUrl: '',
                });
            }
            rows[0] = fallbackResult.rows[0];
        }

        const dbRow = rows[0];

        // Map database snake_case columns to camelCase frontend state variables
        const formattedData = {
            id: dbRow.id,
            brandName: dbRow.brand_name || '',
            companyName: dbRow.company_name || '',
            phone: dbRow.phone || '',
            email: dbRow.email || '',
            gstin: dbRow.gstin || '',
            pan: dbRow.pan || '',
            fssai: dbRow.fssai || '',
            msmeNo: dbRow.msme_no || '',
            dlNo: dbRow.dl_no || '',
            businessType: dbRow.business_type || 'Manufacturing',
            altPhone: dbRow.alt_phone || '',
            website: dbRow.website || '',
            // Billing mapping
            billingAddress1: dbRow.billing_address_line1 || dbRow.address_line1 || '',
            billingAddress2: dbRow.billing_address_line2 || dbRow.address_line2 || '',
            billingPincode: dbRow.billing_pincode || dbRow.pincode || '',
            billingCity: dbRow.billing_city || dbRow.city || '',
            billingState: dbRow.billing_state || dbRow.state || '',
            billingCountry: dbRow.billing_country || dbRow.country || 'India',
            // Shipping mapping
            shippingAddress1: dbRow.shipping_address_line1 || '',
            shippingAddress2: dbRow.shipping_address_line2 || '',
            shippingPincode: dbRow.shipping_pincode || '',
            shippingCity: dbRow.shipping_city || '',
            shippingState: dbRow.shipping_state || '',
            shippingCountry: dbRow.shipping_country || 'India',
            isDefault: dbRow.is_default ?? true,
            logoUrl: dbRow.logo_url || '',
        };

        return res.status(200).json({ data: formattedData });
    } catch (err) {
        console.error('❌ Error fetching company details from database:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Save / Add a new company
export const saveCompanyDetails = async (req, res) => {
    const client = await pool.connect();
    try {
        const {
            brandName,
            companyName,
            phone,
            email,
            gstin,
            pan,
            fssai,
            msmeNo,
            dlNo,
            businessType,
            altPhone,
            website,
            billingAddress1,
            billingAddress2,
            billingPincode,
            billingCity,
            billingState,
            billingCountry,
            shippingAddress1,
            shippingAddress2,
            shippingPincode,
            shippingCity,
            shippingState,
            shippingCountry,
            isDefault,
        } = req.body;

        // Capture logo file path if uploaded
        const logoPath = req.file ? `/uploads/${req.file.filename}` : null;
        const shouldBeDefault = isDefault === 'true' || isDefault === true;

        await client.query('BEGIN');

        if (shouldBeDefault) {
            await client.query('UPDATE company_details SET is_default = FALSE');
        }

        const query = `
            INSERT INTO company_details 
            (
                brand_name, company_name, phone, email, gstin, pan, fssai, msme_no, dl_no, business_type, alt_phone, website, 
                billing_address_line1, billing_address_line2, billing_pincode, billing_city, billing_state, billing_country,
                shipping_address_line1, shipping_address_line2, shipping_pincode, shipping_city, shipping_state, shipping_country,
                is_default, logo_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            RETURNING *;
        `;

        const values = [
            brandName,
            companyName,
            phone,
            email,
            gstin,
            pan,
            fssai,
            msmeNo,
            dlNo,
            businessType || 'Manufacturing',
            altPhone,
            website,
            billingAddress1,
            billingAddress2,
            billingPincode,
            billingCity,
            billingState,
            billingCountry || 'India',
            shippingAddress1,
            shippingAddress2,
            shippingPincode,
            shippingCity,
            shippingState,
            shippingCountry || 'India',
            shouldBeDefault,
            logoPath
        ];

        const { rows } = await client.query(query, values);
        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'New company added successfully!',
            data: rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error saving new company:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Specific Update Handler
export const updateCompanyDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            brandName,
            companyName,
            phone,
            email,
            gstin,
            pan,
            fssai,
            msmeNo,
            dlNo,
            businessType,
            altPhone,
            website,
            billingAddress1,
            billingAddress2,
            billingPincode,
            billingCity,
            billingState,
            billingCountry,
            shippingAddress1,
            shippingAddress2,
            shippingPincode,
            shippingCity,
            shippingState,
            shippingCountry,
            isDefault,
        } = req.body;

        const logoPath = req.file ? `/uploads/${req.file.filename}` : null;

        const query = `
            UPDATE company_details 
            SET 
                brand_name = COALESCE($1, brand_name),
                company_name = COALESCE($2, company_name),
                phone = COALESCE($3, phone),
                email = COALESCE($4, email),
                gstin = COALESCE($5, gstin),
                pan = COALESCE($6, pan),
                fssai = COALESCE($7, fssai),
                msme_no = COALESCE($8, msme_no),
                dl_no = COALESCE($9, dl_no),
                business_type = COALESCE($10, business_type),
                alt_phone = COALESCE($11, alt_phone),
                website = COALESCE($12, website),
                billing_address_line1 = COALESCE($13, billing_address_line1),
                billing_address_line2 = COALESCE($14, billing_address_line2),
                billing_pincode = COALESCE($15, billing_pincode),
                billing_city = COALESCE($16, billing_city),
                billing_state = COALESCE($17, billing_state),
                billing_country = COALESCE($18, billing_country),
                shipping_address_line1 = COALESCE($19, shipping_address_line1),
                shipping_address_line2 = COALESCE($20, shipping_address_line2),
                shipping_pincode = COALESCE($21, shipping_pincode),
                shipping_city = COALESCE($22, shipping_city),
                shipping_state = COALESCE($23, shipping_state),
                shipping_country = COALESCE($24, shipping_country),
                is_default = COALESCE($25, is_default),
                logo_url = COALESCE($26, logo_url),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $27
            RETURNING *;
        `;

        const values = [
            brandName,
            companyName,
            phone,
            email,
            gstin,
            pan,
            fssai,
            msmeNo,
            dlNo,
            businessType,
            altPhone,
            website,
            billingAddress1,
            billingAddress2,
            billingPincode,
            billingCity,
            billingState,
            billingCountry,
            shippingAddress1,
            shippingAddress2,
            shippingPincode,
            shippingCity,
            shippingState,
            shippingCountry,
            isDefault,
            logoPath,
            id
        ];

        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ error: `Company with ID ${id} not found.` });
        }

        return res.status(200).json({
            success: true,
            message: 'Company details and logo updated successfully!',
            data: rows[0]
        });
    } catch (err) {
        console.error('❌ Error updating company details:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Get all companies list for switcher dropdown
export const getAllCompanies = async (req, res) => {
    try {
        const query = 'SELECT * FROM company_details ORDER BY id ASC';
        const { rows } = await pool.query(query);

        const formattedRows = rows.map(dbRow => ({
            id: dbRow.id,
            brandName: dbRow.brand_name || '',
            companyName: dbRow.company_name || '',
            gstin: dbRow.gstin || '',
            pan: dbRow.pan || '',
            fssai: dbRow.fssai || '',
            msmeNo: dbRow.msme_no || '',
            dlNo: dbRow.dl_no || '',
            logoUrl: dbRow.logo_url || '',
            isDefault: dbRow.is_default ?? false,
        }));

        return res.status(200).json(formattedRows);
    } catch (err) {
        console.error('❌ Error fetching companies list:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Switch Default Company
export const switchDefaultCompany = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        await client.query('UPDATE company_details SET is_default = FALSE');

        const updateQuery = `
            UPDATE company_details 
            SET is_default = TRUE, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING *;
        `;
        const { rows } = await client.query(updateQuery, [id]);

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: `Company with ID ${id} not found.` });
        }

        await client.query('COMMIT');

        const dbRow = rows[0];
        const formattedData = {
            id: dbRow.id,
            brandName: dbRow.brand_name || '',
            companyName: dbRow.company_name || '',
            gstin: dbRow.gstin || '',
            pan: dbRow.pan || '',
            fssai: dbRow.fssai || '',
            msmeNo: dbRow.msme_no || '',
            dlNo: dbRow.dl_no || '',
            logoUrl: dbRow.logo_url || '',
            isDefault: dbRow.is_default,
        };

        return res.status(200).json({
            success: true,
            message: 'Default company updated successfully!',
            data: formattedData
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error switching default company:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};