import pool from '../../db.js';

export const getWarehouses = async (req, res) => {
    try {
        const { companyId, tab = 'All', search, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM warehouses WHERE company_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM warehouses WHERE company_id = $1';
        let values = [targetCompanyId];

        if (tab === 'Deleted') {
            query += ' AND is_deleted = TRUE';
            countQuery += ' AND is_deleted = TRUE';
        } else {
            query += ' AND is_deleted = FALSE';
            countQuery += ' AND is_deleted = FALSE';
        }

        if (search && search.trim() !== '') {
            query += ' AND (name ILIKE $2 OR code ILIKE $2 OR city ILIKE $2 OR phone ILIKE $2)';
            countQuery += ' AND (name ILIKE $2 OR code ILIKE $2 OR city ILIKE $2 OR phone ILIKE $2)';
            values.push(`%${search.trim()}%`);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, search ? 2 : 1));
        const totalCount = parseInt(countRes.rows[0].count);

        const formatted = rows.map(r => ({
            id: r.id,
            companyId: r.company_id,
            name: r.name,
            code: r.code || '',
            phone: r.phone || '',
            email: r.email || '',
            address: r.address || '',
            city: r.city || '',
            state: r.state || '',
            pincode: r.pincode || '',
            isPrimary: r.is_primary || false,
            createdBy: r.created_by || 'Raj S',
            createdAt: r.created_at,
            isDeleted: r.is_deleted
        }));

        return res.status(200).json({ success: true, totalCount, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching warehouses:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getWarehouseById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM warehouses WHERE id = $1 AND is_deleted = FALSE';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Warehouse not found.' });

        const r = rows[0];
        const formatted = {
            id: r.id,
            companyId: r.company_id,
            name: r.name,
            code: r.code || '',
            phone: r.phone || '',
            email: r.email || '',
            address: r.address || '',
            city: r.city || '',
            state: r.state || '',
            pincode: r.pincode || '',
            isPrimary: r.is_primary || false
        };

        return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching single warehouse:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const addWarehouse = async (req, res) => {
    try {
        const { companyId, name, code, phone, email, address, city, state, pincode, isPrimary, createdBy } = req.body;
        const targetCompanyId = companyId || 1;

        const query = `
            INSERT INTO warehouses (
                company_id, name, code, phone, email, address, city, state, pincode, is_primary, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;

        const values = [
            targetCompanyId, name, code || '', phone || '', email || '',
            address || '', city || '', state || '', pincode || '', isPrimary || false, createdBy || 'Raj S'
        ];

        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Error adding warehouse:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, phone, email, address, city, state, pincode, isPrimary } = req.body;

        const query = `
            UPDATE warehouses 
            SET name = COALESCE($1, name),
                code = COALESCE($2, code),
                phone = COALESCE($3, phone),
                email = COALESCE($4, email),
                address = COALESCE($5, address),
                city = COALESCE($6, city),
                state = COALESCE($7, state),
                pincode = COALESCE($8, pincode),
                is_primary = COALESCE($9, is_primary)
            WHERE id = $10
            RETURNING *;
        `;

        const values = [name, code, phone, email, address, city, state, pincode, isPrimary, id];
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) return res.status(404).json({ error: 'Warehouse not found.' });
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Error updating warehouse:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE warehouses SET is_deleted = TRUE WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Warehouse not found.' });
        return res.status(200).json({ success: true, message: 'Warehouse deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting warehouse:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};