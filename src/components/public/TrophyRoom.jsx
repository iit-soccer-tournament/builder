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
      <div className="card" style={{ border: 'none', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', background: 'white', overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '30px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: 'white', borderBottom: 'none', textAlign: 'center' }}>
          <h2 style={{ color: '#ffffff', margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>IIT Soccer Tournament {edition.year}</h2>
        </div>
        <div className="card-body" style={{ padding: '40px 30px' }}>
          
          {/* Highlighted Champion Team Photo inside the card */}
          {champTrophy && (
            <div className="champ-photo-section text-center mb-10" style={{ paddingBottom: '30px', borderBottom: '1px solid #f1f5f9' }}>
              <div className="champ-photo-container text-center" style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                <img 
                  src={champTrophy.imageData || champTrophy.imagePath} 
                  alt={`${edition.champion || 'Champion'} Team Photo`}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '440px', 
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
          )}

          {/* Awards List */}
          {trophyList.length === 0 ? (
            <p className="text-muted text-center py-12">No trophies or awards logged for this season yet.</p>
          ) : (
            <div className="trophies-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {trophyList.map((trophy) => (
                <div 
                  key={trophy.id} 
                  className="trophy-award-card p-4" 
                  style={{ 
                    background: '#f8fafc', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '20px', 
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    textAlign: 'left',
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
                  <div className="trophy-avatar-container" style={{ width: '80px', height: '80px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={trophy.image} 
                      alt={trophy.name} 
                      style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const emojiSpan = document.createElement('span');
                        emojiSpan.innerText = '🏆';
                        emojiSpan.style.fontSize = '40px';
                        e.target.parentNode.appendChild(emojiSpan);
                      }}
                    />
                  </div>
                  <div className="trophy-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h4 className="font-black" style={{ color: '#0f172a', fontSize: '16px', margin: 0 }}>{trophy.name}</h4>
                    <p className="font-black text-amber-600" style={{ fontSize: '16px', margin: 0 }}>{trophy.winner || 'TBD'}</p>
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
