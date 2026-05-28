import { useState, useEffect } from 'react';
import axios from 'axios';

const INITIAL = { vehicle:'', type:'service', description:'', status:'scheduled', scheduledDate:'', completedDate:'', cost:'', mechanic:'', garage:'', notes:'' };

const statusBadge = (s) => {
  const m = { scheduled:'badge-blue', in_progress:'badge-yellow', completed:'badge-green', cancelled:'badge-red' };
  return <span className={`badge ${m[s]||'badge-gray'}`}>{s?.replace('_',' ')}</span>;
};
const typeBadge = (t) => {
  const m = { service:'badge-blue', repair:'badge-red', inspection:'badge-purple', tire:'badge-gray', oil_change:'badge-yellow', other:'badge-gray' };
  return <span className={`badge ${m[t]||'badge-gray'}`}>{t?.replace('_',' ')}</span>;
};

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
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
      const [r, v] = await Promise.all([axios.get('/api/maintenance'), axios.get('/api/vehicles')]);
      setRecords(r.data); setVehicles(v.data);
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  // FIX 1: Safely invoke async loading block to avoid returning a Promise to the effect layer
  useEffect(() => {
    load();
  }, []);

  const fmt = d => d ? d.split('T')[0] : '';
  const totalCost = records.reduce((s, r) => s + (r.cost||0), 0);

  const openAdd = () => { setEditing(null); setForm({...INITIAL, scheduledDate: new Date().toISOString().split('T')[0]}); setError(''); setModal(true); };
  
  const openEdit = (r) => { 
    setEditing(r._id); 
    // FIX 2: Explicitly provide empty string fallbacks to prevent mixing controlled vs uncontrolled inputs
    setForm({ 
      ...r, 
      vehicle: r.vehicle?._id || r.vehicle || '', 
      type: r.type || 'service',
      description: r.description || '',
      status: r.status || 'scheduled',
      scheduledDate: fmt(r.scheduledDate), 
      completedDate: fmt(r.completedDate),
      cost: r.cost ?? '',
      mechanic: r.mechanic ?? '',
      garage: r.garage ?? '',
      notes: r.notes ?? ''
    }); 
    setError(''); 
    setModal(true); 
  };

  const handleSave = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) await axios.put(`/api/maintenance/${editing}`, form);
      else await axios.post('/api/maintenance', form);
      load(); setModal(false);
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Delete this maintenance record?')) return;
    await axios.delete(`/api/maintenance/${id}`).then(load).catch(console.error);
  };

  const filtered = records.filter(r => `${r.vehicle?.plateNumber||''} ${r.description||''} ${r.type||''} ${r.mechanic||''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Maintenance</h1>
          <p>{records.length} maintenance records</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div className="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search maintenance..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Schedule Service</button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(4,1fr)', marginBottom:24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value" style={{ color:'var(--accent)', fontSize:26 }}>${totalCost.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value" style={{ color:'var(--blue)', fontSize:26 }}>{records.filter(r=>r.status==='scheduled').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color:'var(--accent2)', fontSize:26 }}>{records.filter(r=>r.status==='in_progress').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color:'var(--green)', fontSize:26 }}>{records.filter(r=>r.status==='completed').length}</div>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" style={{width:28,height:28}}></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:40}}>🔧</span><p>No maintenance records yet.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Vehicle</th><th>Type</th><th>Description</th><th>Scheduled</th><th>Mechanic</th><th>Cost</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td style={{ color:'var(--accent)', fontWeight:600 }}>{r.vehicle?.plateNumber || '—'}<div style={{fontSize:12,color:'var(--text3)'}}>{r.vehicle?.make}</div></td>
                    <td>{typeBadge(r.type)}</td>
                    <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.description}</td>
                    <td>{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '—'}</td>
                    <td>{r.mechanic || '—'}</td>
                    <td style={{ color:'var(--green)', fontWeight:600 }}>${(r.cost||0).toLocaleString()}</td>
                    <td>{statusBadge(r.status)}</td>
                    <td>
                      <div style={{ display:'flex', gap:8 }}>
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
              <h3>{editing ? 'Edit Maintenance' : 'Schedule Maintenance'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group">
                    <label className="form-label">Vehicle *</label>
                    <select className="form-input" value={form.vehicle} onChange={e=>setForm(p=>({...p,vehicle:e.target.value}))} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-input" value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                      <option value="service">Service</option><option value="repair">Repair</option><option value="inspection">Inspection</option><option value="tire">Tire</option><option value="oil_change">Oil Change</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'span 2' }}>
                    <label className="form-label">Description *</label>
                    <textarea className="form-input" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} required rows={2} style={{ resize:'vertical' }} placeholder="Describe the maintenance work..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled Date *</label>
                    <input type="date" className="form-input" value={form.scheduledDate} onChange={e=>setForm(p=>({...p,scheduledDate:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Completed Date</label>
                    <input type="date" className="form-input" value={form.completedDate} onChange={e=>setForm(p=>({...p,completedDate:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                      <option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cost ($)</label>
                    <input type="number" className="form-input" value={form.cost} onChange={e=>setForm(p=>({...p,cost:e.target.value}))} placeholder="0" min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mechanic</label>
                    <input className="form-input" value={form.mechanic} onChange={e=>setForm(p=>({...p,mechanic:e.target.value}))} placeholder="Mechanic name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Garage / Workshop</label>
                    <input className="form-input" value={form.garage} onChange={e=>setForm(p=>({...p,garage:e.target.value}))} placeholder="Workshop name" />
                  </div>
                  <div className="form-group" style={{ gridColumn:'span 2' }}>
                    <label className="form-label">Notes</label>
                    <textarea className="form-input" value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} style={{ resize:'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}}></div> Saving...</> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}