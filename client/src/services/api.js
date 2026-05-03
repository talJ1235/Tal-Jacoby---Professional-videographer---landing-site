import axios from 'axios';

// On Vercel: relative URL (empty = same origin → /api/leads)
// For local dev with Express: set VITE_API_URL=http://localhost:3001 in .env.local
const BASE = import.meta.env.VITE_API_URL ?? '';

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

// Public
export const submitLead = (data) => api.post('/api/leads', data);

// Admin helpers
const adminApi = (password) =>
  axios.create({
    baseURL: BASE,
    timeout: 10000,
    headers: { 'x-admin-key': password },
  });

export const getLeads = (password, params) =>
  adminApi(password).get('/api/leads', { params });

export const getLead = (password, id) =>
  adminApi(password).get(`/api/leads/${id}`);

export const updateLead = (password, id, data) =>
  adminApi(password).patch(`/api/leads/${id}`, data);

export const deleteLead = (password, id) =>
  adminApi(password).delete(`/api/leads/${id}`);

export const exportCsv = (password) =>
  adminApi(password).get('/api/leads/export/csv', { responseType: 'blob' });
