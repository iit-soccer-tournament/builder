import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Beer, 
  FileText, 
  History, 
  Shield, 
  Play,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import fallbackDb from './data/database_fallback.json';
const initialEditions = JSON.parse(JSON.stringify(fallbackDb.editions || {}));
const initialPalmares = JSON.parse(JSON.stringify(fallbackDb.palmaresOverview || []));
const initialYear = fallbackDb.activeEditionYear || 2026;

// Public view components
import PublicHome from './components/public/PublicHome';
import PublicFixtures from './components/public/PublicFixtures';
import PublicScorers from './components/public/PublicScorers';
import PublicDrunk from './components/public/PublicDrunk';
import PublicRules from './components/public/PublicRules';
import PublicHistory from './components/public/PublicHistory';
import TrophyRoom from './components/public/TrophyRoom';

// Builder component
import BuilderMain from './components/builder/BuilderMain';

import './App.css';

const isBuilderAvailable = import.meta.env.VITE_BUILDER === 'true';

function App() {

  // 1. Data Store initialized from localStorage
  const [editions, setEditions] = useState(() => {
    const saved = localStorage.getItem('iit_editions');
    return saved ? JSON.parse(saved) : initialEditions;
  });

  const [activeEditionYear, setActiveEditionYear] = useState(() => {
    const saved = localStorage.getItem('iit_active_year');
    return saved ? parseInt(saved, 10) : initialYear;
  });

  const [palmaresOverview, setPalmaresOverview] = useState(() => {
    const saved = localStorage.getItem('iit_palmares_overview');
    return saved ? JSON.parse(saved) : initialPalmares;
  });

  const [globalRules, setGlobalRules] = useState(() => {
    const saved = localStorage.getItem('iit_global_rules');
    if (saved) return saved;
    return fallbackDb.editions?.["2026"]?.rules || "Tournament rules\n\n    The following rules are set as precautionary measure.\n\n       \n\n    The primary principles shall be common sense and respect of the other participants.";
  });

  const [globalFieldInfo, setGlobalFieldInfo] = useState(() => {
    const saved = localStorage.getItem('iit_global_field_info');
    if (saved) return JSON.parse(saved);
    return {
      location: "Via Negrotto Serra Riccò, Genoa, Italy",
      mapUrl: "https://www.google.com/maps/embed/v1/place?key=AIzaSyBs_lAfpuIjfx7DGisR7oUh1ZZ_C5qtGKc&q=Via+Negrotto+Serra+Ricc%C3%B2%2C+Genoa%2C+Italy&maptype=roadmap",
      pitchName: "Pitches B & C",
      pitchDetails: "All matches take place on modern synthetic turf fields equipped with warm showers and artificial lighting."
    };
  });

  // UI state
  const [isBuilder, setIsBuilder] = useState(isBuilderAvailable); // App starts in Builder Mode if available
  const [activeTab, setActiveTab] = useState('home');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('All');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(null);

  // Load data from `./data/data.json` at startup if we are running in public preview website mode
  useEffect(() => {
    if (!isBuilderAvailable) {
      fetch('./data/data.json')
        .then(res => {
          if (!res.ok) throw new Error("Could not fetch ./data/data.json");
          return res.json();
        })
        .then(data => {
          if (data) {
            const fixImagePath = (path) => {
              if (path && !path.startsWith('data:') && !path.startsWith('http') && !path.startsWith('./')) {
                return './data/' + path;
              }
              return path;
            };

            const editionsCopy = JSON.parse(JSON.stringify(data.editions || {}));
            Object.keys(editionsCopy).forEach(yr => {
              const ed = editionsCopy[yr];
              if (ed.customTrophies) {
                ed.customTrophies.forEach(t => {
                  if (t.imagePath) {
                    t.imagePath = fixImagePath(t.imagePath);
                  }
                });
              }
            });

            const fieldInfoCopy = data.globalFieldInfo ? JSON.parse(JSON.stringify(data.globalFieldInfo)) : null;
            if (fieldInfoCopy && fieldInfoCopy.pitchImage) {
              fieldInfoCopy.pitchImage = fixImagePath(fieldInfoCopy.pitchImage);
            }

            setEditions(editionsCopy);
            if (data.activeEditionYear) {
              setActiveEditionYear(data.activeEditionYear);
            }
            if (data.palmaresOverview) {
              setPalmaresOverview(data.palmaresOverview);
            }
            if (data.globalRules) {
              setGlobalRules(data.globalRules);
            }
            if (fieldInfoCopy) {
              setGlobalFieldInfo(fieldInfoCopy);
            }
          }
        })
        .catch(err => {
          console.warn("Failed to load `./data/data.json`, using fallback database:", err);
        });
    }
  }, []);

  // Sync state changes with localStorage (only in builder mode)
  useEffect(() => {
    if (isBuilderAvailable) {
      localStorage.setItem('iit_editions', JSON.stringify(editions));
    }
  }, [editions]);

  useEffect(() => {
    if (isBuilderAvailable) {
      localStorage.setItem('iit_active_year', activeEditionYear.toString());
    }
  }, [activeEditionYear]);

  useEffect(() => {
    if (isBuilderAvailable) {
      localStorage.setItem('iit_palmares_overview', JSON.stringify(palmaresOverview));
    }
  }, [palmaresOverview]);

  useEffect(() => {
    if (isBuilderAvailable) {
      localStorage.setItem('iit_global_rules', globalRules);
    }
  }, [globalRules]);

  useEffect(() => {
    if (isBuilderAvailable) {
      localStorage.setItem('iit_global_field_info', JSON.stringify(globalFieldInfo));
    }
  }, [globalFieldInfo]);

  // Sync state with hash changes
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validTabs = ['home', 'fixtures', 'scorers', 'drunk', 'rules', 'history'];
    return validTabs.includes(hash) ? hash : 'home';
  };

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = '#/home';
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Helpers
  const getScorersWithGoals = (edition) => {
    const matches = edition.matches || [];
    const scorersMap = new Map();
    
    matches.forEach(m => {
      if (m.status === 'played') {
        const processList = (list, teamId) => {
          (list || []).forEach(item => {
            const name = typeof item === 'object' && item !== null ? item.name : item;
            const isOg = typeof item === 'object' && item !== null ? !!item.isOwnGoal : false;
            const gender = typeof item === 'object' && item !== null ? item.gender || 'Men' : 'Men';
            if (!isOg && name && name.trim()) {
              const cleanName = name.trim();
              const key = cleanName.toLowerCase();
              if (scorersMap.has(key)) {
                const entry = scorersMap.get(key);
                entry.goals += 1;
                if (gender) entry.gender = gender;
              } else {
                scorersMap.set(key, {
                  id: 's_' + key,
                  name: cleanName,
                  team: teamId || '',
                  goals: 1,
                  gender: gender
                });
              }
            }
          });
        };
        processList(m.scorers1, m.team1);
        processList(m.scorers2, m.team2);
      }
    });

    return Array.from(scorersMap.values());
  };

  const rawEdition = editions[activeEditionYear] || {
    year: activeEditionYear,
    isFinished: false,
    teams: [],
    matches: [],
    scorers: [],
    drunkContest: [],
    rules: '',
    customTrophies: []
  };

  const currentEdition = {
    ...rawEdition,
    scorers: getScorersWithGoals(rawEdition),
    drunkContest: (rawEdition.teams && rawEdition.teams.length > 0)
      ? rawEdition.teams.map(t => {
          const match = (rawEdition.drunkContest || []).find(d => d.team.toLowerCase() === t.name.toLowerCase());
          return {
            team: t.name,
            beers: match ? match.beers : 0
          };
        })
      : (rawEdition.drunkContest || [])
  };

  const latestYear = Math.max(...Object.keys(editions).map(Number), 2026);

  const getTeamName = (teamId, fallbackText = '') => {
    if (!teamId) return fallbackText;
    const team = currentEdition.teams.find(t => t.id === teamId);
    return team ? team.name : fallbackText;
  };

  const getTeamColor = (teamId) => {
    if (!teamId) return '#718096';
    const team = currentEdition.teams.find(t => t.id === teamId);
    return team ? team.logoColor : '#718096';
  };

  // Compute standings dynamically from played matches
  const calculateStandings = () => {
    const standingsList = currentEdition.teams.map(team => ({
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0
    }));

    (currentEdition.matches || []).forEach(match => {
      const isRegularSeason = match.round === "Regular Season" || (match.round && match.round.startsWith("Round "));
      if (isRegularSeason && match.status === "played") {
        const t1 = standingsList.find(t => t.id === match.team1);
        const t2 = standingsList.find(t => t.id === match.team2);

        if (t1 && t2 && match.score1 !== null && match.score2 !== null) {
          const s1 = parseInt(match.score1, 10);
          const s2 = parseInt(match.score2, 10);

          t1.played += 1;
          t2.played += 1;
          t1.gf += s1;
          t1.ga += s2;
          t2.gf += s2;
          t2.ga += s1;

          if (s1 > s2) {
            t1.won += 1;
            t1.points += 3;
            t2.lost += 1;
          } else if (s1 < s2) {
            t2.won += 1;
            t2.points += 3;
            t1.lost += 1;
          } else {
            t1.drawn += 1;
            t1.points += 1;
            t2.drawn += 1;
            t2.points += 1;
          }
        }
      }
    });

    standingsList.forEach(t => {
      t.gd = t.gf - t.ga;
    });

    return standingsList.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  };

  const standings = calculateStandings();

  const handleResetDefault = () => {
    if (window.confirm("Are you sure you want to reset all data to the default tournament values? Your custom modifications will be lost!")) {
      localStorage.clear();
      
      const freshEditions = JSON.parse(JSON.stringify(fallbackDb.editions || {}));
      const freshPalmares = JSON.parse(JSON.stringify(fallbackDb.palmaresOverview || []));
      
      setEditions(freshEditions);
      setActiveEditionYear(initialYear);
      setPalmaresOverview(freshPalmares);
      setGlobalRules(fallbackDb.editions?.["2026"]?.rules || "Tournament rules...");
      setGlobalFieldInfo({
        location: "Via Negrotto Serra Riccò, Genoa, Italy",
        mapUrl: "https://www.google.com/maps/embed/v1/place?key=AIzaSyBs_lAfpuIjfx7DGisR7oUh1ZZ_C5qtGKc&q=Via+Negrotto+Serra+Ricc%C3%B2%2C+Genoa%2C+Italy&maptype=roadmap",
        pitchName: "Pitches B & C",
        pitchImage: ""
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  return (
    <div className="app-container">
      {/* View Mode Switching Banner */}
      {isBuilderAvailable && (
        <div className="mode-toggle-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isBuilder ? '#1e293b' : '#16a34a', color: 'white', padding: '12px 24px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <div>
            {isBuilder ? (
              <span>🔨 Builder Mode active. Update seasons, scores, and media.</span>
            ) : (
              <span>👀 Live Preview Mode active. You are seeing the static website.</span>
            )}
          </div>
          <button 
            onClick={() => {
              setIsBuilder(!isBuilder);
              if (isBuilder) {
                window.location.hash = '#/home';
              }
            }}
            className="admin-toggle active"
            style={{ background: 'white', color: isBuilder ? '#1e293b' : '#16a34a', border: 'none', cursor: 'pointer', padding: '8px 16px' }}
          >
            {isBuilder ? (
              <><Play size={14} className="inline-icon mr-1" /> Open Live Preview</>
            ) : (
              <><BookOpen size={14} className="inline-icon mr-1" /> Back to Builder</>
            )}
          </button>
        </div>
      )}

      {isBuilder ? (
        /* ==================== BUILDER VIEW ==================== */
        <BuilderMain 
          editions={editions}
          setEditions={setEditions}
          activeEditionYear={activeEditionYear}
          setActiveEditionYear={setActiveEditionYear}
          palmaresOverview={palmaresOverview}
          setPalmaresOverview={setPalmaresOverview}
          globalRules={globalRules}
          onUpdateGlobalRules={setGlobalRules}
          globalFieldInfo={globalFieldInfo}
          onUpdateGlobalFieldInfo={setGlobalFieldInfo}
          onResetDefault={handleResetDefault}
          onPreviewToggle={() => {
            setIsBuilder(false);
            window.location.hash = '#/home';
          }}
        />
      ) : (
        /* ==================== PREVIEW SITE VIEW ==================== */
        <>
          {/* Public Header */}
          <header className="main-header">
            <div className="header-logo">
              <Trophy className="trophy-icon" />
              <div>
                <h1>IIT Soccer Tournament</h1>
                <p className="subtitle">{activeEditionYear} Season</p>
              </div>
            </div>
          </header>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button className={activeTab === 'home' ? 'active' : ''} onClick={() => window.location.hash = '#/home'}>
              <Calendar className="tab-icon" />
              <span>{currentEdition.isFinished ? 'Trophy Room' : 'Home'}</span>
            </button>
            <button className={activeTab === 'fixtures' ? 'active' : ''} onClick={() => window.location.hash = '#/fixtures'}>
              <Trophy className="tab-icon" />
              <span>Tables &amp; Fixtures</span>
            </button>
            <button className={activeTab === 'scorers' ? 'active' : ''} onClick={() => window.location.hash = '#/scorers'}>
              <Users className="tab-icon" />
              <span>Top Scorers</span>
            </button>
            <button className={activeTab === 'drunk' ? 'active' : ''} onClick={() => window.location.hash = '#/drunk'}>
              <Beer className="tab-icon" />
              <span>Drunk Contest</span>
            </button>
            <button className={activeTab === 'rules' ? 'active' : ''} onClick={() => window.location.hash = '#/rules'}>
              <FileText className="tab-icon" />
              <span>Rules</span>
            </button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => window.location.hash = '#/history'}>
              <History className="tab-icon" />
              <span>Palmarès</span>
            </button>
          </nav>
          
          {/* Archive Warning Banner */}
          {activeEditionYear !== latestYear && (
            <div className="archive-banner" style={{ background: '#eab308', color: '#1e293b', padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', fontSize: '13px', border: '1px solid #ca8a04', animation: 'fadeIn 0.3s ease' }}>
              <span>⚠️ You are currently viewing the historical archive of the {activeEditionYear} Edition.</span>
              <button 
                onClick={() => {
                  setActiveEditionYear(latestYear);
                  window.location.hash = '#/home';
                }}
                className="admin-toggle active btn-sm"
                style={{ background: '#1e293b', color: 'white', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' }}
              >
                Go to Current {latestYear} Edition
              </button>
            </div>
          )}

          {/* Public Views */}
          <main className="main-content">
            {activeTab === 'home' && (
              currentEdition.isFinished ? (
                <TrophyRoom edition={currentEdition} />
              ) : (
                 <PublicHome 
                  edition={currentEdition} 
                  getTeamName={getTeamName} 
                  getTeamColor={getTeamColor} 
                  fieldInfo={globalFieldInfo}
                />
              )
            )}

            {/* TAB 2: FIXTURES & STANDINGS */}
            {activeTab === 'fixtures' && (
              <PublicFixtures 
                edition={currentEdition}
                standings={standings}
                selectedRoundFilter={selectedRoundFilter}
                setSelectedRoundFilter={setSelectedRoundFilter}
                selectedTeamFilter={selectedTeamFilter}
                setSelectedTeamFilter={setSelectedTeamFilter}
                getTeamName={getTeamName}
                getTeamColor={getTeamColor}
              />
            )}

            {/* TAB 3: SCORERS */}
            {activeTab === 'scorers' && (
              <PublicScorers 
                scorers={currentEdition.scorers} 
                getTeamName={getTeamName} 
              />
            )}

            {/* TAB 4: DRUNK CONTEST */}
            {activeTab === 'drunk' && (
              <PublicDrunk 
                drunkContest={currentEdition.drunkContest} 
              />
            )}

            {/* TAB 5: RULES */}
            {activeTab === 'rules' && (
              <PublicRules 
                rulesText={globalRules} 
              />
            )}

            {activeTab === 'history' && (
              <PublicHistory 
                palmares={palmaresOverview} 
                editions={editions}
                onSelectEdition={(year) => {
                  setActiveEditionYear(year);
                  window.location.hash = '#/home';
                }}
              />
            )}
          </main>

          <footer className="footer">
            <p>© {activeEditionYear} IIT Soccer Tournament. Remade with premium styling &amp; hash routing.</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;
