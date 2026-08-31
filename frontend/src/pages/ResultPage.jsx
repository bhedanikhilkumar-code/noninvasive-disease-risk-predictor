import { Link, useLocation } from 'react-router-dom';

const readStoredResult = () => {
  try {
    const value = sessionStorage.getItem('last-prediction-result');
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const ResultPage = () => {
  const location = useLocation();
  const result = location.state?.result || readStoredResult();

  if (!result) {
    return (
      <section className="card empty-state">
        <p className="eyebrow">No assessment</p>
        <h2>No result available</h2>
        <p className="muted">Run a prediction first to view its risk score and explanations.</p>
        <Link className="btn" to="/predict">Go to Assessment</Link>
      </section>
    );
  }

  const explanations = Array.isArray(result.explanations) ? result.explanations : [];
  const score = Number(result.score);

  return (
    <section className="card result-card">
      <p className="eyebrow">Assessment complete</p>
      <h2>Prediction Result</h2>
      <div className="result-summary">
        <div>
          <span className="muted">Risk score</span>
          <strong>{Number.isFinite(score) ? score : '—'} / 100</strong>
        </div>
        <div>
          <span className="muted">Risk level</span>
          <strong>{result.level || 'Unknown'}</strong>
        </div>
      </div>
      <h3>Key signals</h3>
      <ul className="explanation-list">
        {explanations.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
      <p className="disclaimer">This is an educational prototype using synthetic training data. It is not a medical diagnosis or a substitute for professional care.</p>
      <Link className="btn" to="/predict">Run Another Assessment</Link>
    </section>
  );
};

export default ResultPage;
