import { useState, useEffect, useRef } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useLeads } from '../hooks/useLeads';
import { exportCsv } from '../services/api';
import { formatDate } from '../utils';
import './Admin.css';

const STATUSES = ['חדש', 'בטיפול', 'סגור'];
const PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'TAL2025';

function LoginGate({ onLogin }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (pw === PASSWORD) onLogin();
    else setError('סיסמה שגויה');
  };

  return (
    <div className="login-gate">
      <form className="login-form" onSubmit={submit}>
        <h1 className="login-logo">טל יעקבי</h1>
        <p className="login-sub">כניסה לניהול לידים</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="סיסמה"
          className="login-input"
          autoFocus
        />
        {error && <p className="login-error">{error}</p>}
        <Button type="submit" size="lg" style={{ width: '100%' }}>כניסה</Button>
      </form>
    </div>
  );
}

function StatsBar({ leads }) {
  const total = leads.length;
  const newCount = leads.filter((l) => l.status === 'חדש').length;
  const inProgress = leads.filter((l) => l.status === 'בטיפול').length;
  const closed = leads.filter((l) => l.status === 'סגור').length;
  return (
    <div className="stats-bar">
      <div className="stat-card"><span className="stat-card__num">{total}</span><span className="stat-card__lbl">סה"כ לידים</span></div>
      <div className="stat-card stat-card--new"><span className="stat-card__num">{newCount}</span><span className="stat-card__lbl">חדשים</span></div>
      <div className="stat-card stat-card--inprogress"><span className="stat-card__num">{inProgress}</span><span className="stat-card__lbl">בטיפול</span></div>
      <div className="stat-card stat-card--closed"><span className="stat-card__num">{closed}</span><span className="stat-card__lbl">סגורים</span></div>
    </div>
  );
}

function NoteCell({ lead, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(lead.notes || '');
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => {
    setEditing(false);
    if (val !== lead.notes) onSave(lead.id, { notes: val });
  };

  return editing ? (
    <input
      ref={inputRef}
      className="notes-input"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(lead.notes); setEditing(false); } }}
    />
  ) : (
    <span className="notes-text" onClick={() => setEditing(true)} title="לחץ לעריכה">
      {val || <em className="notes-empty">הוסף הערה</em>}
    </span>
  );
}

export function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('admin') === '1');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { leads, total, loading, error, fetchLeads, patchLead, removeLead } = useLeads(PASSWORD);

  useEffect(() => {
    if (!authed) return;
    fetchLeads({ search, status: statusFilter, page });
  }, [authed, search, statusFilter, page]);

  const handleLogin = () => {
    sessionStorage.setItem('admin', '1');
    setAuthed(true);
  };

  const handleExport = async () => {
    try {
      const { data } = await exportCsv(PASSWORD);
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'leads.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('שגיאה בייצוא');
    }
  };

  const whatsapp = (phone) => {
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('0') ? '972' + clean.slice(1) : clean;
    return `https://wa.me/${num}`;
  };

  const totalPages = Math.ceil(total / 20);

  if (!authed) return <LoginGate onLogin={handleLogin} />;

  return (
    <div className="admin">
      <header className="admin-header">
        <h1 className="admin-logo">טל יעקבי — ניהול לידים</h1>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem('admin'); setAuthed(false); }}>יציאה</button>
      </header>

      <div className="admin-body">
        <StatsBar leads={leads} />

        {/* Toolbar */}
        <div className="admin-toolbar">
          <input
            className="admin-search"
            placeholder="חיפוש לפי שם / טלפון..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="admin-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">כל הסטטוסים</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={handleExport}>ייצוא CSV</Button>
        </div>

        {loading && <p className="admin-loading">טוען...</p>}
        {error && <p className="admin-error">{error}</p>}

        {!loading && leads.length === 0 && <p className="admin-empty">לא נמצאו לידים</p>}

        {leads.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>טלפון</th>
                    <th>אימייל</th>
                    <th>שירות</th>
                    <th>תאריך</th>
                    <th>סטטוס</th>
                    <th>הערות</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="td-name">{lead.name}</td>
                      <td>{lead.phone}</td>
                      <td className="td-email">{lead.email}</td>
                      <td>{lead.service}</td>
                      <td className="td-date">{formatDate(lead.createdAt)}</td>
                      <td>
                        <select
                          className="status-select"
                          value={lead.status}
                          onChange={(e) => patchLead(lead.id, { status: e.target.value })}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <Badge status={lead.status}>{lead.status}</Badge>
                      </td>
                      <td className="td-notes">
                        <NoteCell lead={lead} onSave={patchLead} />
                      </td>
                      <td className="td-actions">
                        <a href={whatsapp(lead.phone)} target="_blank" rel="noopener noreferrer" className="action-wa" title="וואטסאפ">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                        <button className="action-delete" onClick={() => { if (confirm(`מחק את ${lead.name}?`)) removeLead(lead.id); }} title="מחק">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn${p === page ? ' page-btn--active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
