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

  const validateForm = () => {
    const errors = {};
    if (!Number.isFinite(form.age) || form.age < 1 || form.age > 120) errors.age = 'Age must be between 1 and 120.';
    if (!Number.isFinite(form.bmi) || form.bmi < 10 || form.bmi > 60) errors.bmi = 'BMI must be between 10 and 60.';
    if (!Number.isFinite(form.bp_systolic) || form.bp_systolic < 70 || form.bp_systolic > 250) errors.bp_systolic = 'Systolic BP must be between 70 and 250.';
    if (!Number.isFinite(form.bp_diastolic) || form.bp_diastolic < 40 || form.bp_diastolic > 150) errors.bp_diastolic = 'Diastolic BP must be between 40 and 150.';
    if (Number.isFinite(form.bp_systolic) && Number.isFinite(form.bp_diastolic) && form.bp_diastolic >= form.bp_systolic) {
      errors.bp_diastolic = 'Diastolic BP must be lower than systolic BP.';
    }
    if (!Number.isFinite(form.glucose) || form.glucose < 40 || form.glucose > 400) errors.glucose = 'Glucose must be between 40 and 400.';
    if (!Number.isFinite(form.heart_rate) || form.heart_rate < 30 || form.heart_rate > 220) errors.heart_rate = 'Heart rate must be between 30 and 220.';
    if (form.symptoms_text.trim().length < 3) errors.symptoms_text = 'Please enter at least 3 characters.';
    if (form.symptoms_text.length > 2000) errors.symptoms_text = 'Symptoms must be 2000 characters or fewer.';
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      setError('Please correct the highlighted fields.');
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
      setError(requestId ? `${message} Please contact support with request ID: ${requestId}` : message);
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
          {fieldErrors.age && <small className="error">{fieldErrors.age}</small>}
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
          {fieldErrors.bmi && <small className="error">{fieldErrors.bmi}</small>}
        </label>
        <label>
          bp_systolic
          <input name="bp_systolic" type="number" value={form.bp_systolic} onChange={onChange} />
          {fieldErrors.bp_systolic && <small className="error">{fieldErrors.bp_systolic}</small>}
        </label>
        <label>
          bp_diastolic
          <input name="bp_diastolic" type="number" value={form.bp_diastolic} onChange={onChange} />
          {fieldErrors.bp_diastolic && <small className="error">{fieldErrors.bp_diastolic}</small>}
        </label>
        <label>
          glucose
          <input name="glucose" type="number" step="0.1" value={form.glucose} onChange={onChange} />
          {fieldErrors.glucose && <small className="error">{fieldErrors.glucose}</small>}
        </label>
        <label>
          heart_rate
          <input name="heart_rate" type="number" value={form.heart_rate} onChange={onChange} />
          {fieldErrors.heart_rate && <small className="error">{fieldErrors.heart_rate}</small>}
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
          {fieldErrors.symptoms_text && <small className="error">{fieldErrors.symptoms_text}</small>}
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
