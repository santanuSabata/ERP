import pool from '../../db.js';

const getTableConfig = (tab) => {
    switch (tab) {
        case 'pipeline': return { table: 'crm_pipelines', nameCol: 'name' };
        case 'lead-stages': return { table: 'crm_lead_stages', nameCol: 'name' };
        case 'deal-stages': return { table: 'crm_deal_stages', nameCol: 'name' };
        case 'sources': return { table: 'crm_sources', nameCol: 'name' };
        case 'labels': return { table: 'crm_labels', nameCol: 'name' };
        case 'contract-type': return { table: 'crm_contract_types', nameCol: 'name' };
        case 'products': return { table: 'crm_products', nameCol: 'name' };
        default: return null;
    }
};

export const getMetaItems = async (req, res) => {
    try {
        const { tab } = req.params;
        const { search, companyId = 1 } = req.query;
        const config = getTableConfig(tab);

        if (!config) {
            return res.status(400).json({ success: false, error: 'Invalid module tab specified.' });
        }

        let query = `SELECT * FROM ${config.table} WHERE company_id = $1 AND is_deleted = FALSE`;
        let values = [companyId];

        if (search && search.trim() !== '') {
            query += ` AND ${config.nameCol} ILIKE $2`;
            values.push(`%${search.trim()}%`);
        }

        query += ` ORDER BY display_order ASC, id DESC`;

        const { rows } = await pool.query(query, values);
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error(`❌ Error fetching CRM meta for ${req.params.tab}:`, err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const addMetaItem = async (req, res) => {
    try {
        const { tab } = req.params;
        const { name, display_order, companyId = 1 } = req.body;
        const config = getTableConfig(tab);

        if (!config) {
            return res.status(400).json({ success: false, error: 'Invalid module tab specified.' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, error: 'Name is required.' });
        }

        const query = `INSERT INTO ${config.table} (company_id, ${config.nameCol}, display_order) VALUES ($1, $2, $3) RETURNING *;`;
        const { rows } = await pool.query(query, [companyId, name.trim(), display_order || 1]);

        return res.status(201).json({ success: true, message: 'Created successfully', data: rows[0] });
    } catch (err) {
        console.error(`❌ Error adding CRM meta for ${req.params.tab}:`, err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const updateMetaItem = async (req, res) => {
    try {
        const { tab, id } = req.params;
        const { name } = req.body;
        const config = getTableConfig(tab);

        if (!config) {
            return res.status(400).json({ success: false, error: 'Invalid module tab specified.' });
        }

        const query = `UPDATE ${config.table} SET ${config.nameCol} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND is_deleted = FALSE RETURNING *;`;
        const { rows } = await pool.query(query, [name.trim(), id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }

        return res.status(200).json({ success: true, message: 'Updated successfully', data: rows[0] });
    } catch (err) {
        console.error(`❌ Error updating CRM meta for ${req.params.tab}:`, err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const reorderMetaItems = async (req, res) => {
    try {
        const { tab } = req.params;
        const { items } = req.body; // Expects array of { id, display_order }
        const config = getTableConfig(tab);

        if (!config || !Array.isArray(items)) {
            return res.status(400).json({ success: false, error: 'Invalid payload structure.' });
        }

        for (const item of items) {
            await pool.query(`UPDATE ${config.table} SET display_order = $1 WHERE id = $2`, [item.display_order, item.id]);
        }

        return res.status(200).json({ success: true, message: 'Reordered successfully' });
    } catch (err) {
        console.error(`❌ Error reordering CRM meta for ${req.params.tab}:`, err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

export const deleteMetaItem = async (req, res) => {
    try {
        const { tab, id } = req.params;
        const config = getTableConfig(tab);

        if (!config) {
            return res.status(400).json({ success: false, error: 'Invalid module tab specified.' });
        }

        const query = `UPDATE ${config.table} SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Record not found.' });
        }

        return res.status(200).json({ success: true, message: 'Deleted successfully.' });
    } catch (err) {
        console.error(`❌ Error deleting CRM meta for ${req.params.tab}:`, err);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};