import React, { useState } from 'react';

function PublicScorers({ scorers = [], getTeamName }) {
  const [genderTab, setGenderTab] = useState('Men');
  const filtered = scorers
    .filter(s => s.gender === genderTab)
    .sort((a, b) => b.goals - a.goals);

  return (
    <div className="card">
      <div className="card-header flex-between">
        <h2>Top Scorers</h2>
        <div className="gender-tabs">
          <button 
            className={genderTab === 'Men' ? 'active' : ''} 
            onClick={() => setGenderTab('Men')}
          >
            Men
          </button>
          <button 
            className={genderTab === 'Women' ? 'active' : ''} 
            onClick={() => setGenderTab('Women')}
          >
            Women
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="scorers-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th className="text-left">Player</th>
                <th className="text-left">Team</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((scorer, index) => (
                <tr key={scorer.id}>
                  <td>
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td className="text-left font-bold">{scorer.name}</td>
                  <td className="text-left text-muted">{getTeamName(scorer.team, 'Independent')}</td>
                  <td className="font-bold text-lg text-green">{scorer.goals}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-muted">No scorer records logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PublicScorers;
