import { apiFetch, getToken } from './index';

const base = (projectId) => `/projects/${projectId}/attachments`;

export const getAttachments = (projectId) =>
  apiFetch(base(projectId));

export const uploadAttachment = (projectId, file) => {
  const body = new FormData();
  body.append('file', file);
  // FormData — don't set Content-Type, let the browser set multipart boundary
  return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${base(projectId)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body,
  }).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  });
};

export const downloadAttachment = async (projectId, id, filename) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${base(projectId)}/${id}`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const deleteAttachment = (projectId, id) =>
  apiFetch(`${base(projectId)}/${id}`, { method: 'DELETE' });
