import pool from '../../db.js'; // Adjust based on your db config path

export const getDepartments = async (req, res) => {
    try {
        const { companyId = 2, search = '', page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const searchFilter = `%${search}%`;

        const query = `
            SELECT * FROM departments 
            WHERE company_id = $1 
            AND (name ILIKE $2 OR code ILIKE $2 OR head_of_department ILIKE $2)
            ORDER BY id DESC
            LIMIT $3 OFFSET $4;
        `;

        const countQuery = `
            SELECT COUNT(*) FROM departments 
            WHERE company_id = $1 
            AND (name ILIKE $2 OR code ILIKE $2 OR head_of_department ILIKE $2);
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
        console.error('❌ Failed to fetch departments:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM departments WHERE id = $1;', [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Department not found.' });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to fetch department:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createDepartment = async (req, res) => {
    try {
        const { companyId = 2, name, code, description, headOfDepartment, status, totalEmployees } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Department name and code are required.' });
        }

        const query = `
            INSERT INTO departments (company_id, name, code, description, head_of_department, status, total_employees)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [companyId, name, code, description, headOfDepartment, status || 'Active', totalEmployees || 0];
        
        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to create department:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, description, headOfDepartment, status, totalEmployees } = req.body;

        const query = `
            UPDATE departments 
            SET name = COALESCE($1, name),
                code = COALESCE($2, code),
                description = COALESCE($3, description),
                head_of_department = COALESCE($4, head_of_department),
                status = COALESCE($5, status),
                total_employees = COALESCE($6, total_employees)
            WHERE id = $7
            RETURNING *;
        `;
        const values = [name, code, description, headOfDepartment, status, totalEmployees, id];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Department not found.' });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to update department:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM departments WHERE id = $1;', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'Department not found.' });
        return res.status(200).json({ success: true, message: 'Department deleted successfully.' });
    } catch (err) {
        console.error('❌ Failed to delete department:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};