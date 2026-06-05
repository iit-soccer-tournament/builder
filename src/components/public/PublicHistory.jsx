
function PublicHistory({ palmares = [], editions = {}, onSelectEdition }) {
  return (
    <div className="card text-left">
      <div className="card-header flex-between">
        <h2>Palmarès - Past Seasons Overview</h2>
      </div>
      <div className="card-body">
        <div className="history-timeline">
          {palmares.map((record) => {
            const editionData = editions[record.year] || {};
            const champTrophy = (editionData.customTrophies || []).find(
              t => t.id === `champ_${record.year}` || t.name === "Champion Team Photo"
            );
            const imgSource = record.championPhoto || (champTrophy ? (champTrophy.imageData || champTrophy.imagePath) : null);

            return (
              <div key={record.year} className={`history-card ${imgSource ? 'has-image' : ''}`}>
                {imgSource && (
                  <div className="history-image-container">
                    <img 
                      src={imgSource} 
                      alt={`${record.champion} Champion Team`}
                    />
                  </div>
                )}
                <div>
                  <div className="history-year flex-gap items-center mb-3">
                    <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-light)' }}>{record.year}</span>
                    <button 
                      className="admin-toggle active btn-sm text-xs ml-3"
                      onClick={() => onSelectEdition(record.year)}
                      style={{ padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                  </div>
                  <div className="history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                    <div className="history-metric">
                      <span className="label">🥇 Champions</span>
                      <span className="value text-green" style={{ fontWeight: 800 }}>{record.champion}</span>
                    </div>
                    <div className="history-metric">
                      <span className="label">🥈 Runner-up</span>
                      <span className="value">{record.runnerUp}</span>
                    </div>
                    {record.thirdPlace && (
                      <div className="history-metric">
                        <span className="label">🥉 3rd Place</span>
                        <span className="value">{record.thirdPlace}</span>
                      </div>
                    )}
                    <div className="history-metric">
                      <span className="label">🍺 Drunk Champions</span>
                      <span className="value text-amber">{record.drunkChampion}</span>
                    </div>
                    <div className="history-metric">
                      <span className="label">⚽ Top Scorer (Men)</span>
                      <span className="value">{record.topScorerM || record.topScorer || '-'}</span>
                    </div>
                    <div className="history-metric">
                      <span className="label">⚽ Top Scorer (Women)</span>
                      <span className="value">{record.topScorerW || '-'}</span>
                    </div>
                    {record.lastPlace && (
                      <div className="history-metric">
                        <span className="label">💩 Last Place</span>
                        <span className="value text-rose-600">{record.lastPlace}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {palmares.length === 0 && (
            <p className="text-muted text-center py-6">No historical records saved.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PublicHistory;
