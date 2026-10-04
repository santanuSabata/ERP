import pool from '../../db.js';

export const getUsers = async (req, res) => {
    try {
        const { companyId = 2, search = '', page = 1, limit = 10, role = 'All' } = req.query;
        const offset = (page - 1) * limit;
        const searchFilter = `%${search}%`;

        let roleCondition = '';
        const queryParams = [companyId, searchFilter, limit, offset];

        if (role && role !== 'All') {
            roleCondition = `AND u.role = $5`;
            queryParams.push(role);
        }

        const query = `
            SELECT u.id, u.company_id, u.employee_id, u.department_id, u.designation_id, 
                   u.username, u.full_name, u.email, u.mobile, u.role, u.status, u.secure_pin, 
                   u.created_by, u.created_at, u.updated_at,
                   e.employee_id AS emp_code,
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            LEFT JOIN departments dept ON u.department_id = dept.id
            LEFT JOIN designations desig ON u.designation_id = desig.id
            WHERE u.company_id = $1 
            AND (u.full_name ILIKE $2 OR u.username ILIKE $2 OR u.email ILIKE $2 OR u.mobile ILIKE $2 OR dept.name ILIKE $2 OR desig.name ILIKE $2)
            ${roleCondition}
            ORDER BY u.id DESC
            LIMIT $3 OFFSET $4;
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            LEFT JOIN departments dept ON u.department_id = dept.id
            LEFT JOIN designations desig ON u.designation_id = desig.id
            WHERE u.company_id = $1 
            AND (u.full_name ILIKE $2 OR u.username ILIKE $2 OR u.email ILIKE $2 OR u.mobile ILIKE $2 OR dept.name ILIKE $2 OR desig.name ILIKE $2)
            ${roleCondition};
        `;

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, role && role !== 'All' ? [companyId, searchFilter, role] : [companyId, searchFilter])
        ]);

        return res.status(200).json({
            success: true,
            data: result.rows,
            totalCount: parseInt(countResult.rows[0].count, 10)
        });
    } catch (err) {
        console.error('❌ Failed to fetch users:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT u.id, u.company_id, u.employee_id, u.department_id, u.designation_id, 
                   u.username, u.full_name, u.email, u.mobile, u.role, u.status, u.secure_pin, 
                   u.created_by, u.created_at, u.updated_at,
                   e.employee_id AS emp_code,
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            LEFT JOIN departments dept ON u.department_id = dept.id
            LEFT JOIN designations desig ON u.designation_id = desig.id
            WHERE u.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to fetch user:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createUser = async (req, res) => {
    try {
        const { companyId = 2, employeeId, departmentId, designationId, username, fullName, email, mobile, role, status, password, pin, createdBy } = req.body;

        if (!employeeId || !username || !email) {
            return res.status(400).json({ error: 'Employee, Username, and Email are required.' });
        }

        const query = `
            INSERT INTO users (company_id, employee_id, department_id, designation_id, username, full_name, email, mobile, role, status, password_hash, secure_pin, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;
        const values = [
            companyId, employeeId, departmentId || null, designationId || null, 
            username, fullName, email, mobile, role || 'Staff', status || 'Active', password || null, pin || null, createdBy || 'System Admin'
        ];
        
        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to create user:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

import bcrypt from 'bcryptjs'; // Ensure you have bcryptjs imported

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, departmentId, designationId, username, fullName, email, mobile, role, status, password, pin } = req.body;

        // Hash the password only if a new password string is provided and not empty
        let hashedPassword = null;
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const query = `
            UPDATE users 
            SET employee_id = COALESCE($1, employee_id),
                department_id = COALESCE($2, department_id),
                designation_id = COALESCE($3, designation_id),
                username = COALESCE($4, username),
                full_name = COALESCE($5, full_name),
                email = COALESCE($6, email),
                mobile = COALESCE($7, mobile),
                role = COALESCE($8, role),
                status = COALESCE($9, status),
                password_hash = COALESCE(NULLIF($10, ''), password_hash),
                secure_pin = COALESCE(NULLIF($11, ''), secure_pin),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *;
        `;
        
        // Pass hashedPassword into the query parameters instead of the plaintext password
        const values = [employeeId, departmentId, designationId, username, fullName, email, mobile, role, status, hashedPassword, pin, id];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to update user:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1;', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'User not found.' });
        return res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (err) {
        console.error('❌ Failed to delete user:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};