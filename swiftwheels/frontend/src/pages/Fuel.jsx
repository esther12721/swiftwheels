import { useState, useEffect } from 'react';
import axios from 'axios';

const INITIAL = { vehicle: '', driver: '', date: '', liters: '', pricePerLiter: '', odometer: '', station: '', notes: '' };

export default function Fuel() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [r, v, d] = await Promise.all([
        axios.get('/api/fuel'),
        axios.get('/api/vehicles'),
        axios.get('/api/drivers')
      ]);
      setRecords(r.data);
      setVehicles(v.data);
      setDrivers(d.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Prevents passing an implicit Promise to useEffect, which causes the "destroy is not a function" crash
  useEffect(() => {
    load();
  }, []);

  const fmt = d => d ? d.split('T')[0] : '';
  const totalCost = records.reduce((s, r) => s + (r.totalCost || 0), 0);
  const totalLiters = records.reduce((s, r) => s + (r.liters || 0), 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...INITIAL, date: new Date().toISOString().split('T')[0] });
    setError('');
    setModal(true);
  };

  // FIXED: Added nullish coalescing to prevent uncontrolled input warnings on edit modal open
  const openEdit = (r) => {
    setEditing(r._id);
    setForm({
      ...r,
      vehicle: r.vehicle?._id || r.vehicle || '',
      driver: r.driver?._id || r.driver || '',
      date: fmt(r.date),
      station: r.station ?? '',
      odometer: r.odometer ?? '',
      notes: r.notes ?? ''
    });
    setError('');
    setModal(true);
  };

  const handleSave = async e => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) await axios.put(`/api/fuel/${editing}`, form);
      else await axios.post('/api/fuel', form);
      load();
      setModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this fuel record?')) return;
    await axios.delete(`/api/fuel/${id}`).then(load).catch(console.error);
  };

  const filtered = records.filter(r =>
    `${r.vehicle?.plateNumber || ''} ${r.driver?.name || ''} ${r.station || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fuel Management</h1>
          <p>{records.length} fuel records</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Record</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Fuel Cost</div>
          <div className="stat-value" style={{ color: 'var(--accent)', fontSize: 28 }}>
            ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Liters</div>
          <div className="stat-value" style={{ color: 'var(--blue)', fontSize: 28 }}>
            {totalLiters.toLocaleString()} L
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Records</div>
          <div className="stat-value" style={{ color: 'var(--green)', fontSize: 28 }}>
            {records.length}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ width: 28, height: 28 }}></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: 40 }}>⛽</span>
            <p>No fuel records yet.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Liters</th>
                  <th>Price/L</th>
                  <th>Total Cost</th>
                  <th>Station</th>
                  <th>Odometer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td>{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{r.vehicle?.plateNumber || '—'}</td>
                    <td>{r.driver?.name || '—'}</td>
                    <td>{r.liters} L</td>
                    <td>${r.pricePerLiter}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>${(r.totalCost || 0).toFixed(2)}</td>
                    <td>{r.station || '—'}</td>
                    <td>{r.odometer ? `${r.odometer.toLocaleString()} km` : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Fuel Record' : 'Add Fuel Record'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle *</label>
                    <select className="form-input" value={form.vehicle || ''} onChange={e => setForm(p => ({ ...p, vehicle: e.target.value }))} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driver</label>
                    <select className="form-input" value={form.driver || ''} onChange={e => setForm(p => ({ ...p, driver: e.target.value }))}>
                      <option value="">Select driver (optional)</option>
                      {drivers.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-input" value={form.date || ''} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Station</label>
                    <input className="form-input" value={form.station || ''} onChange={e => setForm(p => ({ ...p, station: e.target.value }))} placeholder="Fuel station name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Liters *</label>
                    <input type="number" step="0.01" className="form-input" value={form.liters || ''} onChange={e => setForm(p => ({ ...p, liters: e.target.value }))} required min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price per Liter ($) *</label>
                    <input type="number" step="0.01" className="form-input" value={form.pricePerLiter || ''} onChange={e => setForm(p => ({ ...p, pricePerLiter: e.target.value }))} required min="0" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Odometer Reading (km)</label>
                    <input type="number" className="form-input" value={form.odometer || ''} onChange={e => setForm(p => ({ ...p, odometer: e.target.value }))} placeholder="Current km reading" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-input" value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
                  </div>
                </div>
                {form.liters && form.pricePerLiter && (
                  <div style={{ background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 14 }}>
                    💰 Estimated Total: <strong style={{ color: 'var(--accent)' }}>${(form.liters * form.pricePerLiter).toFixed(2)}</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Saving...</> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}