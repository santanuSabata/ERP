import pool from '../../db.js';

export const getPurchases = async (req, res) => {
    try {
        const { companyId, search, status, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = `
            SELECT pur.*, v.name AS vendor_name, v.phone AS vendor_phone 
            FROM purchases pur
            LEFT JOIN vendors v ON pur.vendor_id = v.id
            WHERE pur.company_id = $1 AND pur.is_deleted = FALSE
        `;
        let countQuery = 'SELECT COUNT(*) FROM purchases WHERE company_id = $1 AND is_deleted = FALSE';
        let values = [targetCompanyId];

        if (search && search.trim() !== '') {
            const paramIdx = values.length + 1;
            query += ` AND (pur.bill_number ILIKE $${paramIdx} OR pur.po_number ILIKE $${paramIdx} OR v.name ILIKE $${paramIdx} OR pur.notes ILIKE $${paramIdx})`;
            countQuery += ` AND (bill_number ILIKE $${paramIdx} OR po_number ILIKE $${paramIdx} OR notes ILIKE $${paramIdx})`;
            values.push(`%${search.trim()}%`);
        }

        if (status && status !== 'All') {
            const paramIdx = values.length + 1;
            query += ` AND LOWER(pur.status) = LOWER($${paramIdx})`;
            countQuery += ` AND LOWER(status) = LOWER($${paramIdx})`;
            values.push(status);
        }

        query += ` ORDER BY pur.id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, values.length));
        const totalCount = parseInt(countRes.rows[0].count);

        const summaryRes = await pool.query(`
            SELECT 
                COALESCE(SUM(total_amount), 0) AS total_amount,
                COALESCE(SUM(paid_amount), 0) AS paid_amount,
                COALESCE(SUM(pending_amount), 0) AS pending_amount
            FROM purchases WHERE company_id = $1 AND is_deleted = FALSE
        `, [targetCompanyId]);

        const formatted = await Promise.all(rows.map(async (r) => {
            const itemsRes = await pool.query(`
                SELECT pd.*, p.name AS product_name, p.sku AS product_sku 
                FROM purchase_details pd
                LEFT JOIN products p ON pd.product_id = p.id
                WHERE pd.purchase_id = $1
            `, [r.id]);

            return {
                id: r.id,
                companyId: r.company_id,
                billNumber: r.bill_number,
                poNumber: r.po_number || '',
                vendorId: r.vendor_id,
                vendorName: r.vendor_name || 'Unassigned Vendor',
                vendorPhone: r.vendor_phone || '',
                purchaseType: r.purchase_type,
                dispatchTo: r.dispatch_to,
                supplierInvoiceDate: r.supplier_invoice_date,
                paymentDate: r.payment_date,
                reference: r.reference,
                vehicleNo: r.vehicle_no,
                salesPerson: r.sales_person,
                dlNo: r.dl_no,
                totalAmount: parseFloat(r.total_amount || 0),
                paidAmount: parseFloat(r.paid_amount || 0),
                pendingAmount: parseFloat(r.pending_amount || 0),
                status: r.status,
                paymentMode: r.payment_mode,
                notes: r.notes || '',
                terms: r.terms || '',
                signatureName: r.signature_name || '',
                createdAt: r.created_at,
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

        return res.status(200).json({
            success: true,
            totalCount,
            summary: summaryRes.rows[0],
            data: formatted
        });
    } catch (err) {
        console.error('❌ Error fetching purchases:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const getPurchaseOrderByPoNo = async (req, res) => {
    try {
        const { poNumber } = req.params;
        const poRes = await pool.query(`
            SELECT po.*, v.name AS vendor_name, v.id AS vendor_id 
            FROM purchase_orders po
            LEFT JOIN vendors v ON po.vendor_id = v.id
            WHERE po.po_number ILIKE $1 AND po.is_deleted = FALSE
        `, [poNumber]);

        if (poRes.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Purchase Order not found.' });
        }

        const po = poRes.rows[0];
        const detailsRes = await pool.query(`
            SELECT pod.*, p.name AS product_name 
            FROM purchase_order_details pod
            LEFT JOIN products p ON pod.product_id = p.id
            WHERE pod.purchase_order_id = $1
        `, [po.id]);

        return res.status(200).json({
            success: true,
            data: {
                poNumber: po.po_number,
                vendorId: po.vendor_id,
                vendorSearchName: po.vendor_name,
                items: detailsRes.rows.map(d => ({
                    productId: d.product_id,
                    productSearchName: d.product_name,
                    quantity: d.quantity,
                    unitPrice: d.unit_price,
                    lineTotal: d.line_total
                }))
            }
        });
    } catch (err) {
        console.error('❌ Error fetching PO by number:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const addPurchase = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            companyId, billNumber, poNumber, vendorId, purchaseType, dispatchTo,
            supplierInvoiceDate, paymentDate, reference, vehicleNo, salesPerson, dlNo,
            status, paymentMode, notes, terms, signatureName, items, paidAmount = 0
        } = req.body;

        const targetCompanyId = companyId || 1;
        const generatedBillNo = billNumber || `PINV-${Math.floor(1000 + Math.random() * 9000)}`;
        const currentDate = supplierInvoiceDate || new Date().toISOString().split('T')[0];

        const whRes = await client.query(`
            SELECT id FROM warehouses WHERE company_id = $1 ORDER BY id ASC LIMIT 1;
        `, [targetCompanyId]);
        const primaryWarehouseId = whRes.rows.length > 0 ? whRes.rows[0].id : null;

        let totalAmount = 0;
        if (items && items.length > 0) {
            totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)), 0);
        }

        const paid = parseFloat(paidAmount || 0);
        const pending = Math.max(0, totalAmount - paid);
        const billStatus = paid >= totalAmount ? 'paid' : (status || 'pending');

        const purQuery = `
            INSERT INTO purchases (
                company_id, bill_number, po_number, vendor_id, purchase_type, dispatch_to,
                supplier_invoice_date, payment_date, reference, vehicle_no, sales_person, dl_no,
                total_amount, paid_amount, pending_amount, status, payment_mode, notes, terms, signature_name
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *;
        `;

        const purValues = [
            targetCompanyId, generatedBillNo, poNumber || null, vendorId ? parseInt(vendorId) : null,
            purchaseType || 'Regular', dispatchTo || null, currentDate,
            paymentDate || currentDate, reference || null, vehicleNo || null, salesPerson || null, dlNo || null,
            totalAmount, paid, pending, billStatus, paymentMode || 'UPI', notes || '', terms || '', signatureName || ''
        ];

        const purRes = await client.query(purQuery, purValues);
        const newPurId = purRes.rows[0].id;

        if (items && items.length > 0) {
            for (let idx = 0; idx < items.length; idx++) {
                const item = items[idx];
                const qty = parseFloat(item.quantity || 1);
                const price = parseFloat(item.unitPrice || 0);
                const lineTotal = qty * price;
                const prodId = item.productId ? parseInt(item.productId) : null;

                await client.query(`
                    INSERT INTO purchase_details (purchase_id, product_id, quantity, unit_price, line_total)
                    VALUES ($1, $2, $3, $4, $5);
                `, [newPurId, prodId, qty, price, lineTotal]);

                if (prodId) {
                    const uniqueTransactionId = `STK-IN-${generatedBillNo}-${idx + 1}`;
                    await client.query(`
                        INSERT INTO stocks (
                            stock_date, company_id, warehouse_id, product_id, transaction_id, transaction_date, 
                            transaction_type, quantity_in, quantity_out, issue_date, status, remarks, user_id
                        ) VALUES ($1, $2, $3, $4, $5, $6, 'Stock In', $7, 0.00, $8, 'Active', $9, $10);
                    `, [
                        currentDate, 
                        targetCompanyId, 
                        primaryWarehouseId, 
                        prodId, 
                        uniqueTransactionId, 
                        currentDate, 
                        qty, 
                        currentDate, 
                        `Stock In via Purchase Bill: ${generatedBillNo}`, 
                        'Admin'
                    ]);
                }
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Purchase Bill created & stock-in logged successfully', data: purRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding purchase bill:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const updatePurchase = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            companyId, billNumber, poNumber, vendorId, purchaseType, dispatchTo,
            supplierInvoiceDate, paymentDate, reference, vehicleNo, salesPerson, dlNo,
            status, paymentMode, notes, terms, signatureName, items, paidAmount = 0
        } = req.body;

        const targetCompanyId = companyId || 1;
        const currentDate = supplierInvoiceDate || new Date().toISOString().split('T')[0];

        const whRes = await client.query(`
            SELECT id FROM warehouses WHERE company_id = $1 ORDER BY id ASC LIMIT 1;
        `, [targetCompanyId]);
        const primaryWarehouseId = whRes.rows.length > 0 ? whRes.rows[0].id : null;

        let totalAmount = 0;
        if (items && items.length > 0) {
            totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.quantity || 1) * parseFloat(item.unitPrice || 0)), 0);
        }

        const paid = parseFloat(paidAmount || 0);
        const pending = Math.max(0, totalAmount - paid);
        const billStatus = paid >= totalAmount ? 'paid' : (status || 'pending');

        const updateQuery = `
            UPDATE purchases 
            SET bill_number = COALESCE($1, bill_number),
                po_number = COALESCE($2, po_number),
                vendor_id = COALESCE($3, vendor_id),
                purchase_type = COALESCE($4, purchase_type),
                dispatch_to = COALESCE($5, dispatch_to),
                supplier_invoice_date = COALESCE($6, supplier_invoice_date),
                payment_date = COALESCE($7, payment_date),
                reference = COALESCE($8, reference),
                vehicle_no = COALESCE($9, vehicle_no),
                sales_person = COALESCE($10, sales_person),
                dl_no = COALESCE($11, dl_no),
                total_amount = COALESCE($12, total_amount),
                paid_amount = COALESCE($13, paid_amount),
                pending_amount = COALESCE($14, pending_amount),
                status = COALESCE($15, status),
                payment_mode = COALESCE($16, payment_mode),
                notes = COALESCE($17, notes),
                terms = COALESCE($18, terms),
                signature_name = COALESCE($19, signature_name),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $20
            RETURNING *;
        `;

        const values = [
            billNumber, poNumber, vendorId ? parseInt(vendorId) : null, purchaseType, dispatchTo,
            supplierInvoiceDate, paymentDate, reference, vehicleNo, salesPerson, dlNo,
            totalAmount, paid, pending, billStatus, paymentMode, notes, terms, signatureName, id
        ];

        const purRes = await client.query(updateQuery, values);
        if (purRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Purchase Bill not found.' });
        }

        // Refresh line items
        await client.query('DELETE FROM purchase_details WHERE purchase_id = $1;', [id]);

        if (items && items.length > 0) {
            for (let idx = 0; idx < items.length; idx++) {
                const item = items[idx];
                const qty = parseFloat(item.quantity || 1);
                const price = parseFloat(item.unitPrice || 0);
                const lineTotal = qty * price;
                const prodId = item.productId ? parseInt(item.productId) : null;

                await client.query(`
                    INSERT INTO purchase_details (purchase_id, product_id, quantity, unit_price, line_total)
                    VALUES ($1, $2, $3, $4, $5);
                `, [id, prodId, qty, price, lineTotal]);

                if (prodId) {
                    const uniqueTransactionId = `STK-IN-${billNumber}-${idx + 1}`;
                    
                    // Check if stock entry already exists for this bill & product. If so, UPDATE it. Otherwise, INSERT.
                    const existingStock = await client.query(`
                        SELECT id FROM stocks WHERE transaction_id = $1 AND product_id = $2;
                    `, [uniqueTransactionId, prodId]);

                    if (existingStock.rows.length > 0) {
                        await client.query(`
                            UPDATE stocks 
                            SET quantity_in = $1, stock_date = $2, transaction_date = $3, updated_at = CURRENT_TIMESTAMP
                            WHERE transaction_id = $4 AND product_id = $5;
                        `, [qty, currentDate, currentDate, uniqueTransactionId, prodId]);
                    } else {
                        await client.query(`
                            INSERT INTO stocks (
                                stock_date, company_id, warehouse_id, product_id, transaction_id, transaction_date, 
                                transaction_type, quantity_in, quantity_out, issue_date, status, remarks, user_id
                            ) VALUES ($1, $2, $3, $4, $5, $6, 'Stock In', $7, 0.00, $8, 'Active', $9, $10);
                        `, [
                            currentDate, 
                            targetCompanyId, 
                            primaryWarehouseId, 
                            prodId, 
                            uniqueTransactionId, 
                            currentDate, 
                            qty, 
                            currentDate, 
                            `Stock In via Purchase Bill: ${billNumber}`, 
                            'Admin'
                        ]);
                    }
                }
            }
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Purchase Bill updated & existing stocks updated successfully', data: purRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating purchase bill:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('UPDATE purchases SET is_deleted = TRUE WHERE id = $1 RETURNING *;', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Purchase Bill not found.' });
        return res.status(200).json({ success: true, message: 'Purchase Bill removed successfully.' });
    } catch (err) {
        console.error('❌ Error deleting purchase bill:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};