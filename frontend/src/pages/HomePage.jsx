import { Link } from 'react-router-dom';

const HomePage = () => (
  <section className="card">
    <p className="eyebrow">Noninvasive screening prototype</p>
    <h2>Understand your demo risk profile</h2>
    <p className="muted">
      Enter basic vitals, lifestyle signals, and symptom notes to receive an educational risk score with the signals that influenced it.
    </p>
    <Link className="btn" to="/predict">Start Assessment</Link>
    <p className="disclaimer">
      Prototype limitation: the current ML model is trained on generated synthetic data. Results are for demonstration and education only, not diagnosis or medical advice.
    </p>
  </section>
);

export default HomePage;
