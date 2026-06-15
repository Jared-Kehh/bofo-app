import React, { useState, useEffect } from 'react';
import { JOB_SITES } from '../constants';
import { getReports, deleteReport } from '../api';
import styles from './DailyReportAdmin.module.css';

async function downloadPhoto(url, filename) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'photo.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    window.open(url, '_blank');
  }
}

function photoFilename(report, index) {
  const name = (report.employeeName || 'photo').replace(/\s+/g, '_');
  const date = report.date || new Date(report.timestamp).toISOString().split('T')[0];
  return `${name}_${date}_photo${index + 1}.jpg`;
}

export default function DailyReportAdmin({ refreshKey, sites = JOB_SITES }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { url, filename }
  const [downloading, setDownloading] = useState(null);

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

  const handleDownloadAll = async (report, e) => {
    e.stopPropagation();
    if (!report.photoUrls?.length) return;
    setDownloading(report.id);
    for (let i = 0; i < report.photoUrls.length; i++) {
      await downloadPhoto(report.photoUrls[i], photoFilename(report, i));
      if (i < report.photoUrls.length - 1) await new Promise(r => setTimeout(r, 200));
    }
    setDownloading(null);
  };

  const uniqueEmployees = [...new Set(reports.map(r => r.employeeName))].sort();
  const sortedSites = [...sites].sort((a, b) => a.localeCompare(b));

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
          {sortedSites.map(s => <option key={s} value={s}>{s}</option>)}
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
                  {report.photoUrls?.length > 0 && (
                    <button
                      className={styles.dlAllBtn}
                      onClick={e => handleDownloadAll(report, e)}
                      disabled={downloading === report.id}
                      title="Download all photos"
                    >
                      {downloading === report.id ? '…' : '↓ All'}
                    </button>
                  )}
                  <span className={styles.chevron}>{expanded === report.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === report.id && (
                <div className={styles.cardBody}>
                  {report.notes && (
                    <div className={styles.notes}>
                      <span className={styles.notesLabel}>Notes</span>
                      <p className={styles.notesText}>{report.notes}</p>
                    </div>
                  )}

                  {report.photoUrls?.length > 0 ? (
                    <div className={styles.photoGrid}>
                      {report.photoUrls.map((url, i) => (
                        <div key={i} className={styles.photoWrap}>
                          <img
                            src={url}
                            alt={`Photo ${i + 1}`}
                            className={styles.photo}
                            onClick={() => setLightbox({ url, filename: photoFilename(report, i) })}
                          />
                          <button
                            className={styles.photoDownloadBtn}
                            onClick={() => downloadPhoto(url, photoFilename(report, i))}
                            title="Download"
                          >
                            ↓
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.noPhotos}>No photos attached.</p>
                  )}

                  <button
                    className={styles.deleteBtn}
                    onClick={e => handleDelete(report.id, e)}
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
            <img src={lightbox.url} alt="Full size" className={styles.lightboxImg} />
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}>×</button>
            <button
              className={styles.lightboxDownload}
              onClick={() => downloadPhoto(lightbox.url, lightbox.filename)}
              title="Download photo"
            >
              ↓
            </button>
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
