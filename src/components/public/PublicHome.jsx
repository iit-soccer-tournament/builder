import { MapPin } from 'lucide-react';

function PublicHome({ edition, getTeamName, getTeamColor, fieldInfo }) {
  const parseDateSafe = (dateStr) => {
    if (!dateStr) return new Date(0);
    const cleanDate = dateStr.split(',')[0].trim();
    const parsed = new Date(`${cleanDate}, ${edition.year}`);
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

  const getKnockoutMatchesByStage = () => {
    const roundsList = edition.rounds || [];
    const matchesList = edition.matches || [];
    
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
          border: isFinal ? '2px solid var(--accent-color)' : '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          margin: '4px 0',
          textAlign: 'left'
        }}
      >
        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {isFinal ? 'Championship' : isThirdPlace ? '3rd Place Match' : m.round}
        </div>
        
        {/* Team 1 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isPlayed && !t1Winner ? 0.6 : 1 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTeamColor(m.team1) }}></span>
            <span style={{ fontSize: '12px', fontWeight: t1Winner ? 'bold' : 'normal', color: '#1e293b' }}>
              {getTeamName(m.team1, m.team1Text)}
            </span>
          </div>
          {isPlayed && (
            <span style={{ fontSize: '12px', fontWeight: t1Winner ? 'bold' : 'normal', opacity: !t1Winner ? 0.6 : 1, color: '#1e293b' }}>
              {m.score1}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: isPlayed && !t2Winner ? 0.6 : 1 }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTeamColor(m.team2) }}></span>
            <span style={{ fontSize: '12px', fontWeight: t2Winner ? 'bold' : 'normal', color: '#1e293b' }}>
              {getTeamName(m.team2, m.team2Text)}
            </span>
          </div>
          {isPlayed && (
            <span style={{ fontSize: '12px', fontWeight: t2Winner ? 'bold' : 'normal', opacity: !t2Winner ? 0.6 : 1, color: '#1e293b' }}>
              {m.score2}
            </span>
          )}
        </div>

        {!isPlayed && (
          <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '4px', marginTop: '2px' }}>
            Scheduled • {m.time} {m.pitch ? `(Pitch ${m.pitch})` : ''}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="home-pane">
      {hasKnockoutMatches && (
        <div className="card bracket-card mb-6" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h3>Tournament Knockout Bracket</h3>
          </div>
          <div className="card-body p-4 overflow-x-auto" style={{ background: '#f8fafc' }}>
            <div className="bracket-container" style={{ display: 'flex', gap: '24px', minWidth: '800px', padding: '10px 0' }}>
              {/* Column 1: Round of 16 */}
              {knockoutStages.round_of_16.length > 0 && (
                <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '12px' }}>
                  <h4 className="text-center font-bold text-sm mb-2" style={{ color: '#15803d', borderBottom: '1.5px solid rgba(21,128,61,0.15)', paddingBottom: '4px', margin: 0 }}>Round of 16</h4>
                  {knockoutStages.round_of_16.map(m => renderBracketMatchCard(m))}
                </div>
              )}
              {/* Column 2: Quarterfinals */}
              {knockoutStages.quarters.length > 0 && (
                <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '12px' }}>
                  <h4 className="text-center font-bold text-sm mb-2" style={{ color: '#15803d', borderBottom: '1.5px solid rgba(21,128,61,0.15)', paddingBottom: '4px', margin: 0 }}>Quarterfinals</h4>
                  {knockoutStages.quarters.map(m => renderBracketMatchCard(m))}
                </div>
              )}
              {/* Column 3: Semifinals */}
              {knockoutStages.semis.length > 0 && (
                <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '12px' }}>
                  <h4 className="text-center font-bold text-sm mb-2" style={{ color: '#15803d', borderBottom: '1.5px solid rgba(21,128,61,0.15)', paddingBottom: '4px', margin: 0 }}>Semifinals</h4>
                  {knockoutStages.semis.map(m => renderBracketMatchCard(m))}
                </div>
              )}
              {/* Column 4: Finals */}
              {(knockoutStages.final.length > 0 || knockoutStages.third_place.length > 0) && (
                <div className="bracket-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '20px' }}>
                  <h4 className="text-center font-bold text-sm mb-2" style={{ color: '#15803d', borderBottom: '1.5px solid rgba(21,128,61,0.15)', paddingBottom: '4px', margin: 0 }}>Finals</h4>
                  {knockoutStages.final.map(m => renderBracketMatchCard(m, true))}
                  {knockoutStages.third_place.map(m => renderBracketMatchCard(m, false, true))}
                </div>
              )}
            </div>
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
                      <div className="qm-meta">Upcoming • {m.date} {m.time} (Pitch {m.pitch})</div>
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
