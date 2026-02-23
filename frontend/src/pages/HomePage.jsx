import { Link } from 'react-router-dom';

const HomePage = () => (
  <section className="card">
    <h2>Welcome</h2>
    <p>
      This project predicts early disease risk using non-invasive health data, lifestyle signals, and
      symptom descriptions.
    </p>
    <Link className="btn" to="/predict">
      Start Prediction
    </Link>
  </section>
);

export default HomePage;
