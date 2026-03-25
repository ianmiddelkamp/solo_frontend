import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getProjects } from '../../api/projects';
import { createTimeEntry, updateTimeEntry, getTimeEntries } from '../../api/timeEntries';
import { getTaskGroups } from '../../api/tasks';
import PageHeader from '../../components/PageHeader';
import { today, hoursFromRange } from '../../utils/dates';
import { DateTime } from 'luxon';

const EMPTY = { project_id: '', date: today(), hours: '', description: '', start_time: '', stop_time: '', task_id: '' };

export default function TimesheetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    ...EMPTY,
    project_id: location.state?.projectId || '',
  });
  const [projects, setProjects] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const timesProvided = form.start_time && form.stop_time;

  useEffect(() => {
    getProjects()
      .then((ps) => {
        setProjects(ps);
        if (!isEdit && !form.project_id && ps.length > 0) {
          setForm((prev) => ({ ...prev, project_id: String(ps[0].id) }));
        }
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isEdit || !form.project_id) return;
    getTimeEntries(form.project_id)
      .then((entries) => {
        const entry = entries.find((e) => String(e.id) === String(id));
        if (entry) {
          setForm({
            project_id: String(form.project_id),
            date: entry.date,
            hours: entry.hours,
            description: entry.description || '',
            start_time: entry.started_at ? DateTime.fromISO(entry.started_at).toFormat('HH:mm') : '',
            stop_time: entry.stopped_at ? DateTime.fromISO(entry.stopped_at).toFormat('HH:mm') : '',
            task_id: entry.task_id ? String(entry.task_id) : '',
          });
        }
      })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, form.project_id]);

  useEffect(() => {
    if (!form.project_id) { setTaskGroups([]); return; }
    getTaskGroups(form.project_id).then(setTaskGroups).catch(() => setTaskGroups([]));
  }, [form.project_id]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate hours when both times and date are set
      const date = name === 'date' ? value : updated.date;
      const start = name === 'start_time' ? value : updated.start_time;
      const stop = name === 'stop_time' ? value : updated.stop_time;

      if (date && start && stop) {
        const startISO = `${date}T${start}`;
        const stopISO = `${date}T${stop}`;
        if (stopISO > startISO) {
          updated.hours = hoursFromRange(startISO, stopISO);
        }
      }

      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { project_id, start_time, stop_time, task_id, ...entryData } = form;
    const payload = {
      ...entryData,
      hours: Math.round(parseFloat(entryData.hours) * 100) / 100,
      task_id: task_id || null,
      started_at: start_time ? DateTime.fromISO(`${form.date}T${start_time}`).toISO() : null,
      stopped_at: stop_time ? DateTime.fromISO(`${form.date}T${stop_time}`).toISO() : null,
    };
    try {
      if (isEdit) {
        await updateTimeEntry(project_id, id, payload);
      } else {
        await createTimeEntry(project_id, payload);
      }
      navigate('/timesheets');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <PageHeader title={isEdit ? 'Edit Time Entry' : 'Log Time'} />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
          <select
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.client ? ` — ${p.client.name}` : ''}
              </option>
            ))}
          </select>
        </div>
        {taskGroups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <select
              name="task_id"
              value={form.task_id}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">No task</option>
              {taskGroups.map((group) => (
                <optgroup key={group.id} label={group.title}>
                  {group.tasks.map((task) => (
                    <option key={task.id} value={task.id}>{task.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
            <input
              type="time"
              name="stop_time"
              value={form.stop_time}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>



        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hours *</label>
          <input
            type="number"
            name="hours"
            value={form.hours}
            onChange={handleChange}
            required
            min="0"
            step="any"
            placeholder="e.g. 2.5"
            readOnly={timesProvided}
            className={`w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${timesProvided ? 'bg-gray-50 text-gray-500' : ''}`}
          />
          {timesProvided && <p className="text-xs text-gray-400 mt-1">Calculated from start and end time</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            placeholder="What did you work on?"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Time'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/timesheets')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
