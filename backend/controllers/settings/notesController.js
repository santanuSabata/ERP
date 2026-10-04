import pool from '../../db.js';

// Get notes or terms filtered by company and type/document_type
export const getNotesTerms = async (req, res) => {
    try {
        const { companyId, type = 'Notes', documentType } = req.query;
        let query = 'SELECT * FROM document_notes_terms WHERE company_id = $1 AND type = $2';
        let values = [companyId || 1, type];

        if (documentType && documentType !== 'All') {
            query += ' AND document_type = $3';
            values.push(documentType);
        }

        query += ' ORDER BY id ASC';
        const { rows } = await pool.query(query, values);

        const formatted = rows.map(r => ({
            id: r.id,
            companyId: r.company_id,
            type: r.type,
            documentType: r.document_type,
            content: r.content,
            isDefault: r.is_default,
            isActive: r.is_active,
        }));

        return res.status(200).json(formatted);
    } catch (err) {
        console.error('❌ Error fetching notes & terms:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Add new note or term
export const addNoteTerm = async (req, res) => {
    const client = await pool.connect();
    try {
        const { companyId, type, documentType, content, isDefault, isActive } = req.body;
        const targetCompanyId = companyId || 1;
        const makeDefault = isDefault === 'true' || isDefault === true;
        const makeActive = isActive === 'true' || isActive === true;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query(
                'UPDATE document_notes_terms SET is_default = FALSE WHERE company_id = $1 AND type = $2 AND document_type = $3',
                [targetCompanyId, type, documentType]
            );
        }

        const query = `
            INSERT INTO document_notes_terms (company_id, type, document_type, content, is_default, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [targetCompanyId, type || 'Notes', documentType || 'Invoice', content, makeDefault, makeActive];
        const { rows } = await client.query(query, values);
        await client.query('COMMIT');

        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding note/term:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Update note or term
export const updateNoteTerm = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { companyId, type, documentType, content, isDefault, isActive } = req.body;
        const targetCompanyId = companyId || 1;
        const makeDefault = isDefault === 'true' || isDefault === true;
        const makeActive = isActive === 'true' || isActive === true;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query(
                'UPDATE document_notes_terms SET is_default = FALSE WHERE company_id = $1 AND type = $2 AND document_type = $3',
                [targetCompanyId, type, documentType]
            );
        }

        const query = `
            UPDATE document_notes_terms 
            SET company_id = COALESCE($1, company_id),
                type = COALESCE($2, type),
                document_type = COALESCE($3, document_type),
                content = COALESCE($4, content),
                is_default = COALESCE($5, is_default),
                is_active = COALESCE($6, is_active)
            WHERE id = $7
            RETURNING *;
        `;
        const values = [targetCompanyId, type, documentType, content, makeDefault, makeActive, id];
        const { rows } = await client.query(query, values);
        await client.query('COMMIT');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Record not found.' });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating note/term:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Delete note or term
export const deleteNoteTerm = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM document_notes_terms WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Record not found.' });
        }

        return res.status(200).json({ success: true, message: 'Deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting record:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};