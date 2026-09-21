import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postPrediction } from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [quickForm, setQuickForm] = useState({
    age: '45',
    bp_systolic: '130',
    bp_diastolic: '85',
    glucose: '105',
    bmi: '26.5',
    smoking: false,
    physical_activity: 'medium',
    symptoms_text: 'None reported'
  });
  const [quickResult, setQuickResult] = useState(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  const onQuickChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuickForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const runQuickScreening = async (e) => {
    e.preventDefault();
    setQuickLoading(true);
    setQuickError('');
    try {
      const payload = {
        age: Number(quickForm.age) || 45,
        gender: 'male',
        bmi: Number(quickForm.bmi) || 25.0,
        bp_systolic: Number(quickForm.bp_systolic) || 120,
        bp_diastolic: Number(quickForm.bp_diastolic) || 80,
        glucose: Number(quickForm.glucose) || 95,
        heart_rate: 75,
        smoking: Boolean(quickForm.smoking),
        alcohol: false,
        physical_activity: quickForm.physical_activity,
        symptoms_text: quickForm.symptoms_text
      };
      const record = await postPrediction(payload);
      setQuickResult(record.output);
    } catch (err) {
      setQuickError(err.response?.data?.message || 'Quick check unavailable');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
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
                <span>🚀</span> Start Full Comprehensive Screening
              </Link>
              <Link className="btn btn-secondary" to="/dashboard">
                <span>📊</span> View Analytics Dashboard
              </Link>
            </div>
          </div>

          {/* Working Live Health Screener Widget */}
          <div className="hero-stats-card">
            <div className="hero-card-header">
              <span>🩺 Live Interactive Screener</span>
              <span className="live-pulse">● Connected</span>
            </div>

            {quickResult ? (
              <div style={{ padding: '.5rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '.82rem', color: '#64748b', fontWeight: 600 }}>Calculated Risk Score</span>
                  <div style={{
                    fontSize: '2.4rem',
                    fontWeight: 800,
                    color: quickResult.score >= 70 ? '#ef4444' : quickResult.score >= 35 ? '#f59e0b' : '#10b981'
                  }}>
                    {quickResult.score} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 100</span>
                  </div>
                  <span className={`badge-pill badge-${quickResult.level?.toLowerCase()}`} style={{ fontSize: '.85rem' }}>
                    {quickResult.level} Risk Tier
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem', marginBottom: '1rem' }}>
                  <div style={{ background: '#f8fafc', padding: '.6rem', borderRadius: '.5rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>🫀 Cardiovascular</div>
                    <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{quickResult.cardiovascular_score || 0}</strong>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '.6rem', borderRadius: '.5rem', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '.75rem', color: '#64748b' }}>🩸 Diabetes Risk</div>
                    <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{quickResult.diabetes_score || 0}</strong>
                  </div>
                </div>

                {quickResult.explanations?.[0] && (
                  <p style={{ fontSize: '.78rem', color: '#475569', background: '#f1f5f9', padding: '.5rem .7rem', borderRadius: '.4rem', margin: '0 0 1rem 0', lineHeight: '1.4' }}>
                    💡 {quickResult.explanations[0]}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-hero-primary"
                    onClick={() => navigate('/result', { state: { result: quickResult } })}
                    style={{ width: '100%', fontSize: '.85rem', padding: '.6rem' }}
                  >
                    View Complete Clinical Report &rarr;
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setQuickResult(null)}
                    style={{ width: '100%', fontSize: '.8rem', padding: '.45rem' }}
                  >
                    ↺ Test Another Patient
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={runQuickScreening} style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                <span style={{ fontSize: '.8rem', color: '#64748b' }}>
                  Test the live machine learning model instantly with sample or custom vitals:
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  <div>
                    <label style={{ fontSize: '.72rem', color: '#475569', display: 'block', marginBottom: '.2rem' }}>Age (years)</label>
                    <input
                      name="age"
                      type="number"
                      value={quickForm.age}
                      onChange={onQuickChange}
                      style={{ padding: '.4rem .6rem', fontSize: '.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '.72rem', color: '#475569', display: 'block', marginBottom: '.2rem' }}>BMI (kg/m²)</label>
                    <input
                      name="bmi"
                      type="number"
                      step="0.1"
                      value={quickForm.bmi}
                      onChange={onQuickChange}
                      style={{ padding: '.4rem .6rem', fontSize: '.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  <div>
                    <label style={{ fontSize: '.72rem', color: '#475569', display: 'block', marginBottom: '.2rem' }}>Systolic BP (mmHg)</label>
                    <input
                      name="bp_systolic"
                      type="number"
                      value={quickForm.bp_systolic}
                      onChange={onQuickChange}
                      style={{ padding: '.4rem .6rem', fontSize: '.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '.72rem', color: '#475569', display: 'block', marginBottom: '.2rem' }}>Diastolic BP (mmHg)</label>
                    <input
                      name="bp_diastolic"
                      type="number"
                      value={quickForm.bp_diastolic}
                      onChange={onQuickChange}
                      style={{ padding: '.4rem .6rem', fontSize: '.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '.72rem', color: '#475569', display: 'block', marginBottom: '.2rem' }}>Fasting Glucose (mg/dL)</label>
                  <input
                    name="glucose"
                    type="number"
                    value={quickForm.glucose}
                    onChange={onQuickChange}
                    style={{ padding: '.4rem .6rem', fontSize: '.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', margin: '.2rem 0' }}>
                  <input
                    id="quick_smoking"
                    name="smoking"
                    type="checkbox"
                    checked={quickForm.smoking}
                    onChange={onQuickChange}
                  />
                  <label htmlFor="quick_smoking" style={{ fontSize: '.78rem', color: '#475569', cursor: 'pointer', margin: 0 }}>
                    Active tobacco smoker
                  </label>
                </div>

                {quickError && (
                  <small style={{ color: '#ef4444', fontSize: '.75rem' }}>{quickError}</small>
                )}

                <button
                  type="submit"
                  disabled={quickLoading}
                  className="btn btn-hero-primary"
                  style={{ width: '100%', padding: '.65rem', fontSize: '.9rem', marginTop: '.2rem' }}
                >
                  {quickLoading ? '⚡ Processing Assessment...' : '⚡ Calculate Live Risk Now'}
                </button>
              </form>
            )}
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
};

export default HomePage;
