import pool from '../../db.js';

export const getVendors = async (req, res) => {
    try {
        const { companyId, tab = 'All', search, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM vendors WHERE company_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM vendors WHERE company_id = $1';
        let values = [targetCompanyId];

        if (tab === 'Deleted') {
            query += ' AND is_deleted = TRUE';
            countQuery += ' AND is_deleted = TRUE';
        } else {
            query += ' AND is_deleted = FALSE';
            countQuery += ' AND is_deleted = FALSE';
        }

        if (search && search.trim() !== '') {
            query += ' AND (name ILIKE $2 OR phone ILIKE $2 OR company_name ILIKE $2 OR email ILIKE $2)';
            countQuery += ' AND (name ILIKE $2 OR phone ILIKE $2 OR company_name ILIKE $2 OR email ILIKE $2)';
            values.push(`%${search.trim()}%`);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, values.length > 1 ? 2 : 1));
        const totalCount = parseInt(countRes.rows[0].count);

        let totalYouPay = 0;
        let totalYouCollect = 0;

        const formatted = rows.map(r => {
            const balance = parseFloat(r.opening_balance || 0);
            if (r.balance_type === 'Credit' || r.balance_type === 'Debit') {
                totalYouPay += balance; // For vendors, closing balance typically represents You Pay
            }

            return {
                id: r.id,
                companyId: r.company_id,
                name: r.name,
                phone: r.phone || '',
                email: r.email || '',
                gstin: r.gstin || '',
                companyName: r.company_name || '',
                billingAddress1: r.billing_address_line1 || '',
                shippingAddress1: r.shipping_address_line1 || '',
                openingBalance: balance,
                balanceType: r.balance_type || 'Debit',
                tdsEnabled: r.tds_enabled || false,
                tcsEnabled: r.tcs_enabled || false,
                rcmApplicable: r.rcm_applicable || false,
                createdBy: r.created_by || 'Raj S',
                createdAt: r.created_at,
                isDeleted: r.is_deleted,
            };
        });

        return res.status(200).json({
            success: true,
            summary: { totalYouPay, totalYouCollect },
            totalCount,
            data: formatted,
        });
    } catch (err) {
        console.error('❌ Error fetching vendors:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const addVendor = async (req, res) => {
    try {
        const {
            companyId, name, phone, email, gstin, companyName,
            billingAddress1, billingAddress2, billingPincode, billingCity, billingState, billingCountry,
            shippingAddress1, shippingAddress2, shippingPincode, shippingCity, shippingState, shippingCountry,
            openingBalance, balanceType, tdsEnabled, tcsEnabled, rcmApplicable, createdBy
        } = req.body;

        const targetCompanyId = companyId || 1;

        const query = `
            INSERT INTO vendors (
                company_id, name, phone, email, gstin, company_name,
                billing_address_line1, billing_address_line2, billing_pincode, billing_city, billing_state, billing_country,
                shipping_address_line1, shipping_address_line2, shipping_pincode, shipping_city, shipping_state, shipping_country,
                opening_balance, balance_type, tds_enabled, tcs_enabled, rcm_applicable, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
            RETURNING *;
        `;

        const values = [
            targetCompanyId, name, phone || '', email || '', gstin || '', companyName || '',
            billingAddress1 || '', billingAddress2 || '', billingPincode || '', billingCity || '', billingState || '', billingCountry || 'India',
            shippingAddress1 || '', shippingAddress2 || '', shippingPincode || '', shippingCity || '', shippingState || '', shippingCountry || 'India',
            openingBalance || 0.00, balanceType || 'Debit', tdsEnabled || false, tcsEnabled || false, rcmApplicable || false, createdBy || 'Raj S'
        ];

        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Error adding vendor:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name, phone, email, gstin, companyName,
            billingAddress1, billingAddress2, billingPincode, billingCity, billingState, billingCountry,
            shippingAddress1, shippingAddress2, shippingPincode, shippingCity, shippingState, shippingCountry,
            openingBalance, balanceType, tdsEnabled, tcsEnabled, rcmApplicable
        } = req.body;

        const query = `
            UPDATE vendors 
            SET name = COALESCE($1, name),
                phone = COALESCE($2, phone),
                email = COALESCE($3, email),
                gstin = COALESCE($4, gstin),
                company_name = COALESCE($5, company_name),
                billing_address_line1 = COALESCE($6, billing_address_line1),
                billing_address_line2 = COALESCE($7, billing_address_line2),
                billing_pincode = COALESCE($8, billing_pincode),
                billing_city = COALESCE($9, billing_city),
                billing_state = COALESCE($10, billing_state),
                billing_country = COALESCE($11, billing_country),
                shipping_address_line1 = COALESCE($12, shipping_address_line1),
                shipping_address_line2 = COALESCE($13, shipping_address_line2),
                shipping_pincode = COALESCE($14, shipping_pincode),
                shipping_city = COALESCE($15, shipping_city),
                shipping_state = COALESCE($16, shipping_state),
                shipping_country = COALESCE($17, shipping_country),
                opening_balance = COALESCE($18, opening_balance),
                balance_type = COALESCE($19, balance_type),
                tds_enabled = COALESCE($20, tds_enabled),
                tcs_enabled = COALESCE($21, tcs_enabled),
                rcm_applicable = COALESCE($22, rcm_applicable)
            WHERE id = $23
            RETURNING *;
        `;

        const values = [
            name, phone, email, gstin, companyName,
            billingAddress1, billingAddress2, billingPincode, billingCity, billingState, billingCountry,
            shippingAddress1, shippingAddress2, shippingPincode, shippingCity, shippingState, shippingCountry,
            openingBalance, balanceType, tdsEnabled, tcsEnabled, rcmApplicable, id
        ];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Vendor not found.' });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Error updating vendor:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteVendor = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE vendors SET is_deleted = TRUE WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Vendor not found.' });
        return res.status(200).json({ success: true, message: 'Vendor moved to deleted.' });
    } catch (err) {
        console.error('❌ Error deleting vendor:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};