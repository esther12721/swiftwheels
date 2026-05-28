import { useState, useEffect } from 'react';
import axios from 'axios';

const INITIAL_FORM = { 
  plateNumber: '', 
  make: '', 
  model: '', 
  year: '', 
  type: 'truck', 
  fuelType: 'diesel', 
  capacity: '', 
  mileage: '', 
  status: 'available', 
  notes: '' 
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // NEW FEATURE STATES: Operational View Segmentation
  const [activeTab, setActiveTab] = useState('all'); // options: 'all', 'available', 'maintenance', 'in_use'
  const [togglingId, setTogglingId] = useState(null);

  // Fetch all fleet records
  const loadVehicles = () => {
    setLoading(true);
    axios.get('/api/vehicles')
      .then(res => setVehicles(res.data))
      .catch(err => console.error('Error loading vehicles:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const openAddModal = () => { 
    setEditing(null); 
    setForm(INITIAL_FORM); 
    setError(''); 
    setModal(true); 
  };

  const openEditModal = (v) => { 
    setEditing(v._id); 
    setForm({ 
      plateNumber: v.plateNumber ?? '',
      make: v.make ?? '',
      model: v.model ?? '',
      year: v.year ?? '',
      type: v.type ?? 'truck',
      fuelType: v.fuelType ?? 'diesel',
      capacity: v.capacity ?? '',
      mileage: v.mileage ?? '',
      status: v.status ?? 'available',
      notes: v.notes ?? ''
    }); 
    setError(''); 
    setModal(true); 
  };

  const handleSave = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setSaving(true);
    try {
      if (editing) {
        await axios.put(`/api/vehicles/${editing}`, form);
      } else {
        await axios.post('/api/vehicles', form);
      }
      loadVehicles(); 
      setModal(false);
    } catch (err) { 
      setError(err.response?.data?.message || 'Failed to save vehicle ledger entry.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this vehicle from the fleet?')) return;
    try {
      await axios.delete(`/api/vehicles/${id}`);
      loadVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  // NEW FEATURE: Inline Status Quick-Toggle (Bypasses Modal loop)
  const handleQuickStatusToggle = async (id, currentStatus) => {
    setTogglingId(id);
    const nextStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    try {
      await axios.put(`/api/vehicles/${id}`, {
        ...vehicles.find(v => v._id === id),
        status: nextStatus
      });
      loadVehicles();
    } catch (err) {
      console.error("Failed to quickly switch logistics state", err);
    } finally {
      setTogglingId(null);
    }
  };

  // NEW FEATURE: Client-Side Ledger CSV Data Export Engine
  const handleExportCSV = () => {
    if (filteredVehicles.length === 0) return alert("No active records available to export.");
    
    const headers = "Plate Number,Make,Model,Type,Year,Mileage (km),Fuel,Status\n";
    const rows = filteredVehicles.map(v => 
      `"${v.plateNumber}","${v.make}","${v.model}","${v.type}",${v.year},${v.mileage || 0},"${v.fuelType}","${v.status}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fleet_ledger_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status Badge Mapper utilizing your global classes
  const renderStatusBadge = (status) => {
    const maps = {
      available: { class: 'badge-green', label: 'Available' },
      in_use: { class: 'badge-blue', label: 'In Use' },
      maintenance: { class: 'badge-yellow', label: 'Maintenance' },
      retired: { class: 'badge-red', label: 'Retired' }
    };
    const config = maps[status] || { class: 'badge-gray', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  // Vehicle Type Classification Badge Maker
  const renderTypeBadge = (type) => {
    const maps = {
      truck: 'badge-purple',
      bus: 'badge-blue',
      van: 'badge-yellow',
      car: 'badge-green'
    };
    return (
      <span className={`badge ${maps[type] || 'badge-gray'}`} style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: 700 }}>
        {type}
      </span>
    );
  };

  // MULTI-LAYER FILTER (Combines Search Input + Segmented Navigation Tabs)
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = `${v.plateNumber} ${v.make} ${v.model} ${v.type}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : v.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Compute stats for upper overview cards
  const statsAvailable = vehicles.filter(v => v.status === 'available').length;
  const statsInMaintenance = vehicles.filter(v => v.status === 'maintenance').length;
  const statsInUse = vehicles.filter(v => v.status === 'in_use').length;

  return (
    <div className="vehicles-page">
      {/* PAGE HEADER ROW */}
      <div className="page-header">
        <div>
          <h1>Vehicles Fleet</h1>
          <p>Manage your operational fleet ledger and configurations</p>
        </div>
        <div className="flex gap-2">
          {/* NEW BUTTON: Export Utility */}
          <button className="btn btn-secondary" onClick={handleExportCSV} title="Export current grid data to spreadsheet format">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            + Add Vehicle
          </button>
        </div>
      </div>

      {/* QUICK FLEET METRICS GRID */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'all' ? '1px solid var(--accent)' : '' }} onClick={() => setActiveTab('all')}>
          <span className="stat-label">Total Fleet Size</span>
          <span className="stat-value">{vehicles.length}</span>
          <span className="stat-sub">Registered units</span>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'available' ? '1px solid var(--green)' : '' }} onClick={() => setActiveTab('available')}>
          <span className="stat-label">Operational</span>
          <span className="stat-value" style={{ color: 'var(--green)' }}>{statsAvailable}</span>
          <span className="stat-sub">Ready for logistics</span>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'in_use' ? '1px solid var(--blue)' : '' }} onClick={() => setActiveTab('in_use')}>
          <span className="stat-label">Active Deployment</span>
          <span className="stat-value" style={{ color: 'var(--blue)' }}>{statsInUse}</span>
          <span className="stat-sub">Units out on jobs</span>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'maintenance' ? '1px solid var(--accent)' : '' }} onClick={() => setActiveTab('maintenance')}>
          <span className="stat-label">In Service Shop</span>
          <span className="stat-value" style={{ color: 'var(--accent)' }}>{statsInMaintenance}</span>
          <span className="stat-sub">Active repairs pending</span>
        </div>
      </div>

      {/* NEW FEATURE: TABBED SUB-VIEW SYSTEM NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {['all', 'available', 'in_use', 'maintenance', 'retired'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: activeTab === tab ? 'var(--bg3)' : 'transparent',
              border: 'none',
              color: activeTab === tab ? 'var(--accent)' : 'var(--text2)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.15s ease'
            }}
          >
            {tab === 'all' ? 'All Fleet Units' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* CONTROLS AREA (SEARCH & TABLE) */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder={`Filter current tab data subset...`} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 500 }}>
            Showing {filteredVehicles.length} of {vehicles.length} entries
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center" style={{ padding: '80px' }}>
            <div className="spinner" style={{ width: 32, height: 32 }}></div>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '40px' }}>🚛</span>
            <p>No active fleet vehicles matched your filter parameters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Vehicle Details</th>
                  <th>Classification</th>
                  <th>Model Year</th>
                  <th>Current Mileage</th>
                  <th>Fuel System</th>
                  <th>Status Profile</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(v => (
                  <tr key={v._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '15px', color: 'var(--accent)' }}>
                      {v.plateNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{v.make}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text3)' }}>{v.model}</div>
                    </td>
                    <td>{renderTypeBadge(v.type)}</td>
                    <td>{v.year}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {v.mileage ? Number(v.mileage).toLocaleString() : '0'}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '4px' }}>km</span>
                      
                      {/* NEW FEATURE: SMART EXTREME VEHICLE MILEAGE WARNING BADGE */}
                      {Number(v.mileage) >= 150000 && (
                        <div style={{ marginTop: '2px' }}>
                          <span className="badge badge-red" style={{ fontSize: '10px', padding: '1px 6px' }} title="Asset has surpassed the critical fleet servicing milestone thresholds.">
                            ⚠️ Service Due
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>
                      {v.fuelType}
                    </td>
                    <td>
                      {/* INLINE STATUS TOGGLE ACTION PACK */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderStatusBadge(v.status)}
                        
                        {(v.status === 'available' || v.status === 'maintenance') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px' }}
                            disabled={togglingId === v._id}
                            onClick={() => handleQuickStatusToggle(v._id, v.status)}
                            title={v.status === 'available' ? "Send directly to Shop" : "Release back into Active service status"}
                          >
                            {togglingId === v._id ? '...' : v.status === 'available' ? '🔧 Shop' : '✅ Clear'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(v)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL SYSTEM LAYER */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Modify Vehicle Record' : 'Provision New Fleet Vehicle'}</h3>
              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Plate Number *</label>
                    <input className="form-input" value={form.plateNumber} onChange={e => setForm(p => ({ ...p, plateNumber: e.target.value }))} required placeholder="RAB 123A" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacture Year *</label>
                    <input type="number" className="form-input" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} required placeholder="2022" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Make *</label>
                    <input className="form-input" value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value }))} required placeholder="Toyota" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input className="form-input" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required placeholder="Hilux" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type *</label>
                    <select className="form-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="truck">Truck</option>
                      <option value="bus">Bus</option>
                      <option value="van">Van</option>
                      <option value="car">Car</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fuel Configuration</label>
                    <select className="form-input" value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))}>
                      <option value="petrol">Petrol</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Profile</label>
                    <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="available">Available</option>
                      <option value="in_use">In Use</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Odometer Mileage (km)</label>
                    <input type="number" className="form-input" value={form.mileage} onChange={e => setForm(p => ({ ...p, mileage: e.target.value }))} placeholder="0" min="0" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Load / Passenger Capacity</label>
                    <input className="form-input" value={form.capacity} onChange={e => setForm(p => ({ ...p, capacity: e.target.value }))} placeholder="e.g. 5 tons, 16 seats" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Logistical Notes</label>
                    <textarea className="form-input" style={{ resize: 'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Add specific mechanical annotations..." rows={3} />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <div className="spinner" style={{ width: 14, height: 14, marginRight: 6 }}></div>}
                  {saving ? 'Saving...' : 'Commit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}