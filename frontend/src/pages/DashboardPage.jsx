import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fetchStats } from '../services/api';

const emptyStats = { total: 0, avgScore: 0, byLevel: { Low: 0, Medium: 0, High: 0 }, last7Days: 0 };

const DashboardPage = () => {
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(emptyStats));
  }, []);

  const data = Object.entries(stats.byLevel || {}).map(([level, count]) => ({ level, count }));

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-box">Total Predictions: {stats.total}</div>
        <div className="stat-box">Average Score: {stats.avgScore}</div>
        <div className="stat-box">Predictions (Last 7 Days): {stats.last7Days}</div>
      </div>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="level" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2f6feb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default DashboardPage;
