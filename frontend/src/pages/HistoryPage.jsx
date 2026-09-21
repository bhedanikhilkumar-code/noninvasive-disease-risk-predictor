import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteHistoryItem, fetchHistory } from '../services/api';

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
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const loadHistory = () => {
    setLoading(true);
    fetchHistory()
      .then((data) => {
        setRows(data);
        setLoading(false);
      })
      .catch(() => {
        setRows([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this screening record?')) return;
    setDeletingId(id);
    try {
      await deleteHistoryItem(id);
      setRows((prev) => prev.filter((r) => r._id !== id));
      if (selectedRecord?._id === id) setSelectedRecord(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeletingId(null);
    }
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const headers = ['Date', 'Age', 'Gender', 'Systolic_BP', 'Diastolic_BP', 'BMI', 'Glucose', 'Heart_Rate', 'Smoking', 'Physical_Activity', 'Risk_Score', 'Risk_Level', 'Cardiovascular_Score', 'Diabetes_Score', 'Symptoms'];
    const csvRows = [headers.join(',')];

    rows.forEach((r) => {
      const i = r.input || {};
      const o = r.output || {};
      const row = [
        `"${new Date(r.createdAt).toISOString()}"`,
        i.age || '',
        i.gender || '',
        i.bp_systolic || '',
        i.bp_diastolic || '',
        i.bmi || '',
        i.glucose || '',
        i.heart_rate || '',
        i.smoking ? 'Yes' : 'No',
        i.physical_activity || '',
        o.score || '',
        `"${o.level || ''}"`,
        o.cardiovascular_score || '',
        o.diabetes_score || '',
        `"${(i.symptoms_text || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `pulsepredict_screenings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            Browse, search, audit, and manage past disease risk predictions stored in the local clinical record database.
          </p>
        </div>

        {/* Actions & Filters */}
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={exportCSV}
            disabled={!rows.length}
            style={{ padding: '.4rem .85rem', fontSize: '.82rem' }}
          >
            📥 Export CSV
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadHistory}
            style={{ padding: '.4rem .85rem', fontSize: '.82rem' }}
          >
            🔄 Refresh
          </button>
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
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const out = row.output || {};
                const inp = row.input || {};
                return (
                  <tr
                    key={row._id}
                    onClick={() => setSelectedRecord(row)}
                    style={{ cursor: 'pointer', transition: 'background .15s' }}
                    title="Click to view full clinical details"
                  >
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
                    <td style={{ maxWidth: '240px', fontSize: '.85rem' }}>
                      <span style={{ color: '#334155' }}>
                        {inp.symptoms_text || 'None reported'}
                      </span>
                      {out.warnings?.length > 0 && (
                        <div style={{ marginTop: '.3rem' }}>
                          <small style={{ color: '#dc2626', fontWeight: 600 }}>⚠️ Emergency Flag</small>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '.25rem .5rem', fontSize: '.75rem', marginRight: '.4rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(row);
                        }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '.25rem .5rem', fontSize: '.75rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        disabled={deletingId === row._id}
                        onClick={(e) => handleDelete(row._id, e)}
                      >
                        {deletingId === row._id ? '...' : '✕'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '1rem',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.75rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '.75rem' }}>
              <div>
                <h3 style={{ margin: '0 0 .2rem 0', fontSize: '1.3rem' }}>Screening Clinical Record</h3>
                <small style={{ color: '#64748b' }}>Recorded on {new Date(selectedRecord.createdAt).toLocaleString()}</small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* Score Banner */}
            <div style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '.75rem',
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '.75rem', color: '#64748b' }}>COMPOSITE RISK</div>
                <strong style={{ fontSize: '1.8rem', color: selectedRecord.output?.score >= 70 ? '#dc2626' : selectedRecord.output?.score >= 35 ? '#d97706' : '#16a34a' }}>
                  {selectedRecord.output?.score}
                </strong>
                <div style={{ fontSize: '.75rem', color: '#94a3b8' }}>/ 100</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '.75rem', color: '#64748b' }}>TIER</div>
                <span className={`badge-pill ${getLevelClass(selectedRecord.output?.level)}`}>
                  {selectedRecord.output?.level} Risk
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '.75rem', color: '#64748b' }}>SUB-SCORES</div>
                <div style={{ fontSize: '.85rem' }}>🫀 Heart: <strong>{selectedRecord.output?.cardiovascular_score || 0}</strong></div>
                <div style={{ fontSize: '.85rem' }}>🩸 Diabetes: <strong>{selectedRecord.output?.diabetes_score || 0}</strong></div>
              </div>
            </div>

            {/* Warnings */}
            {selectedRecord.output?.warnings?.length > 0 && (
              <div className="warning-alert-box" style={{ marginBottom: '1rem' }}>
                <strong>⚠️ Emergency Clinical Notice:</strong>
                <ul style={{ margin: '.3rem 0 0 0', paddingLeft: '1.2rem' }}>
                  {selectedRecord.output.warnings.map((w, idx) => (
                    <li key={idx} style={{ fontSize: '.82rem' }}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explanations */}
            {selectedRecord.output?.explanations?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 .4rem 0', fontSize: '.95rem' }}>Clinical Evidence Drivers:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569', fontSize: '.85rem', lineHeight: '1.4' }}>
                  {selectedRecord.output.explanations.map((e, idx) => (
                    <li key={idx} style={{ marginBottom: '.25rem' }}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {selectedRecord.output?.recommendations?.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 .4rem 0', fontSize: '.95rem' }}>Evidence-Based Recommendations:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#475569', fontSize: '.85rem', lineHeight: '1.4' }}>
                  {selectedRecord.output.recommendations.map((r, idx) => (
                    <li key={idx} style={{ marginBottom: '.25rem' }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                onClick={() => handleDelete(selectedRecord._id)}
              >
                Delete Record
              </button>
              <button
                type="button"
                className="btn btn-hero-primary"
                onClick={() => {
                  const out = selectedRecord.output;
                  setSelectedRecord(null);
                  navigate('/result', { state: { result: out } });
                }}
              >
                Open Full Report &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistoryPage;
