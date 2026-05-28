import { useState, useEffect } from 'react';
import axios from 'axios';

const INITIAL_FORM = {
  tripNumber: '',
  vehicleId: '',
  driverId: '',
  origin: '',
  destination: '',
  startDate: '',
  status: 'scheduled',
  notes: ''
};

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  // DESIGN UPGRADES: Sub-view filtering and quick loaders
  const [activeTab, setActiveTab] = useState('all'); 
  const [togglingId, setTogglingId] = useState(null);

  // Combined parallel baseline dataset initializer 
  const loadPageDataset = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get('/api/trips'),
        axios.get('/api/vehicles'),
        axios.get('/api/drivers')
      ]);
      setTrips(tripsRes.data);
      // Only keep 'available' assets open for new deployments
      setVehicles(vehiclesRes.data.filter(v => v.status === 'available'));
      setDrivers(driversRes.data);
    } catch (err) {
      console.error('Error synchronizing database relational vectors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageDataset();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setForm({ ...INITIAL_FORM, tripNumber: `TRP-${Math.floor(1000 + Math.random() * 9000)}` });
    setError('');
    setModal(true);
  };

  const openEditModal = (t) => {
    setEditing(t._id);
    setForm({
      tripNumber: t.tripNumber ?? '',
      vehicleId: t.vehicleId?._id ?? t.vehicleId ?? '',
      driverId: t.driverId?._id ?? t.driverId ?? '',
      origin: t.origin ?? '',
      destination: t.destination ?? '',
      startDate: t.startDate ? t.startDate.split('T')[0] : '',
      status: t.status ?? 'scheduled',
      notes: t.notes ?? ''
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
        const res = await axios.put(`/api/trips/${editing}`, form);
        setTrips(p => p.map(t => t._id === editing ? res.data : t));
      } else {
        const res = await axios.post('/api/trips', form);
        setTrips(p => [res.data, ...p]);
      }
      setModal(false);
      loadPageDataset(); // Refresh assets availability states
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save trip route payload metrics.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to drop this trip run configuration?')) return;
    try {
      await axios.delete(`/api/trips/${id}`);
      setTrips(p => p.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // DESIGN REFACTOR: Quick Status Advancement Toggle without modal forms
  const handleQuickStatusCycle = async (id, currentStatus) => {
    setTogglingId(id);
    let nextStatus = 'in_progress';
    if (currentStatus === 'in_progress') nextStatus = 'completed';
    
    try {
      const match = trips.find(t => t._id === id);
      const res = await axios.put(`/api/trips/${id}`, {
        ...match,
        vehicleId: match.vehicleId?._id || match.vehicleId,
        driverId: match.driverId?._id || match.driverId,
        status: nextStatus
      });
      setTrips(p => p.map(t => t._id === id ? res.data : t));
      if (nextStatus === 'completed') loadPageDataset(); // Releases vehicle back to pool
    } catch (err) {
      console.error("Failed to fast-advance active deployment run status", err);
    } finally {
      setTogglingId(null);
    }
  };

  // DESIGN REFACTOR: Client-Side Ledger CSV Spreadsheet Exporter
  const handleExportSpreadsheet = () => {
    if (filteredTrips.length === 0) return alert("No logistics data rows available to output.");
    const headers = "Trip ID,Vehicle Plate,Driver,Origin Hub,Destination Target,Departure Date,Status State\n";
    const content = filteredTrips.map(t => 
      `"${t.tripNumber}","${t.vehicleId?.plateNumber || 'N/A'}","${t.driverId?.name || 'Unassigned'}","${t.origin}","${t.destination}","${t.startDate ? t.startDate.split('T')[0] : ''}","${t.status}"`
    ).join("\n");
    
    const blob = new Blob([headers + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `dispatch_manifest_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusBadge = (status) => {
    const maps = {
      scheduled: { class: 'badge-purple', label: 'Scheduled' },
      in_progress: { class: 'badge-blue', label: 'In Progress' },
      completed: { class: 'badge-green', label: 'Completed' },
      cancelled: { class: 'badge-red', label: 'Cancelled' }
    };
    const config = maps[status] || { class: 'badge-gray', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  // COMPREHENSIVE DUAL-LAYER DATAVIEW FILTER
  const filteredTrips = trips.filter(t => {
    const matchesSearch = `${t.tripNumber} ${t.origin} ${t.destination} ${t.driverId?.name || ''} ${t.vehicleId?.plateNumber || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' ? true : t.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Calculate high-level system stat insights
  const statsScheduled = trips.filter(t => t.status === 'scheduled').length;
  const statsActive = trips.filter(t => t.status === 'in_progress').length;
  const statsDone = trips.filter(t => t.status === 'completed').length;

  return (
    <div className="trips-page">
      {/* PAGE HEADER ACTION COMPONENT ROW */}
      <div className="page-header">
        <div>
          <h1>Logistics & Trips</h1>
          <p>Schedule dispatch tasks and bind drivers to fleet operational assets.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleExportSpreadsheet} title="Download current manifest workspace table to Excel CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Logs
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>+ Schedule Trip</button>
        </div>
      </div>

      {/* METRICS DISPATCH SYNOPSIS BANNER GRID */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'all' ? '1px solid var(--accent)' : '' }} onClick={() => setActiveTab('all')}>
          <span className="stat-label">Total Work Orders</span>
          <span className="stat-value">{trips.length}</span>
          <span className="stat-sub">Overall assignments</span>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'scheduled' ? '1px solid var(--purple)' : '' }} onClick={() => setActiveTab('scheduled')}>
          <span className="stat-label">Manifests Scheduled</span>
          <span className="stat-value" style={{ color: 'var(--purple)' }}>{statsScheduled}</span>
          <span className="stat-sub">Pending departure timelines</span>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'in_progress' ? '1px solid var(--blue)' : '' }} onClick={() => setActiveTab('in_progress')}>
          <span className="stat-label">In Transit</span>
          <span className="stat-value" style={{ color: 'var(--blue)' }}>{statsActive}</span>
          <span className="stat-sub">Units live on shipping lanes</span>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer', border: activeTab === 'completed' ? '1px solid var(--green)' : '' }} onClick={() => setActiveTab('completed')}>
          <span className="stat-label">Delivered Runs</span>
          <span className="stat-value" style={{ color: 'var(--green)' }}>{statsDone}</span>
          <span className="stat-sub">Fulfillments finalized</span>
        </div>
      </div>

      {/* HORIZONTAL INTERACTIVE CONTROL FILTER TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((tab) => (
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
            {tab === 'all' ? 'All Deployments' : tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* MAIN DATA STAGE CONTAINER LAYER */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" placeholder="Search by route hubs, dispatch serial, driver name, vehicle tag..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text3)', fontWeight: 500 }}>
            Showing {filteredTrips.length} of {trips.length} orders
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center" style={{ padding: '80px' }}><div className="spinner" style={{ width:32, height:32 }}></div></div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px' }}>
            <span style={{ fontSize: '40px' }}>🗺️</span>
            <p style={{ marginTop: '12px', color: 'var(--text2)' }}>No operational run logs match your layout parameters inside this subview selection tab.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Assigned Vehicle</th>
                  <th>Assigned Driver</th>
                  <th>Route Pipeline Blueprint</th>
                  <th>Departure Date</th>
                  <th>Status State</th>
                  <th style={{ textAlign: 'right' }}>Actions Workspace</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>
                      {t.tripNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{t.vehicleId?.plateNumber || 'Unassigned'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        {t.vehicleId?.make} {t.vehicleId?.model}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text)' }}>{t.driverId?.name || <span style={{ color: 'var(--red)' }}>Missing Operator</span>}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{t.driverId?.licenseNumber || 'No ID Ref'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                        <span>{t.origin}</span>
                        <span style={{ color: 'var(--accent)', fontSize: '11px' }}>➔</span>
                        <span style={{ color: 'var(--text2)' }}>{t.destination}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text2)' }}>
                      {t.startDate ? new Date(t.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '--'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {renderStatusBadge(t.status)}
                        
                        {/* INLINE EXPEDITED LOGISTICS ACCELERATOR TOGGLE BUTTON */}
                        {(t.status === 'scheduled' || t.status === 'in_progress') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '4px', fontWeight: 700 }}
                            disabled={togglingId === t._id}
                            onClick={() => handleQuickStatusCycle(t._id, t.status)}
                            title={t.status === 'scheduled' ? "Flag as departed and in-route" : "Log delivery payload as completely discharged"}
                          >
                            {togglingId === t._id ? '...' : t.status === 'scheduled' ? '🛫 Dispatch' : '🏁 Arrived'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(t)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RELATIONAL SELECTION FORM DIALOG MODAL LAYOUT */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editing ? `Modify Asset Deployment Run [${form.tripNumber}]` : 'Dispatch New Route Schedule'}</h3>
              <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Trip Serial Identifier</label>
                    <input className="form-input" value={form.tripNumber} disabled style={{ opacity: 0.6, fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Departure Date *</label>
                    <input type="date" className="form-input" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                  </div>

                  {/* SMART REFERENCE EXTENSION: VEHICLES COLLECTION */}
                  <div className="form-group">
                    <label className="form-label">Assign Operational Fleet Vehicle *</label>
                    <select className="form-input" value={form.vehicleId} onChange={e => setForm(p => ({ ...p, vehicleId: e.target.value }))} required>
                      <option value="">-- Choose Available Asset --</option>
                      {editing && trips.find(t => t._id === editing)?.vehicleId && (
                        <option value={trips.find(t => t._id === editing).vehicleId._id}>
                          {trips.find(t => t._id === editing).vehicleId.plateNumber} (Currently Bound)
                        </option>
                      )}
                      {vehicles.map(v => (
                        <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model} [{v.type}]</option>
                      ))}
                    </select>
                  </div>

                  {/* SMART REFERENCE EXTENSION: DRIVERS COLLECTION */}
                  <div className="form-group">
                    <label className="form-label">Assign Certified Driver *</label>
                    <select className="form-input" value={form.driverId} onChange={e => setForm(p => ({ ...p, driverId: e.target.value }))} required>
                      <option value="">-- Choose Active Operator --</option>
                      {editing && trips.find(t => t._id === editing)?.driverId && (
                        <option value={trips.find(t => t._id === editing).driverId._id}>
                          {trips.find(t => t._id === editing).driverId.name} (Currently Bound)
                        </option>
                      )}
                      {drivers.map(d => (
                        <option key={d._id} value={d._id}>{d.name} — (Lic: {d.licenseNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Origin Hub Location *</label>
                    <input className="form-input" value={form.origin} onChange={e => setForm(p => ({ ...p, origin: e.target.value }))} required placeholder="e.g. Warehouse Sector A" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Port Target *</label>
                    <input className="form-input" value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))} required placeholder="e.g. Distribution Center B" />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Logistical Deployment Status State</label>
                    <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="scheduled">Scheduled</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Cargo Route Manifest Notes</label>
                    <textarea className="form-input" style={{ resize: 'vertical' }} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Add cargo weights, tracking coordinates, or structural parameters..." rows={3} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <div className="spinner" style={{ width: 14, height: 14, marginRight: 6 }}></div>}
                  {saving ? 'Processing...' : 'Save Run Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}