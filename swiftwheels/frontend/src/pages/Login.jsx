import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sanitize values to prevent accidental trailing whitespace issues
    const sanitizedEmail = form.email.trim();
    const sanitizedPassword = form.password;

    try {
      await login(sanitizedEmail, sanitizedPassword);
      navigate('/');
    } catch (err) {
      console.error('Login error details:', err);
      // Capture detailed server message (e.g., "Invalid email or password")
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
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
      
      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
            </svg>
          </div>
          <div>
            <div style={styles.logoText}><span>Swift</span><span style={{ color: 'var(--accent)' }}>Wheels</span></div>
            <div style={styles.logoSub}>Fleet Management System</div>
          </div>
        </div>
        <div style={styles.tagline}>
          <h1 style={styles.headline}>Drive your fleet.<br /><span style={styles.highlight}>Forward.</span></h1>
          <p style={styles.subtext}>Complete visibility over every vehicle, driver, and delivery — all in one intelligent platform.</p>
        </div>
        <div style={styles.features}>
          {['Real-time vehicle tracking', 'Smart fuel analytics', 'Maintenance scheduling', 'Instant reports'].map((f) => (
            <div key={f} style={styles.featureItem}>
              <span style={styles.featureDot}></span>
              <span style={styles.featureText}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSub}>Sign in to your account</p>
          </div>
          
          {error && <div className="alert alert-error" style={styles.errorAlert}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input 
                name="email" 
                type="email" 
                className="form-input" 
                placeholder="you@company.com"
                value={form.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                name="password" 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={form.password} 
                onChange={handleChange} 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ marginTop: 8, height: 44, fontSize: 15 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div> Signing in...</> : 'Sign in →'}
            </button>
          </form>
          
          <div style={styles.footer}>
            <span style={{ color: 'var(--text3)', fontSize: 14 }}>Don't have an account?</span>{' '}
            <Link to="/register" style={styles.link}>Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden', position: 'relative' },
  bg: { position: 'absolute', inset: 0, pointerEvents: 'none' },
  glow1: { position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)' },
  glow2: { position: 'absolute', bottom: '-20%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 70%)' },
  grid: { position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.3 },
  left: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', gap: 40, position: 'relative', zIndex: 1 },
  brand: { display: 'flex', alignItems: 'center', gap: 14 },
  logoIcon: { width: 48, height: 48, background: 'var(--accent)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 },
  logoSub: { fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 },
  tagline: { maxWidth: 480 },
  headline: { fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, lineHeight: 1.1, marginBottom: 16 },
  highlight: { color: 'var(--accent)' },
  subtext: { fontSize: 16, color: 'var(--text2)', lineHeight: 1.7 },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: { display: 'flex', alignItems: 'center', gap: 12 },
  featureDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  featureText: { fontSize: 15, color: 'var(--text2)' },
  right: { width: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative', zIndex: 1 },
  formCard: { width: '100%', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 20, padding: '40px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  formHeader: { marginBottom: 28 },
  formTitle: { fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700 },
  formSub: { color: 'var(--text3)', fontSize: 14, marginTop: 4 },
  form: { display: 'flex', flexDirection: 'column', gap: 18 },
  errorAlert: { marginBottom: 16, padding: '10px 14px', borderRadius: '8px', fontSize: '14px' },
  footer: { marginTop: 24, textAlign: 'center' },
  link: { color: 'var(--accent)', fontSize: 14, fontWeight: 500, textDecoration: 'none' },
};