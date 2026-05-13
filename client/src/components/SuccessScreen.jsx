import React from 'react';
import s from './SuccessScreen.module.css';

export default function SuccessScreen({ lang: t, submission, onReset }) {
  const typeLabel = submission.requestType === 'material' ? t.material
    : submission.requestType === 'tool' ? t.toolType : t.other;

  const detail = (() => {
    const d = submission.details || {};
    if (submission.requestType === 'material') return [d.brand, d.workType, d.product].filter(Boolean).join(' – ');
    if (submission.requestType === 'tool') return d.tool;
    return d.description;
  })();

  const qtyDisplay = (() => {
    if (!submission.quantity) return null;
    const unit = submission.details?.unit;
    return unit ? `${submission.quantity} ${unit}` : submission.quantity;
  })();

  return (
    <div className={s.wrapper}>
      <div className={s.icon}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4.5 10.5l4 4 7-8" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className={s.title}>{t.successTitle}</h2>
      <p className={s.sub}>{t.successSub}</p>

      <div className={s.card}>
        {[
          [t.employeeName, submission.employeeName],
          [t.jobSite, submission.jobSite],
          [t.requestType, typeLabel],
          detail && [t.details, detail],
          qtyDisplay && [t.qty, qtyDisplay],
          submission.notes && [t.notes, submission.notes],
          ['Status', t.statusPending],
        ].filter(Boolean).map(([label, val]) => (
          <div className={s.row} key={label}>
            <span className={s.rowLabel}>{label}</span>
            <span className={s.rowVal}>{val}</span>
          </div>
        ))}
      </div>

      <button className={s.resetBtn} onClick={onReset}>{t.newRequest}</button>
    </div>
  );
}
