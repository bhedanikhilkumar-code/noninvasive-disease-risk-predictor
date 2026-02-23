import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PredictPage from './pages/PredictPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';

const App = () => (
  <div className="container">
    <header>
      <h1>AI Early Disease Risk Predictor</h1>
      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/predict">Predict</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
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
  </div>
);

export default App;
