import pool from '../../db.js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
export const getStocks = async (req, res) => {
    try {
        const { companyId, search, status, transactionType, warehouseId, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = `
            SELECT s.*, p.name AS product_name, p.sku AS product_sku, w.name AS warehouse_name
            FROM stocks s 
            LEFT JOIN products p ON s.product_id = p.id 
            LEFT JOIN warehouses w ON s.warehouse_id = w.id
            WHERE s.company_id = $1 AND s.is_deleted = FALSE
        `;
        let countQuery = 'SELECT COUNT(*) FROM stocks WHERE company_id = $1 AND is_deleted = FALSE';
        let values = [targetCompanyId];

        if (search && search.trim() !== '') {
            const paramIdx = values.length + 1;
            query += ` AND (s.transaction_id ILIKE $${paramIdx} OR s.remarks ILIKE $${paramIdx} OR p.name ILIKE $${paramIdx} OR w.name ILIKE $${paramIdx})`;
            countQuery += ` AND (transaction_id ILIKE $${paramIdx} OR remarks ILIKE $${paramIdx})`;
            values.push(`%${search.trim()}%`);
        }

        if (status && status !== 'All') {
            const paramIdx = values.length + 1;
            query += ` AND s.status = $${paramIdx}`;
            countQuery += ` AND status = $${paramIdx}`;
            values.push(status);
        }

        if (transactionType && transactionType !== 'All') {
            const paramIdx = values.length + 1;
            query += ` AND s.transaction_type = $${paramIdx}`;
            countQuery += ` AND transaction_type = $${paramIdx}`;
            values.push(transactionType);
        }

        if (warehouseId && warehouseId !== 'All') {
            const paramIdx = values.length + 1;
            query += ` AND s.warehouse_id = $${paramIdx}`;
            countQuery += ` AND warehouse_id = $${paramIdx}`;
            values.push(parseInt(warehouseId));
        }

        query += ` ORDER BY s.id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, values.length));
        const totalCount = parseInt(countRes.rows[0].count);

        const formatted = rows.map(r => ({
            id: r.id,
            stockDate: r.stock_date,
            companyId: r.company_id,
            productId: r.product_id,
            productName: r.product_name || 'General Item',
            productSku: r.product_sku || '-',
            warehouseId: r.warehouse_id,
            warehouseName: r.warehouse_name || 'Main Warehouse',
            transactionId: r.transaction_id,
            transactionDate: r.transaction_date,
            transactionType: r.transaction_type,
            quantityIn: parseFloat(r.quantity_in || 0),
            quantityOut: parseFloat(r.quantity_out || 0),
            issueDate: r.issue_date,
            status: r.status,
            remarks: r.remarks || '',
            userId: r.user_id || 'Admin',
            createdAt: r.created_at
        }));

        return res.status(200).json({
            success: true,
            totalCount,
            data: formatted
        });
    } catch (err) {
        console.error('❌ Error fetching stocks:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const getStockById = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query(`
            SELECT s.*, p.name AS product_name, p.sku AS product_sku, w.name AS warehouse_name
            FROM stocks s 
            LEFT JOIN products p ON s.product_id = p.id 
            LEFT JOIN warehouses w ON s.warehouse_id = w.id
            WHERE s.id = $1 AND s.is_deleted = FALSE
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Stock transaction not found.' });
        }

        const r = rows[0];
        const formatted = {
            id: r.id,
            stockDate: r.stock_date,
            companyId: r.company_id,
            productId: r.product_id,
            productName: r.product_name || 'General Item',
            productSku: r.product_sku || '-',
            warehouseId: r.warehouse_id,
            warehouseName: r.warehouse_name || 'Main Warehouse',
            transactionId: r.transaction_id,
            transactionDate: r.transaction_date,
            transactionType: r.transaction_type,
            quantityIn: parseFloat(r.quantity_in || 0),
            quantityOut: parseFloat(r.quantity_out || 0),
            issueDate: r.issue_date,
            status: r.status,
            remarks: r.remarks || '',
            userId: r.user_id || 'Admin'
        };

        return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching stock by ID:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const addStock = async (req, res) => {
    try {
        const {
            stockDate, companyId, productId, warehouseId, transactionId, transactionDate,
            transactionType, quantityIn, quantityOut, issueDate, status, remarks, userId
        } = req.body;

        const targetCompanyId = companyId || 1;
        const generatedTxnId = transactionId || `TXN-${Math.floor(1000 + Math.random() * 9000)}`;

        const query = `
            INSERT INTO stocks (
                stock_date, company_id, product_id, warehouse_id, transaction_id, transaction_date,
                transaction_type, quantity_in, quantity_out, issue_date, status, remarks, user_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *;
        `;

        const values = [
            stockDate || new Date(), targetCompanyId, productId || null, warehouseId ? parseInt(warehouseId) : null,
            generatedTxnId, transactionDate || new Date(), transactionType || 'Stock Out',
            quantityIn || 0, quantityOut || 0, issueDate || new Date(),
            status || 'Active', remarks || '', userId || 'Admin'
        ];

        const { rows } = await pool.query(query, values);
        return res.status(201).json({ success: true, message: 'Stock transaction created successfully', data: rows[0] });
    } catch (err) {
        console.error('❌ Error adding stock:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};

export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            stockDate, productId, warehouseId, transactionDate, transactionType,
            quantityIn, quantityOut, issueDate, status, remarks, userId
        } = req.body;

        const query = `
            UPDATE stocks 
            SET stock_date = COALESCE($1, stock_date),
                product_id = COALESCE($2, product_id),
                warehouse_id = COALESCE($3, warehouse_id),
                transaction_date = COALESCE($4, transaction_date),
                transaction_type = COALESCE($5, transaction_type),
                quantity_in = COALESCE($6, quantity_in),
                quantity_out = COALESCE($7, quantity_out),
                issue_date = COALESCE($8, issue_date),
                status = COALESCE($9, status),
                remarks = COALESCE($10, remarks),
                user_id = COALESCE($11, user_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $12
            RETURNING *;
        `;

        const values = [
            stockDate, productId, warehouseId ? parseInt(warehouseId) : null, transactionDate, transactionType,
            quantityIn, quantityOut, issueDate, status, remarks, userId, id
        ];

        const { rows } = await pool.query(query, values);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Transaction not found.' });

        return res.status(200).json({ success: true, message: 'Stock updated successfully', data: rows[0] });
    } catch (err) {
        console.error('❌ Error updating stock:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
};

export const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('UPDATE stocks SET is_deleted = TRUE WHERE id = $1 RETURNING *;', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Transaction not found.' });
        return res.status(200).json({ success: true, message: 'Stock transaction removed successfully.' });
    } catch (err) {
        console.error('❌ Error deleting stock:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const uploadStocksCsv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a CSV file.' });
        }

        const fileContent = fs.readFileSync(req.file.path);
        const records = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        let insertedCount = 0;
        const companyId = req.body.companyId || 1;

        for (const r of records) {
            const txnId = r.transaction_id || `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
            await pool.query(`
                INSERT INTO stocks (
                    stock_date, company_id, product_id, warehouse_id, transaction_id, transaction_date,
                    transaction_type, quantity_in, quantity_out, issue_date, status, remarks, user_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (transaction_id) DO NOTHING;
            `, [
                r.stock_date || new Date(),
                companyId,
                r.product_id ? parseInt(r.product_id) : null,
                r.warehouse_id ? parseInt(r.warehouse_id) : null,
                txnId,
                r.transaction_date || new Date(),
                r.transaction_type || 'Stock Out',
                parseFloat(r.quantity_in || 0),
                parseFloat(r.quantity_out || 1),
                r.issue_date || new Date(),
                r.status || 'Active',
                r.remarks || 'CSV Uploaded',
                r.user_id || 'Admin'
            ]);
            insertedCount++;
        }

        fs.unlinkSync(req.file.path);

        return res.status(200).json({ success: true, message: `Successfully imported ${insertedCount} stock records from CSV.` });
    } catch (err) {
        console.error('❌ Error importing CSV stocks:', err);
        return res.status(500).json({ success: false, error: err.message || 'Failed to parse CSV file.' });
    }
};

// Product Group-wise Stock Summary Endpoint
export const getStockSummary = async (req, res) => {
    try {
        const { companyId } = req.query;
        const targetCompanyId = companyId || 1;

        const query = `
            SELECT 
                COALESCE(p.id, 0) AS product_id,
                COALESCE(p.name, 'Unassigned Item') AS product_name,
                COALESCE(p.sku, 'N/A') AS product_sku,
                COALESCE(p.category, 'Finish') AS category,
                COALESCE(SUM(s.quantity_in), 0) AS total_stock_in,
                COALESCE(SUM(s.quantity_out), 0) AS total_stock_out,
                (COALESCE(SUM(s.quantity_in), 0) - COALESCE(SUM(s.quantity_out), 0)) AS balance,
                COALESCE(SUM(s.quantity_in * COALESCE(p.purchase_price, 0)), 0) AS purchase_amount,
                COALESCE(SUM(s.quantity_out * COALESCE(p.selling_price, 0)), 0) AS sales_amount
            FROM stocks s
            LEFT JOIN products p ON s.product_id = p.id
            WHERE s.company_id = $1 AND s.is_deleted = FALSE
            GROUP BY p.id, p.name, p.sku, p.category
            ORDER BY product_name ASC;
        `;

        const { rows } = await pool.query(query, [targetCompanyId]);
        const formatted = rows.map(r => ({
            productId: r.product_id,
            productName: r.product_name,
            productSku: r.product_sku,
            category: r.category,
            totalStockIn: parseFloat(r.total_stock_in),
            totalStockOut: parseFloat(r.total_stock_out),
            balance: parseFloat(r.balance),
            purchaseAmount: parseFloat(r.purchase_amount),
            salesAmount: parseFloat(r.sales_amount)
        }));

        return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching stock summary:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};