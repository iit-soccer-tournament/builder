import { X } from 'lucide-react';

function PublicFixtures({ 
  edition, 
  standings, 
  selectedTeamFilter, 
  setSelectedTeamFilter, 
  getTeamName, 
  getTeamColor 
}) {
  
  // Group matches by date
  const getGroupedMatches = () => {
    let filtered = edition.matches || [];

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
                  const advanceDirectCount = edition.advanceDirectCount !== undefined ? parseInt(edition.advanceDirectCount, 10) : 2;
                  const playoffCount = edition.playoffCount !== undefined ? parseInt(edition.playoffCount, 10) : 4;
                  const playoutCountSetting = edition.playoutCount !== undefined ? parseInt(edition.playoutCount, 10) : 2;
                  const hosCount = edition.hosCount !== undefined ? parseInt(edition.hosCount, 10) : 2;

                  let posClass = "";
                  if (index < advanceDirectCount) {
                    posClass = "advance-direct";
                  } else if (index < advanceDirectCount + playoffCount) {
                    posClass = "playoffs";
                  } else if (index < advanceDirectCount + playoffCount + playoutCountSetting) {
                    posClass = "playouts";
                  } else {
                    posClass = "hos-zone";
                  }

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
            {(() => {
              const adc = edition.advanceDirectCount !== undefined ? parseInt(edition.advanceDirectCount, 10) : 2;
              const pc = edition.playoffCount !== undefined ? parseInt(edition.playoffCount, 10) : 4;
              const poc = edition.playoutCount !== undefined ? parseInt(edition.playoutCount, 10) : 2;
              const hc = edition.hosCount !== undefined ? parseInt(edition.hosCount, 10) : 2;
              return (
                <>
                  {adc > 0 && (
                    <div className="legend-item">
                      <span className="legend-color direct"></span> 
                      Direct Promotion (Top {adc})
                    </div>
                  )}
                  {pc > 0 && (
                    <div className="legend-item">
                      <span className="legend-color playoff-zone"></span> 
                      Play-offs (Next {pc})
                    </div>
                  )}
                  {poc > 0 && (
                    <div className="legend-item">
                      <span className="legend-color playout-zone"></span> 
                      Play-outs (Next {poc})
                    </div>
                  )}
                  {hc > 0 && (
                    <div className="legend-item">
                      <span className="legend-color hos-zone"></span> 
                      HoS Match (Last {hc})
                    </div>
                  )}
                </>
              );
            })()}
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
                          <div className="match-scorers-view">
                            <div className="scorers-left">
                              {text1}
                            </div>
                            <div className="scorers-spacer"></div>
                            <div className="scorers-right">
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
