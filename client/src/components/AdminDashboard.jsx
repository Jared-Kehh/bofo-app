import React, { useEffect, useState, useMemo } from 'react';
import { JOB_SITES } from '../constants';
import { getSubmissions, updateStatus as apiUpdateStatus, deleteSubmission as apiDeleteSubmission } from '../api';

import s from './AdminDashboard.module.css';

const STATUS_LABELS = { Pending: 'pending', Approved: 'approved', Completed: 'completed' };

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getDetail(sub) {
  const d = sub.details || {};
  if (sub.requestType === 'material') return [d.brand, d.workType, d.product].filter(Boolean).join(' – ') || '—';
  if (sub.requestType === 'tool') return d.tool || '—';
  return d.description || '—';
}

function formatQty(sub) {
  const unit = sub.details?.unit;
  return unit ? `${sub.quantity} ${unit}` : sub.quantity;
}

export default function AdminDashboard({ lang: t, refreshKey, sites = JOB_SITES }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    setLoading(true);
    getSubmissions()
      .then(data => { setSubmissions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refreshKey]);

  const deleteSubmission = async (id) => {
    if (!window.confirm('Delete this submission? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await apiDeleteSubmission(id);
      setSubmissions(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      alert('Failed to delete submission. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await apiUpdateStatus(id, status);
      setSubmissions(prev => prev.map(x => x.id === id ? { ...x, status } : x));
    } finally {
      setUpdating(null);
    }
  };

  const stats = useMemo(() => ({
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'Pending').length,
    approved: submissions.filter(s => s.status === 'Approved').length,
    completed: submissions.filter(s => s.status === 'Completed').length,
  }), [submissions]);

  const filtered = useMemo(() => submissions.filter(sub => {
    const q = search.toLowerCase();
    const matchSearch = !q || sub.employeeName.toLowerCase().includes(q) || sub.jobSite.toLowerCase().includes(q);
    const matchStatus = !filterStatus || sub.status === filterStatus;
    const matchSite = !filterSite || sub.jobSite === filterSite;
    return matchSearch && matchStatus && matchSite;
  }), [submissions, search, filterStatus, filterSite]);

  return (
    <div className={s.dashboard}>

      <div className={s.stats}>
        {[
          { label: t.totalSubmissions, val: stats.total, cls: '' },
          { label: t.pendingCount, val: stats.pending, cls: s.statPending },
          { label: t.approvedCount, val: stats.approved, cls: s.statApproved },
          { label: t.completedCount, val: stats.completed, cls: s.statCompleted },
        ].map(({ label, val, cls }) => (
          <div className={`${s.stat} ${cls}`} key={label}>
            <span className={s.statVal}>{val}</span>
            <span className={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      <div className={s.filters}>
        <input
          className={s.search}
          type="text"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={s.filterRow}>
          <div className={s.selectWrap}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">{t.allStatuses}</option>
              <option value="Pending">{t.statusPending}</option>
              <option value="Approved">{t.statusApproved}</option>
              <option value="Completed">{t.statusCompleted}</option>
            </select>
          </div>
          <div className={s.selectWrap}>
            <select value={filterSite} onChange={e => setFilterSite(e.target.value)}>
              <option value="">{t.allSites}</option>
              {[...sites].sort((a, b) => a.localeCompare(b)).map(site => <option key={site}>{site}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading && <div className={s.empty}>Loading...</div>}

      {!loading && filtered.length === 0 && (
        <div className={s.empty}>{submissions.length === 0 ? t.adminEmpty : 'No results match your filters.'}</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={s.list}>
          {filtered.map(sub => (
            <div className={s.card} key={sub.id}>
              <div className={s.cardHeader}>
                <div>
                  <span className={s.empName}>{sub.employeeName}</span>
                  <span className={s.siteName}>{sub.jobSite}</span>
                </div>
                <span className={`${s.pill} ${s[STATUS_LABELS[sub.status] || 'pending']}`}>
                  {t[`status${sub.status}`] || sub.status}
                </span>
              </div>

              <div className={s.cardBody}>
                <div className={s.metaRow}>
                  <span className={s.metaLabel}>{t.requestType}</span>
                  <span className={s.metaVal}>{sub.requestType.charAt(0).toUpperCase() + sub.requestType.slice(1)}</span>
                </div>
                <div className={s.metaRow}>
                  <span className={s.metaLabel}>{t.details}</span>
                  <span className={s.metaVal}>{getDetail(sub)}</span>
                </div>
                {sub.quantity && (
                  <div className={s.metaRow}>
                    <span className={s.metaLabel}>{t.qty}</span>
                    <span className={s.metaVal}>{formatQty(sub)}</span>
                  </div>
                )}
                {sub.priority && sub.priority === 'urgent' && (
                  <div className={s.metaRow}>
                    <span className={s.metaLabel}>{t.priority}</span>
                    <span className={s.urgentBadge}>{t.priorityUrgent}</span>
                  </div>
                )}
                {sub.neededBy && (
                  <div className={s.metaRow}>
                    <span className={s.metaLabel}>{t.neededBy}</span>
                    <span className={s.metaVal}>{sub.neededBy}</span>
                  </div>
                )}
                {sub.notes && (
                  <div className={s.metaRow}>
                    <span className={s.metaLabel}>{t.notes}</span>
                    <span className={s.metaVal}>{sub.notes}</span>
                  </div>
                )}
                <div className={s.metaRow}>
                  <span className={s.metaLabel}>Submitted</span>
                  <span className={s.metaTime}>{formatTime(sub.timestamp)}</span>
                </div>
              </div>

              <div className={s.cardFooter}>
                {sub.status !== 'Pending' && (
                  <button
                    className={s.actionBtn}
                    onClick={() => updateStatus(sub.id, 'Pending')}
                    disabled={updating === sub.id || deleting === sub.id}
                  >{t.markPending}</button>
                )}
                {sub.status !== 'Approved' && (
                  <button
                    className={`${s.actionBtn} ${s.actionApprove}`}
                    onClick={() => updateStatus(sub.id, 'Approved')}
                    disabled={updating === sub.id || deleting === sub.id}
                  >{t.markApproved}</button>
                )}
                {sub.status !== 'Completed' && (
                  <button
                    className={`${s.actionBtn} ${s.actionComplete}`}
                    onClick={() => updateStatus(sub.id, 'Completed')}
                    disabled={updating === sub.id || deleting === sub.id}
                  >{t.markCompleted}</button>
                )}
                <button
                  className={`${s.actionBtn} ${s.actionDelete}`}
                  onClick={() => deleteSubmission(sub.id)}
                  disabled={deleting === sub.id || updating === sub.id}
                >{deleting === sub.id ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
