import React, { useState, useEffect } from 'react';
import { JOB_SITES } from '../constants';
import { getReports, deleteReport } from '../api';
import styles from './DailyReportAdmin.module.css';

export default function DailyReportAdmin({ refreshKey }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => { load(); }, [refreshKey]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    try {
      await deleteReport(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (expanded === id) setExpanded(null);
    } catch {
      alert('Failed to delete report.');
    }
  };

  const uniqueEmployees = [...new Set(reports.map(r => r.employeeName))].sort();

  const filtered = reports.filter(r => {
    if (filterSite && r.jobSite !== filterSite) return false;
    if (filterEmployee && r.employeeName !== filterEmployee) return false;
    if (filterDate) {
      const rDate = new Date(r.timestamp).toLocaleDateString('en-CA');
      if (rDate !== filterDate) return false;
    }
    return true;
  });

  const totalPhotos = reports.reduce((sum, r) => sum + (r.photoUrls?.length || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNum}>{reports.length}</span>
          <span className={styles.statLabel}>Total Reports</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNum}>{totalPhotos}</span>
          <span className={styles.statLabel}>Total Photos</span>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filterSite}
          onChange={e => setFilterSite(e.target.value)}
        >
          <option value="">All Sites</option>
          {JOB_SITES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className={styles.filterSelect}
          value={filterEmployee}
          onChange={e => setFilterEmployee(e.target.value)}
        >
          <option value="">All Employees</option>
          {uniqueEmployees.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input
          type="date"
          className={styles.filterInput}
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>No reports found.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map(report => (
            <div key={report.id} className={styles.card}>
              <div
                className={styles.cardHead}
                onClick={() => setExpanded(expanded === report.id ? null : report.id)}
              >
                <div className={styles.cardLeft}>
                  <span className={styles.empName}>{report.employeeName}</span>
                  <span className={styles.jobSite}>{report.jobSite}</span>
                </div>
                <div className={styles.cardRight}>
                  <span className={styles.photoCount}>{report.photoUrls?.length || 0} photos</span>
                  <span className={styles.date}>{fmtDate(report.timestamp)}</span>
                  <span className={styles.chevron}>{expanded === report.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === report.id && (
                <div className={styles.cardBody}>
                  {report.notes ? (
                    <div className={styles.notes}>
                      <span className={styles.notesLabel}>Notes</span>
                      <p className={styles.notesText}>{report.notes}</p>
                    </div>
                  ) : null}

                  {report.photoUrls?.length > 0 ? (
                    <div className={styles.photoGrid}>
                      {report.photoUrls.map((url, i) => (
                        <div key={i} className={styles.photoWrap} onClick={() => setLightbox(url)}>
                          <img src={url} alt={`Photo ${i + 1}`} className={styles.photo} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noPhotos}>No photos attached.</p>
                  )}

                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDelete(report.id, e)}
                  >
                    Delete Report
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <div className={styles.lightboxInner} onClick={e => e.stopPropagation()}>
            <img src={lightbox} alt="Full size" className={styles.lightboxImg} />
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}
