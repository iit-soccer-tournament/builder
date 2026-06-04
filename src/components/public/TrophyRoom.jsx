import React from 'react';
import { Trophy, Award, Users, Beer, Target } from 'lucide-react';

function TrophyRoom({ edition }) {
  const trophies = edition.customTrophies || [];
  const champTrophy = trophies.find(t => t.id === `champ_${edition.year}` || t.name === "Champion Team Photo");
  const otherTrophies = trophies.filter(t => t !== champTrophy);

  return (
    <div className="trophy-room-pane font-sans">
      <div className="hero-section text-center">
        <div className="large-beer" style={{ fontSize: '72px', animation: 'bounce 3s infinite' }}>🏆</div>
        <h2 className="mt-2 text-3xl font-black">IIT Soccer Tournament {edition.year} Final Standings</h2>
        <p className="mt-2 text-muted max-w-lg mx-auto">The season has completed. Here are the champions, runners-up, and special award winners who left their mark on the pitch.</p>
      </div>

      {/* Main Champions Panel */}
      <div className="card mb-6">
        <div className="card-header bg-green-50">
          <h3 className="text-green text-lg font-bold">🥇 Season Champions</h3>
        </div>
        <div className="card-body">
          <div className="champions-container" style={{ display: 'grid', gridTemplateColumns: champTrophy ? '1.2fr 1fr' : '1fr', gap: '24px', alignItems: 'center' }}>
            {champTrophy && (
              <div className="champ-photo-container text-center">
                <img 
                  src={champTrophy.imageData || champTrophy.imagePath} 
                  alt={`${edition.champion} Champion Team Photo`}
                  style={{ maxWidth: '100%', maxHeight: '320px', objectFit: 'contain', display: 'block', margin: '0 auto', borderRadius: '12px', border: '3px solid #ca8a04', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <span className="block text-xs text-muted mt-2 italic">🏆 {edition.champion} Champion Team Photo</span>
              </div>
            )}

            <div className="champions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div className="winner-metric text-center p-4" style={{ background: 'rgba(21, 128, 61, 0.05)', borderRadius: '12px', border: '1px solid rgba(21, 128, 61, 0.15)' }}>
                <Trophy size={36} className="text-amber mx-auto mb-2" />
                <span className="block text-xs uppercase text-muted font-bold">Tournament Champion</span>
                <span className="block text-lg font-extrabold text-green mt-1">{edition.champion || 'TBD'}</span>
              </div>
              
              <div className="winner-metric text-center p-4" style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <Award size={36} className="text-slate mx-auto mb-2" />
                <span className="block text-xs uppercase text-muted font-bold">Runner-Up</span>
                <span className="block text-lg font-extrabold mt-1">{edition.runnerUp || 'TBD'}</span>
              </div>

              <div className="winner-metric text-center p-4" style={{ background: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                <Beer size={36} className="text-amber mx-auto mb-2" />
                <span className="block text-xs uppercase text-muted font-bold">Drunk Champions</span>
                <span className="block text-lg font-extrabold text-amber mt-1">{edition.drunkChampion || 'TBD'}</span>
              </div>

              <div className="winner-metric text-center p-4" style={{ background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <Target size={36} className="text-blue mx-auto mb-2" />
                <span className="block text-xs uppercase text-muted font-bold">Top Scorers</span>
                <span className="block text-xs font-extrabold mt-1">♂ {edition.topScorerM || 'TBD'}</span>
                <span className="block text-xs font-extrabold">♀ {edition.topScorerW || 'TBD'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Awards Grid */}
      <div className="card">
        <div className="card-header">
          <h3>🏆 Special Trophies &amp; Awards</h3>
        </div>
        <div className="card-body">
          {otherTrophies.length === 0 ? (
            <p className="text-muted text-center py-6">No custom trophies or awards logged for this season.</p>
          ) : (
            <div className="trophies-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {otherTrophies.map((trophy) => (
                <div 
                  key={trophy.id} 
                  className="trophy-award-card text-center p-4" 
                  style={{ background: 'white', border: '1.5px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}
                >
                  <div className="trophy-avatar-container mb-3" style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(trophy.imageData || trophy.imagePath) ? (
                      <img 
                        src={trophy.imageData || trophy.imagePath} 
                        alt={trophy.name} 
                        style={{ maxHeight: '90px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px' }} 
                      />
                    ) : (
                      <span style={{ fontSize: '48px' }}>🏆</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-md" style={{ color: '#166534' }}>{trophy.name}</h4>
                  <p className="text-sm font-bold text-slate-700 mt-1">Recipient: <span className="text-amber">{trophy.winner}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrophyRoom;
