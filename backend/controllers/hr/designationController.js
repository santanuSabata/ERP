import pool from '../../db.js';

export const getDesignations = async (req, res) => {
    try {
        const { companyId = 2, search = '', page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const searchFilter = `%${search}%`;

        const query = `
            SELECT d.*, dept.name AS department_name 
            FROM designations d
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE d.company_id = $1 
            AND (d.name ILIKE $2 OR d.code ILIKE $2 OR dept.name ILIKE $2)
            ORDER BY d.id DESC
            LIMIT $3 OFFSET $4;
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM designations d
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE d.company_id = $1 
            AND (d.name ILIKE $2 OR d.code ILIKE $2 OR dept.name ILIKE $2);
        `;

        const [result, countResult] = await Promise.all([
            pool.query(query, [companyId, searchFilter, limit, offset]),
            pool.query(countQuery, [companyId, searchFilter])
        ]);

        return res.status(200).json({
            success: true,
            data: result.rows,
            totalCount: parseInt(countResult.rows[0].count, 10)
        });
    } catch (err) {
        console.error('❌ Failed to fetch designations:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDesignationById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT d.*, dept.name AS department_name 
            FROM designations d
            LEFT JOIN departments dept ON d.department_id = dept.id
            WHERE d.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Designation not found.' });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to fetch designation:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createDesignation = async (req, res) => {
    try {
        const { companyId = 2, departmentId, name, code, description, status } = req.body;

        if (!name || !code || !departmentId) {
            return res.status(400).json({ error: 'Designation name, code, and department are required.' });
        }

        const query = `
            INSERT INTO designations (company_id, department_id, name, code, description, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [companyId, departmentId, name, code, description, status || 'Active'];
        
        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to create designation:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { departmentId, name, code, description, status } = req.body;

        const query = `
            UPDATE designations 
            SET department_id = COALESCE($1, department_id),
                name = COALESCE($2, name),
                code = COALESCE($3, code),
                description = COALESCE($4, description),
                status = COALESCE($5, status)
            WHERE id = $6
            RETURNING *;
        `;
        const values = [departmentId, name, code, description, status, id];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Designation not found.' });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to update designation:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteDesignation = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM designations WHERE id = $1;', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'Designation not found.' });
        return res.status(200).json({ success: true, message: 'Designation deleted successfully.' });
    } catch (err) {
        console.error('❌ Failed to delete designation:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};