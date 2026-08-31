import { useEffect, useState } from 'react';
import { fetchHistory } from '../services/api';

const HistoryPage = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchHistory()
      .then((data) => {
        if (active) setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setError('History could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Private to this browser session</p>
          <h2>Prediction History</h2>
        </div>
      </div>
      {loading && <p className="muted">Loading history…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!loading && !error && rows.length === 0 && <p className="muted">No predictions yet. Start an assessment to create your first record.</p>}
      {!loading && rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Score</th><th>Level</th><th>Age</th><th>Symptoms</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                  <td>{row.output?.score ?? '—'}</td>
                  <td>{row.output?.level ?? '—'}</td>
                  <td>{row.input?.age ?? '—'}</td>
                  <td>{row.input?.symptoms_text || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default HistoryPage;
