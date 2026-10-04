import pool from '../../db.js';

// Get All Leads with Search, Filtering, and Pagination
export const getLeads = async (req, res) => {
    try {
        const { search = '', status = 'All', insuranceType = 'All', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const searchFilter = `%${search}%`;

        let queryConditions = `WHERE (company_name ILIKE $1 OR contact_person ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR transaction_id ILIKE $1)`;
        const queryParams = [searchFilter];
        let paramIndex = 2;

        if (status && status !== 'All') {
            queryConditions += ` AND status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        if (insuranceType && insuranceType !== 'All') {
            queryConditions += ` AND insurance_type = $${paramIndex}`;
            queryParams.push(insuranceType);
            paramIndex++;
        }

        // Fetch paginated leads with assigned agent info
        const dataQuery = `
            SELECT l.*, e.name AS agent_name 
            FROM leads l
            LEFT JOIN employees e ON l.agent_id = e.id
            ${queryConditions}
            ORDER BY l.id DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        queryParams.push(parseInt(limit), offset);

        const { rows } = await pool.query(dataQuery, queryParams);

        // Fetch total count for pagination
        const countQuery = `SELECT COUNT(*) FROM leads l ${queryConditions};`;
        const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
        const totalLeads = parseInt(countResult.rows[0].count);

        return res.status(200).json({
            success: true,
            leads: rows,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('❌ Get leads error:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// Create Single Lead
export const createLead = async (req, res) => {
    try {
        const { transactionId, transactionDate, companyName, contactPerson, email, phone, insuranceType, policyValue, transactionType, status, agentId, remarks, createdBy } = req.body;

        const query = `
            INSERT INTO leads (transaction_id, transaction_date, company_name, contact_person, email, phone, insurance_type, policy_value, transaction_type, status, agent_id, remarks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
        const values = [
            transactionId || `TXN-${Date.now()}`,
            transactionDate || new Date(),
            companyName,
            contactPerson,
            email,
            phone,
            insuranceType,
            policyValue || 0,
            transactionType || 'New Policy',
            status || 'New',
            agentId || null,
            remarks,
            createdBy || 'Admin'
        ];

        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0], message: 'Lead created successfully!' });
    } catch (err) {
        console.error('❌ Create lead error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};

// Update Lead
export const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { transactionDate, companyName, contactPerson, email, phone, insuranceType, policyValue, transactionType, status, agentId, remarks } = req.body;

        const query = `
            UPDATE leads 
            SET transaction_date = COALESCE($1, transaction_date),
                company_name = COALESCE($2, company_name),
                contact_person = COALESCE($3, contact_person),
                email = COALESCE($4, email),
                phone = COALESCE($5, phone),
                insurance_type = COALESCE($6, insurance_type),
                policy_value = COALESCE($7, policy_value),
                transaction_type = COALESCE($8, transaction_type),
                status = COALESCE($9, status),
                agent_id = $10,
                remarks = COALESCE($11, remarks),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *;
        `;
        const values = [transactionDate, companyName, contactPerson, email, phone, insuranceType, policyValue, transactionType, status, agentId || null, remarks, id];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Lead not found.' });

        return res.status(200).json({ success: true, data: rows[0], message: 'Lead updated successfully!' });
    } catch (err) {
        console.error('❌ Update lead error:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// Delete Lead
export const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *;', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Lead not found.' });

        return res.status(200).json({ success: true, message: 'Lead deleted successfully!' });
    } catch (err) {
        console.error('❌ Delete lead error:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// Bulk Upload Leads via CSV data payload
export const bulkUploadLeads = async (req, res) => {
    try {
        const { leads } = req.body; // Expects an array of lead objects parsed from CSV
        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid leads provided for upload.' });
        }

        let insertedCount = 0;
        for (const l of leads) {
            const query = `
                INSERT INTO leads (transaction_id, transaction_date, company_name, contact_person, email, phone, insurance_type, policy_value, transaction_type, status, remarks, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (transaction_id) DO NOTHING;
            `;
            await pool.query(query, [
                l.transaction_id || `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                l.transaction_date || new Date(),
                l.company_name,
                l.contact_person,
                l.email,
                l.phone,
                l.insurance_type || 'General Insurance',
                l.policy_value || 0,
                l.transaction_type || 'New Policy',
                l.status || 'New',
                l.remarks,
                'CSV Import'
            ]);
            insertedCount++;
        }

        return res.status(200).json({ success: true, message: `Successfully imported ${insertedCount} leads!` });
    } catch (err) {
        console.error('❌ Bulk upload error:', err);
        return res.status(500).json({ success: false, error: 'Failed to process CSV import.' });
    }
};

