import React, { useState } from 'react';
import { EMPLOYEES, JOB_SITES, BRANDS, WORK_TYPES, PRODUCTS_BY_BRAND_AND_TYPE, UNITS } from '../constants';
import { createSubmission } from '../api';
import s from './RequestForm.module.css';

function QuantityStepper({ value, onChange }) {
  const num = parseInt(value, 10);
  const decrement = () => {
    if (num > 1) onChange(String(num - 1));
  };
  const increment = () => onChange(String((isNaN(num) ? 0 : num) + 1));
  const handleChange = (e) => {
    const v = e.target.value;
    if (v === '' || /^\d+$/.test(v)) onChange(v);
  };
  return (
    <div className={s.stepper}>
      <button type="button" onClick={decrement} className={s.stepBtn}>−</button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        className={s.stepInput}
        placeholder="0"
      />
      <button type="button" onClick={increment} className={s.stepBtn}>+</button>
    </div>
  );
}

export default function RequestForm({ lang: t, onSubmitted, extraSites = [] }) {
  const allSites = extraSites.length > 0
    ? [...extraSites].sort((a, b) => a.localeCompare(b))
    : JOB_SITES;
  const [form, setForm] = useState({
    employeeName: '', jobSite: '', requestType: '',
    brand: '', workType: '', product: '', tool: '', description: '',
    quantity: '', unit: 'Units',
    neededBy: '', priority: 'normal', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleTypeChange = (val) => {
    setForm(f => ({ ...f, requestType: val, brand: '', workType: '', product: '', tool: '', description: '', quantity: '', unit: 'Units' }));
  };

  const handleBrandChange = (val) => {
    setForm(f => ({ ...f, brand: val, workType: '', product: '' }));
  };

  const handleWorkTypeChange = (val) => {
    setForm(f => ({ ...f, workType: val, product: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employeeName || !form.jobSite || !form.requestType) { setError(t.required); return; }
    if (form.requestType === 'other' && !form.description) { setError(t.required); return; }
    setError('');
    setLoading(true);

    let details = {};
    if (form.requestType === 'material') details = { brand: form.brand, workType: form.workType, product: form.product, unit: form.unit };
    else if (form.requestType === 'tool') details = { tool: form.tool, unit: form.unit };
    else details = { description: form.description, unit: form.unit };

    try {
      const submission = await createSubmission({
        employeeName: form.employeeName,
        jobSite: form.jobSite,
        requestType: form.requestType,
        details,
        quantity: form.quantity || null,
        neededBy: form.neededBy || null,
        priority: form.priority,
        notes: form.notes
      });
      onSubmitted(submission);
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
            {allSites.map(site => <option key={site}>{site}</option>)}
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

        {form.requestType === 'material' && (() => {
          const availableWorkTypes = form.brand
            ? WORK_TYPES.filter(wt => (PRODUCTS_BY_BRAND_AND_TYPE[form.brand]?.[wt] || []).length > 0)
            : [];
          const availableProducts = form.brand && form.workType
            ? (PRODUCTS_BY_BRAND_AND_TYPE[form.brand]?.[form.workType] || [])
            : [];
          return (
            <div className={s.conditional}>
              <div>
                <label className={s.label}>{t.brand}</label>
                <div className={s.selectWrap}>
                  <select value={form.brand} onChange={e => handleBrandChange(e.target.value)}>
                    <option value="">{t.selectBrand}</option>
                    {BRANDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={s.label}>{t.workType}</label>
                <div className={s.selectWrap}>
                  <select value={form.workType} onChange={e => handleWorkTypeChange(e.target.value)} disabled={!form.brand}>
                    <option value="">{form.brand ? t.selectWorkType : t.selectBrand}</option>
                    {availableWorkTypes.map(wt => <option key={wt}>{wt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={s.label}>{t.product}</label>
                <div className={s.selectWrap}>
                  <select value={form.product} onChange={e => set('product', e.target.value)} disabled={!form.workType}>
                    <option value="">{form.workType ? t.selectProduct : t.selectWorkType}</option>
                    {availableProducts.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={s.label}>{t.quantity}</label>
                <div className={s.qtyRow}>
                  <QuantityStepper value={form.quantity} onChange={v => set('quantity', v)} />
                  <div className={`${s.selectWrap} ${s.unitSelect}`}>
                    <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
              <div className={s.qtyRow}>
                <QuantityStepper value={form.quantity} onChange={v => set('quantity', v)} />
                <div className={`${s.selectWrap} ${s.unitSelect}`}>
                  <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
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
              <div className={s.qtyRow}>
                <QuantityStepper value={form.quantity} onChange={v => set('quantity', v)} />
                <div className={`${s.selectWrap} ${s.unitSelect}`}>
                  <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={s.section}>
        <label className={s.label}>{t.whenNeeded}</label>
        <div className={s.timingGrid}>
          {t.timingOptions.map((opt, i) => (
            <button
              key={opt.label}
              type="button"
              className={`${s.timingBtn} ${form.neededBy === opt.label ? s.timingBtnSel : ''} ${i === t.timingOptions.length - 1 ? s.spanTwo : ''}`}
              onClick={() => setForm(f => ({ ...f, neededBy: opt.label, priority: opt.priority }))}
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
