import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getProjects } from '../../api/projects';
import { getClients } from '../../api/clients';
import { getChargeCodes, createChargeCode } from '../../api/chargeCodes';
import {
  createTimeEntry, updateTimeEntry,
  getTimeEntry,
  createChargeCodeTimeEntry, updateChargeCodeTimeEntry,
} from '../../api/timeEntries';
import { getTaskGroups } from '../../api/tasks';
import PageHeader from '../../components/PageHeader';
import { today, hoursFromRange } from '../../utils/dates';
import { DateTime } from 'luxon';

const EMPTY_PROJECT = { project_id: '', date: today(), hours: '', description: '', start_time: '', stop_time: '', task_id: '' };
const EMPTY_CHARGE = { charge_code_id: '', client_id: '', date: today(), hours: '', description: '', start_time: '', stop_time: '' };

export default function TimesheetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);

  // Detect mode from location state or default to project
  const initialMode = location.state?.chargeCodeId ? 'charge_code' : 'project';

  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(
    mode === 'project'
      ? { ...EMPTY_PROJECT, project_id: location.state?.projectId || '', client_id: location.state?.clientId || '' }
      : { ...EMPTY_CHARGE, charge_code_id: location.state?.chargeCodeId || '', client_id: location.state?.clientId || '' }
  );
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargeCodes, setChargeCodes] = useState([]);
  const [taskGroups, setTaskGroups] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newCc, setNewCc] = useState(null); // null = hidden, {} = open
  const [savingCc, setSavingCc] = useState(false);

  const timesProvided = form.start_time && form.stop_time;

  // load projects, clients, and charge code data
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((e) => setError(e.message));

    getClients().then(setClients).catch(() => {});
    getChargeCodes().then(setChargeCodes).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load existing entry for edit
  useEffect(() => {
    if (!isEdit) return;

    getTimeEntry(id)
      .then((entry) => {
        setForm({
          project_id: String(entry.project_id || ''),
          charge_code_id: String(entry.charge_code_id || ''),
          client_id: String(entry.client_id || location.state?.clientId),
          date: entry.date,
          hours: entry.hours,
          description: entry.description || '',
          start_time: entry.started_at ? DateTime.fromISO(entry.started_at).toFormat('HH:mm') : '',
          stop_time: entry.stopped_at ? DateTime.fromISO(entry.stopped_at).toFormat('HH:mm') : '',
          task_id: entry.task_id ? String(entry.task_id) : '',
        });
      })
      .catch((e) => setError(e.message));
  }, []);

  // Load task groups when project changes
  useEffect(() => {
    if (mode !== 'project' || !form.project_id) { setTaskGroups([]); return; }
    getTaskGroups(form.project_id).then(setTaskGroups).catch(() => setTaskGroups([]));
  }, [mode, form.project_id]);

  function switchMode(newMode) {
    setMode(newMode);
    setError(null);
    setTaskGroups([]);
    const clientId = form.client_id || '';
    if (newMode === 'project') {
      setForm({ ...EMPTY_PROJECT, project_id: projects[0] ? String(projects[0].id) : '', client_id: clientId });
    } else {
      setForm({ ...EMPTY_CHARGE, charge_code_id: chargeCodes[0] ? String(chargeCodes[0].id) : '', client_id: clientId });
    }
  }

  const filteredProjects = form.client_id
    ? projects.filter((p) => String(p.client?.id) === form.client_id)
    : projects;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Clear project when client changes
      if (name === 'client_id') {
        updated.project_id = '';
      } else if (name === 'project_id' && !prev.client_id ){
        let project = projects.find( p => p.id === Number(value))
        if(project){
          updated.client_id = String(project.client_id)
        }
      
      }
      const date = name === 'date' ? value : updated.date;
      const start = name === 'start_time' ? value : updated.start_time;
      const stop = name === 'stop_time' ? value : updated.stop_time;
      if (date && start && stop) {
        const startISO = `${date}T${start}`;
        const stopISO = `${date}T${stop}`;
        if (stopISO > startISO) updated.hours = hoursFromRange(startISO, stopISO);
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (mode === 'project') {
        const { project_id, start_time, stop_time, task_id, ...entryData } = form;
        const payload = {
          ...entryData,
          hours: Math.round(parseFloat(entryData.hours) * 100) / 100,
          task_id: task_id || null,
          started_at: start_time ? DateTime.fromISO(`${form.date}T${start_time}`).toISO() : null,
          stopped_at: stop_time ? DateTime.fromISO(`${form.date}T${stop_time}`).toISO() : null,
        };
        if (isEdit) {
          await updateTimeEntry(project_id, id, payload);
        } else {
          await createTimeEntry(project_id, payload);
        }
      } else {
        const { start_time, stop_time, ...entryData } = form;
        const payload = {
          ...entryData,
          hours: Math.round(parseFloat(entryData.hours) * 100) / 100,
          started_at: start_time ? DateTime.fromISO(`${form.date}T${start_time}`).toISO() : null,
          stopped_at: stop_time ? DateTime.fromISO(`${form.date}T${stop_time}`).toISO() : null,
        };
        if (isEdit) {
          await updateChargeCodeTimeEntry(id, payload);
        } else {
          await createChargeCodeTimeEntry(payload);
        }
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

        {/* Client — always visible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
          <select
            name="client_id"
            value={form.client_id}
            onChange={handleChange}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Mode toggle */}
        {!isEdit && (
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode('project')}
              className={`flex-1 py-2 transition-colors ${mode === 'project' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Project
            </button>
            <button
              type="button"
              onClick={() => switchMode('charge_code')}
              className={`flex-1 py-2 transition-colors ${mode === 'charge_code' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Charge Code
            </button>
          </div>
        )}

        {mode === 'project' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                required
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              >
                <option value="">Select a project…</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
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
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
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
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Charge Code *</label>
                {!newCc && (
                  <button type="button" onClick={() => setNewCc({ code: '', description: '', rate: '' })}
                    className="text-xs text-indigo-600 hover:text-indigo-800">
                    + New
                  </button>
                )}
              </div>
              <select
                name="charge_code_id"
                value={form.charge_code_id}
                onChange={handleChange}
                required={!newCc}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
              >
                <option value="">Select a charge code…</option>
                {chargeCodes.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.code}{cc.description ? ` — ${cc.description}` : ''}
                  </option>
                ))}
              </select>

              {newCc && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2">
                  <p className="text-xs font-medium text-gray-600">New charge code</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Code *"
                      value={newCc.code}
                      onChange={(e) => setNewCc((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5 font-mono uppercase"
                    />
                    <input
                      placeholder="Description"
                      value={newCc.description}
                      onChange={(e) => setNewCc((p) => ({ ...p, description: e.target.value }))}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                    />
                  </div>
                  <input
                    type="number"
                    placeholder="Rate (optional)"
                    value={newCc.rate}
                    min="0"
                    step="0.01"
                    onChange={(e) => setNewCc((p) => ({ ...p, rate: e.target.value }))}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-1.5"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={savingCc || !newCc.code.trim()}
                      onClick={async () => {
                        setSavingCc(true);
                        try {
                          const created = await createChargeCode({
                            user_id: 1,
                            code: newCc.code.trim(),
                            description: newCc.description.trim() || null,
                            rate: newCc.rate !== '' ? parseFloat(newCc.rate) : null,
                          });
                          setChargeCodes((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
                          setForm((prev) => ({ ...prev, charge_code_id: String(created.id) }));
                          setNewCc(null);
                        } catch (e) {
                          setError(e.message);
                        } finally {
                          setSavingCc(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {savingCc ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setNewCc(null)}
                      className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
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
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
            <input
              type="time"
              name="stop_time"
              value={form.stop_time}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
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
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || Boolean(newCc)}
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
