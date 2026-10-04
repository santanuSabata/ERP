import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/axios.js';
import { API_PATHS } from '../utils/apiPaths.js';
import Input from './ui/Input.jsx';
import Textarea from './ui/Textarea.jsx';
import Button from './ui/Button.jsx';

const CustomerForm = ({ initial, onSaved, onCancel }) => {
    const [form, setForm] = useState({
        name: initial?.name || '',
        email: initial?.email || '',
        mobile: initial?.mobile || '',
        company: initial?.company || '',
        address: initial?.address || '',
        notes: initial?.notes || '',
    });

    const updateField = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim() || null,
                mobile: form.mobile.trim() || null,
                company: form.company.trim() || null,
                address: form.address.trim() || null,
                notes: form.notes.trim() || null,
            };

            if (initial) {
                await api.put(API_PATHS.CUSTOMERS.UPDATE(initial.id), payload);
                toast.success('Customer updated');
            } else {
                await api.post(API_PATHS.CUSTOMERS.CREATE, payload);
                toast.success('Customer added');
            }

            onSaved();
        } catch (err) {
            console.error('CUSTOMER SAVE ERROR:', err.response?.data || err);
            toast.error(err.response?.data?.message || 'Failed to save customer');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <Input
                label="Customer Name"
                placeholder="e.g. John Doe"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="Email"
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                />

                <Input
                    label="Mobile"
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={form.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
                />
            </div>

            <Input
                label="Company"
                placeholder="e.g. ABC Technologies"
                value={form.company}
                onChange={(e) => updateField('company', e.target.value)}
            />

            <Textarea
                label="Address"
                rows={2}
                placeholder="Customer address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
            />

            <Textarea
                label="Notes (optional)"
                rows={3}
                placeholder="Additional customer notes..."
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
            />

            <div className="flex gap-2 justify-end pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : initial ? 'Update Customer' : 'Save Customer'}
                </Button>
            </div>
        </form>
    );
};

export default CustomerForm;
