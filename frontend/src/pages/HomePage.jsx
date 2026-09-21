import { Link } from 'react-router-dom';

const HomePage = () => (
  <div>
    {/* Hero Section */}
    <section className="hero-banner">
      <div className="hero-grid">
        <div className="hero-content">
          <div className="hero-badge">
            <span>✨</span> Calibrated Machine Learning & Clinical NLP
          </div>
          <h1>Early Disease Risk Prediction Without Blood Draws</h1>
          <p>
            Assess your early cardiometabolic health risks using non-invasive everyday vitals, lifestyle habits, and reported symptoms. Get evidence-based risk scores, disease-specific breakdowns, and actionable lifestyle recommendations.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-hero-primary" to="/predict">
              <span>🚀</span> Start Free Screening
            </Link>
            <Link className="btn btn-secondary" to="/dashboard">
              <span>📊</span> View Analytics Dashboard
            </Link>
          </div>
        </div>

        {/* Laptop Hero Feature Card */}
        <div className="hero-stats-card">
          <div className="hero-card-header">
            <span>🩺 Clinical Screening Engine</span>
            <span className="live-pulse">● Active</span>
          </div>
          <div className="hero-card-items">
            <div className="hero-card-item">
              <span className="item-icon">🫀</span>
              <div>
                <strong>AHA/ACC Cardiovascular Staging</strong>
                <small>Pulse pressure & arterial load analysis</small>
              </div>
            </div>
            <div className="hero-card-item">
              <span className="item-icon">🩸</span>
              <div>
                <strong>ADA Metabolic Risk Matrix</strong>
                <small>Early prediabetes & insulin resistance markers</small>
              </div>
            </div>
            <div className="hero-card-item">
              <span className="item-icon">🎯</span>
              <div>
                <strong>93.3% ROC-AUC Accuracy</strong>
                <small>Calibrated Gradient Boosting ensemble model</small>
              </div>
            </div>
            <div className="hero-card-item">
              <span className="item-icon">⚡</span>
              <div>
                <strong>100% Noninvasive & Instant</strong>
                <small>Zero lab wait times, zero blood draws</small>
              </div>
            </div>
          </div>
        </div>
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
      <h2 style={{ fontSize: '1.4rem', marginTop: 0, marginBottom: '1.75rem', textAlign: 'center' }}>
        How PulsePredict AI Works
      </h2>
      <div className="steps-grid">
        <div className="step-box">
          <div className="step-number" style={{ background: '#eff6ff', color: '#2563eb' }}>
            1
          </div>
          <h4>Input Health Signals</h4>
          <p>
            Enter routine non-invasive parameters: age, BMI, blood pressure, glucose, resting pulse, and symptoms.
          </p>
        </div>

        <div className="step-box">
          <div className="step-number" style={{ background: '#ecfdf5', color: '#10b981' }}>
            2
          </div>
          <h4>Ensemble ML Processing</h4>
          <p>
            Calibrated Gradient Boosting evaluates nonlinear risk interactions and cross-references symptom ontologies.
          </p>
        </div>

        <div className="step-box">
          <div className="step-number" style={{ background: '#fef3c7', color: '#d97706' }}>
            3
          </div>
          <h4>Get Actionable Insights</h4>
          <p>
            Receive personalized risk dials, emergency warning alerts, and physician-reviewed lifestyle roadmaps.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
        <Link className="btn btn-hero-primary" to="/predict" style={{ padding: '.85rem 2.25rem', fontSize: '1.05rem' }}>
          Start Your Health Assessment Now &rarr;
        </Link>
      </div>
    </section>
  </div>
);

export default HomePage;
