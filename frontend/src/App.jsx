import { useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';

const App = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="container">
      <header className="app-header">
        <div className="header-brand-row">
          <NavLink to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon">🩺</div>
            <div className="brand-title">
              PulsePredict AI
              <span className="brand-subtitle">Noninvasive Disease Risk Predictor</span>
            </div>
          </NavLink>
          <button
            type="button"
            className="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>

        <nav className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink to="/" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">🏠</span> Home
          </NavLink>
          <NavLink to="/predict" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">🩺</span> Screening Form
          </NavLink>
          <NavLink to="/history" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">📋</span> History
          </NavLink>
          <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
            <span className="nav-icon">📊</span> Analytics
          </NavLink>
        </nav>
      </header>

      <main className="main-content">
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
        <div className="footer-disclaimer">
          <span>
            * Screening estimate based on clinical guidelines (AHA/ACC & ADA). Not a substitute for medical diagnosis.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
