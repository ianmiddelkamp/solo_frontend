import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProject, createProject, updateProject } from '../../api/projects';
import { getClients } from '../../api/clients';
import { getProjectRate, setProjectRate, getClientRate } from '../../api/rates';
import PageHeader from '../../components/PageHeader';
import TaskBoard from '../../components/TaskBoard';
import ProjectEstimates from '../../components/ProjectEstimates';
import ProjectAttachments from '../../components/ProjectAttachments';
import { createEstimate } from '../../api/estimates';

const EMPTY = { name: '', client_id: '', description: '' };

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [rate, setRateValue] = useState('');
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creatingEstimate, setCreatingEstimate] = useState(false);

  useEffect(() => {
    getClients().then(setClients).catch((e) => setError(e.message));

    if (isEdit) {
      getProject(id)
        .then((p) => setForm({ name: p.name, client_id: p.client_id, description: p.description || '' }))
        .catch((e) => setError(e.message));

      getProjectRate(id)
        .then((r) => setRateValue(r?.rate != null ? String(r.rate) : ''))
        .catch(() => { }); // no rate yet is fine
    }
  }, [id, isEdit]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // When selecting a client on a new project, pre-populate rate from client default
    if (name === 'client_id' && !isEdit && value) {
      getClientRate(value)
        .then((r) => { if (r?.rate != null) setRateValue(String(r.rate)); })
        .catch(() => { });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let projectId = id;
      if (isEdit) {
        await updateProject(id, form);
      } else {
        const created = await createProject(form);
        projectId = created.id;
      }

      if (rate !== '') {
        await setProjectRate(projectId, parseFloat(rate));
      }

      navigate('/projects');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <PageHeader title={isEdit ? 'Edit Project' : 'New Project'} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <div className="flex gap-8 items-start">
        <div className="w-96 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h3>
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
              <select
                name="client_id"
                value={form.client_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
              <input
                type="number"
                name="rate"
                value={rate}
                onChange={(e) => setRateValue(e.target.value)}
                min="0"
                step="0.01"
                placeholder="e.g. 150.00"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </form>

        </div>



        {isEdit && (
          <div className="flex-1 min-w-0">
            <TaskBoard projectId={id} />
          </div>
        )}
        {isEdit && (
          <div  className="flex-1 min-w-0">
            <ProjectEstimates projectId={id} />
          </div>
        )
        }
        {isEdit && (
          <div className="flex-1 min-w-0">
            <ProjectAttachments projectId={id} />
          </div>
        )}
      </div>
    </div>
  );
}
