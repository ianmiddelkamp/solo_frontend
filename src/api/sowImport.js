import { getToken } from './index';

const base = () => import.meta.env.VITE_API_URL || 'http://localhost:3000';
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

export const parseSow = async (projectId, fileOrText, onStatus) => {
  const body = new FormData();
  if (typeof fileOrText === 'string') {
    body.append('text', fileOrText);
  } else {
    body.append('file', fileOrText);
  }

  onStatus?.('Analysing document…');
  const res = await fetch(`${base()}/projects/${projectId}/sow_import`, {
    method: 'POST',
    headers: authHeader(),
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Import failed');
  return data;
};
