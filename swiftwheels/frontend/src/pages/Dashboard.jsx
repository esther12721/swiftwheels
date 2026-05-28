import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card">
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={{ color }}>{value}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
      <div style={{ color, opacity:0.4, fontSize:28 }}>{icon}</div>
    </div>
  </div>
);

const statusBadge = (status) => {
  const map = { scheduled:'badge-blue', in_progress:'badge-yellow', completed:'badge-green', cancelled:'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_',' ')}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:80 }}><div className="spinner" style={{width:32,height:32}}></div></div>;

  return (
    <div>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:700 }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color:'var(--text2)', marginTop:6 }}>Here's what's happening with your fleet today.</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Vehicles" value={stats?.totalVehicles || 0} sub={`${stats?.availableVehicles || 0} available`} color="var(--accent)" icon="🚛" />
        <StatCard label="Active Trips" value={stats?.activeTrips || 0} sub={`${stats?.totalTrips || 0} total trips`} color="var(--blue)" icon="🗺️" />
        <StatCard label="Drivers" value={stats?.totalDrivers || 0} sub="Registered drivers" color="var(--green)" icon="👤" />
        <StatCard label="Fuel Spend" value={`$${(stats?.totalFuelCost || 0).toLocaleString()}`} sub="All time" color="var(--accent2)" icon="⛽" />
        <StatCard label="In Maintenance" value={stats?.vehiclesInMaintenance || 0} sub="Vehicles being serviced" color="var(--purple)" icon="🔧" />
        <StatCard label="Scheduled Service" value={stats?.scheduledMaintenance || 0} sub="Upcoming maintenance" color="var(--text2)" icon="📅" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:20 }}>
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <h2 style={{ fontFamily:'var(--font-display)', fontSize:18 }}>Recent Trips</h2>
            <a href="/trips" style={{ color:'var(--accent)', fontSize:13, textDecoration:'none' }}>View all →</a>
          </div>
          {stats?.recentTrips?.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trip #</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Route</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTrips.map(trip => (
                    <tr key={trip._id}>
                      <td style={{ color:'var(--accent)', fontWeight:600 }}>{trip.tripNumber}</td>
                      <td>{trip.driver?.name || '—'}</td>
                      <td>{trip.vehicle?.plateNumber} <span style={{ color:'var(--text3)' }}>{trip.vehicle?.make}</span></td>
                      <td>{trip.origin} → {trip.destination}</td>
                      <td>{statusBadge(trip.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span style={{ fontSize:40 }}>🗺️</span>
              <p>No trips recorded yet. Start by adding a vehicle and driver.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
