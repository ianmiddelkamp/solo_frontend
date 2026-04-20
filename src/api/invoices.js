import { apiFetch, getToken } from './index';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const getInvoices = () => apiFetch('/invoices');
export const getUnbilledEntries = (clientId, startDate, endDate) => {
  const params = new URLSearchParams({ client_id: clientId });
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  return apiFetch(`/invoices/unbilled_entries?${params}`);
};
export const getInvoice = (id) => apiFetch(`/invoices/${id}`);
export const createInvoice = (data) =>
  apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) });
export const updateInvoice = (id, data) =>
  apiFetch(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ invoice: data }) });
export const deleteInvoice = (id) => apiFetch(`/invoices/${id}`, { method: 'DELETE' });
export const regeneratePdf = (id) => apiFetch(`/invoices/${id}/regenerate_pdf`, { method: 'POST' });
export const sendInvoice = (id) => apiFetch(`/invoices/${id}/send_invoice`, { method: 'POST' });

export async function downloadPdf(id, filename) {
  const res = await fetch(`${BASE_URL}/invoices/${id}/pdf`, {
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
