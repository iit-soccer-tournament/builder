function TrophyRoom({ edition }) {
  const trophies = edition.customTrophies || [];
  // Find champion team photo
  const champTrophy = trophies.find(t => t.id === `champ_${edition.year}` || t.name === "Champion Team Photo");
  // Get other custom trophies
  const otherTrophies = trophies.filter(t => t !== champTrophy);

  // Build the list of all trophies in the requested order
  const trophyList = [];

  if (edition.champion) {
    trophyList.push({
      id: 'champion',
      name: 'Tournament Champion',
      winner: edition.champion,
      image: '/winner.png'
    });
  }

  if (edition.runnerUp) {
    trophyList.push({
      id: 'runnerUp',
      name: 'Runner-Up (2nd Place)',
      winner: edition.runnerUp,
      image: '/second_place.png'
    });
  }

  if (edition.thirdPlace) {
    trophyList.push({
      id: 'thirdPlace',
      name: 'Third Place (3rd Place)',
      winner: edition.thirdPlace,
      image: '/third_place.png'
    });
  }

  if (edition.drunkChampion) {
    trophyList.push({
      id: 'drunkChampion',
      name: 'Drunk Champions',
      winner: edition.drunkChampion,
      image: '/drunk_team.png'
    });
  }

  if (edition.topScorerM) {
    trophyList.push({
      id: 'topScorerM',
      name: 'Top Scorer (Men)',
      winner: edition.topScorerM,
      image: '/top_scorer.png'
    });
  }

  if (edition.topScorerW) {
    trophyList.push({
      id: 'topScorerW',
      name: 'Top Scorer (Women)',
      winner: edition.topScorerW,
      image: '/top_scorer.png'
    });
  }

  if (edition.lastPlace) {
    trophyList.push({
      id: 'lastPlace',
      name: 'Last Place',
      winner: edition.lastPlace,
      image: '/last_place.png'
    });
  }

  // Add custom trophies next to the normal ones
  otherTrophies.forEach(t => {
    trophyList.push({
      id: t.id,
      name: t.name,
      winner: t.winner,
      image: t.imageData || t.imagePath || '/winner.png'
    });
  });

  return (
    <div className="trophy-room-pane font-sans" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div className="hero-section text-center mb-8" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '40px 20px', borderRadius: '24px', color: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'rgba(22, 163, 74, 0.1)', borderRadius: '50%', filter: 'blur(30px)' }}></div>
        
        <div className="large-beer" style={{ fontSize: '72px', animation: 'bounce 3s infinite', display: 'inline-block' }}>🏆</div>
        <h2 className="mt-2 text-3xl font-black" style={{ letterSpacing: '-0.5px' }}>IIT Soccer Tournament {edition.year}</h2>
        <p className="mt-2 text-slate-300 max-w-lg mx-auto" style={{ fontSize: '15px', lineHeight: 1.6 }}>The season has completed. Here are the champions, runners-up, and special award winners who left their mark on the pitch.</p>
      </div>

      {/* Highlighted Champion Team Photo Banner at the Top */}
      {champTrophy && (
        <div className="card mb-8" style={{ border: 'none', background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div className="card-header text-center" style={{ background: 'transparent', borderBottom: 'none', paddingTop: '30px' }}>
            <h3 style={{ fontSize: '20px', color: '#1e293b', fontWeight: 800 }}>🥇 Champion Team Photo</h3>
          </div>
          <div className="card-body" style={{ padding: '0 30px 40px 30px' }}>
            <div className="champ-photo-container text-center" style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', margin: '0 auto' }}>
              <img 
                src={champTrophy.imageData || champTrophy.imagePath} 
                alt={`${edition.champion || 'Champion'} Team Photo`}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '480px', 
                  objectFit: 'contain', 
                  display: 'block', 
                  margin: '0 auto', 
                  borderRadius: '16px', 
                  border: '4px solid #eab308', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)' 
                }}
              />
              <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fef9c3', border: '1px solid #fef08a', borderRadius: '30px', color: '#854d0e', fontWeight: 'bold', fontSize: '14px' }}>
                🎉 {edition.champion || 'Champion'} - Season {edition.year} Winners!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Awards Grid */}
      <div className="card" style={{ border: 'none', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', background: 'white' }}>
        <div className="card-header" style={{ padding: '24px 30px', background: 'transparent', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>🏆 Trophies &amp; Awards</h3>
        </div>
        <div className="card-body" style={{ padding: '30px' }}>
          {trophyList.length === 0 ? (
            <p className="text-muted text-center py-12">No trophies or awards logged for this season yet.</p>
          ) : (
            <div className="trophies-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '24px' }}>
              {trophyList.map((trophy) => (
                <div 
                  key={trophy.id} 
                  className="trophy-award-card text-center p-6" 
                  style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '20px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
                  }}
                >
                  <div className="trophy-avatar-container mb-4" style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={trophy.image} 
                      alt={trophy.name} 
                      style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const emojiSpan = document.createElement('span');
                        emojiSpan.innerText = '🏆';
                        emojiSpan.style.fontSize = '56px';
                        e.target.parentNode.appendChild(emojiSpan);
                      }}
                    />
                  </div>
                  <h4 className="font-black text-md" style={{ color: '#0f172a', fontSize: '16px', marginBottom: '8px' }}>{trophy.name}</h4>
                  <div style={{ display: 'inline-block', padding: '6px 16px', background: 'white', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <p className="text-xs text-slate-500 font-bold uppercase style={{ margin: 0 }}">Winner</p>
                    <p className="text-sm font-black text-amber-600" style={{ margin: '2px 0 0 0' }}>{trophy.winner || 'TBD'}</p>
                  </div>
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
