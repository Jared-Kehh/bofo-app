import React, { useState, useEffect } from 'react';
import { JOB_SITES } from '../constants';
import { getLocations, addLocation, deleteLocation, seedLocations } from '../api';
import s from './ManageLocations.module.css';

const SEED_KEY = 'bofo_locations_seeded';

export default function ManageLocations({ onLocationsChange }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const data = await getLocations();
        if (data.length === 0 && !localStorage.getItem(SEED_KEY)) {
          const seeded = await seedLocations(JOB_SITES);
          const all = Array.isArray(seeded) && seeded.length ? seeded : await getLocations();
          localStorage.setItem(SEED_KEY, '1');
          setLocations(all);
          onLocationsChange(all);
        } else {
          localStorage.setItem(SEED_KEY, '1');
          setLocations(data);
          onLocationsChange(data);
        }
      } catch {
        // API unavailable — forms will fall back to constants
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const sorted = [...locations].sort((a, b) => a.name.localeCompare(b.name));

  const handleAdd = async () => {
    const name = input.trim();
    if (!name) return;
    if (locations.some(l => l.name.toLowerCase() === name.toLowerCase())) {
      setError('This location already exists.');
      return;
    }
    setAdding(true);
    setError('');
    try {
      const newLoc = await addLocation(name);
      const updated = [...locations, newLoc];
      setLocations(updated);
      onLocationsChange(updated);
      setInput('');
    } catch {
      setError('Failed to add location. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteLocation(id);
      const updated = locations.filter(l => l.id !== id);
      setLocations(updated);
      onLocationsChange(updated);
    } catch {
      alert('Failed to delete location.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.addRow}>
        <input
          className={s.input}
          type="text"
          placeholder="New location name..."
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
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <p className={s.error}>{error}</p>}

      {loading ? (
        <div className={s.empty}>Loading locations…</div>
      ) : (
        <>
          <div className={s.count}>{sorted.length} locations</div>
          <div className={s.list}>
            {sorted.map(loc => (
              <div key={loc.id} className={s.row}>
                <span className={s.name}>{loc.name}</span>
                <button
                  className={s.deleteBtn}
                  onClick={() => handleDelete(loc.id)}
                  disabled={deleting === loc.id}
                  aria-label={`Remove ${loc.name}`}
                >
                  {deleting === loc.id ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
