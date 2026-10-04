import pool from '../../db.js';

// Get all signatures for the active company
export const getSignatures = async (req, res) => {
    try {
        const { companyId } = req.query;
        let query = 'SELECT * FROM signatures';
        let values = [];

        if (companyId) {
            query += ' WHERE company_id = $1 ORDER BY id ASC';
            values = [companyId];
        } else {
            query += ' ORDER BY id ASC';
        }

        const { rows } = await pool.query(query, values);

        const formatted = rows.map(r => ({
            id: r.id,
            companyId: r.company_id,
            name: r.name,
            url: r.signature_url || '',
            isDefault: r.is_default
        }));

        return res.status(200).json(formatted);
    } catch (err) {
        console.error('❌ Error fetching signatures:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Add a new signature linked to company_id
export const addSignature = async (req, res) => {
    const client = await pool.connect();
    try {
        const { companyId, name, isDefault } = req.body;
        const targetCompanyId = companyId || 1;
        const signaturePath = req.file ? `/uploads/${req.file.filename}` : null;
        const makeDefault = isDefault === 'true' || isDefault === true;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query('UPDATE signatures SET is_default = FALSE WHERE company_id = $1', [targetCompanyId]);
        }

        const query = `
            INSERT INTO signatures (company_id, name, signature_url, is_default)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const { rows } = await client.query(query, [targetCompanyId, name, signaturePath, makeDefault]);
        await client.query('COMMIT');

        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding signature:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Update an existing signature
export const updateSignature = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { companyId, name, isDefault } = req.body;
        const targetCompanyId = companyId || 1;
        const signaturePath = req.file ? `/uploads/${req.file.filename}` : null;
        const makeDefault = isDefault === 'true' || isDefault === true;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query('UPDATE signatures SET is_default = FALSE WHERE company_id = $1', [targetCompanyId]);
        }

        const query = `
            UPDATE signatures 
            SET company_id = COALESCE($1, company_id),
                name = COALESCE($2, name),
                signature_url = COALESCE($3, signature_url),
                is_default = COALESCE($4, is_default)
            WHERE id = $5
            RETURNING *;
        `;
        const { rows } = await client.query(query, [targetCompanyId, name, signaturePath, makeDefault, id]);
        await client.query('COMMIT');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Signature not found.' });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating signature:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Delete a signature
export const deleteSignature = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM signatures WHERE id = $1 RETURNING *;';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Signature not found.' });
        }

        return res.status(200).json({ success: true, message: 'Signature deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting signature:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};