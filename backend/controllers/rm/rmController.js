import pool from '../../db.js';

// Rm Login API using Mobile Number and PIN
export const rmLogin = async (req, res) => {
    try {
        const { mobile, pin } = req.body;
        
        console.log('🔍 Rm Login Request Received:', { mobile, pinLength: pin?.length });

        // Query using strict secure_pin and mobile columns
        const query = `
            SELECT u.*, e.id AS employee_id 
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            WHERE u.mobile = $1 AND u.secure_pin = $2;
        `;
        
        const { rows } = await pool.query(query, [mobile, pin]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid mobile number or secure PIN.' });
        }

        const user = rows[0];
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                employeeId: user.employee_id,
                name: user.full_name || user.name || 'Rm',
                role: user.role || 'Rm',
                mobile: user.mobile
            }
        });
    } catch (err) {
        console.error('❌ CRITICAL AGENT LOGIN ERROR:', err.message);
        console.error(err.stack);
        return res.status(500).json({ 
            success: false, 
            error: `Database Error: ${err.message}` 
        });
    }
};

// Get Assigned Leads for specific Rm
// Backend Controller: Get Rm Assigned Leads
export const getRmLeads = async (req, res) => {
    try {
        const { rmId, status, search } = req.query;

        if (!rmId) {
            return res.status(400).json({ success: false, error: 'Rm ID is required' });
        }

        let query = `SELECT * FROM leads WHERE agent_id = $1`;
        const params = [rmId]; // 👈 Fixed from agentId to rmId
        let paramCount = 2;

        if (status && status !== 'All') {
            query += ` AND status = $${paramCount++}`;
            params.push(status);
        }

        if (search) {
            query += ` AND (company_name ILIKE $${paramCount} OR contact_person ILIKE $${paramCount} OR transaction_id ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY created_at DESC`;

        const leadsResult = await pool.query(query, params);
        const leads = leadsResult.rows;

        // Calculate Stats for the Rm Dashboard Cards
        const statsQuery = `
            SELECT 
                COUNT(*) AS total_leads,
                COUNT(CASE WHEN status = 'New' THEN 1 END) AS new_leads,
                COUNT(CASE WHEN status = 'Interested' THEN 1 END) AS interested_leads,
                COUNT(CASE WHEN status = 'Converted' THEN 1 END) AS converted_leads
            FROM leads WHERE agent_id = $1
        `;
        const statsResult = await pool.query(statsQuery, [rmId]);
        const stats = statsResult.rows[0];

        res.json({
            success: true,
            leads,
            stats
        });
    } catch (err) {
        console.error('Error fetching rm leads:', err);
        res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};

// Backend Controller: Update Lead Status by Rm
export const updateRmLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { leadStatus, lead_stage_id, remarks } = req.body;

        const query = `
            UPDATE leads 
            SET status = COALESCE($1, status), 
                lead_stage_id = COALESCE($2, lead_stage_id), 
                remarks = COALESCE($3, remarks), 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $4 
            RETURNING *
        `;
        const result = await pool.query(query, [
            leadStatus || null, 
            lead_stage_id !== undefined ? lead_stage_id : null, 
            remarks || null, 
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        res.json({
            success: true,
            message: 'Lead status and stage updated successfully',
            lead: result.rows[0]
        });
    } catch (err) {
        console.error('Error updating rm lead status:', err);
        res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};