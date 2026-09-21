import { Link, useLocation } from 'react-router-dom';

const getLevelClass = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'badge-low';
    case 'medium':
      return 'badge-medium';
    case 'high':
      return 'badge-high';
    default:
      return '';
  }
};

const getFillClass = (score) => {
  if (score >= 70) return 'fill-high';
  if (score >= 35) return 'fill-medium';
  return 'fill-low';
};

const ResultPage = () => {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <section className="card">
        <h2>No result available</h2>
        <p>Please enter your health vitals and lifestyle information first.</p>
        <Link className="btn" to="/predict">
          Go to Predict
        </Link>
      </section>
    );
  }

  const {
    score = 0,
    level = 'Low',
    cardiovascular_score,
    diabetes_score,
    symptom_flags = [],
    explanations = [],
    warnings = [],
    recommendations = [],
    disclaimer,
    model_version
  } = result;

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Comprehensive Risk Assessment</h2>
        <span className={`badge-pill ${getLevelClass(level)}`}>
          {level} Risk Tier
        </span>
      </div>

      <div style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '2.4rem', fontWeight: 'bold', color: score >= 70 ? '#b91c1c' : score >= 35 ? '#d97706' : '#15803d' }}>
          {score} <span style={{ fontSize: '1.2rem', color: '#64748b' }}>/ 100</span>
        </div>
        <div className="meter-bar-bg" style={{ height: '14px' }}>
          <div
            className={`meter-bar-fill ${getFillClass(score)}`}
            style={{ width: `${Math.min(100, Math.max(2, score))}%` }}
          />
        </div>
      </div>

      {/* Critical Safety Warnings */}
      {warnings.length > 0 && (
        <div className="warning-alert-box">
          <h3 style={{ margin: '0 0 .5rem 0', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span>⚠️</span> Critical Clinical Warnings
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {warnings.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '.3rem' }}><strong>{item}</strong></li>
            ))}
          </ul>
        </div>
      )}

      {/* Multi-Condition Risk Breakdown */}
      {(cardiovascular_score !== undefined || diabetes_score !== undefined) && (
        <>
          <h3>Disease-Specific Breakdown</h3>
          <div className="risk-breakdown-grid">
            {cardiovascular_score !== undefined && (
              <div className="risk-meter-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>🫀 Cardiovascular (Heart) Risk</span>
                  <span>{cardiovascular_score} / 100</span>
                </div>
                <div className="meter-bar-bg">
                  <div
                    className={`meter-bar-fill ${getFillClass(cardiovascular_score)}`}
                    style={{ width: `${Math.min(100, Math.max(2, cardiovascular_score))}%` }}
                  />
                </div>
                <small style={{ display: 'block', marginTop: '.4rem', color: '#64748b' }}>
                  AHA/Framingham model factors (BP, pulse pressure, smoking, age)
                </small>
              </div>
            )}

            {diabetes_score !== undefined && (
              <div className="risk-meter-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                  <span>🩸 Type-2 Diabetes Risk</span>
                  <span>{diabetes_score} / 100</span>
                </div>
                <div className="meter-bar-bg">
                  <div
                    className={`meter-bar-fill ${getFillClass(diabetes_score)}`}
                    style={{ width: `${Math.min(100, Math.max(2, diabetes_score))}%` }}
                  />
                </div>
                <small style={{ display: 'block', marginTop: '.4rem', color: '#64748b' }}>
                  ADA risk factors (fasting/random glucose, BMI, physical activity)
                </small>
              </div>
            )}
          </div>
        </>
      )}

      {/* Detected Symptom Markers */}
      {symptom_flags.length > 0 && (
        <div style={{ margin: '1rem 0' }}>
          <h4>Identified Clinical Symptoms:</h4>
          <div>
            {symptom_flags.map((flag, idx) => (
              <span key={idx} className="tag-badge">
                🔍 {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Factor Analysis / Explanations */}
      <h3>Key Contributing Health Factors</h3>
      <ul style={{ lineHeight: '1.6' }}>
        {explanations.map((item, idx) => (
          <li key={idx} style={{ marginBottom: '.4rem' }}>{item}</li>
        ))}
      </ul>

      {/* Actionable Lifestyle & Clinical Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginTop: '1.2rem' }}>
          <h3>Personalized Evidence-Based Recommendations</h3>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-card">
              💡 {rec}
            </div>
          ))}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

      <p style={{ fontSize: '.88rem', color: '#64748b' }}>
        <em>{disclaimer || 'This is a screening estimate, not a diagnosis or a substitute for medical care.'}</em>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        {model_version && (
          <small style={{ color: '#94a3b8' }}>
            Model Engine: {model_version} (Calibrated Gradient Boosting Ensemble)
          </small>
        )}
        <Link className="btn" to="/predict">
          Start New Assessment
        </Link>
      </div>
    </section>
  );
};

export default ResultPage;
