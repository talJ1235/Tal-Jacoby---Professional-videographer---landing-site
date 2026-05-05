import { Fragment, useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useLeads } from '../hooks/useLeads';
import { getLeads } from '../services/api';
import { formatDate } from '../utils';
import './Admin.css';

const STATUSES = ['חדש', 'בטיפול', 'סגור'];
const normStatus = (s) => (s === 'new' ? 'חדש' : s || 'חדש');

// ── Login ──────────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setLoading(true); setError('');
    try {
      await getLeads(pw, { page: 1 });
      onLogin(pw);
    } catch (err) {
      if (err.response?.status === 401) setError('סיסמה שגויה');
      else setError('שגיאת חיבור — נסה שוב');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-gate">
      <form className="login-form" onSubmit={submit}>
        <h1 className="login-logo">טל יעקבי</h1>
        <p className="login-sub">כניסה לניהול לידים</p>
        <div className="login-input-wrap">
          <input
            type={show ? 'text' : 'password'} value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="סיסמה" className="login-input" autoFocus disabled={loading}
          />
          <button type="button" className="login-eye" onClick={() => setShow((s) => !s)} tabIndex={-1}>
            {show ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
        {error && <p className="login-error">{error}</p>}
        <Button type="submit" size="lg" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'מתחבר...' : 'כניסה'}
        </Button>
      </form>
    </div>
  );
}

// ── Stats ──────────────────────────────────────────────────────
function StatsBar({ leads }) {
  const total      = leads.length;
  const newCount   = leads.filter((l) => l.status === 'חדש').length;
  const inProgress = leads.filter((l) => l.status === 'בטיפול').length;
  const closed     = leads.filter((l) => l.status === 'סגור').length;
  return (
    <div className="stats-bar">
      <div className="stat-card"><span className="stat-card__num">{total}</span><span className="stat-card__lbl">סה"כ לידים</span></div>
      <div className="stat-card stat-card--new"><span className="stat-card__num">{newCount}</span><span className="stat-card__lbl">חדשים</span></div>
      <div className="stat-card stat-card--inprogress"><span className="stat-card__num">{inProgress}</span><span className="stat-card__lbl">בטיפול</span></div>
      <div className="stat-card stat-card--closed"><span className="stat-card__num">{closed}</span><span className="stat-card__lbl">סגורים</span></div>
    </div>
  );
}

// ── Notes cell ─────────────────────────────────────────────────
function NoteCell({ lead, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(lead.notes || '');
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  const save = () => {
    setEditing(false);
    if (val !== (lead.notes || '')) onSave(lead.id, { notes: val });
  };
  return editing ? (
    <input ref={inputRef} className="notes-input" value={val}
      onChange={(e) => setVal(e.target.value)} onBlur={save}
      onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(lead.notes || ''); setEditing(false); } }}
    />
  ) : (
    <span className="notes-text" onClick={() => setEditing(true)} title="לחץ לעריכה">
      {val || <em className="notes-empty">הוסף הערה</em>}
    </span>
  );
}

// ── Inline confirm wrapper ─────────────────────────────────────
function ConfirmBtn({ confirmText, onConfirm, children, className }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="confirm-wrap">
      {open ? (
        <span className="delete-confirm">
          <span className="delete-confirm__txt">{confirmText}</span>
          <button className="delete-confirm__yes" onClick={async () => { setOpen(false); await onConfirm(); }} title="אישור">✓</button>
          <button className="delete-confirm__no"  onClick={() => setOpen(false)} title="ביטול">✕</button>
        </span>
      ) : (
        <button className={className} onClick={() => setOpen(true)}>{children}</button>
      )}
    </span>
  );
}

// ── Main Admin ─────────────────────────────────────────────────
export function Admin() {
  const [password, setPassword]         = useState(() => sessionStorage.getItem('admin_pw') || '');
  const [activeTab, setActiveTab]       = useState('active');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]                 = useState(1);
  const [expandedMsg, setExpandedMsg]   = useState(null);
  const { leads, total, loading, error, fetchLeads, patchLead, removeLead } = useLeads(password);

  useEffect(() => {
    if (!password) return;
    fetchLeads({ search, status: statusFilter, page });
  }, [password, search, statusFilter, page]);

  const handleLogin = (pw) => { sessionStorage.setItem('admin_pw', pw); setPassword(pw); };

  const normalizedLeads = leads.map((l) => ({ ...l, status: normStatus(l.status) }));

  const tabLeads = activeTab === 'active'
    ? normalizedLeads.filter((l) => l.status === 'חדש' || l.status === 'בטיפול')
    : normalizedLeads;

  const handleExport = async () => {
    try {
      const { data } = await getLeads(password, { page: 1, pageSize: 9999 });
      const all = (data.leads || []).map((l) => ({ ...l, status: normStatus(l.status) }));
      const rows = all.map((l) => ({
        'שם': l.name, 'טלפון': l.phone, 'אימייל': l.email, 'שירות': l.service,
        'סטטוס': l.status, 'הודעה': l.message || '', 'הערות': l.notes || '',
        'תאריך': formatDate(l.created_at || l.createdAt),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'לידים');
      ws['!cols'] = [14,14,22,16,10,28,28,14].map((wch) => ({ wch }));
      XLSX.writeFile(wb, 'leads.xlsx');
    } catch { alert('שגיאה בייצוא'); }
  };

  const whatsapp = (phone) => {
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('0') ? '972' + clean.slice(1) : clean;
    return `https://wa.me/${num}`;
  };

  const totalPages = Math.ceil(total / 20);
  if (!password) return <LoginGate onLogin={handleLogin} />;

  return (
    <div className="admin">
      <header className="admin-header">
        <h1 className="admin-logo">טל יעקבי — ניהול לידים</h1>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem('admin_pw'); setPassword(''); }}>יציאה</button>
      </header>

      <div className="admin-body">
        <StatsBar leads={normalizedLeads} />

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={`admin-tab${activeTab === 'active' ? ' admin-tab--active' : ''}`}
            onClick={() => { setActiveTab('active'); setStatusFilter(''); setPage(1); }}>
            לידים פעילים
            <span className="admin-tab__badge">
              {normalizedLeads.filter((l) => l.status === 'חדש' || l.status === 'בטיפול').length}
            </span>
          </button>
          <button className={`admin-tab${activeTab === 'history' ? ' admin-tab--active' : ''}`}
            onClick={() => { setActiveTab('history'); setStatusFilter(''); setPage(1); }}>
            היסטוריה
            <span className="admin-tab__badge admin-tab__badge--gray">{normalizedLeads.length}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <input className="admin-search" placeholder="חיפוש לפי שם / טלפון..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select className="admin-filter" value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">כל הסטטוסים</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-excel" onClick={handleExport}>ייצוא Excel ⬇</button>
        </div>

        {loading && <p className="admin-loading">טוען...</p>}
        {error   && <p className="admin-error">{error}</p>}
        {!loading && tabLeads.length === 0 && <p className="admin-empty">לא נמצאו לידים</p>}

        {tabLeads.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="leads-table">
                <thead>
                  <tr>
                    <th>שם</th><th>טלפון</th><th>אימייל</th><th>שירות</th>
                    <th>תאריך</th><th>סטטוס</th><th>הערות</th><th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {tabLeads.map((lead) => (
                    // Fragment with key — fixes React reconciliation issues
                    <Fragment key={lead.id}>
                      <tr>
                        <td className="td-name">{lead.name}</td>
                        <td>{lead.phone}</td>
                        <td className="td-email">{lead.email}</td>
                        <td>{lead.service}</td>
                        <td className="td-date">{formatDate(lead.created_at || lead.createdAt)}</td>
                        <td>
                          <select className="status-select" value={lead.status}
                            onChange={(e) => patchLead(lead.id, { status: e.target.value })}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <Badge status={lead.status}>{lead.status}</Badge>
                        </td>
                        <td className="td-notes">
                          <NoteCell lead={lead} onSave={patchLead} />
                        </td>
                        <td className="td-actions">
                          {/* 1. WhatsApp */}
                          <a href={whatsapp(lead.phone)} target="_blank" rel="noopener noreferrer" className="action-wa" title="וואטסאפ">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </a>

                          {/* 2. Message — ALWAYS shown */}
                          <button
                            className={`action-msg${expandedMsg === lead.id ? ' action-msg--open' : ''}`}
                            onClick={() => setExpandedMsg(expandedMsg === lead.id ? null : lead.id)}
                            title={lead.message ? 'הצג הודעה' : 'אין הודעה'}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                          </button>

                          {/* 3. Action: archive (active) / restore (history) / delete (history) */}
                          {activeTab === 'active' ? (
                            <ConfirmBtn
                              confirmText="להיסטוריה?"
                              onConfirm={async () => {
                                await patchLead(lead.id, { status: 'סגור' });
                                fetchLeads({ search, status: statusFilter, page });
                              }}
                              className="action-archive"
                              title="העבר להיסטוריה"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/>
                                <line x1="10" y1="12" x2="14" y2="12"/>
                              </svg>
                            </ConfirmBtn>
                          ) : (
                            <>
                              <ConfirmBtn
                                confirmText="לפעילים?"
                                onConfirm={async () => {
                                  await patchLead(lead.id, { status: 'חדש' });
                                  fetchLeads({ search, status: statusFilter, page });
                                }}
                                className="action-restore"
                                title="שחזר ללידים פעילים"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                                </svg>
                              </ConfirmBtn>
                              <ConfirmBtn
                                confirmText="מחק?"
                                onConfirm={() => removeLead(lead.id)}
                                className="action-delete"
                                title="מחק לצמיתות"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                              </ConfirmBtn>
                            </>
                          )}
                        </td>
                      </tr>

                      {/* Expanded message row */}
                      {expandedMsg === lead.id && (
                        <tr className="msg-row">
                          <td colSpan={8}>
                            <div className="msg-expand">
                              {lead.message ? (
                                <>
                                  <span className="msg-expand__label">הודעה מ-{lead.name}:</span>
                                  <textarea className="msg-expand__text" readOnly value={lead.message} />
                                </>
                              ) : (
                                <span className="msg-expand__empty">
                                  הלקוח לא הוסיף הודעה בעת הגשת הפנייה
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={`page-btn${p === page ? ' page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
