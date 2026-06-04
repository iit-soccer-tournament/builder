import React from 'react';
import { Beer } from 'lucide-react';

function PublicDrunk({ drunkContest = [] }) {
  const sorted = [...drunkContest].sort((a, b) => b.beers - a.beers);

  return (
    <div className="drunk-contest-layout">
      {/* Table */}
      <div className="drunk-card">
        <div className="card">
          <div className="card-header">
            <h2>Beer Consumption Leaderboard</h2>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="drunk-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Rank</th>
                    <th className="text-left">Team</th>
                    <th>Beers Consumed</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item, index) => (
                    <tr key={item.team} className={index === 0 ? "beer-king" : ""}>
                      <td>
                        {index === 0 ? (
                          <span className="trophy-badge"><Beer size={18} /></span>
                        ) : (
                          <span className="rank-badge">{index + 1}</span>
                        )}
                      </td>
                      <td className="text-left font-bold">{item.team}</td>
                      <td className="font-bold text-amber">{item.beers} 🍺</td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-4 text-muted">No beer logs recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Rules */}
      <div className="drunk-info-card">
        <div className="card text-left">
          <div className="card-header">
            <h3>Drunk Contest Rules</h3>
          </div>
          <div className="card-body">
            <ul className="rules-list">
              <li>🍻 Order a beer and tell the barman to which team you belong.</li>
              <li>🙌 Fans, supporters, and players can all register beers for their squad.</li>
              <li>🏆 The team with the most beers wins a custom trophy and a case of beer!</li>
            </ul>
            <div className="beer-visual text-center py-6">
              <div className="large-beer">🍺</div>
              <p className="small-text text-muted mt-2">Always remember to drink responsibly and enjoy the games.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicDrunk;
