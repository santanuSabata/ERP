import pool from '../../db.js';

export const getEmployees = async (req, res) => {
    try {
        const { companyId = 2, search = '', page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const searchFilter = `%${search}%`;

        const query = `
            SELECT e.*, 
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM employees e
            LEFT JOIN departments dept ON e.department_id = dept.id
            LEFT JOIN designations desig ON e.designation_id = desig.id
            WHERE (e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.name ILIKE $1 OR e.employee_id ILIKE $1 OR e.email_address ILIKE $1 OR dept.name ILIKE $1 OR desig.name ILIKE $1)
            ORDER BY e.id DESC
            LIMIT $2 OFFSET $3;
        `;

        const countQuery = `
            SELECT COUNT(*) 
            FROM employees e
            LEFT JOIN departments dept ON e.department_id = dept.id
            LEFT JOIN designations desig ON e.designation_id = desig.id
            WHERE (e.first_name ILIKE $1 OR e.last_name ILIKE $1 OR e.name ILIKE $1 OR e.employee_id ILIKE $1 OR e.email_address ILIKE $1 OR dept.name ILIKE $1 OR desig.name ILIKE $1);
        `;

        const [result, countResult] = await Promise.all([
            pool.query(query, [searchFilter, limit, offset]),
            pool.query(countQuery, [searchFilter])
        ]);

        return res.status(200).json({
            success: true,
            data: result.rows,
            totalCount: parseInt(countResult.rows[0].count, 10)
        });
    } catch (err) {
        console.error('❌ Failed to fetch employees:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT e.*, 
                   dept.name AS department_name, 
                   desig.name AS designation_name 
            FROM employees e
            LEFT JOIN departments dept ON e.department_id = dept.id
            LEFT JOIN designations desig ON e.designation_id = desig.id
            WHERE e.id = $1;
        `;
        const { rows } = await pool.query(query, [id]);
        
        if (rows.length === 0) return res.status(404).json({ error: 'Employee not found.' });

        // Fetch qualifications
        const qualQuery = 'SELECT * FROM employee_qualifications WHERE employee_id = $1;';
        const qualRes = await pool.query(qualQuery, [id]);

        const employeeData = { ...rows[0], qualifications: qualRes.rows };

        return res.status(200).json({ success: true, data: employeeData });
    } catch (err) {
        console.error('❌ Failed to fetch employee:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const createEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { 
            firstName, lastName, employeeId, dateOfJoining, departmentId, designationId, 
            employmentType, reportingManager, gender, maritalStatus, bloodGroup, employeeStatus,
            emailAddress, mobileNumber, alternateNumber, country, additionalInfo,
            addressLine1, addressLine2, city, state, pinCode,
            basicSalary, hra, conveyance, medical, specialAllowance, grossSalary,
            pf, profTax, tds, otherDeductions, totalDeductions, netSalary,
            qualifications = []
        } = req.body;

        const fullName = `${firstName} ${lastName}`;

        const insertEmpQuery = `
            INSERT INTO employees (
                first_name, last_name, name, employee_id, date_of_joining, department_id, designation_id, 
                employment_type, reporting_manager, gender, marital_status, blood_group, employee_status, 
                email_address, mobile_number, alternate_number, country, additional_info, 
                address_line_1, address_line_2, city, state, pin_code, 
                basic_salary, hra, conveyance, medical, special_allowance, gross_salary, 
                pf, prof_tax, tds, other_deductions, total_deductions, net_salary
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35)
            RETURNING *;
        `;

        const values = [
            firstName, lastName, fullName, employeeId, dateOfJoining || null, departmentId || null, designationId || null,
            employmentType || 'Full-Time', reportingManager, gender || 'Male', maritalStatus, bloodGroup, employeeStatus || 'Active',
            emailAddress, mobileNumber, alternateNumber, country || 'India', additionalInfo,
            addressLine1, addressLine2, city, state, pinCode,
            basicSalary || 0, hra || 0, conveyance || 1600, medical || 1250, specialAllowance || 0, grossSalary || 0,
            pf || 0, profTax || 200, tds || 0, otherDeductions || 0, totalDeductions || 0, netSalary || 0
        ];

        const empRes = await client.query(insertEmpQuery, values);
        const newEmpId = empRes.rows[0].id;

        // Insert Qualifications
        for (const q of qualifications) {
            const qualQuery = `
                INSERT INTO employee_qualifications (employee_id, qualification, specialization, qualification_type, institution, passing_year, percentage, additional_certification, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            await client.query(qualQuery, [
                newEmpId, q.qualification, q.specialization || '—', q.qualificationType || 'Graduation',
                q.institution, q.passingYear, q.percentage || '—', q.additionalCertification, q.description
            ]);
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, data: empRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to create employee:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const updateEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { 
            firstName, lastName, employeeId, dateOfJoining, departmentId, designationId, 
            employmentType, reportingManager, gender, maritalStatus, bloodGroup, employeeStatus,
            emailAddress, mobileNumber, alternateNumber, country, additionalInfo,
            addressLine1, addressLine2, city, state, pinCode,
            basicSalary, hra, conveyance, medical, specialAllowance, grossSalary,
            pf, profTax, tds, otherDeductions, totalDeductions, netSalary,
            qualifications = []
        } = req.body;

        const fullName = `${firstName} ${lastName}`;

        const updateEmpQuery = `
            UPDATE employees SET 
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                name = COALESCE($3, name),
                employee_id = COALESCE($4, employee_id),
                date_of_joining = COALESCE($5, date_of_joining),
                department_id = COALESCE($6, department_id),
                designation_id = COALESCE($7, designation_id),
                employment_type = COALESCE($8, employment_type),
                reporting_manager = COALESCE($9, reporting_manager),
                gender = COALESCE($10, gender),
                marital_status = COALESCE($11, marital_status),
                blood_group = COALESCE($12, blood_group),
                employee_status = COALESCE($13, employee_status),
                email_address = COALESCE($14, email_address),
                mobile_number = COALESCE($15, mobile_number),
                alternate_number = COALESCE($16, alternate_number),
                country = COALESCE($17, country),
                additional_info = COALESCE($18, additional_info),
                address_line_1 = COALESCE($19, address_line_1),
                address_line_2 = COALESCE($20, address_line_2),
                city = COALESCE($21, city),
                state = COALESCE($22, state),
                pin_code = COALESCE($23, pin_code),
                basic_salary = COALESCE($24, basic_salary),
                hra = COALESCE($25, hra),
                conveyance = COALESCE($26, conveyance),
                medical = COALESCE($27, medical),
                special_allowance = COALESCE($28, special_allowance),
                gross_salary = COALESCE($29, gross_salary),
                pf = COALESCE($30, pf),
                prof_tax = COALESCE($31, prof_tax),
                tds = COALESCE($32, tds),
                other_deductions = COALESCE($33, other_deductions),
                total_deductions = COALESCE($34, total_deductions),
                net_salary = COALESCE($35, net_salary),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $36
            RETURNING *;
        `;

        const values = [
            firstName, lastName, fullName, employeeId, dateOfJoining, departmentId, designationId,
            employmentType, reportingManager, gender, maritalStatus, bloodGroup, employeeStatus,
            emailAddress, mobileNumber, alternateNumber, country, additionalInfo,
            addressLine1, addressLine2, city, state, pinCode,
            basicSalary, hra, conveyance, medical, specialAllowance, grossSalary,
            pf, profTax, tds, otherDeductions, totalDeductions, netSalary, id
        ];

        const empRes = await client.query(updateEmpQuery, values);
        if (empRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found.' });
        }

        // Refresh qualifications: Delete old and insert new
        await client.query('DELETE FROM employee_qualifications WHERE employee_id = $1;', [id]);
        for (const q of qualifications) {
            const qualQuery = `
                INSERT INTO employee_qualifications (employee_id, qualification, specialization, qualification_type, institution, passing_year, percentage, additional_certification, description)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
            `;
            await client.query(qualQuery, [
                id, q.qualification, q.specialization || '—', q.qualificationType || 'Graduation',
                q.institution, q.passingYear, q.percentage || '—', q.additionalCertification, q.description
            ]);
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, data: empRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Failed to update employee:', err);
        return res.status(500).json({ error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query('DELETE FROM employees WHERE id = $1;', [id]);

        if (rowCount === 0) return res.status(404).json({ error: 'Employee not found.' });
        return res.status(200).json({ success: true, message: 'Employee deleted successfully.' });
    } catch (err) {
        console.error('❌ Failed to delete employee:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};