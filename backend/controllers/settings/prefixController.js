import pool from '../../db.js';

export const getPrefixes = async (req, res) => {
    try {
        const { companyId, documentType, entryType = 'prefix' } = req.query;
        const targetCompId = companyId || 1;

        let query = `
            SELECT * FROM document_prefixes 
            WHERE company_id = $1 AND entry_type = $2 AND is_deleted = FALSE
        `;
        let values = [targetCompId, entryType];

        if (documentType) {
            query += ` AND document_type = $3`;
            values.push(documentType);
        }

        query += ` ORDER BY id DESC`;

        const { rows } = await pool.query(query, values);
        return res.status(200).json({ success: true, data: rows });
    } catch (err) {
        console.error('❌ SQL Error in getPrefixes:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};

export const createPrefix = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { companyId, documentType, entryType = 'prefix', prefixValue, isDefault } = req.body;
        const targetCompId = companyId || 1;

        if (isDefault) {
            await client.query(
                `UPDATE document_prefixes SET is_default = FALSE WHERE company_id = $1 AND document_type = $2 AND entry_type = $3`,
                [targetCompId, documentType, entryType]
            );
        }

        const insertQuery = `
            INSERT INTO document_prefixes (company_id, document_type, entry_type, prefix_value, is_default)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const { rows } = await client.query(insertQuery, [targetCompId, documentType, entryType, prefixValue, isDefault || false]);

        await client.query('COMMIT');
        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ SQL Error in createPrefix:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

export const updatePrefix = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { id } = req.params;
        const { companyId, documentType, entryType, prefixValue, isDefault } = req.body;
        const targetCompId = companyId || 1;

        if (isDefault) {
            await client.query(
                `UPDATE document_prefixes SET is_default = FALSE WHERE company_id = $1 AND document_type = $2 AND entry_type = $3`,
                [targetCompId, documentType, entryType]
            );
        }

        const updateQuery = `
            UPDATE document_prefixes 
            SET prefix_value = $1, is_default = $2
            WHERE id = $3 RETURNING *;
        `;
        const { rows } = await client.query(updateQuery, [prefixValue, isDefault || false, id]);

        if (rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, error: 'Prefix not found.' });
        }

        await client.query('COMMIT');
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ SQL Error in updatePrefix:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    } finally {
        client.release();
    }
};

export const deletePrefix = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'UPDATE document_prefixes SET is_deleted = TRUE WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Prefix not found.' });
        return res.status(200).json({ success: true, message: 'Prefix deleted successfully.' });
    } catch (err) {
        console.error('❌ SQL Error in deletePrefix:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
};