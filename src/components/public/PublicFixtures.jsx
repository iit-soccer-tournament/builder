import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

function PublicFixtures({ 
  edition, 
  standings, 
  selectedTeamFilter, 
  setSelectedTeamFilter, 
  getTeamName, 
  getTeamColor 
}) {
  const [collapsedState, setCollapsedState] = useState({});
  
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
  const dateKeys = Object.keys(groupedMatches);

  // Find the index of the last date that has at least one played match
  let lastPlayedIndex = -1;
  for (let i = dateKeys.length - 1; i >= 0; i--) {
    const dateMatches = groupedMatches[dateKeys[i]] || [];
    if (dateMatches.some(m => m.status === 'played')) {
      lastPlayedIndex = i;
      break;
    }
  }

  const getKnockoutMatchesByStage = () => {
    const roundsList = edition.rounds || [];
    const matchesList = edition.matches || [];
    
    // Group matches by knockoutType
    const stages = {
      round_of_16: [],
      quarters: [],
      semis: [],
      third_place: [],
      final: []
    };
    
    matchesList.forEach(m => {
      const rObj = roundsList.find(r => (typeof r === 'object' ? r.name : r) === m.round) || { name: m.round, type: 'group' };
      if (rObj.type === 'knockout' && rObj.knockoutType) {
        if (stages[rObj.knockoutType]) {
          stages[rObj.knockoutType].push(m);
        }
      }
    });
    
    return stages;
  };

  const knockoutStages = getKnockoutMatchesByStage();
  const hasKnockoutMatches = Object.values(knockoutStages).some(arr => arr.length > 0);

  const renderBracketMatchCard = (m, isFinal = false, isThirdPlace = false) => {
    const isPlayed = m.status === 'played';
    const s1 = isPlayed ? parseInt(m.score1, 10) : null;
    const s2 = isPlayed ? parseInt(m.score2, 10) : null;
    const t1Winner = isPlayed && s1 > s2;
    const t2Winner = isPlayed && s2 > s1;

    return (
      <div 
        key={m.id} 
        style={{
          background: 'white',
          border: isFinal ? '2.5px solid var(--accent-color)' : '1px solid #e2e8f0',
          borderRadius: '5px',
          padding: '4px 6px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          margin: '1px 0',
          textAlign: 'left'
        }}
      >
        <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {isFinal ? 'Championship' : isThirdPlace ? '3rd Place' : m.round}
        </div>
        
        {/* Team 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isPlayed && !t1Winner ? 0.65 : 1 }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: getTeamColor(m.team1) }}></span>
            <span style={{ fontSize: '10px', fontWeight: t1Winner ? 'bold' : '500', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
              {getTeamName(m.team1, m.team1Text)}
            </span>
          </div>
          {isPlayed && (
            <span style={{ fontSize: '10px', fontWeight: t1Winner ? 'bold' : 'normal', opacity: !t1Winner ? 0.6 : 1, color: '#1e293b' }}>
              {m.score1}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: isPlayed && !t2Winner ? 0.65 : 1 }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: getTeamColor(m.team2) }}></span>
            <span style={{ fontSize: '10px', fontWeight: t2Winner ? 'bold' : '500', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px' }}>
              {getTeamName(m.team2, m.team2Text)}
            </span>
          </div>
          {isPlayed && (
            <span style={{ fontSize: '10px', fontWeight: t2Winner ? 'bold' : 'normal', opacity: !t2Winner ? 0.6 : 1, color: '#1e293b' }}>
              {m.score2}
            </span>
          )}
        </div>

        {!isPlayed && (
          <div style={{ fontSize: '8px', color: '#94a3b8', textAlign: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '2px', marginTop: '1px' }}>
            {m.time} {m.pitch ? `• P${m.pitch}` : ''}
          </div>
        )}
      </div>
    );
  };

  // Group standings by team.group if any group exists
  const hasGroups = standings.some(team => team.group && team.group.trim());
  const groupsMap = {};
  if (hasGroups) {
    standings.forEach(team => {
      const gName = (team.group && team.group.trim()) ? `Group ${team.group.trim()}` : 'Unassigned';
      if (!groupsMap[gName]) {
        groupsMap[gName] = [];
      }
      groupsMap[gName].push(team);
    });
  }

  const renderStandingsTable = (teamsList, showHeader = false, groupTitle = '') => {
    return (
      <div className="card-body p-0 table-responsive">
        {showHeader && (
          <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{groupTitle}</h3>
          </div>
        )}
        <table className="standings-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }} title="Position">Pos</th>
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
            {teamsList.map((team, index) => {
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
            {teamsList.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-4 text-muted">No teams found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixtures-layout">
      {/* Standings Table column */}
      <div className="standings-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {hasGroups ? (
          Object.keys(groupsMap).sort().map(gName => (
            <div className="card" key={gName}>
              {renderStandingsTable(groupsMap[gName], true, gName)}
            </div>
          ))
        ) : (
          <div className="card">
            <div className="card-header">
              <h2>Current Ranking</h2>
            </div>
            {renderStandingsTable(standings, false)}
          </div>
        )}

        {/* Standings Legend - render at the bottom of the column */}
        <div className="card legend-card" style={{ padding: '16px' }}>
          <div className="legend-footer" style={{ borderTop: 'none', paddingTop: 0, paddingBottom: 0, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
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

      {/* Matches schedule and bracket */}
      <div className="matches-list-area">
        {hasKnockoutMatches && (
          <div className="card bracket-card mb-4" style={{ marginBottom: '16px' }}>
            <div className="card-header" style={{ padding: '10px 16px' }}>
              <h2 style={{ fontSize: '14px', margin: 0 }}>Knockout Bracket</h2>
            </div>
            <div className="card-body p-2 overflow-x-auto" style={{ background: '#f8fafc' }}>
              <div className="bracket-container" style={{ display: 'flex', gap: '8px', minWidth: '450px', padding: '4px 0' }}>
                {/* Column 1: Round of 16 */}
                {knockoutStages.round_of_16.length > 0 && (
                  <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '6px', minWidth: '100px' }}>
                    <h4 className="text-center font-bold text-[9px] mb-1" style={{ color: '#15803d', borderBottom: '1px solid rgba(21,128,61,0.15)', paddingBottom: '2px', margin: 0 }}>Round of 16</h4>
                    {knockoutStages.round_of_16.map(m => renderBracketMatchCard(m))}
                  </div>
                )}
                {/* Column 2: Quarterfinals */}
                {knockoutStages.quarters.length > 0 && (
                  <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '6px', minWidth: '100px' }}>
                    <h4 className="text-center font-bold text-[9px] mb-1" style={{ color: '#15803d', borderBottom: '1px solid rgba(21,128,61,0.15)', paddingBottom: '2px', margin: 0 }}>Quarterfinals</h4>
                    {knockoutStages.quarters.map(m => renderBracketMatchCard(m))}
                  </div>
                )}
                {/* Column 3: Semifinals */}
                {knockoutStages.semis.length > 0 && (
                  <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '6px', minWidth: '100px' }}>
                    <h4 className="text-center font-bold text-[9px] mb-1" style={{ color: '#15803d', borderBottom: '1px solid rgba(21,128,61,0.15)', paddingBottom: '2px', margin: 0 }}>Semifinals</h4>
                    {knockoutStages.semis.map(m => renderBracketMatchCard(m))}
                  </div>
                )}
                {/* Column 4: Finals */}
                {(knockoutStages.final.length > 0 || knockoutStages.third_place.length > 0) && (
                  <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '8px', minWidth: '100px' }}>
                    <h4 className="text-center font-bold text-[9px] mb-1" style={{ color: '#15803d', borderBottom: '1px solid rgba(21,128,61,0.15)', paddingBottom: '2px', margin: 0 }}>Finals</h4>
                    {knockoutStages.final.map(m => renderBracketMatchCard(m, true))}
                    {knockoutStages.third_place.map(m => renderBracketMatchCard(m, false, true))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
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
              Object.keys(groupedMatches).map(date => {
                const isExpanded = collapsedState[date] !== undefined
                  ? collapsedState[date]
                  : (lastPlayedIndex === -1 ? true : dateKeys.indexOf(date) >= lastPlayedIndex);

                const toggleDate = () => {
                  setCollapsedState(prev => ({
                    ...prev,
                    [date]: !isExpanded
                  }));
                };

                return (
                  <div key={date} className="date-group" style={{ marginBottom: isExpanded ? '24px' : '12px' }}>
                    <h3 
                      className="date-header" 
                      onClick={toggleDate}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        userSelect: 'none'
                      }}
                    >
                      <span>{date}</span>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </h3>
                    
                    {isExpanded && (
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
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicFixtures;
