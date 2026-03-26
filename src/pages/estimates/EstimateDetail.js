import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEstimate, updateEstimate, downloadEstimatePdf, regenerateEstimatePdf, sendEstimate } from '../../api/estimates';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getEstimate(id)
      .then(setEstimate)
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

  const transition = STATUS_TRANSITIONS[estimate.status];

  return (
    <div className="p-8 max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/estimates')} className="text-sm text-gray-500 hover:text-gray-700">
            ← Estimates
          </button>
          <h2 className="text-2xl font-semibold text-gray-800">{estimate.number}</h2>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Client</p>
            <p className="font-medium text-gray-900">{estimate.project?.client?.name}</p>
            {estimate.project?.client?.contact_name && (
              <p className="text-sm text-gray-500">{estimate.project.client.contact_name}</p>
            )}
            {estimate.project?.client?.email1 && (
              <p className="text-sm text-gray-500">{estimate.project.client.email1}</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Project</p>
            <p className="text-sm text-gray-700">{estimate.project?.name}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-1">Issued</p>
            <p className="text-sm text-gray-700">{formatDate(estimate.created_at)}</p>
          </div>
        </div>

        {/* Line items */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Hours</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {estimate.estimate_line_items?.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-sm text-gray-700">{item.description || '—'}</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-right">{parseFloat(item.hours).toFixed(2)}</td>
                <td className="px-6 py-3 text-sm text-gray-900 text-right">${parseFloat(item.rate).toFixed(2)}</td>
                <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">${parseFloat(item.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide mr-8">Estimated Total</span>
            <span className="text-xl font-bold text-gray-900">
              ${parseFloat(estimate.total || 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
