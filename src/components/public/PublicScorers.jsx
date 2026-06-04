import React from 'react';

function PublicScorers({ scorers = [], getTeamName }) {
  const menScorers = scorers
    .filter(s => (s.gender || 'Men') === 'Men')
    .sort((a, b) => b.goals - a.goals);

  const womenScorers = scorers
    .filter(s => (s.gender || 'Men') === 'Women')
    .sort((a, b) => b.goals - a.goals);

  const renderTable = (list, title, genderIcon) => (
    <div className="card text-left" style={{ margin: 0 }}>
      <div className="card-header flex-between">
        <h2>{genderIcon} {title}</h2>
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
              {list.map((scorer, index) => (
                <tr key={scorer.id}>
                  <td>
                    <span className="rank-badge">{index + 1}</span>
                  </td>
                  <td className="text-left font-bold">{scorer.name}</td>
                  <td className="text-left text-muted">{getTeamName(scorer.team, 'Independent')}</td>
                  <td className="font-bold text-lg text-green">{scorer.goals}</td>
                </tr>
              ))}
              {list.length === 0 && (
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      {renderTable(menScorers, "Men's Top Scorers", "♂")}
      {renderTable(womenScorers, "Women's Top Scorers", "♀")}
    </div>
  );
}

export default PublicScorers;
