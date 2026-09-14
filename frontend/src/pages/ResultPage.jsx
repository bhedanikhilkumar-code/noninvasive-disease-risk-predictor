import { Link, useLocation } from 'react-router-dom';

const ResultPage = () => {
  const location = useLocation();
  const result = location.state?.result;

  if (!result) {
    return (
      <section className="card">
        <h2>No result available</h2>
        <Link className="btn" to="/predict">
          Go to Predict
        </Link>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Prediction Result</h2>
      <p>
        <strong>Risk Score:</strong> {result.score} / 100
      </p>
      <p>
        <strong>Risk Level:</strong> {result.level}
      </p>
      {result.warnings?.length > 0 && (
        <>
          <h3>Important warnings</h3>
          <ul>
            {result.warnings.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </>
      )}
      <h3>Why this score?</h3>
      <ul>
        {result.explanations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>
        {result.disclaimer ||
          'This is a screening estimate, not a diagnosis or a substitute for medical care.'}
      </p>
      {result.model_version && <small>Model version: {result.model_version}</small>}
      <Link className="btn" to="/predict">
        Try Another
      </Link>
    </section>
  );
};

export default ResultPage;
