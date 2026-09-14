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
      [name]: type === 'checkbox' ? checked : ['gender', 'symptoms_text', 'physical_activity'].includes(name) ? value : Number(value)
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const record = await postPrediction(form);
      navigate('/result', { state: { result: record.output } });
    } catch (err) {
      setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Prediction request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>Prediction Form</h2>
      <form className="grid" onSubmit={onSubmit}>
        <label>
          age
          <input name="age" type="number" value={form.age} onChange={onChange} />
        </label>
        <label>
          gender
          <select name="gender" value={form.gender} onChange={onChange}>
            <option value="male">male</option>
            <option value="female">female</option>
            <option value="other">other</option>
          </select>
        </label>
        <label>
          bmi
          <input name="bmi" type="number" step="0.1" value={form.bmi} onChange={onChange} />
        </label>
        <label>
          bp_systolic
          <input name="bp_systolic" type="number" value={form.bp_systolic} onChange={onChange} />
        </label>
        <label>
          bp_diastolic
          <input name="bp_diastolic" type="number" value={form.bp_diastolic} onChange={onChange} />
        </label>
        <label>
          glucose
          <input name="glucose" type="number" step="0.1" value={form.glucose} onChange={onChange} />
        </label>
        <label>
          heart_rate
          <input name="heart_rate" type="number" value={form.heart_rate} onChange={onChange} />
        </label>
        <label>
          physical_activity
          <select name="physical_activity" value={form.physical_activity} onChange={onChange}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
        <label className="checkbox-row">
          <input name="smoking" type="checkbox" checked={form.smoking} onChange={onChange} />
          smoking (yes/no)
        </label>
        <label className="checkbox-row">
          <input name="alcohol" type="checkbox" checked={form.alcohol} onChange={onChange} />
          alcohol (yes/no)
        </label>
        <label style={{ gridColumn: '1 / -1' }}>
          symptoms_text
          <textarea
            name="symptoms_text"
            value={form.symptoms_text}
            onChange={onChange}
            rows={3}
            placeholder="e.g. fatigue, headaches, poor sleep"
          />
        </label>
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Get Risk Score'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
};

export default PredictPage;
