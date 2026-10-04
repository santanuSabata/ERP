import pool from '../../db.js';

export const getInventories = async (req, res) => {
    try {
        const { companyId, search, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = `
            SELECT i.*, p.name AS product_name, p.primary_unit, w.name AS warehouse_name 
            FROM inventories i
            LEFT JOIN products p ON i.product_id = p.id
            LEFT JOIN warehouses w ON i.warehouse_id = w.id
            WHERE i.company_id = $1 AND i.is_deleted = FALSE
        `;
        let countQuery = 'SELECT COUNT(*) FROM inventories WHERE company_id = $1 AND is_deleted = FALSE';
        let values = [targetCompanyId];

        if (search && search.trim() !== '') {
            query += ' AND (p.name ILIKE $2 OR i.transaction_type ILIKE $2 OR i.reference_no ILIKE $2)';
            countQuery += ' AND (p.name ILIKE $2 OR i.transaction_type ILIKE $2 OR i.reference_no ILIKE $2)';
            values.push(`%${search.trim()}%`);
        }

        query += ` ORDER BY i.id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, search ? 2 : 1));
        const totalCount = parseInt(countRes.rows[0].count);

        const formatted = rows.map(r => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name || 'Unknown Item',
            warehouseId: r.warehouse_id,
            warehouseName: r.warehouse_name || 'Main Warehouse',
            transactionType: r.transaction_type,
            quantity: parseFloat(r.quantity || 0),
            unit: r.primary_unit || 'BOX',
            unitPrice: parseFloat(r.unit_price || 0),
            referenceNo: r.reference_no || '',
            notes: r.notes || '',
            createdBy: r.created_by || 'Raj S',
            createdAt: r.created_at
        }));

        return res.status(200).json({ success: true, totalCount, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching inventories:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getInventoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM inventories WHERE id = $1 AND is_deleted = FALSE';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Inventory log not found.' });
        }

        const r = rows[0];
        const formatted = {
            id: r.id,
            productId: r.product_id,
            warehouseId: r.warehouse_id,
            transactionType: r.transaction_type,
            quantity: parseFloat(r.quantity || 0),
            unitPrice: parseFloat(r.unit_price || 0),
            referenceNo: r.reference_no || '',
            notes: r.notes || ''
        };

        return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching single inventory log:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const addInventoryStock = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { companyId, productId, warehouseId, transactionType, quantity, unitPrice, referenceNo, notes, createdBy } = req.body;
        const targetCompanyId = companyId || 1;
        const qtyNum = parseFloat(quantity || 0);

        const insertQuery = `
            INSERT INTO inventories (
                company_id, product_id, warehouse_id, transaction_type, quantity, unit_price, reference_no, notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const insertValues = [targetCompanyId, productId, warehouseId || null, transactionType, qtyNum, unitPrice || 0, referenceNo || '', notes || '', createdBy || 'Raj S'];
        const { rows } = await client.query(insertQuery, insertValues);

        const multiplier = transactionType === 'Stock In' ? 1 : -1;
        const updateProductQuery = `
            UPDATE products 
            SET quantity = quantity + ($1 * $2)
            WHERE id = $3;
        `;
        await client.query(updateProductQuery, [qtyNum, multiplier, productId]);

        await client.query('COMMIT');
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error saving inventory stock transaction:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const updateInventory = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { warehouseId, referenceNo, notes } = req.body;

        const query = `
            UPDATE inventories 
            SET warehouse_id = COALESCE($1, warehouse_id),
                reference_no = COALESCE($2, reference_no),
                notes = COALESCE($3, notes)
            WHERE id = $4
            RETURNING *;
        `;
        const { rows } = await client.query(query, [warehouseId || null, referenceNo, notes, id]);

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Inventory log not found.' });
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating inventory log:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE inventories SET is_deleted = TRUE WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Transaction log not found.' });
        return res.status(200).json({ success: true, message: 'Stock log deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting inventory log:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};