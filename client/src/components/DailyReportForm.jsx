import React, { useState, useRef } from 'react';
import { EMPLOYEES, JOB_SITES } from '../constants';
import { uploadReportPhoto, createReport } from '../api';
import styles from './DailyReportForm.module.css';

async function compressImage(file, maxWidth = 1920, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height / width) * maxWidth);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

const MIN_PHOTOS = 4;

export default function DailyReportForm({ onSubmitted, extraSites = [] }) {
  const allSites = extraSites.length > 0
    ? [...extraSites].sort((a, b) => a.localeCompare(b))
    : JOB_SITES;
  const [employee, setEmployee] = useState('');
  const [site, setSite] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const added = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`
    }));
    setPhotos(prev => [...prev, ...added]);
    e.target.value = '';
  };

  const removePhoto = (id) => {
    setPhotos(prev => {
      const p = prev.find(x => x.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter(x => x.id !== id);
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!employee && !site) {
      setError('Please select an employee and job site.');
      return;
    }
    if (!employee) {
      setError('Please select your name.');
      return;
    }
    if (!site) {
      setError('Please select a job site.');
      return;
    }
    if (photos.length < MIN_PHOTOS) {
      setError(`${photos.length} photo${photos.length === 1 ? '' : 's'} added — at least ${MIN_PHOTOS} are required.`);
      return;
    }

    setSubmitting(true);
    setProgress({ done: 0, total: photos.length });

    try {
      let done = 0;
      const urlPromises = photos.map(async (p) => {
        const compressed = await compressImage(p.file);
        const result = await uploadReportPhoto(compressed, site, employee);
        done++;
        setProgress({ done, total: photos.length });
        return result.url;
      });
      const photoUrls = await Promise.all(urlPromises);

      const report = await createReport({ employeeName: employee, jobSite: site, notes, photoUrls });

      photos.forEach(p => URL.revokeObjectURL(p.preview));
      onSubmitted(report);
    } catch (err) {
      setError('Submission failed. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  const photosBadgeOk = photos.length >= MIN_PHOTOS;
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label}>Employee</label>
        <select
          className={styles.select}
          value={employee}
          onChange={e => setEmployee(e.target.value)}
          disabled={submitting}
        >
          <option value="">Select name...</option>
          {EMPLOYEES.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Job Site</label>
        <select
          className={styles.select}
          value={site}
          onChange={e => setSite(e.target.value)}
          disabled={submitting}
        >
          <option value="">Select site...</option>
          {allSites.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className={styles.photoSection}>
        <div className={styles.photoHeader}>
          <label className={styles.label}>Photos</label>
          <span className={`${styles.photoBadge} ${photosBadgeOk ? styles.badgeOk : ''}`}>
            {photos.length} / {MIN_PHOTOS} min
          </span>
        </div>

        {photos.length > 0 && (
          <div className={styles.photoGrid}>
            {photos.map(p => (
              <div key={p.id} className={styles.photoThumb}>
                <img src={p.preview} alt="preview" className={styles.thumbImg} />
                <button
                  className={styles.removeBtn}
                  onClick={() => removePhoto(p.id)}
                  disabled={submitting}
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className={styles.hiddenInput}
          disabled={submitting}
        />
        <button
          className={styles.addPhotoBtn}
          onClick={() => fileInputRef.current.click()}
          disabled={submitting}
        >
          + Add Photos
        </button>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          Notes <span className={styles.optional}>(optional)</span>
        </label>
        <textarea
          className={styles.textarea}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Work completed, progress updates, issues from the field..."
          rows={4}
          disabled={submitting}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {submitting && (
        <div className={styles.progressWrap}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <p className={styles.progressText}>
            Uploading {progress.done} of {progress.total} photos...
          </p>
        </div>
      )}

      <button
        className={styles.submitBtn}
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </div>
  );
}
