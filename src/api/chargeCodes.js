import { apiFetch } from './index';

export const getChargeCodes = () => apiFetch('/charge_codes');

export const createChargeCode = (data) =>
  apiFetch('/charge_codes', {
    method: 'POST',
    body: JSON.stringify({ charge_code: data }),
  });

export const updateChargeCode = (id, data) =>
  apiFetch(`/charge_codes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ charge_code: data }),
  });

export const deleteChargeCode = (id) =>
  apiFetch(`/charge_codes/${id}`, { method: 'DELETE' });
