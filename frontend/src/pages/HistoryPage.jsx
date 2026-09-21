import { useEffect, useState } from 'react';
import { fetchHistory } from '../services/api';

const getLevelClass = (level) => {
  switch (level?.toLowerCase()) {
    case 'low': return 'badge-low';
    case 'medium': return 'badge-medium';
    case 'high': return 'badge-high';
    default: return '';
  }
};

const HistoryPage = () => {
  const [rows, setRows] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  }, []);

  const filtered = rows.filter((row) => {
    const level = row.output?.level || '';
    if (filterLevel !== 'ALL' && level.toUpperCase() !== filterLevel) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const symptoms = (row.input?.symptoms_text || '').toLowerCase();
      const explanations = (row.output?.explanations || []).join(' ').toLowerCase();
      return symptoms.includes(term) || explanations.includes(term);
    }
    return true;
  });

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: '0 0 .3rem 0', fontSize: '1.6rem' }}>Historical Patient Screenings</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '.95rem' }}>
            Browse, search, and audit past disease risk predictions stored in the local clinical record database.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              type="button"
              className="btn btn-outline"
              onClick={() => setFilterLevel(lvl)}
              style={{
                padding: '.4rem .85rem',
                fontSize: '.82rem',
                background: filterLevel === lvl ? '#2563eb' : 'transparent',
                color: filterLevel === lvl ? '#ffffff' : '#2563eb'
              }}
            >
              {lvl === 'ALL' ? 'All Tiers' : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Risk`}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          placeholder="🔍 Search past screenings by symptom keywords (e.g., chest, thirst, fatigue)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
          Loading assessment records...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '.75rem', border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 .5rem 0', fontWeight: 600, color: '#334155' }}>No matching records found</p>
          <small style={{ color: '#64748b' }}>Try clearing your search query or running a new prediction assessment.</small>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Risk Tier</th>
                <th>Overall Score</th>
                <th>Condition Breakdown</th>
                <th>Vitals Summary</th>
                <th>Reported Symptoms</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const out = row.output || {};
                const inp = row.input || {};
                return (
                  <tr key={row._id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '.82rem', color: '#64748b' }}>
                      {new Date(row.createdAt).toLocaleDateString()} <br />
                      <small>{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      <span className={`badge-pill ${getLevelClass(out.level)}`} style={{ fontSize: '.78rem', padding: '.2rem .6rem' }}>
                        {out.level || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '1.05rem', color: (out.score >= 70) ? '#dc2626' : (out.score >= 35) ? '#d97706' : '#16a34a' }}>
                        {out.score}
                      </strong>
                      <span style={{ fontSize: '.78rem', color: '#94a3b8' }}> / 100</span>
                    </td>
                    <td style={{ fontSize: '.82rem' }}>
                      {out.cardiovascular_score !== undefined && (
                        <div>🫀 Heart: <strong>{out.cardiovascular_score}</strong></div>
                      )}
                      {out.diabetes_score !== undefined && (
                        <div>🩸 Diabetes: <strong>{out.diabetes_score}</strong></div>
                      )}
                      {out.cardiovascular_score === undefined && out.diabetes_score === undefined && (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '.82rem', lineHeight: '1.4' }}>
                      <div>Age: {inp.age} ({inp.gender})</div>
                      <div>BP: {inp.bp_systolic}/{inp.bp_diastolic} mmHg</div>
                      <div>BMI: {inp.bmi} | Glu: {inp.glucose}</div>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '.85rem' }}>
                      <span style={{ color: '#334155' }}>
                        {inp.symptoms_text || 'None reported'}
                      </span>
                      {out.warnings?.length > 0 && (
                        <div style={{ marginTop: '.3rem' }}>
                          <small style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Emergency Flag</small>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default HistoryPage;
