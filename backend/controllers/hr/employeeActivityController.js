import pool from '../../db.js';

// Record a new employee activity log
export const logEmployeeActivity = async (req, res) => {
    try {
        const { 
            employeeId, 
            departmentId, 
            designationId, 
            activityType, 
            status, 
            performanceScore, 
            remarks, 
            createdBy 
        } = req.body;

        if (!employeeId || !activityType) {
            return res.status(400).json({ success: false, error: 'Employee ID and Activity Type are required.' });
        }

        const query = `
            INSERT INTO employee_activity_logs (
                employee_id, 
                department_id, 
                designation_id, 
                activity_type, 
                status, 
                performance_score, 
                remarks, 
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        const values = [
            parseInt(employeeId, 10),
            departmentId ? parseInt(departmentId, 10) : null,
            designationId ? parseInt(designationId, 10) : null,
            activityType,
            status || 'Completed',
            performanceScore || 0.00,
            remarks || null,
            createdBy || 'System Admin'
        ];

        const { rows } = await pool.query(query, values);

        return res.status(201).json({
            success: true,
            data: rows[0],
            message: 'Employee activity logged successfully!'
        });
    } catch (err) {
        console.error('❌ Error logging employee activity:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};