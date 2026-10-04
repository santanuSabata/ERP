import pool from '../../db.js';

export const getProducts = async (req, res) => {
    try {
        const { companyId, tab = 'Items', search, category, page = 1, limit = 10 } = req.query;
        const targetCompanyId = companyId || 1;
        const offset = (page - 1) * limit;

        let query = 'SELECT * FROM products WHERE company_id = $1';
        let countQuery = 'SELECT COUNT(*) FROM products WHERE company_id = $1';
        let values = [targetCompanyId];

        if (tab === 'Deleted') {
            query += ' AND is_deleted = TRUE';
            countQuery += ' AND is_deleted = TRUE';
        } else {
            query += ' AND is_deleted = FALSE';
            countQuery += ' AND is_deleted = FALSE';
        }

        if (search && search.trim() !== '') {
            query += ' AND (name ILIKE $2 OR sku ILIKE $2 OR barcode ILIKE $2 OR category ILIKE $2)';
            countQuery += ' AND (name ILIKE $2 OR sku ILIKE $2 OR barcode ILIKE $2 OR category ILIKE $2)';
            values.push(`%${search.trim()}%`);
        }

        if (category && category !== 'All' && category !== 'Select Category') {
            const paramIdx = values.length + 1;
            query += ` AND category = $${paramIdx}`;
            countQuery += ` AND category = $${paramIdx}`;
            values.push(category);
        }

        query += ` ORDER BY id DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        const { rows } = await pool.query(query, values);
        const countRes = await pool.query(countQuery, values.slice(0, values.length > 1 && category ? 2 : (search ? 2 : 1)));
        const totalCount = parseInt(countRes.rows[0].count);

        const formatted = rows.map(r => ({
            id: r.id,
            companyId: r.company_id,
            name: r.name,
            itemType: r.item_type || 'Product',
            category: r.category || '',
            sku: r.sku || '',
            barcode: r.barcode || '',
            hsnSac: r.hsn_sac || '',
            primaryUnit: r.primary_unit || 'BOX',
            sellingPrice: parseFloat(r.selling_price || 0),
            sellingPriceType: r.selling_price_type || 'with Tax',
            taxPercentage: String(r.tax_percentage || '0'),
            purchasePrice: parseFloat(r.purchase_price || 0),
            purchasePriceType: r.purchase_price_type || 'with Tax',
            quantity: parseFloat(r.quantity || 0),
            openingPurchasePrice: parseFloat(r.opening_purchase_price || 0),
            openingStockValue: parseFloat(r.opening_stock_value || 0),
            description: r.description || '',
            createdBy: r.created_by || 'Raj S',
            createdAt: r.created_at,
            isDeleted: r.is_deleted
        }));

        return res.status(200).json({
            success: true,
            totalCount,
            data: formatted
        });
    } catch (err) {
        console.error('❌ Error fetching products:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM products WHERE id = $1 AND is_deleted = FALSE';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        const r = rows[0];
        const formatted = {
            id: r.id,
            companyId: r.company_id,
            name: r.name,
            itemType: r.item_type || 'Product',
            category: r.category || '',
            sku: r.sku || '',
            barcode: r.barcode || '',
            hsnSac: r.hsn_sac || '',
            primaryUnit: r.primary_unit || 'BOX',
            sellingPrice: r.selling_price || '',
            sellingPriceType: r.selling_price_type || 'with Tax',
            taxPercentage: String(r.tax_percentage || '0'),
            purchasePrice: r.purchase_price || '',
            purchasePriceType: r.purchase_price_type || 'with Tax',
            quantity: r.quantity || 0,
            openingPurchasePrice: r.opening_purchase_price || 0,
            openingStockValue: r.opening_stock_value || 0,
            description: r.description || ''
        };

        return res.status(200).json({ success: true, data: formatted });
    } catch (err) {
        console.error('❌ Error fetching single product:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Fetch images for a product from product_images table
export const getProductImages = async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at DESC', [id]);
        return res.status(200).json({ success: true, images: rows });
    } catch (err) {
        console.error('❌ Error fetching product images:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a single image from product_images table
export const deleteProductImage = async (req, res) => {
    try {
        const { imageId } = req.params;
        const { rows } = await pool.query('DELETE FROM product_images WHERE id = $1 RETURNING *', [imageId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Image not found.' });
        return res.status(200).json({ success: true, message: 'Image deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting product image:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const addProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const {
            companyId, name, itemType, category, categoryId, sku, barcode, hsnSac, primaryUnit,
            sellingPrice, sellingPriceType, taxPercentage, purchasePrice, purchasePriceType,
            quantity, openingPurchasePrice, openingStockValue, description, createdBy
        } = req.body;

        const targetCompanyId = companyId || 1;
        const sanitizedCategoryId = categoryId === '' || categoryId === undefined ? null : categoryId;

        const query = `
            INSERT INTO products (
                company_id, name, item_type, category, category_id, sku, barcode, hsn_sac, primary_unit,
                selling_price, selling_price_type, tax_percentage, purchase_price, purchase_price_type,
                quantity, opening_purchase_price, opening_stock_value, description, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *;
        `;

        const values = [
            targetCompanyId, name, itemType || 'Product', category || '', sanitizedCategoryId, sku || '', barcode || '', hsnSac || '', primaryUnit || 'BOX',
            sellingPrice || 0, sellingPriceType || 'with Tax', taxPercentage || 0, purchasePrice || 0, purchasePriceType || 'with Tax',
            quantity || 0, openingPurchasePrice || 0, openingStockValue || 0, description || '', createdBy || 'Raj S'
        ];

        const { rows } = await client.query(query, values);
        const newProductId = rows[0].id;

        // Insert uploaded files into product_images schema table if present
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = `/uploads/${file.filename}`;
                await client.query(
                    'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
                    [newProductId, imageUrl]
                );
            }
        }

        await client.query('COMMIT');
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding product:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const updateProduct = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const {
            name, itemType, category, categoryId, sku, barcode, hsnSac, primaryUnit,
            sellingPrice, sellingPriceType, taxPercentage, purchasePrice, purchasePriceType,
            quantity, openingPurchasePrice, openingStockValue, description
        } = req.body;

        const sanitizedCategoryId = categoryId === '' || categoryId === undefined || categoryId === 'null' ? null : categoryId;

        const query = `
            UPDATE products 
            SET name = COALESCE($1, name),
                item_type = COALESCE($2, item_type),
                category = COALESCE($3, category),
                category_id = COALESCE($4, category_id),
                sku = COALESCE($5, sku),
                barcode = COALESCE($6, barcode),
                hsn_sac = COALESCE($7, hsn_sac),
                primary_unit = COALESCE($8, primary_unit),
                selling_price = COALESCE($9, selling_price),
                selling_price_type = COALESCE($10, selling_price_type),
                tax_percentage = COALESCE($11, tax_percentage),
                purchase_price = COALESCE($12, purchase_price),
                purchase_price_type = COALESCE($13, purchase_price_type),
                quantity = COALESCE($14, quantity),
                opening_purchase_price = COALESCE($15, opening_purchase_price),
                opening_stock_value = COALESCE($16, opening_stock_value),
                description = COALESCE($17, description),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $18
            RETURNING *;
        `;

        const values = [
            name || null, itemType || null, category || null, sanitizedCategoryId, sku || null, 
            barcode || null, hsnSac || null, primaryUnit || null, sellingPrice || null, 
            sellingPriceType || null, taxPercentage || null, purchasePrice || null, 
            purchasePriceType || null, quantity || null, openingPurchasePrice || null, 
            openingStockValue || null, description || null, id
        ];

        const { rows } = await client.query(query, values);
        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found.' });
        }

        // Safely insert new uploaded images into product_images table if present
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = `/uploads/${file.filename}`;
                await client.query(
                    'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
                    [id, imageUrl]
                );
            }
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating product:', err);
        return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE products SET is_deleted = TRUE WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
        return res.status(200).json({ success: true, message: 'Product moved to deleted.' });
    } catch (err) {
        console.error('❌ Error deleting product:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const setPrimaryProductImage = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { productId, imageId } = req.params;

        // 1. Set all images for this product to false
        await client.query('UPDATE product_images SET is_primary = FALSE WHERE product_id = $1', [productId]);

        // 2. Set the selected image to true
        const { rows } = await client.query(
            'UPDATE product_images SET is_primary = TRUE WHERE id = $1 AND product_id = $2 RETURNING *',
            [imageId, productId]
        );

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Image not found.' });
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, message: 'Primary image updated successfully.', data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error setting primary image:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};