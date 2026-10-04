import pool from '../../db.js';

// Get preferences for the current active company
export const getPreferences = async (req, res) => {
    try {
        const { companyId } = req.query; // Or get from active session/default company
        const query = `
            SELECT * FROM company_preferences 
            WHERE company_id = $1 OR company_id IS NULL 
            ORDER BY id DESC LIMIT 1
        `;
        const { rows } = await pool.query(query, [companyId || 1]);

        if (rows.length === 0) {
            return res.status(200).json({
                roundOff: true,
                extraDiscountType: 'Percent',
                showSuggestions: true,
                defaultDueDate: 'Same Day',
                discountType: 'Total Amount',
                sortTransactionsBy: 'Created Date',
                sendSmsToCustomer: false,
                mandatoryRemarksOnCancellation: false,
                addQuantityManuallyOnBarcode: false,
                documentPdfFilename: '{document_title}_{serial_number}',
                ledgerPdfFilename: '{ledger_type}_Ledger_{party_name}',
            });
        }

        const r = rows[0];
        return res.status(200).json({
            roundOff: r.round_off,
            extraDiscountType: r.extra_discount_type,
            showSuggestions: r.show_suggestions,
            defaultDueDate: r.default_due_date,
            discountType: r.discount_type,
            sortTransactionsBy: r.sort_transactions_by,
            sendSmsToCustomer: r.send_sms_to_customer,
            mandatoryRemarksOnCancellation: r.mandatory_remarks_on_cancellation,
            addQuantityManuallyOnBarcode: r.add_quantity_manually_on_barcode,
            documentPdfFilename: r.document_pdf_filename,
            ledgerPdfFilename: r.ledger_pdf_filename,
        });
    } catch (err) {
        console.error('❌ Error fetching preferences:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Save or Update Preferences (Upsert)
export const updatePreferences = async (req, res) => {
    try {
        const {
            companyId,
            roundOff,
            extraDiscountType,
            showSuggestions,
            defaultDueDate,
            discountType,
            sortTransactionsBy,
            sendSmsToCustomer,
            mandatoryRemarksOnCancellation,
            addQuantityManuallyOnBarcode,
            documentPdfFilename,
            ledgerPdfFilename,
        } = req.body;

        const targetCompanyId = companyId || 1;

        // Check if preferences row exists for this company
        const checkQuery = 'SELECT id FROM company_preferences WHERE company_id = $1';
        const existing = await pool.query(checkQuery, [targetCompanyId]);

        let query = '';
        let values = [
            roundOff,
            extraDiscountType,
            showSuggestions,
            defaultDueDate,
            discountType,
            sortTransactionsBy,
            sendSmsToCustomer,
            mandatoryRemarksOnCancellation,
            addQuantityManuallyOnBarcode,
            documentPdfFilename,
            ledgerPdfFilename,
            targetCompanyId
        ];

        if (existing.rows.length > 0) {
            query = `
                UPDATE company_preferences 
                SET 
                    round_off = $1, extra_discount_type = $2, show_suggestions = $3, 
                    default_due_date = $4, discount_type = $5, sort_transactions_by = $6, 
                    send_sms_to_customer = $7, mandatory_remarks_on_cancellation = $8, 
                    add_quantity_manually_on_barcode = $9, document_pdf_filename = $10, 
                    ledger_pdf_filename = $11, updated_at = CURRENT_TIMESTAMP
                WHERE company_id = $12
                RETURNING *;
            `;
        } else {
            query = `
                INSERT INTO company_preferences 
                (
                    round_off, extra_discount_type, show_suggestions, default_due_date, 
                    discount_type, sort_transactions_by, send_sms_to_customer, 
                    mandatory_remarks_on_cancellation, add_quantity_manually_on_barcode, 
                    document_pdf_filename, ledger_pdf_filename, company_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *;
            `;
        }

        const { rows } = await pool.query(query, values);
        return res.status(200).json({
            success: true,
            message: 'Preferences updated successfully!',
            data: rows[0]
        });
    } catch (err) {
        console.error('❌ Error updating preferences:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};