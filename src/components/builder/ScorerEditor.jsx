import React from 'react';

function ScorerEditor({ 
  scorers = [], 
  teams = []
}) {
  const getTeamName = (teamId, fallback = '') => {
    const t = teams.find(x => x.id === teamId);
    return t ? t.name : fallback;
  };

  const menScorers = scorers
    .filter(s => (s.gender || 'Men') === 'Men')
    .sort((a, b) => b.goals - a.goals);

  const womenScorers = scorers
    .filter(s => (s.gender || 'Men') === 'Women')
    .sort((a, b) => b.goals - a.goals);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
      
      {/* MEN'S TOP SCORERS COLUMN */}
      <div className="card text-left">
        <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Men's Top Scorers</h3>
          <span className="text-xs text-muted" style={{ fontWeight: 'bold' }}>{menScorers.length} players</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Rank</th>
                  <th className="text-left">Player</th>
                  <th className="text-left">Team</th>
                  <th>Goals</th>
                </tr>
              </thead>
              <tbody>
                {menScorers.map((s, index) => (
                  <tr key={s.id}>
                    <td className="font-bold text-muted">{index + 1}</td>
                    <td className="text-left font-bold">{s.name}</td>
                    <td className="text-left">{getTeamName(s.team, 'Independent')}</td>
                    <td className="font-bold text-green">{s.goals}</td>
                  </tr>
                ))}
                {menScorers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">No Men's goals logged. Add goals in Matches Scheduler.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* WOMEN'S TOP SCORERS COLUMN */}
      <div className="card text-left">
        <div className="card-header flex-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Women's Top Scorers</h3>
          <span className="text-xs text-muted" style={{ fontWeight: 'bold' }}>{womenScorers.length} players</span>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Rank</th>
                  <th className="text-left">Player</th>
                  <th className="text-left">Team</th>
                  <th>Goals</th>
                </tr>
              </thead>
              <tbody>
                {womenScorers.map((s, index) => (
                  <tr key={s.id}>
                    <td className="font-bold text-muted">{index + 1}</td>
                    <td className="text-left font-bold">{s.name}</td>
                    <td className="text-left">{getTeamName(s.team, 'Independent')}</td>
                    <td className="font-bold text-green">{s.goals}</td>
                  </tr>
                ))}
                {womenScorers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-muted">No Women's goals logged. Add goals in Matches Scheduler.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}

export default ScorerEditor;
