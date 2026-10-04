import pool from '../../db.js';

export const getCategories = async (req, res) => {
    console.log('📥 GET /api/categories request received. Query params:', req.query);
    try {
        const { companyId } = req.query;
        const targetCompId = companyId || 1;
        console.log(`🔍 Querying categories from database for company_id: ${targetCompId}`);

        // Safe query that avoids missing column errors
        const query = `
            SELECT c.*, 
                   (SELECT COUNT(*) FROM products p WHERE p.category = c.name AND p.company_id = c.company_id) AS total_items
            FROM categories c
            WHERE c.company_id = $1
            ORDER BY c.id DESC;
        `;
        const { rows } = await pool.query(query, [targetCompId]);
        console.log(`✅ Successfully fetched ${rows.length} categories for company_id: ${targetCompId}`);
        
        res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('❌ Error fetching categories:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const createCategory = async (req, res) => {
    console.log('📤 POST /api/categories request received. Request Body:', req.body);
    try {
        const { companyId, categoryType, name, description, showInOnlineStore, imageUrl } = req.body;
        const targetCompId = companyId || 1;

        if (!name) {
            console.warn('⚠️ Category creation rejected: Category name is missing.');
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        console.log(`💾 Inserting new category "${name}" (Type: ${categoryType || 'Parent Category'}) for company_id: ${targetCompId}`);
        
        const query = `
            INSERT INTO categories (company_id, category_type, name, description, show_in_online_store, image_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [targetCompId, categoryType || 'Parent Category', name, description || '', showInOnlineStore ?? true, imageUrl || null];

        const { rows } = await pool.query(query, values);
        console.log('✅ Category successfully created in database:', rows[0]);

        res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('❌ Error creating category in database:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};

export const deleteCategory = async (req, res) => {
    console.log(`🗑️ DELETE /api/categories/${req.params.id} request received.`);
    try {
        const { id } = req.params;
        const query = `DELETE FROM categories WHERE id = $1 RETURNING *;`;
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        console.log(`✅ Category deleted successfully:`, rows[0]);
        res.status(200).json({ success: true, message: 'Category deleted successfully', data: rows[0] });
    } catch (err) {
        console.error('❌ Error deleting category:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
};