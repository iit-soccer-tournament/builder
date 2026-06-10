import { MapPin } from 'lucide-react';

function PublicHome({ edition, getTeamName, fieldInfo }) {
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

  return (
    <div className="home-pane">
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
