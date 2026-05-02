import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

// Public
export const submitLead = (data) => api.post('/api/leads', data);

// Admin helpers
const adminApi = (password) =>
  axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
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
