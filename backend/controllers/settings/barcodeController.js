import pool from '../../db.js';

// Get barcode settings for the active company
export const getBarcodeSettings = async (req, res) => {
    try {
        const { companyId } = req.query;
        const targetCompanyId = companyId || 1;

        const query = 'SELECT * FROM barcode_settings WHERE company_id = $1 ORDER BY id DESC LIMIT 1';
        const { rows } = await pool.query(query, [targetCompanyId]);

        if (rows.length === 0) {
            return res.status(200).json({
                packageDate: true,
                priceWithTax: true,
                mrpLabelEnabled: true,
                mrpLabelText: 'MRP',
                mrpFontSize: 16,
                productNameFontSize: 16,
                barcodeLength: 10,
            });
        }

        const r = rows[0];
        return res.status(200).json({
            id: r.id,
            companyId: r.company_id,
            packageDate: r.package_date,
            priceWithTax: r.price_with_tax,
            mrpLabelEnabled: r.mrp_label_enabled,
            mrpLabelText: r.mrp_label_text || 'MRP',
            mrpFontSize: r.mrp_font_size || 16,
            productNameFontSize: r.product_name_font_size || 16,
            barcodeLength: r.barcode_length || 10,
        });
    } catch (err) {
        console.error('❌ Error fetching barcode settings:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Save or Update Barcode Settings (Upsert)
export const saveBarcodeSettings = async (req, res) => {
    try {
        const {
            companyId,
            packageDate,
            priceWithTax,
            mrpLabelEnabled,
            mrpLabelText,
            mrpFontSize,
            productNameFontSize,
            barcodeLength,
        } = req.body;

        const targetCompanyId = companyId || 1;

        // Check if settings row exists for this company
        const checkQuery = 'SELECT id FROM barcode_settings WHERE company_id = $1';
        const existing = await pool.query(checkQuery, [targetCompanyId]);

        let query = '';
        let values = [
            packageDate,
            priceWithTax,
            mrpLabelEnabled,
            mrpLabelText || 'MRP',
            mrpFontSize || 16,
            productNameFontSize || 16,
            barcodeLength || 10,
            targetCompanyId
        ];

        if (existing.rows.length > 0) {
            query = `
                UPDATE barcode_settings 
                SET 
                    package_date = $1, 
                    price_with_tax = $2, 
                    mrp_label_enabled = $3, 
                    mrp_label_text = $4, 
                    mrp_font_size = $5, 
                    product_name_font_size = $6, 
                    barcode_length = $7, 
                    updated_at = CURRENT_TIMESTAMP
                WHERE company_id = $8
                RETURNING *;
            `;
        } else {
            query = `
                INSERT INTO barcode_settings 
                (
                    package_date, price_with_tax, mrp_label_enabled, 
                    mrp_label_text, mrp_font_size, product_name_font_size, 
                    barcode_length, company_id
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *;
            `;
        }

        const { rows } = await pool.query(query, values);
        return res.status(200).json({
            success: true,
            message: 'Barcode settings updated successfully!',
            data: rows[0]
        });
    } catch (err) {
        console.error('❌ Error saving barcode settings:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete / Reset Barcode Settings
export const deleteBarcodeSettings = async (req, res) => {
    try {
        const { companyId } = req.query;
        const targetCompanyId = companyId || 1;

        const query = 'DELETE FROM barcode_settings WHERE company_id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [targetCompanyId]);

        return res.status(200).json({
            success: true,
            message: 'Barcode settings reset successfully.',
            data: rows[0]
        });
    } catch (err) {
        console.error('❌ Error resetting barcode settings:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};