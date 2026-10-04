// quotationController.js
import pool from '../../db.js';

// Get all quotations with search, filters, pagination, and sorting
export const getQuotations = async (req, res) => {
    try {
        const { 
            companyId = 1, 
            search = '', 
            status = 'All', 
            page = 1, 
            limit = 10, 
            sortBy = 'quotation_date', 
            sortOrder = 'DESC' 
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        
        let queryParams = [companyId];
        let conditions = [`company_id = $1`, `is_deleted = FALSE`];

        if (status !== 'All') {
            // Map frontend plural tabs like 'Drafts' to single database state 'draft'
            let normalizedStatus = status.toLowerCase();
            if (normalizedStatus === 'drafts') normalizedStatus = 'draft';

            queryParams.push(normalizedStatus);
            conditions.push(`LOWER(status) = $${queryParams.length}`);
        }

        if (search) {
            queryParams.push(`%${search}%`);
            conditions.push(`(customer_name ILIKE $${queryParams.length} OR quotation_no ILIKE $${queryParams.length} OR reference_no ILIKE $${queryParams.length})`);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Whitelist allowed sort fields to prevent SQL injection
        const allowedSortFields = {
            'total_amount': 'total_amount',
            'quotation_no': 'quotation_no',
            'quotation_date': 'quotation_date'
        };
        const validSortField = allowedSortFields[sortBy] || 'quotation_date';
        const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Fetch paginated data
        const dataQuery = `
            SELECT * FROM quotations 
            ${whereClause} 
            ORDER BY ${validSortField} ${validSortOrder} 
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;
        
        const countQuery = `SELECT COUNT(*) FROM quotations ${whereClause}`;

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataQuery, [...queryParams, parseInt(limit), offset]),
            pool.query(countQuery, queryParams)
        ]);

        res.json({
            data: dataResult.rows,
            totalCount: parseInt(countResult.rows[0].count),
            currentPage: parseInt(page),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
        });
    } catch (err) {
        console.error('❌ Error fetching quotations:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get single quotation by ID including items
export const getQuotationById = async (req, res) => {
    try {
        const { id } = req.params;
        const quotationQuery = await pool.query('SELECT * FROM quotations WHERE id = $1 AND is_deleted = FALSE', [id]);
        
        if (quotationQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Quotation not found' });
        }

        const itemsQuery = await pool.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [id]);

        res.json({
            data: {
                ...quotationQuery.rows[0],
                items: itemsQuery.rows.map(i => ({
                    ...i,
                    description: i.product_desc // map back to frontend description state if needed
                }))
            }
        });
    } catch (err) {
        console.error('❌ Error fetching quotation details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create new quotation with items in a transaction
export const createQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const {
            companyId, quotationNo, quotetype, dispatchFrom, customerId, customerName,
            billingAddress, shippingAddress, quotationDate, validityDate, referenceNo,
            vehicleNo, salesPerson, dlNo, subtotal, totalDiscount, extraDiscountType,
            extraDiscountVal, totalAmount, roundOff, tcs, status, notes, termsConditions,
            selectedBank, selectedSignature, items
        } = req.body;

        const insertQuotationText = `
            INSERT INTO quotations (
                company_id, quotation_no, quotation_type, dispatch_from, customer_id, customer_name,
                billing_address, shipping_address, quotation_date, validity_date, reference_no,
                vehicle_no, sales_person, dl_no, subtotal, total_discount, extra_discount_type,
                extra_discount_val, total_amount, round_off, tcs, status, notes, terms_conditions,
                selected_bank, selected_signature
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            RETURNING id
        `;

        const quotationValues = [
            companyId || 1, quotationNo, quotetype || 'Regular', dispatchFrom || '', customerId || null, customerName,
            billingAddress || '', shippingAddress || '', quotationDate, validityDate || null, referenceNo || '',
            vehicleNo || '', salesPerson || '', dlNo || '', subtotal || 0, totalDiscount || 0, extraDiscountType || '%',
            extraDiscountVal || 0, totalAmount || 0, roundOff ?? true, tcs ?? false, status || 'open', notes || '', termsConditions || '',
            selectedBank || '', selectedSignature || ''
        ];

        const quotationResult = await client.query(insertQuotationText, quotationValues);
        const quotationId = quotationResult.rows[0].id;

        // Insert items using product_desc instead of description
        if (items && Array.isArray(items)) {
            for (const item of items) {
                const insertItemText = `
                    INSERT INTO quotation_items (
                        quotation_id, product_id, product_name, product_desc, quantity, unit_price, discount_percent, total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;
                await client.query(insertItemText, [
                    quotationId, item.productId || null, item.productName, item.product_desc || item.description || '',
                    item.quantity || 1, item.unitPrice || 0, item.discountPercent || 0, item.total || 0
                ]);
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Quotation created successfully', quotationId });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating quotation:', err);
        res.status(500).json({ error: 'Failed to create quotation' });
    } finally {
        client.release();
    }
};

// Update existing quotation and replace items
export const updateQuotation = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;

        const {
            quotationNo, quotetype, dispatchFrom, customerId, customerName,
            billingAddress, shippingAddress, quotationDate, validityDate, referenceNo,
            vehicleNo, salesPerson, dlNo, subtotal, totalDiscount, extraDiscountType,
            extraDiscountVal, totalAmount, roundOff, tcs, status, notes, termsConditions,
            selectedBank, selectedSignature, items
        } = req.body;

        const updateQuotationText = `
            UPDATE quotations SET 
                quotation_no = $1, quotation_type = $2, dispatch_from = $3, customer_id = $4, customer_name = $5,
                billing_address = $6, shipping_address = $7, quotation_date = $8, validity_date = $9, reference_no = $10,
                vehicle_no = $11, sales_person = $12, dl_no = $13, subtotal = $14, total_discount = $15, extra_discount_type = $16,
                extra_discount_val = $17, total_amount = $18, round_off = $19, tcs = $20, status = $21, notes = $22, terms_conditions = $23,
                selected_bank = $24, selected_signature = $25
            WHERE id = $26
        `;

        await client.query(updateQuotationText, [
            quotationNo, quotetype || 'Regular', dispatchFrom || '', customerId || null, customerName,
            billingAddress || '', shippingAddress || '', quotationDate, validityDate || null, referenceNo || '',
            vehicleNo || '', salesPerson || '', dlNo || '', subtotal || 0, totalDiscount || 0, extraDiscountType || '%',
            extraDiscountVal || 0, totalAmount || 0, roundOff ?? true, tcs ?? false, status || 'open', notes || '', termsConditions || '',
            selectedBank || '', selectedSignature || '', id
        ]);

        // Remove old items and re-insert updated items list
        await client.query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);

        if (items && Array.isArray(items)) {
            for (const item of items) {
                const insertItemText = `
                    INSERT INTO quotation_items (
                        quotation_id, product_id, product_name, product_desc, quantity, unit_price, discount_percent, total
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `;
                await client.query(insertItemText, [
                    id, item.productId || null, item.productName, item.product_desc || item.description || '',
                    item.quantity || 1, item.unitPrice || 0, item.discountPercent || 0, item.total || 0
                ]);
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Quotation updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating quotation:', err);
        res.status(500).json({ error: 'Failed to update quotation' });
    } finally {
        client.release();
    }
};

// Soft delete quotation
export const deleteQuotation = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE quotations SET is_deleted = TRUE WHERE id = $1', [id]);
        res.json({ message: 'Quotation deleted successfully' });
    } catch (err) {
        console.error('❌ Error deleting quotation:', err);
        res.status(500).json({ error: 'Failed to delete quotation' });
    }
};