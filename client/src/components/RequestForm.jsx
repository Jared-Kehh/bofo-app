import React, { useState } from 'react';
import { EMPLOYEES, JOB_SITES, BRANDS } from '../constants';
import s from './RequestForm.module.css';

export default function RequestForm({ lang: t, onSubmitted }) {
  const [form, setForm] = useState({
    employeeName: '', jobSite: '', requestType: '',
    brand: '', product: '', tool: '', description: '', quantity: '',
    neededBy: '', priority: 'normal', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTypeChange = (val) => {
    setForm(f => ({ ...f, requestType: val, brand: '', product: '', tool: '', description: '', quantity: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeName || !form.jobSite || !form.requestType) { setError(t.required); return; }
    if (form.requestType === 'other' && !form.description) { setError(t.required); return; }
    setError('');
    setLoading(true);

    let details = {};
    if (form.requestType === 'material') details = { brand: form.brand, product: form.product };
    else if (form.requestType === 'tool') details = { tool: form.tool };
    else details = { description: form.description };

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: form.employeeName,
          jobSite: form.jobSite,
          requestType: form.requestType,
          details,
          quantity: form.quantity || null,
          neededBy: form.neededBy || null,
          priority: form.priority,
          notes: form.notes
        })
      });
      if (!res.ok) throw new Error();
      onSubmitted(await res.json());
    } catch {
      setError(t.errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={s.form} onSubmit={handleSubmit} noValidate>

      <div className={s.section}>
        <label className={s.label}>{t.employeeName} <span className={s.req}>*</span></label>
        <div className={s.selectWrap}>
          <select value={form.employeeName} onChange={e => set('employeeName', e.target.value)}>
            <option value="">{t.selectName}</option>
            {EMPLOYEES.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div className={s.section}>
        <label className={s.label}>{t.jobSite} <span className={s.req}>*</span></label>
        <div className={s.selectWrap}>
          <select value={form.jobSite} onChange={e => set('jobSite', e.target.value)}>
            <option value="">{t.selectSite}</option>
            {JOB_SITES.map(site => <option key={site}>{site}</option>)}
          </select>
        </div>
      </div>

      <div className={s.section}>
        <label className={s.label}>{t.requestType} <span className={s.req}>*</span></label>
        <div className={s.typeGrid}>
          {[
            { val: 'material', label: t.material },
            { val: 'tool', label: t.toolType },
            { val: 'other', label: t.other },
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              className={`${s.typeBtn} ${form.requestType === opt.val ? s.typeBtnSel : ''}`}
              onClick={() => handleTypeChange(opt.val)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {form.requestType === 'material' && (
          <div className={s.conditional}>
            <div>
              <label className={s.label}>{t.brand}</label>
              <div className={s.selectWrap}>
                <select value={form.brand} onChange={e => set('brand', e.target.value)}>
                  <option value="">{t.selectBrand}</option>
                  {BRANDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={s.label}>{t.product}</label>
              <input type="text" value={form.product} onChange={e => set('product', e.target.value)} placeholder={t.productPlaceholder} />
            </div>
            <div>
              <label className={s.label}>{t.quantity}</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" />
            </div>
          </div>
        )}

        {form.requestType === 'tool' && (
          <div className={s.conditional}>
            <div>
              <label className={s.label}>{t.tool}</label>
              <div className={s.selectWrap}>
                <select value={form.tool} onChange={e => set('tool', e.target.value)}>
                  <option value="">{t.selectTool}</option>
                  {t.tools.map(tool => <option key={tool}>{tool}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={s.label}>{t.quantity}</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" />
            </div>
          </div>
        )}

        {form.requestType === 'other' && (
          <div className={s.conditional}>
            <div>
              <label className={s.label}>{t.describeItem} <span className={s.req}>*</span></label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder={t.descPlaceholder} />
            </div>
            <div>
              <label className={s.label}>{t.quantity}</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} placeholder="0" />
            </div>
          </div>
        )}
      </div>

      <div className={s.section}>
        <label className={s.label}>{t.neededBy}</label>
        <input
          type="text"
          value={form.neededBy}
          onChange={e => set('neededBy', e.target.value)}
          placeholder={t.neededByPlaceholder}
        />
      </div>

      <div className={s.section}>
        <label className={s.label}>{t.priority}</label>
        <div className={s.typeGrid}>
          {[
            { val: 'normal', label: t.priorityNormal },
            { val: 'urgent', label: t.priorityUrgent },
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              className={`${s.typeBtn} ${form.priority === opt.val ? s.typeBtnSel : ''}`}
              onClick={() => set('priority', opt.val)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.section}>
        <label className={s.label}>{t.notes}</label>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder={t.notesPlaceholder} rows={3} />
      </div>

      {error && <div className={s.error}>{error}</div>}

      <div className={s.submitArea}>
        <button type="submit" className={s.submitBtn} disabled={loading}>
          {loading ? t.submitting : t.submit}
        </button>
      </div>

    </form>
  );
}
