import pool from '../../db.js';

export const getAttendanceLogs = async (req, res) => {
    try {
        const { companyId = 2, search = '', status = 'All', date, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const searchFilter = `%${search}%`;

        let conditions = [`a.company_id = $1`, `(e.name ILIKE $2 OR e.first_name ILIKE $2 OR e.last_name ILIKE $2 OR e.email_address ILIKE $2 OR e.mobile_number ILIKE $2 OR dept.name ILIKE $2 OR desig.name ILIKE $2 OR a.remarks ILIKE $2)`];
        const queryParams = [companyId, searchFilter];

        if (date) {
            queryParams.push(date);
            conditions.push(`a.attendance_date = $${queryParams.length}`);
        }

        if (status && status !== 'All') {
            queryParams.push(status);
            conditions.push(`a.attendance_status = $${queryParams.length}`);
        }

        queryParams.push(limit);
        const limitParamIndex = queryParams.length;
        queryParams.push(offset);
        const offsetParamIndex = queryParams.length;

        const whereClause = conditions.join(' AND ');

        const query = `
            SELECT a.*, 
                   e.first_name, e.last_name, e.name AS employee_name, e.employee_id AS emp_code, 
                   e.email_address AS email, e.mobile_number AS mobile,
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM employee_attendance a
            LEFT JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments dept ON a.department_id = dept.id
            LEFT JOIN designations desig ON a.designation_id = desig.id
            WHERE ${whereClause}
            ORDER BY a.id DESC
            LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex};
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM employee_attendance a
            LEFT JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments dept ON a.department_id = dept.id
            LEFT JOIN designations desig ON a.designation_id = desig.id
            WHERE ${whereClause};
        `;

        const countParams = queryParams.slice(0, queryParams.length - 2);

        const [result, countResult] = await Promise.all([
            pool.query(query, queryParams),
            pool.query(countQuery, countParams)
        ]);

        return res.status(200).json({
            success: true,
            data: result.rows,
            totalCount: parseInt(countResult.rows[0].count, 10)
        });
    } catch (err) {
        console.error('❌ Failed to fetch attendance logs:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAttendanceLogById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT a.*, 
                   e.first_name, e.last_name, e.name AS employee_name, e.employee_id AS emp_code, 
                   e.email_address AS email, e.mobile_number AS mobile,
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM employee_attendance a
            LEFT JOIN employees e ON a.employee_id = e.id
            LEFT JOIN departments dept ON a.department_id = dept.id
            LEFT JOIN designations desig ON a.designation_id = desig.id
            WHERE a.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Attendance record not found.' });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to fetch attendance record:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createAttendanceLog = async (req, res) => {
    try {
        const { companyId = 2, employeeId, departmentId, designationId, attendanceDate, checkInTime, checkOutTime, attendanceStatus, remarks, createdBy } = req.body;

        if (!employeeId || !attendanceDate) {
            return res.status(400).json({ error: 'Employee and Attendance Date are required.' });
        }

        const query = `
            INSERT INTO employee_attendance (company_id, employee_id, department_id, designation_id, attendance_date, check_in_time, check_out_time, attendance_status, remarks, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;
        const values = [
            companyId, employeeId, departmentId || null, designationId || null, 
            attendanceDate, checkInTime || '09:00:00', checkOutTime || '18:00:00', 
            attendanceStatus || 'Present', remarks, createdBy || 'System Admin'
        ];
        
        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to create attendance record:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const updateAttendanceLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeId, departmentId, designationId, attendanceDate, checkInTime, checkOutTime, attendanceStatus, remarks } = req.body;

        const query = `
            UPDATE employee_attendance 
            SET employee_id = COALESCE($1, employee_id),
                department_id = COALESCE($2, department_id),
                designation_id = COALESCE($3, designation_id),
                attendance_date = COALESCE($4, attendance_date),
                check_in_time = COALESCE($5, check_in_time),
                check_out_time = COALESCE($6, check_out_time),
                attendance_status = COALESCE($7, attendance_status),
                remarks = COALESCE($8, remarks),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING *;
        `;
        const values = [employeeId, departmentId, designationId, attendanceDate, checkInTime, checkOutTime, attendanceStatus, remarks, id];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ error: 'Attendance record not found.' });

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Failed to update attendance record:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
};

export const deleteAttendanceLog = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM employee_attendance WHERE id = $1;', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'Attendance record not found.' });
        return res.status(200).json({ success: true, message: 'Attendance record deleted successfully.' });
    } catch (err) {
        console.error('❌ Failed to delete attendance record:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};