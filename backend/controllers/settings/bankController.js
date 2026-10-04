import pool from '../../db.js';

// Get all bank accounts for the active company
export const getBanks = async (req, res) => {
    try {
        const { companyId } = req.query;
        let query = 'SELECT * FROM bank_accounts';
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
            bankName: r.bank_name,
            accountNumber: r.account_number || '',
            branch: r.branch || '',
            ifscCode: r.ifsc_code || '',
            upiId: r.upi_id || '',
            isDefault: r.is_default,
            isCash: r.is_cash
        }));

        return res.status(200).json(formatted);
    } catch (err) {
        console.error('❌ Error fetching banks:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Add a new bank account linked to company_id
export const addBank = async (req, res) => {
    const client = await pool.connect();
    try {
        const { companyId, bankName, accountNumber, branch, ifscCode, upiId, isDefault } = req.body;
        const targetCompanyId = companyId || 1;
        const makeDefault = isDefault === 'true' || isDefault === true;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query('UPDATE bank_accounts SET is_default = FALSE WHERE company_id = $1', [targetCompanyId]);
        }

        const query = `
            INSERT INTO bank_accounts (company_id, bank_name, account_number, branch, ifsc_code, upi_id, is_default)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        const values = [targetCompanyId, bankName, accountNumber, branch, ifscCode, upiId, makeDefault];
        const { rows } = await client.query(query, values);
        await client.query('COMMIT');

        return res.status(201).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding bank:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Update an existing bank account
export const updateBank = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { companyId, bankName, accountNumber, branch, ifscCode, upiId, isDefault } = req.body;
        const targetCompanyId = companyId || 1;
        const makeDefault = isDefault === 'true' || isDefault === true;

        await client.query('BEGIN');

        if (makeDefault) {
            await client.query('UPDATE bank_accounts SET is_default = FALSE WHERE company_id = $1', [targetCompanyId]);
        }

        const query = `
            UPDATE bank_accounts 
            SET company_id = COALESCE($1, company_id),
                bank_name = COALESCE($2, bank_name),
                account_number = COALESCE($3, account_number),
                branch = COALESCE($4, branch),
                ifsc_code = COALESCE($5, ifsc_code),
                upi_id = COALESCE($6, upi_id),
                is_default = COALESCE($7, is_default)
            WHERE id = $8
            RETURNING *;
        `;
        const values = [targetCompanyId, bankName, accountNumber, branch, ifscCode, upiId, makeDefault, id];
        const { rows } = await client.query(query, values);
        await client.query('COMMIT');

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Bank account not found.' });
        }

        return res.status(200).json({ success: true, data: rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error updating bank:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// Delete a bank account
export const deleteBank = async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM bank_accounts WHERE id = $1 AND is_cash = FALSE RETURNING *;';
        const { rows } = await pool.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Bank account not found or cannot delete Cash account.' });
        }

        return res.status(200).json({ success: true, message: 'Bank account deleted successfully.' });
    } catch (err) {
        console.error('❌ Error deleting bank:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};