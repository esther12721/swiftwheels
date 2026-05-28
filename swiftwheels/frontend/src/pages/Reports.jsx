import { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReportMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const [vRes, dRes, tRes] = await Promise.all([
        axios.get('/api/vehicles'),
        axios.get('/api/drivers'),
        axios.get('/api/trips')
      ]);
      setVehicles(vRes.data || []);
      setDrivers(dRes.data || []);
      setTrips(tRes.data || []);
    } catch (err) {
      console.error('Error synchronizing core logging registries:', err);
      setError('System could not compile dynamic database vectors. Please verify server connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportMetrics();
  }, []);

  // --- REPORT METRIC ANALYTICS CALCULATIONS ---
  const totalFleetCount = vehicles.length;
  const maintenanceCount = vehicles.filter(v => v?.status === 'maintenance' || v?.status === 'out_of_service').length;
  const availableCount = vehicles.filter(v => v?.status === 'available').length;
  const fleetUtilizationRate = totalFleetCount > 0 ? Math.round(((totalFleetCount - maintenanceCount) / totalFleetCount) * 100) : 0;
  
  const totalDriversCount = drivers.length;
  const totalTripsCount = trips.length;
  const scheduledTrips = trips.filter(t => t?.status === 'scheduled').length;
  const activeTrips = trips.filter(t => t?.status === 'in_progress').length;
  const completedTrips = trips.filter(t => t?.status === 'completed').length;
  const cancelledTrips = trips.filter(t => t?.status === 'cancelled').length;
  const successRate = totalTripsCount > 0 ? Math.round((completedTrips / (totalTripsCount - activeTrips - scheduledTrips || 1)) * 100) : 100;
  const grossOdometerMileage = vehicles.reduce((sum, v) => sum + (Number(v?.mileage) || 0), 0);

  // --- SHARED PDF GENERATION LAYOUT ENGINE ---
  const generatePDFReport = (title, headers, rows, filename) => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const timestamp = new Date().toLocaleString();

      // 1. Corporate Brand Document Header
      doc.setFillColor(24, 24, 27); // Dark zinc/charcoal background matching dashboard theme
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text("SWIFTWHEELS FLEET MANAGEMENT", 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(161, 161, 170);
      doc.text(`Official Business Intelligence Audit / Compiled: ${timestamp}`, 14, 23);

      // 2. Report Specific Title Header
      doc.setTextColor(24, 24, 27);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(title.toUpperCase(), 14, 48);

      // Decorative underline banner
      doc.setDrawColor(234, 179, 8); // SwiftWheels Brand Yellow Accent
      doc.setLineWidth(1);
      doc.line(14, 51, 60, 51);

      // 3. Render Autotable using the explicit module call to prevent constructor crashes
      autoTable(doc, {
        startY: 56,
        head: [headers],
        body: rows,
        theme: 'striped',
        headStyles: {
          fillColor: [39, 39, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 4
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [63, 63, 70],
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [244, 244, 245]
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Footer System Tracking Metadata on every page
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(113, 113, 122);
          doc.text(`Page ${data.pageNumber}`, 14, doc.internal.pageSize.height - 10);
          doc.text("CONFIDENTIAL - FOR INTERNAL ADMINISTRATIVE USE ONLY", doc.internal.pageSize.width - 100, doc.internal.pageSize.height - 10);
        }
      });

      // 4. Trigger Automatic File Save Link Stream
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (pdfError) {
      console.error("Autotable Canvas Rendering Error:", pdfError);
      alert("The PDF document compiler hit a rendering bottleneck. Please check console arrays.");
    }
  };

  // --- UPGRADED, CRASH-PROOF PDF DATA MAPPERS ---
  const handleExportVehiclesPDF = () => {
    if (!vehicles || vehicles.length === 0) return alert('No asset records stored to output.');
    try {
      const headers = ["Plate Number", "Make", "Model", "Type", "Odometer (km)", "Status State"];
      const rows = vehicles.map(v => [
        String(v?.plateNumber || 'N/A'), 
        String(v?.make || 'N/A'), 
        String(v?.model || 'N/A'), 
        String(v?.type || 'N/A'), 
        `${(v?.mileage || 0).toLocaleString()} km`, 
        String(v?.status || 'unknown').toUpperCase()
      ]);
      generatePDFReport("Fleet Inventory & Asset Capacity Matrix", headers, rows, "fleet_status_report");
    } catch (err) {
      console.error("PDF Engine Runtime Crash:", err);
      alert("Failed to build Fleet PDF. Check console for details.");
    }
  };

  const handleExportDriversPDF = () => {
    if (!drivers || drivers.length === 0) return alert('No registered operator profiles to output.');
    try {
      const headers = ["Full Operator Name", "License Number", "Contact Phone", "Roster Status"];
      const rows = drivers.map(d => [
        String(d?.name || 'N/A'), 
        String(d?.licenseNumber || 'N/A'), 
        String(d?.phone || 'N/A'), 
        String(d?.status || 'Active').toUpperCase()
      ]);
      generatePDFReport("Operator Roster & Compliance Index", headers, rows, "driver_compliance_report");
    } catch (err) {
      console.error("PDF Engine Runtime Crash:", err);
      alert("Failed to build Roster PDF. Check console for details.");
    }
  };

  const handleExportTripsPDF = () => {
    if (!trips || trips.length === 0) return alert('No transport operational runs to output.');
    try {
      const headers = ["Trip ID", "Vehicle Plate", "Assigned Driver", "Origin Hub", "Destination Target", "Date", "Status"];
      const rows = trips.map(t => [
        String(t?.tripNumber || t?._id || 'N/A'), 
        String(t?.vehicleId?.plateNumber || 'N/A'), 
        String(t?.driverId?.name || 'Unassigned'), 
        String(t?.origin || 'N/A'), 
        String(t?.destination || 'N/A'), 
        t?.startDate ? String(t.startDate).split('T')[0] : '--', 
        String(t?.status || 'Pending').toUpperCase()
      ]);
      generatePDFReport("Logistics Execution & Waybill Run Logs", headers, rows, "logistics_manifest_report");
    } catch (err) {
      console.error("PDF Engine Runtime Crash:", err);
      alert("Failed to build Logistics PDF. Check console for details.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '400px', gap: '16px' }}>
        <div className="spinner" style={{ width: '42px', height: '42px' }}></div>
        <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Compiling PDF layout metrics...</p>
      </div>
    );
  }

  return (
    <div className="reports-management-workspace" style={{ paddingBottom: '40px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1>System Reports & Auditing</h1>
          <p>Evaluate operational constraints, extract encrypted document records, and export corporate sheets.</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchReportMetrics}>🔄 Sync Registers</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '24px' }}>{error}</div>}

      {/* STATS OVERVIEW SECTION */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--accent)' }}>
          <span className="stat-label">Fleet Operational Health</span>
          <span className="stat-value">{fleetUtilizationRate}%</span>
          <span className="stat-sub">{availableCount} of {totalFleetCount} assets clear</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--blue)' }}>
          <span className="stat-label">Accumulated Odometer Log</span>
          <span className="stat-value" style={{ color: 'var(--blue)' }}>{grossOdometerMileage.toLocaleString()} km</span>
          <span className="stat-sub">Total synchronized engine travel</span>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--green)' }}>
          <span className="stat-label">Fulfillment Efficiency</span>
          <span className="stat-value" style={{ color: 'var(--green)' }}>{successRate}%</span>
          <span className="stat-sub">{completedTrips} resolved shipments</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* PROGRESS BLOCK PANELS */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Logistics Operation Manifest Split</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>📦 Discharges Completed</span><span style={{ color: 'var(--green)' }}>{completedTrips} runs</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalTripsCount > 0 ? (completedTrips / totalTripsCount) * 100 : 0}%`, height: '100%', background: 'var(--green)' }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span>🚚 Fleet Live In-Transit</span><span style={{ color: 'var(--blue)' }}>{activeTrips} runs</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${totalTripsCount > 0 ? (activeTrips / totalTripsCount) * 100 : 0}%`, height: '100%', background: 'var(--blue)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* INDEX SUMMARY */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Registry Document Totals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text2)' }}>Vehicles Checked</span>
              <strong style={{ color: 'var(--accent)' }}>{totalFleetCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text2)' }}>Drivers Registered</span>
              <strong style={{ color: 'var(--accent)' }}>{totalDriversCount}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: 'var(--text2)' }}>Total Logged Trips</span>
              <strong style={{ color: 'var(--accent)' }}>{totalTripsCount}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* PDF GEN BUTTON MATRIX GRID */}
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text2)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        Download Protected Corporate PDF Statements
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* CARD 1 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Fleet Inventory Status Matrix</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '16px' }}>
              Compiles real-time metrics tracking license plates, manufacturer variations, asset type breakdowns, current odometer counts, and live deployment statuses.
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportVehiclesPDF}>
            🖨️ Download Fleet PDF
          </button>
        </div>

        {/* CARD 2 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Logistics Waybill Fulfillment Logs</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '16px' }}>
              Generates historical route tracking details containing serial trip indicators, active vehicle couplings, driver dispatch names, origin hubs, and transit durations.
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportTripsPDF}>
            🖨️ Download Logistics PDF
          </button>
        </div>

        {/* CARD 3 */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>📄</span>
              <h4 style={{ fontSize: '15px', fontWeight: 700 }}>Operator Compliance Directory</h4>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5, marginBottom: '16px' }}>
              Outputs an executive roster index containing full employee identification names, active heavy machinery license clearances, and phone lines.
            </p>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportDriversPDF}>
            🖨️ Download Roster PDF
          </button>
        </div>

      </div>

      {/* MAINTENANCE NOTIFICATION BADGE */}
      {maintenanceCount > 0 && (
        <div className="alert alert-error" style={{ marginTop: '24px', background: 'var(--bg2)', borderLeft: '4px solid var(--accent)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 500 }}>
            <strong>Mechanical Audit Flag:</strong> There are currently <strong>{maintenanceCount} assets out of order</strong> or inside the repair workshop. Fleet allocation availability has dropped slightly below nominal margins.
          </span>
        </div>
      )}
    </div>
  );
}