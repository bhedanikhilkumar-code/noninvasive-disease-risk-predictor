import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postPrediction } from '../services/api';

const initial = {
  age: 30,
  gender: 'male',
  bmi: 24,
  bp_systolic: 120,
  bp_diastolic: 80,
  glucose: 95,
  heart_rate: 75,
  smoking: false,
  alcohol: false,
  physical_activity: 'medium',
  symptoms_text: ''
};

const PredictPage = () => {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? checked
        : ['gender', 'symptoms_text', 'physical_activity'].includes(name)
          ? value
          : Number(value)
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const record = await postPrediction(form);
      sessionStorage.setItem('last-prediction-result', JSON.stringify(record.output));
      navigate('/result', { state: { result: record.output } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(Array.isArray(errors) ? errors.join(' ') : err.response?.data?.message || 'Prediction request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Health screening prototype</p>
          <h2>Risk Assessment</h2>
        </div>
        <span className="privacy-badge">Anonymous session</span>
      </div>
      <p className="muted">Enter basic non-invasive indicators. This prototype provides an educational risk score, not a diagnosis.</p>

      <form className="grid" onSubmit={onSubmit}>
        <label>
          Age
          <input name="age" type="number" min="1" max="120" value={form.age} onChange={onChange} required />
        </label>
        <label>
          Gender
          <select name="gender" value={form.gender} onChange={onChange} required>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          BMI
          <input name="bmi" type="number" min="10" max="60" step="0.1" value={form.bmi} onChange={onChange} required />
        </label>
        <label>
          Systolic BP
          <input name="bp_systolic" type="number" min="70" max="250" value={form.bp_systolic} onChange={onChange} required />
        </label>
        <label>
          Diastolic BP
          <input name="bp_diastolic" type="number" min="40" max="150" value={form.bp_diastolic} onChange={onChange} required />
        </label>
        <label>
          Glucose
          <input name="glucose" type="number" min="40" max="400" step="0.1" value={form.glucose} onChange={onChange} required />
        </label>
        <label>
          Heart Rate
          <input name="heart_rate" type="number" min="30" max="220" value={form.heart_rate} onChange={onChange} required />
        </label>
        <label>
          Physical Activity
          <select name="physical_activity" value={form.physical_activity} onChange={onChange} required>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input name="smoking" type="checkbox" checked={form.smoking} onChange={onChange} />
          Smoking
        </label>
        <label className="checkbox-row">
          <input name="alcohol" type="checkbox" checked={form.alcohol} onChange={onChange} />
          Alcohol use
        </label>
        <label className="full-width">
          Symptoms / notes
          <textarea
            name="symptoms_text"
            value={form.symptoms_text}
            onChange={onChange}
            rows={4}
            maxLength={1000}
            placeholder="e.g. fatigue, headache, poor sleep"
            required
          />
          <small>{form.symptoms_text.length}/1000 characters</small>
        </label>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Calculating…' : 'Get Risk Score'}
        </button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
};

export default PredictPage;
