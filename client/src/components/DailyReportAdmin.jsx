import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import { JOB_SITES } from '../constants';
import { getReports, deleteReport } from '../api';
import styles from './DailyReportAdmin.module.css';

// ── helpers ────────────────────────────────────────────────────────────────

function sanitize(str) {
  return (str || 'unknown')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadPhoto(url, filename) {
  try {
    const blob = await fetchBlob(url);
    triggerDownload(blob, filename || 'photo.jpg');
  } catch {
    window.open(url, '_blank');
  }
}

function photoFilename(report, index) {
  const name = (report.employeeName || 'photo').replace(/\s+/g, '_');
  const date = report.date || isoDate(report.timestamp);
  return `${name}_${date}_photo${index + 1}.jpg`;
}

function reportBaseName(report) {
  const date = report.date || isoDate(report.timestamp);
  return `${sanitize(report.jobSite)}_${date}_${sanitize(report.employeeName)}`;
}

function isoDate(ts) {
  return new Date(ts).toISOString().split('T')[0];
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ── ZIP builder ────────────────────────────────────────────────────────────

async function buildZip(photoUrls, folderPrefix = '') {
  const zip = new JSZip();
  for (let i = 0; i < photoUrls.length; i++) {
    try {
      const blob = await fetchBlob(photoUrls[i]);
      const ext = blob.type.includes('png') ? '.png' : '.jpg';
      const name = folderPrefix
        ? `${folderPrefix}/photo${i + 1}${ext}`
        : `photo${i + 1}${ext}`;
      zip.file(name, blob);
    } catch {
      // skip failed photo, continue
    }
  }
  return zip.generateAsync({ type: 'blob' });
}

// ── PDF builder ────────────────────────────────────────────────────────────

async function buildPdf(report) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 16;
  const pageW = 210;
  const contentW = pageW - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 15, 15);
  doc.text('Daily Work Report', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Bofo Waterproofing Systems', margin, y);
  y += 8;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Info rows
  doc.setTextColor(15, 15, 15);
  doc.setFontSize(10);
  const infoRows = [
    ['Employee', report.employeeName || '—'],
    ['Job Site', report.jobSite || '—'],
    ['Date', report.date || fmtDate(report.timestamp)],
    ['Photos', String(report.photoUrls?.length || 0)],
  ];
  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'bold');
    doc.text(label + ':', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 30, y);
    y += 6;
  }

  // Notes
  if (report.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(report.notes, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
    doc.setTextColor(15, 15, 15);
  }

  // Photos
  const urls = report.photoUrls || [];
  if (urls.length > 0) {
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Photos:', margin, y);
    y += 8;

    const cols = 2;
    const gap = 6;
    const imgW = (contentW - gap * (cols - 1)) / cols;
    const imgH = Math.round(imgW * 0.75); // 4:3

    for (let i = 0; i < urls.length; i++) {
      const col = i % cols;

      if (col === 0 && i > 0) {
        y += imgH + gap;
      }

      // page break at the start of each row
      if (col === 0 && y + imgH > 275) {
        doc.addPage();
        y = margin;
      }

      const x = margin + col * (imgW + gap);

      try {
        const blob = await fetchBlob(urls[i]);
        const dataUrl = await blobToDataUrl(blob);
        const fmt = blob.type.includes('png') ? 'PNG' : 'JPEG';
        doc.addImage(dataUrl, fmt, x, y, imgW, imgH);
      } catch {
        doc.setDrawColor(200);
        doc.setFillColor(245, 245, 245);
        doc.rect(x, y, imgW, imgH, 'FD');
        doc.setTextColor(160);
        doc.setFontSize(8);
        doc.text('Photo unavailable', x + 2, y + imgH / 2);
        doc.setTextColor(15, 15, 15);
        doc.setFontSize(10);
      }
    }
  }

  return doc;
}

// ── component ──────────────────────────────────────────────────────────────

export default function DailyReportAdmin({ refreshKey, sites = JOB_SITES, lang = {} }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { url, filename }
  const [zipping, setZipping] = useState(null);   // report.id while building per-report ZIP
  const [exporting, setExporting] = useState(null); // report.id while building PDF
  const [dlAllState, setDlAllState] = useState({ active: false, done: 0, total: 0 });

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

  // Feature 1 — per-report ZIP
  const handleZipReport = async (report, e) => {
    e.stopPropagation();
    if (!report.photoUrls?.length) return;
    setZipping(report.id);
    try {
      const blob = await buildZip(report.photoUrls);
      triggerDownload(blob, `${reportBaseName(report)}.zip`);
    } finally {
      setZipping(null);
    }
  };

  // Feature 4 — per-report PDF
  const handleExportPdf = async (report, e) => {
    e.stopPropagation();
    setExporting(report.id);
    try {
      const doc = await buildPdf(report);
      doc.save(`${reportBaseName(report)}.pdf`);
    } finally {
      setExporting(null);
    }
  };

  // Feature 3 — filtered "Download All" ZIP
  const handleDownloadAllFiltered = async () => {
    const withPhotos = filtered.filter(r => r.photoUrls?.length > 0);
    if (!withPhotos.length) return;

    const total = withPhotos.reduce((s, r) => s + r.photoUrls.length, 0);
    setDlAllState({ active: true, done: 0, total });

    const zip = new JSZip();
    let done = 0;

    for (const report of withPhotos) {
      const date = report.date || isoDate(report.timestamp);
      const folder = `${sanitize(report.jobSite)}/${date}/${sanitize(report.employeeName)}`;
      for (let i = 0; i < report.photoUrls.length; i++) {
        try {
          const blob = await fetchBlob(report.photoUrls[i]);
          const ext = blob.type.includes('png') ? '.png' : '.jpg';
          zip.file(`${folder}/photo${i + 1}${ext}`, blob);
        } catch {
          // skip failed photo
        }
        done++;
        setDlAllState({ active: true, done, total });
      }
    }

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(blob, 'work_reports.zip');
    } finally {
      setDlAllState({ active: false, done: 0, total: 0 });
    }
  };

  const uniqueEmployees = [...new Set(reports.map(r => r.employeeName))].sort();
  const sortedSites = [...sites].sort((a, b) => a.localeCompare(b));

  const filtered = reports.filter(r => {
    if (filterSite && r.jobSite !== filterSite) return false;
    if (filterEmployee && r.employeeName !== filterEmployee) return false;
    if (filterDate) {
      const rDate = r.date || new Date(r.timestamp).toLocaleDateString('en-CA');
      if (rDate !== filterDate) return false;
    }
    return true;
  });

  const totalPhotos = reports.reduce((s, r) => s + (r.photoUrls?.length || 0), 0);
  const filteredPhotos = filtered.reduce((s, r) => s + (r.photoUrls?.length || 0), 0);

  const t = {
    downloadZip: 'Download ZIP',
    exportPdf: 'Export PDF',
    downloadAll: 'Download All',
    buildingZip: 'Building ZIP…',
    generatingPdf: 'Generating PDF…',
    ...lang,
  };

  return (
    <div className={styles.container}>
      {/* Stats */}
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

      {/* Filters */}
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

        {/* Feature 3 — Download All filtered */}
        {filteredPhotos > 0 && (
          <button
            className={styles.downloadAllBtn}
            onClick={handleDownloadAllFiltered}
            disabled={dlAllState.active}
          >
            {dlAllState.active
              ? `${t.buildingZip} ${dlAllState.done}/${dlAllState.total}`
              : `${t.downloadAll} (${filteredPhotos} photos)`}
          </button>
        )}
      </div>

      {loading ? (
        <p className={styles.empty}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>No reports found.</p>
      ) : (
        <div className={styles.list}>
          {filtered.map(report => (
            <div key={report.id} className={styles.card}>
              {/* Card header — click to expand */}
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

                  {/* Feature 1 — per-report ZIP button */}
                  {report.photoUrls?.length > 0 && (
                    <button
                      className={styles.dlAllBtn}
                      onClick={e => handleZipReport(report, e)}
                      disabled={zipping === report.id}
                      title={t.downloadZip}
                    >
                      {zipping === report.id ? '…' : '↓ ZIP'}
                    </button>
                  )}

                  <span className={styles.chevron}>{expanded === report.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === report.id && (
                <div className={styles.cardBody}>
                  {/* Notes */}
                  {report.notes && (
                    <div className={styles.notes}>
                      <span className={styles.notesLabel}>Notes</span>
                      <p className={styles.notesText}>{report.notes}</p>
                    </div>
                  )}

                  {/* Action buttons row */}
                  <div className={styles.actionRow}>
                    {/* Feature 4 — Export PDF */}
                    <button
                      className={styles.pdfBtn}
                      onClick={e => handleExportPdf(report, e)}
                      disabled={exporting === report.id}
                    >
                      {exporting === report.id ? t.generatingPdf : t.exportPdf}
                    </button>
                  </div>

                  {/* Feature 2 — Photo grid with individual download buttons */}
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

      {/* Lightbox */}
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
