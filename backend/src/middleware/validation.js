const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

export const validatePredictionInput = (payload) => {
  const errors = [];
  const requiredFields = [
    'age',
    'gender',
    'bmi',
    'bp_systolic',
    'bp_diastolic',
    'glucose',
    'heart_rate',
    'smoking',
    'alcohol',
    'physical_activity',
    'symptoms_text'
  ];

  requiredFields.forEach((field) => {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      errors.push(`${field} is required.`);
    }
  });

  if (!isFiniteNumber(payload.age) || payload.age < 1 || payload.age > 120) errors.push('age must be between 1 and 120.');
  if (!isFiniteNumber(payload.bmi) || payload.bmi < 10 || payload.bmi > 60) errors.push('bmi must be between 10 and 60.');
  if (!isFiniteNumber(payload.bp_systolic) || payload.bp_systolic < 70 || payload.bp_systolic > 250) errors.push('bp_systolic must be between 70 and 250.');
  if (!isFiniteNumber(payload.bp_diastolic) || payload.bp_diastolic < 40 || payload.bp_diastolic > 150) errors.push('bp_diastolic must be between 40 and 150.');
  if (!isFiniteNumber(payload.glucose) || payload.glucose < 40 || payload.glucose > 400) errors.push('glucose must be between 40 and 400.');
  if (!isFiniteNumber(payload.heart_rate) || payload.heart_rate < 30 || payload.heart_rate > 220) errors.push('heart_rate must be between 30 and 220.');

  if (!['male', 'female', 'other'].includes(String(payload.gender).toLowerCase())) {
    errors.push('gender must be one of: male, female, other.');
  }

  if (typeof payload.smoking !== 'boolean') errors.push('smoking must be boolean (true/false).');
  if (typeof payload.alcohol !== 'boolean') errors.push('alcohol must be boolean (true/false).');

  if (!['low', 'medium', 'high'].includes(String(payload.physical_activity).toLowerCase())) {
    errors.push('physical_activity must be one of: low, medium, high.');
  }

  if (typeof payload.symptoms_text !== 'string' || payload.symptoms_text.trim().length < 3) {
    errors.push('symptoms_text must be a descriptive string (at least 3 characters).');
  }

  return errors;
};
