import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import KnockoutBracket from './KnockoutBracket';
import { formatDateReadable } from '../../dateUtils';

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

    // Helper to safely parse date string
    const parseDateSafe = (dateStr) => {
      if (!dateStr) return new Date(0);
      const parsed = new Date(dateStr);
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

  const isShameRound = (roundName) => {
    if (!roundName) return false;
    const lower = roundName.toLowerCase();
    return lower.includes('shame') || lower.includes('hos') || lower.includes('playout') || lower.includes('pout');
  };

  const getStagesForMatches = (matches) => {
    const roundsList = edition.rounds || [];
    const stages = {
      round_of_16: [],
      quarters: [],
      semis: [],
      third_place: [],
      final: []
    };
    
    matches.forEach(m => {
      const rObj = roundsList.find(r => (typeof r === 'object' ? r.name : r) === m.round) || { name: m.round, type: 'group' };
      if (rObj.type === 'knockout' && rObj.knockoutType) {
        if (stages[rObj.knockoutType]) {
          stages[rObj.knockoutType].push(m);
        }
      }
    });
    
    return stages;
  };

  const roundsList = edition.rounds || [];
  const matchesList = edition.matches || [];

  const knockoutMatches = matchesList.filter(m => {
    const rObj = roundsList.find(r => (typeof r === 'object' ? r.name : r) === m.round) || { name: m.round, type: 'group' };
    return rObj.type === 'knockout';
  });

  const championshipMatches = knockoutMatches.filter(m => !isShameRound(m.round));
  const shameMatches = knockoutMatches.filter(m => isShameRound(m.round));

  const championshipStages = getStagesForMatches(championshipMatches);
  const shameStages = getStagesForMatches(shameMatches);

  const hasChampionshipMatches = Object.values(championshipStages).some(arr => arr.length > 0);
  const hasShameMatches = Object.values(shameStages).some(arr => arr.length > 0);

  const getMatchIdentifier = (m) => {
    if (!m || !m.round) return '';
    const allMatches = edition.matches || [];
    const matchesInRound = allMatches
      .filter(x => x.round === m.round)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (matchesInRound.length <= 1) {
      return m.round.toLowerCase();
    }
    const idx = matchesInRound.findIndex(x => x.id === m.id);
    return `${m.round} #${idx + 1}`.toLowerCase();
  };

  const resolveTeamPlaceholder = (text, dep) => {
    // Helper to check if all group stage matches (regular season/group rounds) are played
    const isGroupCompleted = (groupId = null) => {
      const allMatches = edition.matches || [];
      const allRounds = edition.rounds || [];
      
      const groupMatches = allMatches.filter(m => {
        const roundName = (m.round || '').trim().toLowerCase();
        
        // Find round in allRounds case-insensitively
        const rObj = allRounds.find(r => {
          const name = typeof r === 'object' && r !== null ? r.name : r;
          return String(name || '').trim().toLowerCase() === roundName;
        });
        
        let isGroup = false;
        if (rObj) {
          if (typeof rObj === 'object') {
            isGroup = rObj.type === 'group';
          } else {
            // If it's a string, use name detection
            const lower = rObj.toLowerCase();
            isGroup = !(lower.includes('playoff') || lower.includes('playout') || lower.includes('semifinal') || lower.includes('final') || lower.includes('knockout') || lower.includes('quarter'));
          }
        } else {
          isGroup = roundName === 'regular season' || roundName.startsWith('round') || roundName.includes('girone') || roundName.includes('group');
        }
        
        if (!isGroup) return false;
        
        if (groupId) {
          const groupLetter = groupId.trim().toLowerCase();
          const t1Obj = edition.teams.find(t => t.id === m.team1);
          const t2Obj = edition.teams.find(t => t.id === m.team2);
          const t1Group = t1Obj && t1Obj.group ? t1Obj.group.trim().toLowerCase() : '';
          const t2Group = t2Obj && t2Obj.group ? t2Obj.group.trim().toLowerCase() : '';
          return t1Group === groupLetter || t2Group === groupLetter;
        }
        return true;
      });
      
      return groupMatches.length > 0 && groupMatches.every(m => m.status === 'played');
    };

    // 1. Resolve structured dependency if present
    if (dep && typeof dep === 'object') {
      if (dep.type === 'regular_season_rank') {
        const rank = dep.rank;
        if (isGroupCompleted() && standings && standings[rank - 1]) {
          return standings[rank - 1];
        }
      }
      if (dep.type === 'group_rank') {
        const rank = dep.rank;
        const groupLetter = (dep.groupId || '').trim().toLowerCase();
        if (isGroupCompleted(groupLetter)) {
          const groupTeams = standings.filter(t => t.group && t.group.trim().toLowerCase() === groupLetter);
          if (groupTeams[rank - 1]) {
            return groupTeams[rank - 1];
          }
        }
      }
      if (dep.type === 'match_winner' || dep.type === 'match_loser') {
        const isWinnerSearch = dep.type === 'match_winner';
        const foundMatch = (edition.matches || []).find(m => m.id === dep.matchId);
        if (foundMatch && foundMatch.status === 'played') {
          const s1 = parseInt(foundMatch.score1, 10);
          const s2 = parseInt(foundMatch.score2, 10);
          const t1 = foundMatch.team1;
          const t2 = foundMatch.team2;
          const t1Text = foundMatch.team1Text;
          const t2Text = foundMatch.team2Text;
          const t1Dep = foundMatch.team1Dep;
          const t2Dep = foundMatch.team2Dep;

          let winnerId;
          let winnerText;
          let winnerDep;
          let loserId;
          let loserText;
          let loserDep;

          if (s1 > s2) {
            winnerId = t1; winnerText = t1Text; winnerDep = t1Dep;
            loserId = t2; loserText = t2Text; loserDep = t2Dep;
          } else if (s2 > s1) {
            winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
            loserId = t1; loserText = t1Text; loserDep = t1Dep;
          } else {
            const p1 = parseInt(foundMatch.penalties1, 10);
            const p2 = parseInt(foundMatch.penalties2, 10);
            if (!isNaN(p1) && !isNaN(p2) && p1 !== p2) {
              if (p1 > p2) {
                winnerId = t1; winnerText = t1Text; winnerDep = t1Dep;
                loserId = t2; loserText = t2Text; loserDep = t2Dep;
              } else {
                winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
                loserId = t1; loserText = t1Text; loserDep = t1Dep;
              }
            } else {
              winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
              loserId = t1; loserText = t1Text; loserDep = t1Dep;
            }
          }

          const resolvedId = isWinnerSearch ? winnerId : loserId;
          const resolvedText = isWinnerSearch ? winnerText : loserText;
          const resolvedDep = isWinnerSearch ? winnerDep : loserDep;

          if (resolvedId) {
            const tObj = edition.teams.find(t => t.id === resolvedId);
            if (tObj) return tObj;
          }
          if (resolvedText || resolvedDep) {
            return resolveTeamPlaceholder(resolvedText, resolvedDep) || { name: resolvedText, id: null, logoColor: '#718096' };
          }
        }
      }
    }

    // 2. Fallback to existing text parsing
    if (!text) return null;
    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();

    const standingsRankRegex = /^(\d+)(?:st|nd|rd|th)\s+in\s+group\s+(.+)$/i;
    const regularRankRegex = /^(\d+)(?:st|nd|rd|th)\s+in\s+regular\s+season$/i;

    const matchGroup = cleanText.match(standingsRankRegex);
    if (matchGroup) {
      const rank = parseInt(matchGroup[1], 10);
      const groupLetter = matchGroup[2].trim().toLowerCase();
      if (isGroupCompleted(groupLetter)) {
        const groupTeams = standings.filter(t => t.group && t.group.trim().toLowerCase() === groupLetter);
        if (groupTeams[rank - 1]) {
          return groupTeams[rank - 1];
        }
      }
    }

    const matchRegular = cleanText.match(regularRankRegex);
    if (matchRegular) {
      const rank = parseInt(matchRegular[1], 10);
      if (isGroupCompleted() && standings[rank - 1]) {
        return standings[rank - 1];
      }
    }

    if (lower.startsWith('winner of ') || lower.startsWith('loser of ')) {
      const isWinnerSearch = lower.startsWith('winner of ');
      const targetMatchId = lower.replace('winner of ', '').replace('loser of ', '').trim();
      
      const foundMatch = (edition.matches || []).find(m => getMatchIdentifier(m) === targetMatchId);
      if (foundMatch && foundMatch.status === 'played') {
        const s1 = parseInt(foundMatch.score1, 10);
        const s2 = parseInt(foundMatch.score2, 10);
        const t1 = foundMatch.team1;
        const t2 = foundMatch.team2;
        const t1Text = foundMatch.team1Text;
        const t2Text = foundMatch.team2Text;
        const t1Dep = foundMatch.team1Dep;
        const t2Dep = foundMatch.team2Dep;

        let winnerId;
        let winnerText;
        let winnerDep;
        let loserId;
        let loserText;
        let loserDep;

        if (s1 > s2) {
          winnerId = t1; winnerText = t1Text; winnerDep = t1Dep;
          loserId = t2; loserText = t2Text; loserDep = t2Dep;
        } else if (s2 > s1) {
          winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
          loserId = t1; loserText = t1Text; loserDep = t1Dep;
        } else {
          const p1 = parseInt(foundMatch.penalties1, 10);
          const p2 = parseInt(foundMatch.penalties2, 10);
          if (!isNaN(p1) && !isNaN(p2) && p1 !== p2) {
            if (p1 > p2) {
              winnerId = t1; winnerText = t1Text; winnerDep = t1Dep;
              loserId = t2; loserText = t2Text; loserDep = t2Dep;
            } else {
              winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
              loserId = t1; loserText = t1Text; loserDep = t1Dep;
            }
          } else {
            winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
            loserId = t1; loserText = t1Text; loserDep = t1Dep;
          }
        }

        const resolvedId = isWinnerSearch ? winnerId : loserId;
        const resolvedText = isWinnerSearch ? winnerText : loserText;
        const resolvedDep = isWinnerSearch ? winnerDep : loserDep;

        if (resolvedId) {
          const tObj = edition.teams.find(t => t.id === resolvedId);
          if (tObj) return tObj;
        }
        if (resolvedText || resolvedDep) {
          return resolveTeamPlaceholder(resolvedText, resolvedDep) || { name: resolvedText, id: null, logoColor: '#718096' };
        }
      }
    }

    return null;
  };

  const getResolvedTeamInfo = (teamId, text, dep) => {
    if (teamId) {
      const teamObj = edition.teams.find(t => t.id === teamId);
      if (teamObj) return { name: teamObj.name, color: teamObj.logoColor, id: teamObj.id };
    }
    if (text || dep) {
      const resolved = resolveTeamPlaceholder(text, dep);
      if (resolved) {
        return { name: resolved.name, color: resolved.logoColor, id: resolved.id };
      }
      return { name: text || 'TBD', color: '#718096', id: null };
    }
    return { name: 'TBD', color: '#718096', id: null };
  };

  const getMatchDisplayTeamName = (teamId, text, dep) => {
    const resolved = getResolvedTeamInfo(teamId, text, dep);
    if (teamId) {
      return resolved.name;
    }
    return resolved.name !== (text || 'TBD') ? resolved.name : (text || 'TBD');
  };

  const getMatchDisplayTeamColor = (teamId, text, dep) => {
    const resolved = getResolvedTeamInfo(teamId, text, dep);
    return resolved.color || '#718096';
  };

  const renderBracket = (stages, isCompact = true) => (
    <KnockoutBracket
      compact={isCompact}
      getResolvedTeamInfo={getResolvedTeamInfo}
      stages={stages}
    />
  );

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
              const posClass = index < advanceDirectCount
                ? "advance-direct"
                : index < advanceDirectCount + playoffCount
                  ? "playoffs"
                  : index < advanceDirectCount + playoffCount + playoutCountSetting
                    ? "playouts"
                    : "hos-zone";

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
        {hasChampionshipMatches && (
          <div className="card bracket-card mb-4" style={{ marginBottom: '16px' }}>
            <div className="card-header" style={{ padding: '10px 16px' }}>
              <h2 style={{ fontSize: '14px', margin: 0 }}>Championship Bracket</h2>
            </div>
            <div className="card-body p-2" style={{ background: '#f8fafc' }}>
              {renderBracket(championshipStages, true)}
            </div>
          </div>
        )}

        {hasShameMatches && (
          <div className="card bracket-card mb-4" style={{ marginBottom: '16px' }}>
            <div className="card-header" style={{ padding: '10px 16px' }}>
              <h2 style={{ fontSize: '14px', margin: 0 }}>Hall of Shame Bracket</h2>
            </div>
            <div className="card-body p-2" style={{ background: '#f8fafc' }}>
              {renderBracket(shameStages, true)}
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
                      <span>{formatDateReadable(date, groupedMatches[date][0]?.dateSuffix)}</span>
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
                                  <span className="team-color" style={{ backgroundColor: getMatchDisplayTeamColor(match.team1, match.team1Text, match.team1Dep) }}></span>
                                  <span className="name">{getMatchDisplayTeamName(match.team1, match.team1Text, match.team1Dep)}</span>
                                </div>
                                
                                <div className="score-display">
                                  {match.status === 'played' ? (
                                    <span className="score font-bold">
                                      {match.score1} - {match.score2}
                                      {match.penalties1 !== undefined && match.penalties1 !== null && match.penalties2 !== undefined && match.penalties2 !== null && (
                                        <span className="penalties-score text-muted text-xs font-normal ml-1" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                                          ({match.penalties1}-{match.penalties2} p)
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="score text-muted">vs</span>
                                  )}
                                </div>

                                <div className="team-row right-align">
                                  <span className="name">{getMatchDisplayTeamName(match.team2, match.team2Text, match.team2Dep)}</span>
                                  <span className="team-color" style={{ backgroundColor: getMatchDisplayTeamColor(match.team2, match.team2Text, match.team2Dep) }}></span>
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
