import { apiFetch } from './index';

// Project-scoped (existing)
export const getTimeEntries = (projectId) => apiFetch(`/projects/${projectId}/time_entries`);
export const createTimeEntry = (projectId, data) =>
  apiFetch(`/projects/${projectId}/time_entries`, {
    method: 'POST',
    body: JSON.stringify({ time_entry: { ...data, user_id: 1 } }),
  });
export const updateTimeEntry = (projectId, id, data) =>
  apiFetch(`/projects/${projectId}/time_entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ time_entry: data }),
  });
export const deleteTimeEntry = (projectId, id) =>
  apiFetch(`/projects/${projectId}/time_entries/${id}`, { method: 'DELETE' });

// Top-level (charge code entries and all-entries list)
export const getAllTimeEntries = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiFetch(`/time_entries${qs ? `?${qs}` : ''}`);
};
export const getTimeEntry = (id) => apiFetch(`/time_entries/${id}`);
export const createChargeCodeTimeEntry = (data) =>
  apiFetch('/time_entries', {
    method: 'POST',
    body: JSON.stringify({ time_entry: { ...data, user_id: 1 } }),
  });
export const updateChargeCodeTimeEntry = (id, data) =>
  apiFetch(`/time_entries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ time_entry: data }),
  });
export const deleteChargeCodeTimeEntry = (id) =>
  apiFetch(`/time_entries/${id}`, { method: 'DELETE' });
