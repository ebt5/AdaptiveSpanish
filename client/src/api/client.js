const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  post:   (path, body)  => request(path, { method: 'POST',  body: JSON.stringify(body) }),
  get:    (path)        => request(path, { method: 'GET' }),
  put:    (path, body)  => request(path, { method: 'PUT',   body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
};
