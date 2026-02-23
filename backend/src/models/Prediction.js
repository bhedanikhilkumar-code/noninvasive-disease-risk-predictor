import mongoose from 'mongoose';

const inputSchema = new mongoose.Schema(
  {
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    bmi: { type: Number, required: true },
    bp_systolic: { type: Number, required: true },
    bp_diastolic: { type: Number, required: true },
    glucose: { type: Number, required: true },
    heart_rate: { type: Number, required: true },
    smoking: { type: Boolean, required: true },
    alcohol: { type: Boolean, required: true },
    physical_activity: { type: String, enum: ['low', 'medium', 'high'], required: true },
    symptoms_text: { type: String, required: true }
  },
  { _id: false }
);

const outputSchema = new mongoose.Schema(
  {
    score: { type: Number, min: 0, max: 100, required: true },
    level: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
    explanations: { type: [String], default: [] }
  },
  { _id: false }
);

const predictionSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now, index: true },
    input: { type: inputSchema, required: true },
    output: { type: outputSchema, required: true }
  },
  { versionKey: false }
);

predictionSchema.index({ 'output.level': 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
