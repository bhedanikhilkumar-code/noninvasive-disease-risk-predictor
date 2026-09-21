import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { fetchStats } from '../services/api';

const emptyStats = { total: 0, avgScore: 0, byLevel: { Low: 0, Medium: 0, High: 0 }, last7Days: 0 };

const COLOR_MAP = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444'
};

const DashboardPage = () => {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setStats(emptyStats);
        setLoading(false);
      });
  }, []);

  const barData = [
    { level: 'Low Risk', count: stats.byLevel?.Low || 0, fill: COLOR_MAP.Low },
    { level: 'Medium Risk', count: stats.byLevel?.Medium || 0, fill: COLOR_MAP.Medium },
    { level: 'High Risk', count: stats.byLevel?.High || 0, fill: COLOR_MAP.High }
  ];

  const pieData = [
    { name: 'Low Risk', value: stats.byLevel?.Low || 0, color: COLOR_MAP.Low },
    { name: 'Medium Risk', value: stats.byLevel?.Medium || 0, color: COLOR_MAP.Medium },
    { name: 'High Risk', value: stats.byLevel?.High || 0, color: COLOR_MAP.High }
  ].filter((item) => item.value > 0);

  const highRiskPercent = stats.total > 0
    ? Math.round(((stats.byLevel?.High || 0) / stats.total) * 100)
    : 0;

  return (
    <div>
      <section className="card">
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 .4rem 0', fontSize: '1.6rem' }}>Population Health Analytics Dashboard</h2>
          <p style={{ margin: 0, color: '#64748b' }}>
            Aggregated screening metrics, risk stratification distributions, and temporal trends.
          </p>
        </div>

        {/* Top KPI Metrics */}
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label">Total Screenings</span>
            <span className="stat-value">{stats.total}</span>
            <small style={{ color: '#64748b', marginTop: '.3rem' }}>All historical assessments</small>
          </div>

          <div className="stat-box">
            <span className="stat-label">Average Risk Score</span>
            <span className="stat-value" style={{ color: stats.avgScore >= 70 ? '#ef4444' : stats.avgScore >= 35 ? '#f59e0b' : '#10b981' }}>
              {stats.avgScore} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ 100</span>
            </span>
            <small style={{ color: '#64748b', marginTop: '.3rem' }}>Across full cohort</small>
          </div>

          <div className="stat-box">
            <span className="stat-label">Recent Volume</span>
            <span className="stat-value">{stats.last7Days}</span>
            <small style={{ color: '#64748b', marginTop: '.3rem' }}>Completed in last 7 days</small>
          </div>

          <div className="stat-box">
            <span className="stat-label">High Risk Rate</span>
            <span className="stat-value" style={{ color: highRiskPercent > 30 ? '#ef4444' : '#3b82f6' }}>
              {highRiskPercent}%
            </span>
            <small style={{ color: '#64748b', marginTop: '.3rem' }}>Require clinical follow-up</small>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {/* Bar Chart */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '.75rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Cohort Stratification by Risk Tier</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="level" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '.75rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Proportional Breakdown</h3>
            {pieData.length > 0 ? (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '.5rem', border: '1px solid #e2e8f0' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                No screening data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Clinical Note */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#eff6ff', borderRadius: '.6rem', border: '1px solid #bfdbfe', fontSize: '.88rem', color: '#1e40af' }}>
          💡 <strong>Population Triage Protocol:</strong> Patients falling in the <em>High Risk</em> tier (score &ge; 70) should be prioritized for comprehensive laboratory metabolic panels (HbA1c, fasting lipids) and formal 12-lead ECG evaluations.
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
