import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'driver', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role, phone: form.phone });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg}>
        <div style={styles.glow1}></div>
        <div style={styles.glow2}></div>
        <div style={styles.grid}></div>
      </div>
      <div style={styles.container}>
        <div style={styles.formCard}>
          <div style={styles.brand}>
            <div style={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              </svg>
            </div>
            <span style={styles.logoText}><span>Swift</span><span style={{color:'var(--accent)'}}>Wheels</span></span>
          </div>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create your account</h2>
            <p style={styles.formSub}>Join the fleet management platform</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" placeholder="John Doe"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input name="phone" className="form-input" placeholder="+250 xxx xxx xxx"
                  value={form.phone} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input name="email" type="email" className="form-input" placeholder="you@company.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select name="role" className="form-input" value={form.role} onChange={handleChange}>
                <option value="driver">Driver</option>
                <option value="fleet_manager">Fleet Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div style={styles.row}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input name="password" type="password" className="form-input" placeholder="Min 6 characters"
                  value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input name="confirmPassword" type="password" className="form-input" placeholder="Repeat password"
                  value={form.confirmPassword} onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ height: 44, fontSize: 15, marginTop:4 }}>
              {loading ? <><div className="spinner" style={{width:16,height:16,borderWidth:2}}></div> Creating account...</> : 'Create Account →'}
            </button>
          </form>
          <div style={styles.footer}>
            <span style={{color:'var(--text3)', fontSize:14}}>Already have an account?</span>{' '}
            <Link to="/login" style={styles.link}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display:'flex', minHeight:'100vh', background:'var(--bg)', alignItems:'center', justifyContent:'center', position:'relative' },
  bg: { position:'absolute', inset:0, pointerEvents:'none' },
  glow1: { position:'absolute', top:'-20%', right:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)' },
  glow2: { position:'absolute', bottom:'-20%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)' },
  grid: { position:'absolute', inset:0, backgroundImage:'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize:'60px 60px', opacity:0.3 },
  container: { width:'100%', maxWidth:600, padding:24, position:'relative', zIndex:1 },
  formCard: { background:'var(--bg2)', border:'1px solid var(--border2)', borderRadius:20, padding:'40px', boxShadow:'0 24px 80px rgba(0,0,0,0.5)' },
  brand: { display:'flex', alignItems:'center', gap:12, marginBottom:28 },
  logoIcon: { width:40, height:40, background:'var(--accent)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' },
  logoText: { fontFamily:'var(--font-display)', fontSize:20, fontWeight:800 },
  formHeader: { marginBottom:24 },
  formTitle: { fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 },
  formSub: { color:'var(--text3)', fontSize:14, marginTop:4 },
  form: { display:'flex', flexDirection:'column', gap:16 },
  row: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  footer: { marginTop:24, textAlign:'center' },
  link: { color:'var(--accent)', fontSize:14, fontWeight:500, textDecoration:'none' },
};
