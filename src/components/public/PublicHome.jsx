import { MapPin } from 'lucide-react';
import KnockoutBracket from './KnockoutBracket';
import { formatDateReadable } from '../../dateUtils';

function PublicHome({ edition, getTeamName, fieldInfo, standings = [] }) {
  const parseDateSafe = (dateStr) => {
    if (!dateStr) return new Date(0);
    const parsed = new Date(dateStr);
    return isNaN(parsed) ? new Date(0) : parsed;
  };

  const allPlayed = (edition.matches || [])
    .filter(m => m.status === 'played')
    .sort((a, b) => {
      const dateDiff = parseDateSafe(a.date) - parseDateSafe(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });

  const latestPlayedDate = allPlayed.length > 0 ? allPlayed[allPlayed.length - 1].date : null;
  const recentPlayed = latestPlayedDate ? allPlayed.filter(m => m.date === latestPlayedDate) : [];

  const allScheduled = (edition.matches || [])
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => {
      const dateDiff = parseDateSafe(a.date) - parseDateSafe(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });

  const earliestScheduledDate = allScheduled.length > 0 ? allScheduled[0].date : null;
  const upcomingScheduled = earliestScheduledDate ? allScheduled.filter(m => m.date === earliestScheduledDate) : [];

  const location = fieldInfo?.location || "Via Negrotto Serra Riccò, Genoa, Italy";
  const mapUrl = fieldInfo?.mapUrl || "https://www.google.com/maps/embed/v1/place?key=AIzaSyBs_lAfpuIjfx7DGisR7oUh1ZZ_C5qtGKc&q=Via+Negrotto+Serra+Ricc%C3%B2%2C+Genoa%2C+Italy&maptype=roadmap";
  const pitchName = fieldInfo?.pitchName || "Pitches B & C";

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
          } else {
            winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
            loserId = t1; loserText = t1Text; loserDep = t1Dep;
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
        } else {
          winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
          loserId = t1; loserText = t1Text; loserDep = t1Dep;
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

  const renderBracket = (stages) => (
    <KnockoutBracket
      getResolvedTeamInfo={getResolvedTeamInfo}
      stages={stages}
    />
  );

  return (
    <div className="home-pane">
      {hasChampionshipMatches && (
        <div className="card bracket-card mb-6" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>Tournament Championship Bracket</h3>
          </div>
          <div className="card-body p-4" style={{ background: '#f8fafc' }}>
            {renderBracket(championshipStages)}
          </div>
        </div>
      )}

      {hasShameMatches && (
        <div className="card bracket-card mb-6" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>Hall of Shame Bracket</h3>
          </div>
          <div className="card-body p-4" style={{ background: '#f8fafc' }}>
            {renderBracket(shameStages)}
          </div>
        </div>
      )}
      <div className="home-grid">
        {/* Matches Overviews */}
        <div className="home-column">
          <div className="card">
            <div className="card-header">
              <h3>Recent &amp; Upcoming Matches</h3>
            </div>
            <div className="card-body">
              {recentPlayed.length === 0 && upcomingScheduled.length === 0 ? (
                <p className="text-muted text-center py-4">No matches logged for this edition.</p>
              ) : (
                <>
                  {upcomingScheduled.map(m => (
                    <div key={m.id} className="quick-match-row scheduled">
                      <div className="qm-meta">Upcoming • {formatDateReadable(m.date, m.dateSuffix)} {m.time} (Pitch {m.pitch})</div>
                      <div className="qm-teams">
                        <span className="team-name text-right">{getTeamName(m.team1, m.team1Text)}</span>
                        <span className="vs-badge">vs</span>
                        <span className="team-name text-left">{getTeamName(m.team2, m.team2Text)}</span>
                      </div>
                    </div>
                  ))}

                  {recentPlayed.map(m => {
                    const renderHomeMatchScorers = (match) => {
                      const scorers1 = match.scorers1 || [];
                      const scorers2 = match.scorers2 || [];
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
                          return `${name}${count > 1 ? ` (${count})` : ''}`;
                        });
                        return [...regularList, ...ogs].join(', ');
                      };

                      const text1 = countScorers(scorers1);
                      const text2 = countScorers(scorers2);

                      if (!text1 && !text2) return null;

                      return (
                        <div className="qm-scorers">
                          <div className="qm-scorers-left">
                            {text1}
                          </div>
                          <div className="qm-scorers-spacer"></div>
                          <div className="qm-scorers-right">
                            {text2}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div key={m.id} className="quick-match-row played" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="qm-meta" style={{ alignSelf: 'flex-start' }}>Recent • Pitch {m.pitch}</div>
                        <div className="qm-teams">
                          <span className="team-name text-right">{getTeamName(m.team1, m.team1Text)}</span>
                          <span className="score-badge">{m.score1} - {m.score2}</span>
                          <span className="team-name text-left">{getTeamName(m.team2, m.team2Text)}</span>
                        </div>
                        {renderHomeMatchScorers(m)}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Map and details */}
        <div className="home-column">
          <div className="card">
            <div className="card-header">
              <h3><MapPin className="inline-icon" /> Field &amp; Directions</h3>
            </div>
            <div className="card-body field-details">
              <p className="field-address"><strong>Location:</strong> {location}</p>
              <div className="map-placeholder">
                <iframe 
                  title="Map View"
                  src={mapUrl}
                  width="100%" 
                  height="200" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                ></iframe>
              </div>
              <div className="pitch-info mt-3">
                <h4>{pitchName}</h4>
                {fieldInfo?.pitchImage ? (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={fieldInfo.pitchImage} 
                      alt={pitchName} 
                      style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'cover' }} 
                    />
                  </div>
                ) : (
                  <p className="small-text text-muted">No pitches layout/image set.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicHome;
