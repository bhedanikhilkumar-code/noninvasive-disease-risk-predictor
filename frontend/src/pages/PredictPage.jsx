import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postPrediction } from '../services/api';

const initial = {
  age: 32,
  gender: 'male',
  bmi: 24.5,
  bp_systolic: 120,
  bp_diastolic: 80,
  glucose: 95,
  heart_rate: 72,
  smoking: false,
  alcohol: false,
  physical_activity: 'medium',
  symptoms_text: ''
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
  if (bmi < 18.5) return { label: 'Underweight', color: '#64748b' };
  if (bmi < 25.0) return { label: 'Normal Weight', color: '#10b981' };
  if (bmi < 30.0) return { label: 'Overweight', color: '#f59e0b' };
  if (bmi < 35.0) return { label: 'Obese (Class I)', color: '#ef4444' };
  return { label: 'Obese (Class II+)', color: '#b91c1c' };
};

const getBpCategory = (sys, dia) => {
  if (sys >= 180 || dia >= 120) return { label: 'Crisis Range', color: '#b91c1c' };
  if (sys >= 140 || dia >= 90) return { label: 'Stage 2 HTN', color: '#ef4444' };
  if (sys >= 130 || dia >= 80) return { label: 'Stage 1 HTN', color: '#f59e0b' };
  if (sys >= 120) return { label: 'Elevated BP', color: '#eab308' };
  return { label: 'Normal BP', color: '#10b981' };
};

const PredictPage = () => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : ['gender', 'symptoms_text', 'physical_activity'].includes(name) ? value : Number(value)
    }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
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
    if (!Number.isFinite(form.age) || form.age < 1 || form.age > 120) errors.age = 'Age must be between 1 and 120.';
    if (!Number.isFinite(form.bmi) || form.bmi < 10 || form.bmi > 60) errors.bmi = 'BMI must be between 10 and 60.';
    if (!Number.isFinite(form.bp_systolic) || form.bp_systolic < 70 || form.bp_systolic > 250) errors.bp_systolic = 'Systolic BP must be between 70 and 250 mmHg.';
    if (!Number.isFinite(form.bp_diastolic) || form.bp_diastolic < 40 || form.bp_diastolic > 150) errors.bp_diastolic = 'Diastolic BP must be between 40 and 150 mmHg.';
    if (Number.isFinite(form.bp_systolic) && Number.isFinite(form.bp_diastolic) && form.bp_diastolic >= form.bp_systolic) {
      errors.bp_diastolic = 'Diastolic BP must be strictly lower than systolic BP.';
    }
    if (!Number.isFinite(form.glucose) || form.glucose < 40 || form.glucose > 400) errors.glucose = 'Glucose must be between 40 and 400 mg/dL.';
    if (!Number.isFinite(form.heart_rate) || form.heart_rate < 30 || form.heart_rate > 220) errors.heart_rate = 'Heart rate must be between 30 and 220 bpm.';
    if (form.symptoms_text.trim().length < 3) errors.symptoms_text = 'Please enter at least 3 characters describing symptoms or "none".';
    if (form.symptoms_text.length > 2000) errors.symptoms_text = 'Symptoms must be 2000 characters or fewer.';
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setError('Please resolve the highlighted fields before submitting.');
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});

    try {
      const record = await postPrediction(form);
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 .4rem 0', fontSize: '1.6rem' }}>Clinical Risk Screening Assessment</h2>
        <p style={{ margin: 0, color: '#64748b', fontSize: '.95rem' }}>
          Provide your physiological vitals and lifestyle habits. Our calibrated ensemble model cross-references your inputs against AHA/ACC and ADA clinical risk matrices.
        </p>
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
              <input name="age" type="number" value={form.age} onChange={onChange} min="1" max="120" />
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
              <label>
                BMI (kg/m²)
                <span style={{ fontSize: '.75rem', fontWeight: 600, color: bmiInfo.color }}>
                  ● {bmiInfo.label}
                </span>
              </label>
              <input name="bmi" type="number" step="0.1" value={form.bmi} onChange={onChange} />
              {fieldErrors.bmi && <small className="error">{fieldErrors.bmi}</small>}
            </div>

            <div className="form-group">
              <label>
                Systolic BP (mmHg)
                <span style={{ fontSize: '.75rem', fontWeight: 600, color: bpInfo.color }}>
                  ● {bpInfo.label}
                </span>
              </label>
              <input name="bp_systolic" type="number" value={form.bp_systolic} onChange={onChange} />
              {fieldErrors.bp_systolic && <small className="error">{fieldErrors.bp_systolic}</small>}
            </div>

            <div className="form-group">
              <label>
                Diastolic BP (mmHg)
                <span className="input-hint">Target: &lt;80</span>
              </label>
              <input name="bp_diastolic" type="number" value={form.bp_diastolic} onChange={onChange} />
              {fieldErrors.bp_diastolic && <small className="error">{fieldErrors.bp_diastolic}</small>}
            </div>

            <div className="form-group">
              <label>
                Blood Glucose (mg/dL)
                <span className="input-hint">{form.glucose >= 126 ? 'Diabetic Range' : form.glucose >= 100 ? 'Prediabetic' : 'Normal'}</span>
              </label>
              <input name="glucose" type="number" step="0.1" value={form.glucose} onChange={onChange} />
              {fieldErrors.glucose && <small className="error">{fieldErrors.glucose}</small>}
            </div>

            <div className="form-group">
              <label>
                Resting Heart Rate (bpm)
                <span className="input-hint">Normal: 60-100</span>
              </label>
              <input name="heart_rate" type="number" value={form.heart_rate} onChange={onChange} />
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
