import { useState, useCallback } from 'react';
import { getLeads, updateLead, deleteLead } from '../services/api';

export function useLeads(password) {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getLeads(password, params);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  }, [password]);

  const patchLead = useCallback(async (id, data) => {
    const { data: updated } = await updateLead(password, id, data);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  }, [password]);

  const removeLead = useCallback(async (id) => {
    await deleteLead(password, id);
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setTotal((t) => t - 1);
  }, [password]);

  return { leads, total, loading, error, fetchLeads, patchLead, removeLead };
}
