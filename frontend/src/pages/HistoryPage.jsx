import { useEffect, useState } from 'react';
import { fetchHistory } from '../services/api';

const HistoryPage = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchHistory().then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <section className="card">
      <h2>Prediction History</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Level</th>
              <th>Age</th>
              <th>Symptoms</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id}>
                <td>{new Date(row.createdAt).toLocaleString()}</td>
                <td>{row.output?.score}</td>
                <td>{row.output?.level}</td>
                <td>{row.input?.age}</td>
                <td>{row.input?.symptoms_text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default HistoryPage;
