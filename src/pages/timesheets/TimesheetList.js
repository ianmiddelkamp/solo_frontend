import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects } from '../../api/projects';
import { getTimeEntries, deleteTimeEntry, getAllTimeEntries, deleteChargeCodeTimeEntry } from '../../api/timeEntries';
import PageHeader from '../../components/PageHeader';
import { formatDate } from '../../utils/dates';
import { confirm } from '../../services/dialog';

const CHARGE_CODES_KEY = '__charge_codes__';

export default function TimesheetList() {
  const [projects, setProjects] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isChargeCodeMode = selectedKey === CHARGE_CODES_KEY;

  useEffect(() => {
    getProjects()
      .then((ps) => {
        setProjects(ps);
        if (ps.length > 0) setSelectedKey(String(ps[0].id));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    setLoading(true);
    setError(null);

    const fetch = isChargeCodeMode
      ? getAllTimeEntries({ charge_codes_only: true })
      : getTimeEntries(selectedKey);

    fetch
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedKey, isChargeCodeMode]);

  async function handleDelete(entry) {
    if (!await confirm('Delete this time entry?')) return;
    try {
      if (isChargeCodeMode) {
        await deleteChargeCodeTimeEntry(entry.id);
      } else {
        await deleteTimeEntry(selectedKey, entry.id);
      }
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (e) {
      alert(e.message);
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);

  return (
    <div className="p-8">
      <PageHeader title="Timesheets" actionLabel="+ Log Time" actionTo="/timesheets/new" />

      <div className="mb-6 flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">View</label>
        <select
          value={selectedKey}
          onChange={(e) => setSelectedKey(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}{p.client ? ` — ${p.client.name}` : ''}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value={CHARGE_CODES_KEY}>Charge Code Entries</option>
        </select>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                  {isChargeCodeMode
                    ? <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Charge Code</th>
                    : <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  }
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                      {isChargeCodeMode ? 'No charge code entries yet.' : 'No time entries for this project.'}
                    </td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(entry.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{parseFloat(entry.hours).toFixed(2)}</td>
                    {isChargeCodeMode
                      ? <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="font-mono font-medium text-gray-700">{entry.charge_code?.code}</span>
                          {entry.charge_code?.description && <span className="text-gray-400"> · {entry.charge_code.description}</span>}
                        </td>
                      : <td className="px-6 py-4 text-sm text-gray-500">{entry.task?.title || '—'}</td>
                    }
                    <td className="px-6 py-4 text-sm text-gray-500">{entry.description || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      {entry.invoice_line_item?.invoice
                        ? <Link
                            to={`/invoices/${entry.invoice_line_item.invoice.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            {entry.invoice_line_item.invoice.number}
                          </Link>
                        : <span className="text-gray-400">Unbilled</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right text-sm space-x-3">
                      <Link
                        to={`/timesheets/${entry.id}/edit`}
                        state={isChargeCodeMode
                          ? { chargeCodeId: entry.charge_code_id, clientId: entry.client_id }
                          : { projectId: selectedKey }
                        }
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(entry)} className="text-red-500 hover:text-red-700">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {entries.length > 0 && (
            <div className="mt-3 text-right text-sm font-medium text-gray-700">
              Total: <span className="text-gray-900">{totalHours.toFixed(2)} hrs</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
