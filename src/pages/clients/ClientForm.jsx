import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClient, createClient, updateClient } from '../../api/clients';
import { getClientRate, setClientRate } from '../../api/rates';
import PageHeader from '../../components/PageHeader';

const TERMS_OPTIONS = ['NET 15', 'NET 30', 'NET 45', 'NET 60', 'Due on Receipt'];

const EMPTY = {
  name: '',
  contact_name: '',
  email1: '',
  email2: '',
  phone1: '',
  phone2: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postcode: '',
  country: '',
  sales_terms: 'NET 15',
};

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  );
}

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [rate, setRateValue] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      getClient(id)
        .then((c) => setForm({
          name: c.name ?? '',
          contact_name: c.contact_name ?? '',
          email1: c.email1 ?? '',
          email2: c.email2 ?? '',
          phone1: c.phone1 ?? '',
          phone2: c.phone2 ?? '',
          address1: c.address1 ?? '',
          address2: c.address2 ?? '',
          city: c.city ?? '',
          state: c.state ?? '',
          postcode: c.postcode ?? '',
          country:     c.country     ?? '',
          sales_terms: c.sales_terms ?? 'NET 15',
        }))
        .catch((e) => setError(e.message));

      getClientRate(id)
        .then((r) => setRateValue(r?.rate != null ? String(r.rate) : ''))
        .catch(() => {});
    }
  }, [id, isEdit]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let clientId = id;
      if (isEdit) {
        await updateClient(id, form);
      } else {
        const created = await createClient(form);
        clientId = created.id;
      }

      if (rate !== '') {
        await setClientRate(clientId, parseFloat(rate));
      }

      navigate('/clients');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title={isEdit ? 'Edit Client' : 'New Client'} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">

        {/* Business name */}
        <Field label="Business Name *" name="name" value={form.name} onChange={handleChange} />

        {/* Default rate */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Billing</h3>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Hourly Rate ($)</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRateValue(e.target.value)}
              min="0"
              step="0.01"
              placeholder="e.g. 150.00"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">Applied to new projects for this client. Can be overridden per project.</p>
          </div>
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
            <select
              name="sales_terms"
              value={form.sales_terms}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {TERMS_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Name" name="contact_name" value={form.contact_name} onChange={handleChange} />
            <div /> {/* spacer */}
            <Field label="Email" name="email1" value={form.email1} onChange={handleChange} type="email" />
            <Field label="Email 2" name="email2" value={form.email2} onChange={handleChange} type="email" />
            <Field label="Phone" name="phone1" value={form.phone1} onChange={handleChange} type="tel" />
            <Field label="Phone 2" name="phone2" value={form.phone2} onChange={handleChange} type="tel" />
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Address</h3>
          <div className="space-y-3">
            <Field label="Street Address" name="address1" value={form.address1} onChange={handleChange} />
            <Field label="Address Line 2" name="address2" value={form.address2} onChange={handleChange} placeholder="Suite, unit, etc." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" name="city" value={form.city} onChange={handleChange} />
              <Field label="State / Province" name="state" value={form.state} onChange={handleChange} />
              <Field label="Postcode" name="postcode" value={form.postcode} onChange={handleChange} />
              <Field label="Country" name="country" value={form.country} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Client'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
