const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    let message = `API error ${res.status}`;
    try {
      const body = await res.json();
      if (body.errors) message = Object.values(body.errors).flat().join(', ');
      else if (body.error) message = body.error;
    } catch (_) {}
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}
