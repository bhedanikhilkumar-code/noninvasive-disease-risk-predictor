import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchStats } from '../services/api';

const emptyStats = { total: 0, avgScore: 0, byLevel: { Low: 0, Medium: 0, High: 0 }, last7Days: 0 };

const DashboardPage = () => {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchStats()
      .then((data) => { if (active) setStats({ ...emptyStats, ...data }); })
      .catch(() => { if (active) setError('Dashboard data could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const data = Object.entries(stats.byLevel || {}).map(([level, count]) => ({ level, count }));

  return (
    <section className="card">
      <p className="eyebrow">Your session analytics</p>
      <h2>Dashboard</h2>
      {loading && <p className="muted">Loading analytics…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-box"><span>Total predictions</span><strong>{stats.total}</strong></div>
            <div className="stat-box"><span>Average score</span><strong>{stats.avgScore}</strong></div>
            <div className="stat-box"><span>Last 7 days</span><strong>{stats.last7Days}</strong></div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
};

export default DashboardPage;
