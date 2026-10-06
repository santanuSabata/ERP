import pool from '../../db.js';

// Get All Leads with Search, Filtering, and Pagination
export const getLeads = async (req, res) => {
    try {
        const { search = '', status = 'All', insuranceType = 'All', page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        const searchFilter = `%${search}%`;

        let queryConditions = `WHERE (l.company_name ILIKE $1 OR l.contact_person ILIKE $1 OR l.email ILIKE $1 OR l.phone ILIKE $1 OR l.transaction_id ILIKE $1 OR l.city ILIKE $1 OR l.state ILIKE $1 OR l.existing_insurer ILIKE $1)`;
        const queryParams = [searchFilter];
        let paramIndex = 2;

        if (status && status !== 'All') {
            queryConditions += ` AND l.status = $${paramIndex}`;
            queryParams.push(status);
            paramIndex++;
        }

        if (insuranceType && insuranceType !== 'All') {
            queryConditions += ` AND l.insurance_type = $${paramIndex}`;
            queryParams.push(insuranceType);
            paramIndex++;
        }

        const dataQuery = `
            SELECT l.*, 
                   e.name AS agent_name, 
                   ds.name AS deal_stage_name, 
                   ls.name AS lead_stage_name
            FROM leads l
            LEFT JOIN employees e ON l.agent_id = e.id
            LEFT JOIN crm_deal_stages ds ON l.deal_stage_id = ds.id
            LEFT JOIN crm_lead_stages ls ON l.lead_stage_id = ls.id
            ${queryConditions}
            ORDER BY l.id DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
        `;
        queryParams.push(parseInt(limit, 10), offset);

        const { rows } = await pool.query(dataQuery, queryParams);

        const countQuery = `SELECT COUNT(*) FROM leads l ${queryConditions};`;
        const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 1));
        const totalLeads = parseInt(countResult.rows[0].count, 10);

        return res.status(200).json({
            success: true,
            leads: rows,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / parseInt(limit, 10)),
                currentPage: parseInt(page, 10),
                limit: parseInt(limit, 10)
            }
        });
    } catch (err) {
        console.error('❌ Get leads error:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

// Create Single Lead (Supports multiple phones, emails, and discussions)
export const createLead = async (req, res) => {
    try {
        const { 
            transactionId, 
            transactionDate, 
            companyName, 
            contactPerson, 
            email, 
            phone, 
            state,
            city,
            insuranceType, 
            existingInsurer, 
            policyValue, 
            transactionType, 
            dealStageId, 
            leadStageId, 
            status, 
            agentId, 
            remarks, 
            createdBy,
            phones,
            emails,
            discussions
        } = req.body;

        const query = `
            INSERT INTO leads (
                transaction_id, transaction_date, company_name, contact_person, 
                email, phone, state, city, insurance_type, existing_insurer, policy_value, transaction_type, 
                deal_stage_id, lead_stage_id, status, agent_id, remarks, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *;
        `;
        const values = [
            transactionId || `TXN-${Date.now()}`,
            transactionDate || new Date(),
            companyName,
            contactPerson,
            email || (emails?.[0]?.address || ''),
            phone || (phones?.[0]?.number || ''),
            state || null,
            city || null,
            insuranceType,
            existingInsurer || null,
            policyValue || 0,
            transactionType || 'Fresh',
            dealStageId || null,
            leadStageId || null,
            status || 'New',
            agentId || null,
            remarks,
            createdBy || 'Admin'
        ];

        const { rows } = await pool.query(query, values);
        const newLead = rows[0];

        // Insert multiple phones into lead_phones table
        if (Array.isArray(phones)) {
            for (const p of phones) {
                if (p.number) {
                    await pool.query(
                        `INSERT INTO lead_phones (lead_id, phone_label, phone_number, name, description) VALUES ($1, $2, $3, $4, $5)`,
                        [newLead.id, p.label || 'Work', p.number, p.name || null, p.description || null]
                    );
                }
            }
        }

        // Insert multiple emails into lead_emails table
        if (Array.isArray(emails)) {
            for (const em of emails) {
                if (em.address) {
                    await pool.query(
                        `INSERT INTO lead_emails (lead_id, email_label, email_address, name, description) VALUES ($1, $2, $3, $4, $5)`,
                        [newLead.id, em.label || 'Work', em.address, em.name || null, em.description || null]
                    );
                }
            }
        }

        // Insert multiple discussions into lead_discussions table
        if (Array.isArray(discussions)) {
            for (const d of discussions) {
                if (d.text) {
                    await pool.query(
                        `INSERT INTO lead_discussions (lead_id, subject, discussion_text, created_by) VALUES ($1, $2, $3, $4)`,
                        [newLead.id, d.subject || 'General Discussion', d.text, createdBy || 'Admin']
                    );
                }
            }
        }

        // Log initial assignment if agent exists
        if (agentId) {
            await pool.query(
                `INSERT INTO lead_assignment_history (lead_id, previous_agent_id, new_agent_id, changed_by) VALUES ($1, NULL, $2, $3)`,
                [newLead.id, agentId, createdBy || 'Admin']
            );
        }

        return res.status(201).json({ success: true, data: newLead, message: 'Lead created successfully!' });
    } catch (err) {
        console.error('❌ Create lead error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};

// Update Lead (Logs assignment change to history & syncs phones/emails safely)
export const updateLead = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id, 10);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, error: 'Invalid Lead ID provided.' });
        }

        const { 
            transactionDate, 
            companyName, 
            contactPerson, 
            email, 
            phone, 
            state,
            city,
            insuranceType, 
            existingInsurer, 
            policyValue, 
            transactionType, 
            dealStageId, 
            leadStageId, 
            status, 
            agentId, 
            remarks,
            changedBy,
            phones,
            emails,
            discussions
        } = req.body;

        // 1. Fetch current lead data to check previous agent ID
        const currentLeadRes = await pool.query('SELECT agent_id FROM leads WHERE id = $1', [leadId]);
        if (currentLeadRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found.' });
        }
        const previousAgentId = currentLeadRes.rows[0].agent_id;
        const parsedNewAgentId = agentId !== undefined && agentId !== null && agentId !== '' ? parseInt(agentId, 10) : null;

        // 2. Perform Update on main leads table
        const query = `
            UPDATE leads 
            SET transaction_date = COALESCE(NULLIF($1, '')::date, transaction_date),
                company_name = COALESCE(NULLIF($2, ''), company_name),
                contact_person = COALESCE(NULLIF($3, ''), contact_person),
                email = COALESCE(NULLIF($4, ''), email),
                phone = COALESCE(NULLIF($5, ''), phone),
                state = NULLIF($6, ''),
                city = NULLIF($7, ''),
                insurance_type = COALESCE(NULLIF($8, ''), insurance_type),
                existing_insurer = NULLIF($9, ''),
                policy_value = COALESCE(NULLIF($10, '')::numeric, policy_value),
                transaction_type = COALESCE(NULLIF($11, ''), transaction_type),
                deal_stage_id = NULLIF($12, '')::integer,
                lead_stage_id = NULLIF($13, '')::integer,
                status = COALESCE(NULLIF($14, ''), status),
                agent_id = NULLIF($15, '')::integer,
                remarks = COALESCE($16, remarks),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $17
            RETURNING *;
        `;
        const values = [
            transactionDate || null, 
            companyName || null, 
            contactPerson || null, 
            email || null, 
            phone || null, 
            state || null,
            city || null,
            insuranceType || null, 
            existingInsurer || null, 
            policyValue !== undefined && policyValue !== '' ? policyValue : null, 
            transactionType || null, 
            dealStageId || null, 
            leadStageId || null, 
            status || null, 
            parsedNewAgentId, 
            remarks || null, 
            leadId
        ];

        const { rows } = await pool.query(query, values);
        const updatedLead = rows[0];

        // 3. Update multiple phones if provided
        if (Array.isArray(phones)) {
            await pool.query('DELETE FROM lead_phones WHERE lead_id = $1', [leadId]);
            for (const p of phones) {
                const phoneNumber = p.number || p.phone_number;
                if (phoneNumber) {
                    await pool.query(
                        `INSERT INTO lead_phones (lead_id, phone_label, phone_number, name, description) VALUES ($1, $2, $3, $4, $5)`,
                        [leadId, p.label || p.phone_label || 'Work', phoneNumber, p.name || null, p.description || null]
                    );
                }
            }
        }

        // 4. Update multiple emails if provided
        if (Array.isArray(emails)) {
            await pool.query('DELETE FROM lead_emails WHERE lead_id = $1', [leadId]);
            for (const em of emails) {
                const emailAddress = em.address || em.email_address;
                if (emailAddress) {
                    await pool.query(
                        `INSERT INTO lead_emails (lead_id, email_label, email_address, name, description) VALUES ($1, $2, $3, $4, $5)`,
                        [leadId, em.label || em.email_label || 'Work', emailAddress, em.name || null, em.description || null]
                    );
                }
            }
        }

        // 5. Update multiple discussions if provided
        if (Array.isArray(discussions)) {
            await pool.query('DELETE FROM lead_discussions WHERE lead_id = $1', [leadId]);
            for (const d of discussions) {
                const discText = d.text || d.discussion_text;
                if (discText) {
                    await pool.query(
                        `INSERT INTO lead_discussions (lead_id, subject, discussion_text, created_by) VALUES ($1, $2, $3, $4)`,
                        [leadId, d.subject || 'General Discussion', discText, changedBy || 'Admin']
                    );
                }
            }
        }

        // 6. Log into history if agent changed
        if (previousAgentId !== parsedNewAgentId) {
            await pool.query(
                `INSERT INTO lead_assignment_history (lead_id, previous_agent_id, new_agent_id, changed_by) VALUES ($1, $2, $3, $4)`,
                [leadId, previousAgentId, parsedNewAgentId, changedBy || 'Admin']
            );
        }

        return res.status(200).json({ success: true, data: updatedLead, message: 'Lead updated successfully!' });
    } catch (err) {
        console.error('❌ Update lead error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};

// Delete Lead
export const deleteLead = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id, 10);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, error: 'Invalid Lead ID provided.' });
        }

        const { rows } = await pool.query('DELETE FROM leads WHERE id = $1 RETURNING *;', [leadId]);
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
        const { leads } = req.body; 
        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid leads provided for upload.' });
        }

        let insertedCount = 0;
        for (const l of leads) {
            const query = `
                INSERT INTO leads (
                    transaction_id, transaction_date, company_name, contact_person, 
                    email, phone, state, city, insurance_type, existing_insurer, policy_value, transaction_type, 
                    deal_stage_id, lead_stage_id, status, remarks, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                ON CONFLICT (transaction_id) DO NOTHING;
            `;
            await pool.query(query, [
                l.transaction_id || `TXN-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                l.transaction_date || new Date(),
                l.company_name,
                l.contact_person,
                l.email,
                l.phone,
                l.state || null,
                l.city || null,
                l.insurance_type || 'Group Health Insurance',
                l.existing_insurer || null,
                l.policy_value || 0,
                l.transaction_type || 'Fresh',
                l.deal_stage_id || null,
                l.lead_stage_id || null,
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

// Get Single Lead by ID (Includes multiple phones, emails, discussions, and assignment history)
export const getLeadById = async (req, res) => {
    try {
        const leadId = parseInt(req.params.id, 10);
        if (!leadId || isNaN(leadId)) {
            return res.status(400).json({ success: false, error: 'Invalid or missing Lead ID.' });
        }

        const query = `
            SELECT l.*, 
                   e.name AS agent_name, 
                   ds.name AS deal_stage_name, 
                   ls.name AS lead_stage_name
            FROM leads l
            LEFT JOIN employees e ON l.agent_id = e.id
            LEFT JOIN crm_deal_stages ds ON l.deal_stage_id = ds.id
            LEFT JOIN crm_lead_stages ls ON l.lead_stage_id = ls.id
            WHERE l.id = $1;
        `;
        const leadRes = await pool.query(query, [leadId]);
        
        if (leadRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found.' });
        }

        // Fetch related relational records
        const phonesRes = await pool.query('SELECT * FROM lead_phones WHERE lead_id = $1 ORDER BY id ASC;', [leadId]);
        const emailsRes = await pool.query('SELECT * FROM lead_emails WHERE lead_id = $1 ORDER BY id ASC;', [leadId]);
        const discussionsRes = await pool.query('SELECT * FROM lead_discussions WHERE lead_id = $1 ORDER BY id DESC;', [leadId]);

        // Fetch Assignment History with agent names
        const historyQuery = `
            SELECT h.*, 
                   pa.name AS prev_agent_name, 
                   na.name AS new_agent_name
            FROM lead_assignment_history h
            LEFT JOIN employees pa ON h.previous_agent_id = pa.id
            LEFT JOIN employees na ON h.new_agent_id = na.id
            WHERE h.lead_id = $1
            ORDER BY h.id DESC;
        `;
        const historyRes = await pool.query(historyQuery, [leadId]);

        return res.status(200).json({ 
            success: true, 
            lead: {
                ...leadRes.rows[0],
                phones: phonesRes.rows,
                emails: emailsRes.rows,
                discussions: discussionsRes.rows,
                assignment_history: historyRes.rows
            } 
        });
    } catch (err) {
        console.error('❌ Get lead by ID error:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};