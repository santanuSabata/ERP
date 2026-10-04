import pool from '../../db.js';

export const getEmployeeDashboardLogs = async (req, res) => {
    try {
        const { companyId = 2, search = '', page = 1, limit = 10, status = 'All' } = req.query;
        const offset = (page - 1) * limit;
        const searchFilter = `%${search}%`;

        let statusCondition = '';
        const queryParams = [companyId, searchFilter, limit, offset];

        if (status && status !== 'All') {
            statusCondition = `AND l.status = $5`;
            queryParams.push(status);
        }

        const query = `
            SELECT l.*, 
                   e.first_name, e.last_name, e.name AS employee_name, e.employee_id,
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM employee_activity_logs l
            LEFT JOIN employees e ON l.employee_id = e.id
            LEFT JOIN departments dept ON l.department_id = dept.id
            LEFT JOIN designations desig ON l.designation_id = desig.id
            WHERE l.company_id = $1 
            AND (e.name ILIKE $2 OR l.activity_type ILIKE $2 OR dept.name ILIKE $2 OR desig.name ILIKE $2 OR l.remarks ILIKE $2)
            ${statusCondition}
            ORDER BY l.id DESC
            LIMIT $3 OFFSET $4;
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM employee_activity_logs l
            LEFT JOIN employees e ON l.employee_id = e.id
            LEFT JOIN departments dept ON l.department_id = dept.id
            LEFT JOIN designations desig ON l.designation_id = desig.id
            WHERE l.company_id = $1 
            AND (e.name ILIKE $2 OR l.activity_type ILIKE $2 OR dept.name ILIKE $2 OR desig.name ILIKE $2 OR l.remarks ILIKE $2)
            ${statusCondition};
        `;

        // Summary metrics
        const statsQuery = `
            SELECT 
                COUNT(*) AS total_logs,
                SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) AS in_progress_count,
                ROUND(AVG(performance_score), 2) AS avg_performance
            FROM employee_activity_logs WHERE company_id = $1;
        `;

        const [result, countResult, statsResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, status && status !== 'All' ? [companyId, searchFilter, status] : [companyId, searchFilter]),
            pool.query(statsQuery, [companyId])
        ]);

        return res.status(200).json({
            success: true,
            data: result.rows,
            totalCount: parseInt(countResult.rows[0].count, 10),
            stats: statsResult.rows[0]
        });
    } catch (err) {
        console.error('❌ Failed to fetch employee dashboard logs:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getEmployeeDashboardLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT l.*, 
                   e.first_name, e.last_name, e.name AS employee_name, e.employee_id,
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM employee_activity_logs l
            LEFT JOIN employees e ON l.employee_id = e.id
            LEFT JOIN departments dept ON l.department_id = dept.id
            LEFT JOIN designations desig ON l.designation_id = desig.id
            WHERE l.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Dashboard log entry not found.' });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to fetch log entry:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createEmployeeDashboardLog = async (req, res) => {
    try {
        const { companyId = 2, employeeId, departmentId, designationId, transactionDate, activityType, status, performanceScore, remarks, createdBy } = req.body;

        if (!employeeId || !activityType) {
            return res.status(400).json({ error: 'Employee and Activity Type are required.' });
        }

        const query = `
            INSERT INTO employee_activity_logs (company_id, employee_id, department_id, designation_id, transaction_date, activity_type, status, performance_score, remarks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const values = [
            companyId, employeeId, departmentId || null, designationId || null, 
            transactionDate || new Date(), activityType, status || 'Completed', 
            performanceScore || 0.00, remarks, createdBy || 'System Admin'
        ];
        
        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to create log entry:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateEmployeeDashboardLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, departmentId, designationId, transactionDate, activityType, status, performanceScore, remarks, createdBy } = req.body;

        const query = `
            UPDATE employee_activity_logs 
            SET employee_id = COALESCE($1, employee_id),
                department_id = COALESCE($2, department_id),
                designation_id = COALESCE($3, designation_id),
                transaction_date = COALESCE($4, transaction_date),
                activity_type = COALESCE($5, activity_type),
                status = COALESCE($6, status),
                performance_score = COALESCE($7, performance_score),
                remarks = COALESCE($8, remarks),
                created_by = COALESCE($9, created_by)
            WHERE id = $10
            RETURNING *;
        `;
        const values = [employeeId, departmentId, designationId, transactionDate, activityType, status, performanceScore, remarks, createdBy, id];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Log entry not found.' });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to update log entry:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteEmployeeDashboardLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM employee_activity_logs WHERE id = $1;', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'Log entry not found.' });
        return res.status(200).json({ success: true, message: 'Log entry deleted successfully.' });
    } catch (err) {
        console.error('❌ Failed to delete log entry:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};