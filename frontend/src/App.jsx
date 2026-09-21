import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';

const App = () => (
  <div className="container">
    <header className="app-header">
      <NavLink to="/" className="brand-logo">
        <div className="brand-icon">🩺</div>
        <div className="brand-title">
          PulsePredict AI
          <span className="brand-subtitle">Noninvasive Disease Risk Predictor</span>
        </div>
      </NavLink>
      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/predict">Screening Form</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/dashboard">Analytics</NavLink>
      </nav>
    </header>

    <main>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/predict" element={<PredictPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </main>

    <footer className="app-footer">
      <div>
        <strong>PulsePredict AI</strong> &copy; {new Date().getFullYear()} &bull; Final Year Engineering Project
      </div>
      <div>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
          * Screening estimate based on clinical guidelines (AHA/ACC & ADA). Not a substitute for medical diagnosis.
        </span>
      </div>
    </footer>
  </div>
);

export default App;
