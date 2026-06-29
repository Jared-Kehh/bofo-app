import React, { useState, useEffect } from 'react';
import ManageLocations from './ManageLocations';
import {
  getEmployees, addEmployee, deleteEmployee,
  getBrands,    addBrand,    deleteBrand,
  getWorkTypes, addWorkType, deleteWorkType,
  getProducts,  addProduct,  deleteProduct,
  getTools,     addTool,     deleteTool,
  getUnits,     addUnit,     deleteUnit,
} from '../api';
import s from './ManageAll.module.css';

// ── Reusable list section ─────────────────────────────────────────────────

function ListSection({ title, items, onAdd, onDelete, placeholder, t }) {
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    const name = input.trim();
    if (!name) return;
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      setError(t.itemExists || 'Already in the list.');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await onAdd(name);
      setInput('');
    } catch {
      setError(t.addFailed || 'Failed to add. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch {
      alert(t.deleteFailed || 'Failed to remove. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{title}</h3>
      <div className={s.addRow}>
        <input
          className={s.addInput}
          type="text"
          placeholder={placeholder}
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          disabled={adding}
        />
        <button
          className={s.addBtn}
          onClick={handleAdd}
          disabled={adding || !input.trim()}
        >
          {adding ? (t.adding || 'Adding…') : (t.add || 'Add')}
        </button>
      </div>
      {error && <p className={s.errorMsg}>{error}</p>}

      {sorted.length === 0 ? (
        <p className={s.empty}>{t.noItemsYet || 'No items yet.'}</p>
      ) : (
        <div className={s.list}>
          <div className={s.count}>{sorted.length} items</div>
          {sorted.map(item => (
            <div key={item.id} className={s.listRow}>
              <span className={s.listName}>{item.name}</span>
              <button
                className={s.removeBtn}
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                aria-label={`Remove ${item.name}`}
              >
                {deletingId === item.id ? '…' : '×'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Products sub-section ──────────────────────────────────────────────────

function ProductsSection({ brands, workTypes, products, onAdd, onDelete, t }) {
  const [selBrand, setSelBrand] = useState('');
  const [selWorkType, setSelWorkType] = useState('');
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const filteredProducts = products
    .filter(p => p.brand === selBrand && p.workType === selWorkType)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = async () => {
    const name = input.trim();
    if (!name || !selBrand || !selWorkType) return;
    if (filteredProducts.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      setError(t.itemExists || 'Already in the list.');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await onAdd(selBrand, selWorkType, name);
      setInput('');
    } catch {
      setError(t.addFailed || 'Failed to add. Try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch {
      alert(t.deleteFailed || 'Failed to remove. Try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const sortedBrands    = [...brands].sort((a, b) => a.name.localeCompare(b.name));
  const sortedWorkTypes = [...workTypes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{t.productsSection || 'Products'}</h3>

      <div className={s.selectorRow}>
        <div className={s.selectWrap}>
          <select
            value={selBrand}
            onChange={e => { setSelBrand(e.target.value); setSelWorkType(''); }}
          >
            <option value="">{t.selectBrand || 'Select brand…'}</option>
            {sortedBrands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
          </select>
        </div>
        <div className={s.selectWrap}>
          <select
            value={selWorkType}
            onChange={e => setSelWorkType(e.target.value)}
            disabled={!selBrand}
          >
            <option value="">{selBrand ? (t.selectWorkType || 'Select work type…') : (t.selectBrand || 'Select brand first')}</option>
            {selBrand && sortedWorkTypes.map(wt => <option key={wt.id} value={wt.name}>{wt.name}</option>)}
          </select>
        </div>
      </div>

      {(!selBrand || !selWorkType) ? (
        <p className={s.empty}>{t.selectBrandForProducts || 'Select a brand and work type to manage products.'}</p>
      ) : (
        <>
          <div className={s.addRow}>
            <input
              className={s.addInput}
              type="text"
              placeholder={t.newProductPlaceholder || 'New product name…'}
              value={input}
              onChange={e => { setInput(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              disabled={adding}
            />
            <button
              className={s.addBtn}
              onClick={handleAdd}
              disabled={adding || !input.trim()}
            >
              {adding ? (t.adding || 'Adding…') : (t.add || 'Add')}
            </button>
          </div>
          {error && <p className={s.errorMsg}>{error}</p>}

          {filteredProducts.length === 0 ? (
            <p className={s.empty}>{t.noItemsYet || 'No products for this combination.'}</p>
          ) : (
            <div className={s.list}>
              <div className={s.count}>{filteredProducts.length} products</div>
              {filteredProducts.map(p => (
                <div key={p.id} className={s.listRow}>
                  <span className={s.listName}>{p.name}</span>
                  <button
                    className={s.removeBtn}
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    aria-label={`Remove ${p.name}`}
                  >
                    {deletingId === p.id ? '…' : '×'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function ManageAll({ lang: t = {}, onLocationsChange, onChanged }) {
  const [tab, setTab] = useState('sites');
  const [employees,  setEmployees]  = useState([]);
  const [brands,     setBrands]     = useState([]);
  const [workTypes,  setWorkTypes]  = useState([]);
  const [products,   setProducts]   = useState([]);
  const [tools,      setTools]      = useState([]);
  const [units,      setUnits]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const results = await Promise.allSettled([
      getEmployees(), getBrands(), getWorkTypes(), getProducts(), getTools(), getUnits(),
    ]);
    const [emps, brnds, wts, prods, tls, unts] = results;
    if (emps.status   === 'fulfilled') setEmployees(emps.value);
    if (brnds.status  === 'fulfilled') setBrands(brnds.value);
    if (wts.status    === 'fulfilled') setWorkTypes(wts.value);
    if (prods.status  === 'fulfilled') setProducts(prods.value);
    if (tls.status    === 'fulfilled') setTools(tls.value);
    if (unts.status   === 'fulfilled') setUnits(unts.value);
    setLoading(false);
  };

  const notify = () => onChanged?.();

  // Factories for list handlers
  const makeHandlers = (setter, adder, deleter) => ({
    onAdd: async (name) => {
      const item = await adder(name);
      setter(prev => [...prev, item]);
      notify();
    },
    onDelete: async (id) => {
      await deleter(id);
      setter(prev => prev.filter(i => i.id !== id));
      notify();
    },
  });

  const empHandlers  = makeHandlers(setEmployees,  addEmployee,  deleteEmployee);
  const bndHandlers  = makeHandlers(setBrands,     addBrand,     deleteBrand);
  const wtHandlers   = makeHandlers(setWorkTypes,  addWorkType,  deleteWorkType);
  const toolHandlers = makeHandlers(setTools,      addTool,      deleteTool);
  const unitHandlers = makeHandlers(setUnits,      addUnit,      deleteUnit);

  const productHandlers = {
    onAdd: async (brand, workType, name) => {
      const item = await addProduct(brand, workType, name);
      setProducts(prev => [...prev, item]);
      notify();
    },
    onDelete: async (id) => {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      notify();
    },
  };

  const tabs = [
    { key: 'sites',      label: t.manageSitesTab      || 'Sites' },
    { key: 'employees',  label: t.manageEmployeesTab  || 'Employees' },
    { key: 'materials',  label: t.manageMaterialsTab  || 'Materials' },
    { key: 'toolsUnits', label: t.manageToolsUnitsTab || 'Tools & Units' },
  ];

  return (
    <div className={s.container}>
      <div className={s.subNav}>
        {tabs.map(tb => (
          <button
            key={tb.key}
            className={`${s.subNavBtn} ${tab === tb.key ? s.subNavActive : ''}`}
            onClick={() => setTab(tb.key)}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'sites' && (
        <ManageLocations onLocationsChange={onLocationsChange} />
      )}

      {tab === 'employees' && (
        loading ? <div className={s.loadingMsg}>Loading…</div> : (
          <div className={s.content}>
            <ListSection
              title={t.employeesSection || 'Employees'}
              items={employees}
              onAdd={empHandlers.onAdd}
              onDelete={empHandlers.onDelete}
              placeholder={t.newEmployeePlaceholder || 'New employee name…'}
              t={t}
            />
          </div>
        )
      )}

      {tab === 'materials' && (
        loading ? <div className={s.loadingMsg}>Loading…</div> : (
          <div className={s.content}>
            <ListSection
              title={t.brandsSection || 'Brands'}
              items={brands}
              onAdd={bndHandlers.onAdd}
              onDelete={bndHandlers.onDelete}
              placeholder={t.newBrandPlaceholder || 'New brand…'}
              t={t}
            />
            <ListSection
              title={t.workTypesSection || 'Work Types'}
              items={workTypes}
              onAdd={wtHandlers.onAdd}
              onDelete={wtHandlers.onDelete}
              placeholder={t.newWorkTypePlaceholder || 'New work type…'}
              t={t}
            />
            <ProductsSection
              brands={brands}
              workTypes={workTypes}
              products={products}
              onAdd={productHandlers.onAdd}
              onDelete={productHandlers.onDelete}
              t={t}
            />
          </div>
        )
      )}

      {tab === 'toolsUnits' && (
        loading ? <div className={s.loadingMsg}>Loading…</div> : (
          <div className={s.content}>
            <ListSection
              title={t.toolsSection || 'Tools'}
              items={tools}
              onAdd={toolHandlers.onAdd}
              onDelete={toolHandlers.onDelete}
              placeholder={t.newToolPlaceholder || 'New tool…'}
              t={t}
            />
            <ListSection
              title={t.unitsSection || 'Units'}
              items={units}
              onAdd={unitHandlers.onAdd}
              onDelete={unitHandlers.onDelete}
              placeholder={t.newUnitPlaceholder || 'New unit…'}
              t={t}
            />
          </div>
        )
      )}
    </div>
  );
}
