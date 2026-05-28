import { useState, useEffect } from 'react';
import axios from 'axios';

const INITIAL = { name:'', email:'', phone:'', licenseNumber:'', licenseExpiry:'', status:'active', address:'', dateOfBirth:'', notes:'' };

const statusBadge = (s) => {
  const m = { active:'badge-green', inactive:'badge-gray', suspended:'badge-red' };
  return <span className={`badge ${m[s]||'badge-gray'}`}>{s}</span>;
};

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    axios.get('/api/drivers').then(r => setDrivers(r.data)).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const fmt = d => d ? d.split('T')[0] : '';
  const openAdd = () => { setEditing(null); setForm(INITIAL); setError(''); setModal(true); };
  const openEdit = (d) => { setEditing(d._id); setForm({ ...d, licenseExpiry: fmt(d.licenseExpiry), dateOfBirth: fmt(d.dateOfBirth) }); setError(''); setModal(true); };

  const handleSave = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (editing) await axios.put(`/api/drivers/${editing}`, form);
      else await axios.post('/api/drivers', form);
      load(); setModal(false);
    } catch (err) { setError(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!confirm('Remove this driver?')) return;
    await axios.delete(`/api/drivers/${id}`).then(load).catch(console.error);
  };

  const filtered = drivers.filter(d => `${d.name} ${d.email} ${d.licenseNumber}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Drivers</h1>
          <p>Manage {drivers.length} registered driver{drivers.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <div className="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search drivers..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Driver</button>
        </div>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div className="spinner" style={{width:28,height:28}}></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><span style={{fontSize:40}}>👤</span><p>No drivers found. Add your first driver.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Phone</th><th>License No.</th><th>License Expiry</th><th>Trips</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#000', flexShrink:0 }}>
                          {d.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:500, color:'var(--text)' }}>{d.name}</div>
                          <div style={{ fontSize:12, color:'var(--text3)' }}>{d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{d.phone}</td>
                    <td style={{ color:'var(--accent)', fontWeight:600 }}>{d.licenseNumber}</td>
                    <td>{d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : '—'}</td>
                    <td><span className="badge badge-blue">{d.totalTrips || 0}</span></td>
                    <td>{statusBadge(d.status)}</td>
                    <td>
                      <div style={{ display:'flex', gap:8 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>Delete</button>
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
              <h3>{editing ? 'Edit Driver' : 'Add New Driver'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group" style={{ gridColumn:'span 2' }}>
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-input" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} required placeholder="+250 xxx xxx xxx" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Number *</label>
                    <input className="form-input" value={form.licenseNumber} onChange={e=>setForm(p=>({...p,licenseNumber:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Expiry *</label>
                    <input type="date" className="form-input" value={form.licenseExpiry} onChange={e=>setForm(p=>({...p,licenseExpiry:e.target.value}))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input type="date" className="form-input" value={form.dateOfBirth} onChange={e=>setForm(p=>({...p,dateOfBirth:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
                      <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn:'span 2' }}>
                    <label className="form-label">Address</label>
                    <input className="form-input" value={form.address} onChange={e=>setForm(p=>({...p,address:e.target.value}))} placeholder="Driver's address" />
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
                  {saving ? <><div className="spinner" style={{width:14,height:14,borderWidth:2}}></div> Saving...</> : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
