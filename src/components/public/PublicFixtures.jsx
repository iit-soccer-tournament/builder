import { X } from 'lucide-react';

function PublicFixtures({ 
  edition, 
  standings, 
  selectedRoundFilter, 
  setSelectedRoundFilter, 
  selectedTeamFilter, 
  setSelectedTeamFilter, 
  getTeamName, 
  getTeamColor 
}) {
  
  // Group matches by date
  const getGroupedMatches = () => {
    let filtered = selectedRoundFilter === 'All' 
      ? (edition.matches || []) 
      : (edition.matches || []).filter(m => m.round === selectedRoundFilter);

    if (selectedTeamFilter) {
      filtered = filtered.filter(m => m.team1 === selectedTeamFilter || m.team2 === selectedTeamFilter);
    }

    // Helper to safely parse date string without weekday suffix (e.g., "May 26, Tuesday" -> "May 26")
    const parseDateSafe = (dateStr) => {
      if (!dateStr) return new Date(0);
      const cleanDate = dateStr.split(',')[0].trim();
      const parsed = new Date(`${cleanDate}, ${edition.year}`);
      return isNaN(parsed) ? new Date(0) : parsed;
    };

    // Sort by date ascending, then time ascending
    const sorted = [...filtered].sort((a, b) => {
      const dateDiff = parseDateSafe(a.date) - parseDateSafe(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });

    const groups = {};
    sorted.forEach(match => {
      if (!groups[match.date]) {
        groups[match.date] = [];
      }
      groups[match.date].push(match);
    });
    return groups;
  };

  const groupedMatches = getGroupedMatches();

  return (
    <div className="fixtures-layout">
      {/* Standings Table */}
      <div className="standings-card">
        <div className="card">
          <div className="card-header">
            <h2>Current Ranking</h2>
          </div>
          <div className="card-body p-0 table-responsive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }} title="Position">Pos</th>
                  <th className="text-left" title="Team Name">Team</th>
                  <th title="Matches Played">P</th>
                  <th title="Matches Won">W</th>
                  <th title="Matches Drawn">D</th>
                  <th title="Matches Lost">L</th>
                  <th title="Goals For">GF</th>
                  <th title="Goals Against">GA</th>
                  <th title="Goal Difference">GD</th>
                  <th title="Total Points (Win=3, Draw=1)">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => {
                  const posClass = index < 2 
                    ? "advance-direct" 
                    : index < 6 
                      ? "playoffs" 
                      : "playouts";

                  const isFiltered = selectedTeamFilter === team.id;

                  return (
                    <tr 
                      key={team.id} 
                      className={`${posClass} team-row-clickable ${isFiltered ? 'team-row-selected' : ''}`}
                      onClick={() => setSelectedTeamFilter(selectedTeamFilter === team.id ? null : team.id)}
                      title={`Click to filter matches for ${team.name}`}
                    >
                      <td>
                        <span className={`pos-badge pos-${index + 1}`}>{index + 1}</span>
                      </td>
                      <td className="text-left font-medium">
                        <span className="team-color-indicator" style={{ backgroundColor: team.logoColor }}></span>
                        {team.name}
                      </td>
                      <td>{team.played}</td>
                      <td>{team.won}</td>
                      <td>{team.drawn}</td>
                      <td>{team.lost}</td>
                      <td>{team.gf}</td>
                      <td>{team.ga}</td>
                      <td>
                        <span className={team.gd > 0 ? 'pos-gd' : team.gd < 0 ? 'neg-gd' : ''}>
                          {team.gd > 0 ? `+${team.gd}` : team.gd}
                        </span>
                      </td>
                      <td className="font-bold points-col">{team.points}</td>
                    </tr>
                  );
                })}
                {standings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-4 text-muted">No teams found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="card-footer legend-footer">
            <div className="legend-item"><span className="legend-color direct"></span> Semifinals</div>
            <div className="legend-item"><span className="legend-color playoff-zone"></span> Play-offs</div>
            <div className="legend-item"><span className="legend-color playout-zone"></span> Play-outs</div>
          </div>
        </div>
      </div>

      {/* Matches schedule */}
      <div className="matches-list-area">
        <div className="card">
          <div className="card-header flex-between">
            <div>
              <h2>Match Fixtures</h2>
              {selectedTeamFilter && (
                <div className="active-filter-badge">
                  <span>Filtering: <strong>{getTeamName(selectedTeamFilter)}</strong></span>
                  <button onClick={() => setSelectedTeamFilter(null)} className="clear-filter-btn">
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className="filters">
              <select 
                value={selectedRoundFilter} 
                onChange={(e) => setSelectedRoundFilter(e.target.value)}
                className="round-select"
              >
                <option value="All">All Stages</option>
                <option value="Regular Season">Regular Season</option>
                <option value="Playoff (Quarter)">Playoffs</option>
                <option value="Playout (HoS)">Playouts</option>
                <option value="Semifinal">Semifinals</option>
                <option value="3rd Place Final">3rd Place</option>
                <option value="Hall of Shame Final">Hall of Shame Final</option>
                <option value="Championship Final">Championship Final</option>
              </select>
            </div>
          </div>

          <div className="card-body matches-body">
            {Object.keys(groupedMatches).length === 0 ? (
              <p className="no-matches text-center py-6 text-muted">No fixtures logged for this filter.</p>
            ) : (
              Object.keys(groupedMatches).map(date => (
                <div key={date} className="date-group">
                  <h3 className="date-header">{date}</h3>
                  <div className="matches-grid">
                    {groupedMatches[date].map(match => {
                      const renderMatchScorers = (m) => {
                        if (m.status !== 'played') return null;
                        const scorers1 = m.scorers1 || [];
                        const scorers2 = m.scorers2 || [];
                        if (scorers1.length === 0 && scorers2.length === 0) return null;

                        const countScorers = (list) => {
                          const counts = {};
                          const ogs = [];
                          list.forEach(item => {
                            if (!item) return;
                            const name = typeof item === 'object' && item !== null ? item.name : item;
                            const isOg = typeof item === 'object' && item !== null ? !!item.isOwnGoal : false;
                            const gender = typeof item === 'object' && item !== null ? item.gender || 'Men' : 'Men';
                            if (isOg) {
                              ogs.push(`${name} (OG)`);
                            } else {
                              const key = `${name}_${gender}`;
                              counts[key] = (counts[key] || 0) + 1;
                            }
                          });
                          const regularList = Object.entries(counts).map(([key, count]) => {
                            const idx = key.lastIndexOf('_');
                            const name = key.substring(0, idx);
                            return `${name} ${count > 1 ? `(${count})` : ''}`.trim();
                          });
                          return [...regularList, ...ogs].join(', ');
                        };

                        const text1 = countScorers(scorers1);
                        const text2 = countScorers(scorers2);

                        if (!text1 && !text2) return null;

                        return (
                          <div className="match-scorers-view" style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ textAlign: 'left', flex: 1, paddingRight: '10px', fontStyle: 'italic' }}>
                              {text1}
                            </div>
                            <div style={{ width: '40px' }}></div>
                            <div style={{ textAlign: 'right', flex: 1, paddingLeft: '10px', fontStyle: 'italic' }}>
                              {text2}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div key={match.id} className="match-card">
                          <div className="match-meta">
                            <span className="round-tag">{match.round}</span>
                            <span className="pitch-tag">Pitch {match.pitch} • {match.time}</span>
                          </div>
                          <div className="match-teams-score">
                            <div className="team-row left-align">
                              <span className="team-color" style={{ backgroundColor: getTeamColor(match.team1) }}></span>
                              <span className="name">{getTeamName(match.team1, match.team1Text)}</span>
                            </div>
                            
                            <div className="score-display">
                              {match.status === 'played' ? (
                                <span className="score font-bold">{match.score1} - {match.score2}</span>
                              ) : (
                                <span className="score text-muted">vs</span>
                              )}
                            </div>

                            <div className="team-row right-align">
                              <span className="name">{getTeamName(match.team2, match.team2Text)}</span>
                              <span className="team-color" style={{ backgroundColor: getTeamColor(match.team2) }}></span>
                            </div>
                          </div>
                          {renderMatchScorers(match)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicFixtures;
