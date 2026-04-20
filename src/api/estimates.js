import { apiFetch, getToken } from './index';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getEstimates = (projectId) => {
  let url = '/estimates';
  if (projectId) {
    url += `?project_id=${projectId}`;
  }
  return apiFetch(url);
}
export const getEstimate = (id) => apiFetch(`/estimates/${id}`);
export const createEstimate = (data) =>
  apiFetch('/estimates', { method: 'POST', body: JSON.stringify(data) });
export const updateEstimate = (id, data) =>
  apiFetch(`/estimates/${id}`, { method: 'PATCH', body: JSON.stringify({ estimate: data }) });
export const deleteEstimate = (id) => apiFetch(`/estimates/${id}`, { method: 'DELETE' });
export const regenerateEstimatePdf = (id) => apiFetch(`/estimates/${id}/regenerate_pdf`, { method: 'POST' });
export const sendEstimate = (id) => apiFetch(`/estimates/${id}/send_estimate`, { method: 'POST' });

export async function downloadEstimatePdf(id, filename) {
  const res = await fetch(`${BASE_URL}/estimates/${id}/pdf`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error('Failed to download PDF');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${id}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
}
