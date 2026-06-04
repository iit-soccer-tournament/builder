import React from 'react';
import { History, Award } from 'lucide-react';

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
              <div key={record.year} className="history-card" style={{ display: 'grid', gridTemplateColumns: imgSource ? '1fr 2fr' : '1fr', gap: '20px', alignItems: 'center', marginBottom: '24px', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {imgSource && (
                  <div className="history-image-container">
                    <img 
                      src={imgSource} 
                      alt={`${record.champion} Champion Team`}
                      style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: '10px', border: '2px solid #ca8a04', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
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
