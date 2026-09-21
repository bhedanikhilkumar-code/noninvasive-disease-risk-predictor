import { Link } from 'react-router-dom';

const HomePage = () => (
  <div>
    {/* Hero Section */}
    <section className="hero-banner">
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,0.2)', padding: '.3rem .8rem', borderRadius: '9999px', fontSize: '.82rem', fontWeight: 600, marginBottom: '1rem' }}>
        <span>✨</span> Calibrated Machine Learning & Clinical NLP
      </div>
      <h1>Early Disease Risk Prediction Without Blood Draws</h1>
      <p>
        Assess your early cardiometabolic health risks using non-invasive everyday vitals, lifestyle habits, and reported symptoms. Get evidence-based risk scores, disease-specific breakdowns, and actionable lifestyle recommendations.
      </p>
      <div className="hero-actions">
        <Link className="btn" to="/predict" style={{ background: '#ffffff', color: '#1d4ed8', fontWeight: 700 }}>
          <span>🚀</span> Start Free Screening
        </Link>
        <Link className="btn btn-secondary" to="/dashboard">
          <span>📊</span> View Analytics Dashboard
        </Link>
      </div>
    </section>

    {/* Feature Pillars */}
    <div className="feature-cards-grid">
      <div className="feature-card">
        <div className="feature-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
          🫀
        </div>
        <h3>Cardiovascular Screening</h3>
        <p>
          Calculates arterial stiffness (pulse pressure), mean arterial pressure, and hypertension staging according to AHA/ACC guidelines.
        </p>
      </div>

      <div className="feature-card">
        <div className="feature-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
          🩸
        </div>
        <h3>Type-2 Diabetes Risk</h3>
        <p>
          Identifies pre-diabetic and metabolic dysfunction patterns using BMI tiers, glycemic ranges, and activity levels aligned with ADA criteria.
        </p>
      </div>

      <div className="feature-card">
        <div className="feature-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
          🩺
        </div>
        <h3>Clinical Symptom NLP</h3>
        <p>
          Smart text triage scans for critical red-flag symptoms such as chest tightness, radiating pain, excessive thirst, and breathlessness.
        </p>
      </div>

      <div className="feature-card">
        <div className="feature-icon" style={{ background: '#faf5ff', color: '#8b5cf6' }}>
          💡
        </div>
        <h3>Evidence-Based Action Plan</h3>
        <p>
          Provides tailored lifestyle recommendations, nutritional guidance (DASH diet), and recommended follow-up lab diagnostic tests.
        </p>
      </div>
    </div>

    {/* How It Works */}
    <section className="card">
      <h2 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>
        How PulsePredict AI Works
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
        <div>
          <div style={{ width: '3rem', height: '3rem', background: '#eff6ff', color: '#2563eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontSize: '1.2rem', fontWeight: 800 }}>
            1
          </div>
          <h4 style={{ margin: '0 0 .5rem 0' }}>Input Health Signals</h4>
          <p style={{ fontSize: '.88rem', color: '#64748b', margin: 0 }}>
            Enter routine non-invasive parameters: age, BMI, blood pressure, glucose, resting pulse, and symptoms.
          </p>
        </div>

        <div>
          <div style={{ width: '3rem', height: '3rem', background: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontSize: '1.2rem', fontWeight: 800 }}>
            2
          </div>
          <h4 style={{ margin: '0 0 .5rem 0' }}>Ensemble ML Processing</h4>
          <p style={{ fontSize: '.88rem', color: '#64748b', margin: 0 }}>
            Calibrated Gradient Boosting evaluates nonlinear risk interactions and cross-references symptom ontologies.
          </p>
        </div>

        <div>
          <div style={{ width: '3rem', height: '3rem', background: '#fef3c7', color: '#d97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontSize: '1.2rem', fontWeight: 800 }}>
            3
          </div>
          <h4 style={{ margin: '0 0 .5rem 0' }}>Get Actionable Insights</h4>
          <p style={{ fontSize: '.88rem', color: '#64748b', margin: 0 }}>
            Receive personalized risk dials, emergency warning alerts, and physician-reviewed lifestyle roadmaps.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link className="btn" to="/predict" style={{ padding: '.85rem 2rem', fontSize: '1.05rem' }}>
          Start Your Health Assessment Now &rarr;
        </Link>
      </div>
    </section>
  </div>
);

export default HomePage;
