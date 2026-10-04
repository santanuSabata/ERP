import pool from '../../db.js';

export const getPurchaseOrders = async (req, res) => {
    try {
        const { companyId, search, status, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = `
            SELECT po.*, v.name AS vendor_name 
            FROM purchase_orders po
            LEFT JOIN vendors v ON po.vendor_id = v.id
            WHERE po.company_id = $1 AND po.is_deleted = FALSE
        `;
        let countQuery = 'SELECT COUNT(*) FROM purchase_orders WHERE company_id = $1 AND is_deleted = FALSE';
        let values = [targetCompanyId];

        if (search && search.trim() !== '') {
            const paramIdx = values.length + 1;
            query += ` AND (po.po_number ILIKE $${paramIdx} OR v.name ILIKE $${paramIdx} OR po.remarks ILIKE $${paramIdx})`;
            countQuery += ` AND (po_number ILIKE $${paramIdx} OR remarks ILIKE $${paramIdx})`;
            values.push(`%${search.trim()}%`); // 👈 Fixed syntax here
        }

        if (status && status !== 'All') {
            const paramIdx = values.length + 1;
            query += ` AND po.status = $${paramIdx}`;
            countQuery += ` AND status = $${paramIdx}`;
            values.push(status);
        }

        query += ` ORDER BY po.id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, values.length));
        const totalCount = parseInt(countRes.rows[0].count);

        const formatted = await Promise.all(rows.map(async (r) => {
            const itemsRes = await pool.query(`
                SELECT pod.*, p.name AS product_name, p.sku AS product_sku 
                FROM purchase_order_details pod
                LEFT JOIN products p ON pod.product_id = p.id
                WHERE pod.purchase_order_id = $1
            `, [r.id]);

            return {
                id: r.id,
                companyId: r.company_id,
                poNumber: r.po_number,
                vendorId: r.vendor_id,
                vendorName: r.vendor_name || 'Unassigned Vendor',
                orderDate: r.order_date,
                deliveryDate: r.delivery_date,
                totalAmount: parseFloat(r.total_amount || 0),
                status: r.status,
                paymentStatus: r.payment_status,
                remarks: r.remarks || '',
                createdBy: r.created_by || 'Admin',
                items: itemsRes.rows.map(item => ({
                    id: item.id,
                    productId: item.product_id,
                    productName: item.product_name || 'Item',
                    productSku: item.product_sku || '-',
                    quantity: parseFloat(item.quantity || 1),
                    unitPrice: parseFloat(item.unit_price || 0),
                    lineTotal: parseFloat(item.line_total || 0)
                }))
            };
        }));

        return res.status(200).json({ success: true, totalCount, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching purchase orders:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const addPurchaseOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            companyId, poNumber, vendorId, orderDate, deliveryDate,
            status, paymentStatus, remarks, createdBy, items
        } = req.body;

        const targetCompanyId = companyId || 1;
        const generatedPoNo = poNumber || `PO-${Math.floor(100000 + Math.random() * 900000)}`;

        let calculatedTotal = 0;
        if (items && items.length > 0) {
            calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)), 0);
        }

        const poQuery = `
            INSERT INTO purchase_orders (
                company_id, po_number, vendor_id, order_date, delivery_date,
                total_amount, status, payment_status, remarks, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *;
        `;

        const poValues = [
            targetCompanyId, generatedPoNo, vendorId ? parseInt(vendorId) : null,
            orderDate || new Date(), deliveryDate || null, calculatedTotal,
            status || 'Draft', paymentStatus || 'Pending', remarks || '', createdBy || 'Admin'
        ];

        const poRes = await client.query(poQuery, poValues);
        const newPoId = poRes.rows[0].id;

        if (items && items.length > 0) {
            for (const item of items) {
                const qty = parseFloat(item.quantity || 1);
                const price = parseFloat(item.unitPrice || 0);
                const lineTotal = qty * price;

                await client.query(`
                    INSERT INTO purchase_order_details (purchase_order_id, product_id, quantity, unit_price, line_total)
                    VALUES ($1, $2, $3, $4, $5);
                `, [newPoId, item.productId ? parseInt(item.productId) : null, qty, price, lineTotal]);
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Purchase Order created successfully', data: poRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding purchase order:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const updatePurchaseOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            poNumber, vendorId, orderDate, deliveryDate,
            status, paymentStatus, remarks, createdBy, items
        } = req.body;

        let calculatedTotal = 0;
        if (items && items.length > 0) {
            calculatedTotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)), 0);
        }

        const updateQuery = `
            UPDATE purchase_orders 
            SET po_number = COALESCE($1, po_number),
                vendor_id = COALESCE($2, vendor_id),
                order_date = COALESCE($3, order_date),
                delivery_date = COALESCE($4, delivery_date),
                total_amount = COALESCE($5, total_amount),
                status = COALESCE($6, status),
                payment_status = COALESCE($7, payment_status),
                remarks = COALESCE($8, remarks),
                created_by = COALESCE($9, created_by),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING *;
        `;

        const values = [
            poNumber, vendorId ? parseInt(vendorId) : null, orderDate, deliveryDate,
            calculatedTotal, status, paymentStatus, remarks, createdBy, id
        ];

        const poRes = await client.query(updateQuery, values);
        if (poRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Purchase Order not found.' });
        }

        await client.query('DELETE FROM purchase_order_details WHERE purchase_order_id = $1;', [id]);
        if (items && items.length > 0) {
            for (const item of items) {
                const qty = parseFloat(item.quantity || 1);
                const price = parseFloat(item.unitPrice || 0);
                const lineTotal = qty * price;

                await client.query(`
                    INSERT INTO purchase_order_details (purchase_order_id, product_id, quantity, unit_price, line_total)
                    VALUES ($1, $2, $3, $4, $5);
                `, [id, item.productId ? parseInt(item.productId) : null, qty, price, lineTotal]);
            }
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Purchase Order updated successfully', data: poRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating purchase order:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const deletePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('UPDATE purchase_orders SET is_deleted = TRUE WHERE id = $1 RETURNING *;', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Purchase Order not found.' });
        return res.status(200).json({ success: true, message: 'Purchase Order removed successfully.' });
    } catch (err) {
        console.error('❌ Error deleting purchase order:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};