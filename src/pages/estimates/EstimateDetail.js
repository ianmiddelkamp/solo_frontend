import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEstimate, updateEstimate, downloadEstimatePdf, regenerateEstimatePdf, sendEstimate } from '../../api/estimates';
import { getBusinessProfile } from '../../api/businessProfile';
import { formatDate } from '../../utils/dates';
import { confirm } from '../../services/dialog';

const STATUS_STYLES = {
  draft:    'bg-gray-100 text-gray-700',
  sent:     'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};

const STATUS_TRANSITIONS = {
  draft:    { label: 'Mark as Sent',     next: 'sent' },
  sent:     { label: 'Mark as Accepted', next: 'accepted' },
  accepted: null,
  declined: null,
};

export default function EstimateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    Promise.all([getEstimate(id), getBusinessProfile()])
      .then(([est, biz]) => { setEstimate(est); setBusiness(biz); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSend() {
    const email = estimate.project?.client?.email1;
    if (!await confirm(`Send estimate to ${email}?`, { title: 'Send Estimate', confirmLabel: 'Send', danger: false })) return;
    setSending(true);
    try {
      const res = await sendEstimate(id);
      alert(res.message);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      await downloadEstimatePdf(id, `${estimate.number}.pdf`);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleRegeneratePdf() {
    if (!await confirm('Regenerate the PDF? This will overwrite the existing file.', { title: 'Regenerate PDF', confirmLabel: 'Regenerate', danger: false })) return;
    setRegenerating(true);
    try {
      await regenerateEstimatePdf(id);
      await downloadEstimatePdf(id, `${estimate.number}.pdf`);
    } catch (e) {
      alert(e.message);
    } finally {
      setRegenerating(false);
    }
  }

  async function handleStatusUpdate() {
    const transition = STATUS_TRANSITIONS[estimate.status];
    if (!transition) return;
    try {
      const updated = await updateEstimate(id, { status: transition.next });
      setEstimate(updated);
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleMarkDeclined() {
    if (!await confirm('Mark this estimate as declined?', { title: 'Mark Declined', confirmLabel: 'Decline', danger: true })) return;
    try {
      const updated = await updateEstimate(id, { status: 'declined' });
      setEstimate(updated);
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>;
  if (error)   return <div className="p-8 text-red-600">{error}</div>;
  if (!estimate) return null;

  const brand = business?.primary_color || '#4338ca';
  const transition = STATUS_TRANSITIONS[estimate.status];
  const client = estimate.project?.client;

  const bizAddress = [business?.address1, business?.city, business?.state, business?.postcode].filter(Boolean).join(', ');
  const clientAddress = [client?.address1, client?.city, client?.state, client?.postcode].filter(Boolean).join(', ');

  const footer = business?.estimate_footer || 'This is an estimate only. The final invoice may vary based on actual hours worked.';

  return (
    <div className="p-8 max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/estimates')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Estimates
          </button>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_STYLES[estimate.status]}`}>
            {estimate.status}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {transition && (
            <button
              onClick={handleStatusUpdate}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              {transition.label}
            </button>
          )}
          {estimate.status === 'sent' && (
            <button
              onClick={handleMarkDeclined}
              className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 transition-colors"
            >
              Mark as Declined
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {sending ? 'Sending…' : 'Send Estimate'}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Download PDF
          </button>
          <button
            onClick={handleRegeneratePdf}
            disabled={regenerating}
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {regenerating ? 'Regenerating…' : 'Regenerate PDF'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 flex flex-col" style={{ minHeight: '1050px' }}>
        {/* Document header */}
        <div className="flex justify-between items-start">
          <div>
            {business?.logo_data_uri ? (
              <img src={business.logo_data_uri} alt={business.name} className="max-h-20 max-w-40 object-contain" />
            ) : (
              <div style={{ color: brand }} className="text-4xl font-bold tracking-tight leading-none">ESTIMATE</div>
            )}
          </div>
          <div className="text-right">
            {business?.logo_data_uri && (
              <div style={{ color: brand }} className="text-2xl font-bold tracking-tight leading-none">ESTIMATE</div>
            )}
            <div className="text-sm font-semibold text-gray-900 mt-1">{estimate.number}</div>
            <div className="text-xs text-gray-500 mt-1">Date: {formatDate(estimate.created_at)}</div>
            {estimate.project?.name && (
              <div className="text-xs text-gray-500 mt-0.5">Project: {estimate.project.name}</div>
            )}
          </div>
        </div>

        {/* Brand rule */}
        <div style={{ borderTop: `2px solid ${brand}`, margin: '16px 0' }} />

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">From</p>
            <p className="text-sm font-semibold text-gray-900">{business?.name || 'Your Business'}</p>
            <div className="text-xs text-gray-500 leading-relaxed mt-1">
              {bizAddress && <div>{bizAddress}</div>}
              {business?.email && <div>{business.email}</div>}
              {business?.phone && <div>{business.phone}</div>}
              {business?.hst_number && <div>HST # {business.hst_number}</div>}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prepared For</p>
            <p className="text-sm font-semibold text-gray-900">{client?.name}</p>
            <div className="text-xs text-gray-500 leading-relaxed mt-1">
              {client?.contact_name && <div>{client.contact_name}</div>}
              {client?.email1 && <div>{client.email1}</div>}
              {client?.phone1 && <div>{client.phone1}</div>}
              {clientAddress && <div>{clientAddress}</div>}
            </div>
          </div>
        </div>

        {/* Line items */}
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: brand }}>
              <th className="px-3 py-2 text-left text-xs font-semibold text-white uppercase tracking-wide">Task</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase tracking-wide">Est. Hours</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase tracking-wide">Rate</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-white uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {estimate.estimate_line_items?.map((item, i) => (
              <tr key={item.id} style={i % 2 === 1 ? { backgroundColor: '#f9fafb' } : {}}>
                <td className="px-3 py-2 text-sm text-gray-700 border-b border-gray-200">{item.description || '—'}</td>
                <td className="px-3 py-2 text-sm text-gray-900 text-right border-b border-gray-200">{parseFloat(item.hours).toFixed(2)}</td>
                <td className="px-3 py-2 text-sm text-gray-900 text-right border-b border-gray-200">${parseFloat(item.rate).toFixed(2)}</td>
                <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right border-b border-gray-200">${parseFloat(item.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-auto flex justify-end pt-4">
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Estimated Total</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">${parseFloat(estimate.total || 0).toFixed(2)}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-3 border-t border-gray-200 text-xs text-gray-400 leading-relaxed">
          {footer}
          <br />
          Thank you for your business.
        </div>
      </div>
    </div>
  );
}
