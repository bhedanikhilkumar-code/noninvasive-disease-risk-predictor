import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postPrediction } from '../services/api';

const initial = {
  age: '',
  gender: 'male',
  bmi: '',
  bp_systolic: '',
  bp_diastolic: '',
  glucose: '',
  heart_rate: '',
  smoking: false,
  alcohol: false,
  physical_activity: 'medium',
  symptoms_text: ''
};

const TEST_PROFILES = {
  healthy: {
    label: 'Normal / Healthy Baseline',
    data: {
      age: '28',
      gender: 'female',
      bmi: '21.8',
      bp_systolic: '115',
      bp_diastolic: '75',
      glucose: '88',
      heart_rate: '68',
      smoking: false,
      alcohol: false,
      physical_activity: 'high',
      symptoms_text: 'None reported'
    }
  },
  hypertensive: {
    label: 'Cardiovascular / Hypertensive Risk',
    data: {
      age: '56',
      gender: 'male',
      bmi: '29.2',
      bp_systolic: '148',
      bp_diastolic: '94',
      glucose: '104',
      heart_rate: '84',
      smoking: true,
      alcohol: true,
      physical_activity: 'low',
      symptoms_text: 'Shortness of breath after stairs, occasional chest tightness'
    }
  },
  metabolic: {
    label: 'Metabolic / Prediabetic Risk',
    data: {
      age: '48',
      gender: 'female',
      bmi: '32.5',
      bp_systolic: '132',
      bp_diastolic: '86',
      glucose: '138',
      heart_rate: '78',
      smoking: false,
      alcohol: false,
      physical_activity: 'low',
      symptoms_text: 'Excessive thirst, frequent night urination, chronic fatigue'
    }
  }
};

const COMMON_SYMPTOMS = [
  'Chest tightness',
  'Shortness of breath',
  'Excessive thirst',
  'Frequent urination',
  'Blurred vision',
  'Chronic fatigue',
  'Heart palpitations',
  'Dizziness / lightheadedness',
  'Tingling in feet',
  'Swollen ankles',
  'Slow healing cuts'
];

const getBmiCategory = (bmi) => {
  const num = Number(bmi);
  if (!num) return { label: 'Enter BMI or use calculator below', color: '#94a3b8' };
  if (num < 18.5) return { label: 'Underweight', color: '#64748b' };
  if (num < 25.0) return { label: 'Normal Weight', color: '#10b981' };
  if (num < 30.0) return { label: 'Overweight', color: '#f59e0b' };
  if (num < 35.0) return { label: 'Obese (Class I)', color: '#ef4444' };
  return { label: 'Obese (Class II+)', color: '#b91c1c' };
};

const getBpCategory = (sys, dia) => {
  const s = Number(sys);
  const d = Number(dia);
  if (!s || !d) return { label: 'Enter systolic & diastolic BP', color: '#94a3b8' };
  if (s >= 180 || d >= 120) return { label: 'Crisis Range', color: '#b91c1c' };
  if (s >= 140 || d >= 90) return { label: 'Stage 2 HTN', color: '#ef4444' };
  if (s >= 130 || d >= 80) return { label: 'Stage 1 HTN', color: '#f59e0b' };
  if (s >= 120) return { label: 'Elevated BP', color: '#eab308' };
  return { label: 'Normal BP', color: '#10b981' };
};

const PredictPage = () => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showBmiCalc, setShowBmiCalc] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const calculateAndSetBmi = (e) => {
    e.preventDefault();
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!h || h < 50 || h > 260) {
      setFieldErrors((prev) => ({ ...prev, height: 'Enter height between 50 and 260 cm' }));
      return;
    }
    if (!w || w < 20 || w > 350) {
      setFieldErrors((prev) => ({ ...prev, weight: 'Enter weight between 20 and 350 kg' }));
      return;
    }
    const computed = (w / ((h / 100) * (h / 100))).toFixed(1);
    setForm((prev) => ({ ...prev, bmi: computed }));
    setFieldErrors((prev) => ({ ...prev, bmi: '', height: '', weight: '' }));
  };

  const loadProfile = (key) => {
    if (TEST_PROFILES[key]) {
      setForm({ ...TEST_PROFILES[key].data });
      setFieldErrors({});
      setError('');
    }
  };

  const addSymptom = (symptom) => {
    setForm((prev) => {
      const current = prev.symptoms_text.trim();
      if (current.toLowerCase().includes(symptom.toLowerCase())) return prev;
      const updated = current ? `${current}, ${symptom.toLowerCase()}` : symptom;
      return { ...prev, symptoms_text: updated };
    });
    setFieldErrors((prev) => ({ ...prev, symptoms_text: '' }));
  };

  const validateForm = () => {
    const errors = {};
    const age = Number(form.age);
    const bmi = Number(form.bmi);
    const sys = Number(form.bp_systolic);
    const dia = Number(form.bp_diastolic);
    const glu = Number(form.glucose);
    const hr = Number(form.heart_rate);

    if (!form.age || isNaN(age) || age < 1 || age > 120) errors.age = 'Enter patient age (1 - 120 years).';
    if (!form.bmi || isNaN(bmi) || bmi < 10 || bmi > 60) errors.bmi = 'Enter valid BMI (10 - 60 kg/m²). Use calculator below if needed.';
    if (!form.bp_systolic || isNaN(sys) || sys < 70 || sys > 250) errors.bp_systolic = 'Enter systolic BP (70 - 250 mmHg).';
    if (!form.bp_diastolic || isNaN(dia) || dia < 40 || dia > 150) errors.bp_diastolic = 'Enter diastolic BP (40 - 150 mmHg).';
    if (sys && dia && dia >= sys) {
      errors.bp_diastolic = 'Diastolic BP must be lower than systolic BP.';
    }
    if (!form.glucose || isNaN(glu) || glu < 40 || glu > 400) errors.glucose = 'Enter blood glucose (40 - 400 mg/dL).';
    if (!form.heart_rate || isNaN(hr) || hr < 30 || hr > 220) errors.heart_rate = 'Enter resting heart rate (30 - 220 bpm).';

    const symptoms = form.symptoms_text.trim();
    if (symptoms.length < 3) {
      errors.symptoms_text = 'Describe symptoms or enter "None reported".';
    } else if (symptoms.length > 2000) {
      errors.symptoms_text = 'Symptoms must be 2000 characters or fewer.';
    }
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setError('Please fill in all highlighted patient vitals before running screening.');
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const payload = {
        age: Number(form.age),
        gender: form.gender,
        bmi: Number(form.bmi),
        bp_systolic: Number(form.bp_systolic),
        bp_diastolic: Number(form.bp_diastolic),
        glucose: Number(form.glucose),
        heart_rate: Number(form.heart_rate),
        smoking: Boolean(form.smoking),
        alcohol: Boolean(form.alcohol),
        physical_activity: form.physical_activity,
        symptoms_text: form.symptoms_text.trim()
      };

      const record = await postPrediction(payload);
      navigate('/result', { state: { result: record.output } });
    } catch (err) {
      const message = err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Prediction request failed';
      const requestId = err.response?.headers?.['x-request-id'];
      setError(requestId ? `${message} (Request ID: ${requestId})` : message);
    } finally {
      setLoading(false);
    }
  };

  const bmiInfo = getBmiCategory(form.bmi);
  const bpInfo = getBpCategory(form.bp_systolic, form.bp_diastolic);

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 .4rem 0', fontSize: '1.6rem' }}>Clinical Risk Screening Assessment</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '.95rem' }}>
            Provide your physiological vitals and lifestyle habits. Our calibrated ensemble model cross-references your inputs against AHA/ACC and ADA clinical risk matrices.
          </p>
        </div>

        {/* Optional Test Presets for Quick Testing */}
        <div style={{ background: '#f8fafc', padding: '.5rem .85rem', borderRadius: '.6rem', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '.3rem' }}>
            🧪 Optional Test Profiles:
          </span>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {Object.keys(TEST_PROFILES).map((key) => (
              <button
                key={key}
                type="button"
                className="btn btn-outline"
                style={{ padding: '.25rem .55rem', fontSize: '.75rem' }}
                onClick={() => loadProfile(key)}
              >
                {TEST_PROFILES[key].label.split(' / ')[0]}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '.25rem .55rem', fontSize: '.75rem', color: '#dc2626' }}
              onClick={() => { setForm(initial); setFieldErrors({}); setError(''); }}
            >
              Clear Form
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {/* Section 1: Demographics */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span>👤</span> Demographics
          </h3>
          <div className="grid">
            <div className="form-group">
              <label>
                Age (years)
                <span className="input-hint">18 - 120</span>
              </label>
              <input
                name="age"
                type="number"
                placeholder="e.g. 42"
                value={form.age}
                onChange={onChange}
                min="1"
                max="120"
              />
              {fieldErrors.age && <small className="error">{fieldErrors.age}</small>}
            </div>

            <div className="form-group">
              <label>Biological Gender</label>
              <select name="gender" value={form.gender} onChange={onChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Non-binary</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Vitals & Body Metrics */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span>🩺</span> Vitals & Physiological Metrics
          </h3>
          <div className="grid">
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.25rem', flexWrap: 'wrap' }}>
                <label style={{ margin: 0 }}>
                  BMI (kg/m²)
                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: bmiInfo.color, marginLeft: '.4rem' }}>
                    ● {bmiInfo.label}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowBmiCalc(!showBmiCalc)}
                  style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '.78rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {showBmiCalc ? '✕ Hide Calculator' : '📐 Calculate from Height & Weight'}
                </button>
              </div>

              {showBmiCalc && (
                <div style={{ background: '#f0f9ff', padding: '.75rem', borderRadius: '.5rem', border: '1px solid #bae6fd', marginBottom: '.75rem' }}>
                  <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: '.4rem' }}>
                    Quick Height & Weight Calculator
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '.5rem', alignItems: 'flex-end' }}>
                    <div>
                      <small style={{ fontSize: '.72rem', color: '#475569' }}>Height (cm)</small>
                      <input
                        type="number"
                        placeholder="e.g. 175"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        style={{ padding: '.35rem', fontSize: '.85rem' }}
                      />
                    </div>
                    <div>
                      <small style={{ fontSize: '.72rem', color: '#475569' }}>Weight (kg)</small>
                      <input
                        type="number"
                        placeholder="e.g. 72"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        style={{ padding: '.35rem', fontSize: '.85rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={calculateAndSetBmi}
                      style={{ padding: '.45rem .75rem', fontSize: '.8rem', height: 'fit-content' }}
                    >
                      Set BMI
                    </button>
                  </div>
                  {(fieldErrors.height || fieldErrors.weight) && (
                    <small className="error" style={{ display: 'block', marginTop: '.25rem' }}>
                      {fieldErrors.height || fieldErrors.weight}
                    </small>
                  )}
                </div>
              )}

              <input
                name="bmi"
                type="number"
                step="0.1"
                placeholder="e.g. 24.5"
                value={form.bmi}
                onChange={onChange}
              />
              {fieldErrors.bmi && <small className="error">{fieldErrors.bmi}</small>}
            </div>

            <div className="form-group">
              <label>
                Systolic BP (mmHg)
                <span style={{ fontSize: '.75rem', fontWeight: 600, color: bpInfo.color, marginLeft: '.4rem' }}>
                  ● {bpInfo.label}
                </span>
              </label>
              <input
                name="bp_systolic"
                type="number"
                placeholder="e.g. 120"
                value={form.bp_systolic}
                onChange={onChange}
              />
              {fieldErrors.bp_systolic && <small className="error">{fieldErrors.bp_systolic}</small>}
            </div>

            <div className="form-group">
              <label>
                Diastolic BP (mmHg)
                <span className="input-hint">Target: &lt;80</span>
              </label>
              <input
                name="bp_diastolic"
                type="number"
                placeholder="e.g. 80"
                value={form.bp_diastolic}
                onChange={onChange}
              />
              {fieldErrors.bp_diastolic && <small className="error">{fieldErrors.bp_diastolic}</small>}
            </div>

            <div className="form-group">
              <label>
                Blood Glucose (mg/dL)
                <span className="input-hint">{form.glucose ? (Number(form.glucose) >= 126 ? 'Diabetic Range' : Number(form.glucose) >= 100 ? 'Prediabetic' : 'Normal') : 'Fasting target: <100'}</span>
              </label>
              <input
                name="glucose"
                type="number"
                step="0.1"
                placeholder="e.g. 95"
                value={form.glucose}
                onChange={onChange}
              />
              {fieldErrors.glucose && <small className="error">{fieldErrors.glucose}</small>}
            </div>

            <div className="form-group">
              <label>
                Resting Heart Rate (bpm)
                <span className="input-hint">Normal: 60-100</span>
              </label>
              <input
                name="heart_rate"
                type="number"
                placeholder="e.g. 72"
                value={form.heart_rate}
                onChange={onChange}
              />
              {fieldErrors.heart_rate && <small className="error">{fieldErrors.heart_rate}</small>}
            </div>
          </div>
        </div>

        {/* Section 3: Lifestyle Habits */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span>🏃</span> Lifestyle & Behavioral Factors
          </h3>
          <div className="grid">
            <div className="form-group">
              <label>Physical Activity Level</label>
              <select name="physical_activity" value={form.physical_activity} onChange={onChange}>
                <option value="low">Low (Sedentary, &lt;30 min/week)</option>
                <option value="medium">Medium (Moderate, 30-150 min/week)</option>
                <option value="high">High (Active, &gt;150 min/week)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tobacco Use</label>
              <label className="checkbox-card">
                <input name="smoking" type="checkbox" checked={form.smoking} onChange={onChange} />
                <span>Active tobacco smoker / nicotine user</span>
              </label>
            </div>

            <div className="form-group">
              <label>Alcohol Intake</label>
              <label className="checkbox-card">
                <input name="alcohol" type="checkbox" checked={form.alcohol} onChange={onChange} />
                <span>Regular alcohol consumption</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Symptoms NLP */}
        <div className="form-section" style={{ borderBottom: 'none' }}>
          <h3 className="form-section-title">
            <span>💬</span> Symptoms & Subjective Health Complaints
          </h3>
          <div className="form-group">
            <label>
              Describe Any Current Symptoms or Sensations
              <span className="input-hint">Or click quick tags below to append</span>
            </label>
            <textarea
              name="symptoms_text"
              value={form.symptoms_text}
              onChange={onChange}
              rows={3}
              placeholder="e.g., mild chest tightness after climbing stairs, occasional dizziness, and feeling unusually thirsty..."
            />
            {fieldErrors.symptoms_text && <small className="error">{fieldErrors.symptoms_text}</small>}

            <div style={{ marginTop: '.5rem' }}>
              <small style={{ color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>
                Quick Symptom Suggestions:
              </small>
              <div className="chip-container">
                {COMMON_SYMPTOMS.map((symptom) => {
                  const isSelected = form.symptoms_text.toLowerCase().includes(symptom.toLowerCase());
                  return (
                    <button
                      type="button"
                      key={symptom}
                      className={`symptom-chip ${isSelected ? 'active' : ''}`}
                      onClick={() => addSymptom(symptom)}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {symptom}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="warning-alert-box" style={{ margin: '1rem 0' }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn" type="submit" disabled={loading} style={{ padding: '.85rem 2rem', fontSize: '1.05rem' }}>
            {loading ? (
              <>
                <span className="spinner">⏳</span> Analyzing Clinically...
              </>
            ) : (
              <>
                <span>⚡</span> Run Full Risk Assessment
              </>
            )}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setForm(initial)}
            disabled={loading}
          >
            Reset Form
          </button>
        </div>
      </form>
    </section>
  );
};

export default PredictPage;
