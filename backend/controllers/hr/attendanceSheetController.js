import pool from '../../db.js';

export const getMonthlyAttendanceSheet = async (req, res) => {
    try {
        const { companyId = 2, role = 'All', month, year } = req.query;
        
        const targetMonth = parseInt(month, 10) || new Date().getMonth() + 1;
        const targetYear = parseInt(year, 10) || new Date().getFullYear();
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

        // Build role filter conditionally without assuming e.company_id exists
        let roleCondition = '';
        const empParams = [];
        if (role && role !== 'All') {
            roleCondition = `WHERE (e.employment_type ILIKE $1 OR desig.name ILIKE $1)`;
            empParams.push(`%${role}%`);
        }

        const employeesQuery = `
            SELECT e.id, e.employee_id, e.first_name, e.last_name, e.name, 
                   COALESCE(e.employment_type, 'Staff') AS role, 
                   COALESCE(desig.name, 'Staff') AS designation_name
            FROM employees e
            LEFT JOIN designations desig ON e.designation_id = desig.id
            ${roleCondition}
            ORDER BY e.id ASC;
        `;
        
        const empResult = await pool.query(employeesQuery, empParams);
        const employees = empResult.rows;

        if (employees.length === 0) {
            return res.status(200).json({ success: true, daysInMonth, attendanceSheet: [] });
        }

        const startDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const endDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${daysInMonth}`;

        // Fetch attendance records filtered by company_id and date range
        const attQuery = `
            SELECT employee_id, attendance_date, attendance_status
            FROM employee_attendance
            WHERE company_id = $1 AND attendance_date BETWEEN $2 AND $3;
        `;
        const attResult = await pool.query(attQuery, [companyId, startDate, endDate]);
        const attendanceRows = attResult.rows;

        const attendanceSheet = employees.map(emp => {
            const daysMap = {};
            let totalPresent = 0;
            let totalAbsent = 0;
            let totalLate = 0;

            const empAtt = attendanceRows.filter(r => Number(r.employee_id) === Number(emp.id));

            empAtt.forEach(record => {
                const dayNum = new Date(record.attendance_date).getDate();
                let shortStatus = 'Present';
                
                if (record.attendance_status === 'Present') { shortStatus = 'Present'; totalPresent++; }
                else if (record.attendance_status === 'Absent') { shortStatus = 'Absent'; totalAbsent++; }
                else if (record.attendance_status === 'Late') { shortStatus = 'Late'; totalLate++; }
                else if (record.attendance_status === 'Half-Day' || record.attendance_status === 'Half Day') { shortStatus = 'Half-Day'; totalPresent += 0.5; }
                else if (record.attendance_status === 'On Leave') { shortStatus = 'On Leave'; }

                daysMap[dayNum] = shortStatus;
            });

            return {
                staff_id: emp.id,
                employee_id: emp.employee_id || `#${emp.id}`,
                name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
                role: emp.role !== 'Staff' ? emp.role : emp.designation_name,
                days: daysMap,
                totalPresent,
                totalAbsent,
                totalLate
            };
        });

        return res.status(200).json({
            success: true,
            daysInMonth,
            attendanceSheet
        });
    } catch (err) {
        console.error('❌ CRITICAL ERROR in getMonthlyAttendanceSheet:', err.message);
        console.error(err.stack);
        return res.status(500).json({ success: false, error: err.message });
    }
};