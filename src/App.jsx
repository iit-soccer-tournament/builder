import { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Beer, 
  FileText, 
  History, 
  Shield, 
  Play,
  BookOpen
} from 'lucide-react';
import { supabase } from './supabase';
const initialEditions = {};
const initialPalmares = [];
const initialYear = 2026;

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
  const lastSavedRef = useRef(null);

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
    return "Tournament rules\n\n    The following rules are set as precautionary measure.\n\n       \n\n    The primary principles shall be common sense and respect of the other participants.";
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

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'error'
  const [seasonsList, setSeasonsList] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(() => supabase ? true : false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetCountdown, setResetCountdown] = useState(5);

  // UI state
  const [isBuilder, setIsBuilder] = useState(() => {
    if (!isBuilderAvailable) return false;
    const currentHash = window.location.hash;
    if (!currentHash) return true;
    return currentHash.startsWith('#/builder/');
  });
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validTabs = ['home', 'fixtures', 'scorers', 'drunk', 'rules', 'history'];
    return validTabs.includes(hash) ? hash : 'home';
  });
  const [selectedRoundFilter, setSelectedRoundFilter] = useState('All');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState(null);

  // 1. Supabase Auth state listener
  useEffect(() => {
    if (!supabase) {
      return;
    }
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user || null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load data at startup
  useEffect(() => {
    const loadData = async () => {
      try {
        if (supabase) {
          // Fetch global data
          const { data: basicData, error: basicErr } = await supabase
            .from('tournament_data')
            .select('*')
            .eq('id', 'global')
            .single();

          if (basicErr && basicErr.code !== 'PGRST116') {
            throw basicErr;
          }

          if (basicData) {
            const year = basicData.active_edition_year || 2026;
            
            setActiveEditionYear(year);
            setPalmaresOverview(basicData.palmares_overview || []);
            setGlobalRules(basicData.global_rules || "");
            setGlobalFieldInfo(basicData.global_field_info || {});
            
            const sList = basicData.seasons_list || {};
            setSeasonsList(sList);

            // Fetch only the active season
            const { data: activeSeasonRow } = await supabase
              .from('tournament_seasons')
              .select('*')
              .eq('year', year)
              .maybeSingle();

            const editionsMap = {};
            if (activeSeasonRow) {
              editionsMap[year] = activeSeasonRow.data;
            } else {
              // Ensure active season exists in map
              const activeSeasonData = {
                year: year,
                isFinished: false,
                teams: [],
                matches: [],
                scorers: [],
                drunkContest: [],
                customTrophies: []
              };
              if (isBuilderAvailable) {
                await supabase.from('tournament_seasons').upsert({ year: year, data: activeSeasonData });
              }
              editionsMap[year] = activeSeasonData;
            }
            
            setEditions(editionsMap);

            const snapshot = JSON.stringify({
              activeEditionYear: year,
              palmaresOverview: basicData.palmares_overview || [],
              globalRules: basicData.global_rules || "",
              globalFieldInfo: basicData.global_field_info || {},
              editions: editionsMap
            });
            lastSavedRef.current = snapshot;

            if (isBuilderAvailable) {
              localStorage.setItem('iit_active_year', year.toString());
              localStorage.setItem('iit_palmares_overview', JSON.stringify(basicData.palmares_overview || []));
              localStorage.setItem('iit_global_rules', basicData.global_rules || "");
              localStorage.setItem('iit_global_field_info', JSON.stringify(basicData.global_field_info || {}));
              localStorage.setItem('iit_seasons_list', JSON.stringify(sList));
              localStorage.setItem('iit_editions', JSON.stringify(editionsMap));
            }
            setIsLoading(false);
            return;
          } else if (isBuilderAvailable) {
            // Seed default global row
            const defaultBasic = {
              id: 'global',
              active_edition_year: 2026,
              palmares_overview: [],
              global_rules: "Tournament rules...",
              global_field_info: {
                location: "Via Negrotto Serra Riccò, Genoa, Italy",
                mapUrl: "https://www.google.com/maps/embed/v1/place?key=AIzaSyBs_lAfpuIjfx7DGisR7oUh1ZZ_C5qtGKc&q=Via+Negrotto+Serra+Ricc%C3%B2%2C+Genoa%2C+Italy&maptype=roadmap",
                pitchName: "Pitches B & C",
                pitchDetails: "All matches take place on modern synthetic turf fields equipped with warm showers and artificial lighting."
              },
              seasons_list: {
                "2026": {
                  year: 2026,
                  isFinished: false,
                  champion: '',
                  runnerUp: '',
                  drunkChampion: '',
                  topScorerM: '',
                  topScorerW: ''
                }
              }
            };
            await supabase.from('tournament_data').upsert(defaultBasic);

            const defaultSeason = {
              year: 2026,
              isFinished: false,
              teams: [],
              matches: [],
              scorers: [],
              drunkContest: [],
              customTrophies: []
            };
            await supabase.from('tournament_seasons').upsert({ year: 2026, data: defaultSeason });

            setEditions({ "2026": defaultSeason });
            setSeasonsList(defaultBasic.seasons_list);
            setActiveEditionYear(2026);
            setPalmaresOverview(defaultBasic.palmares_overview);
            setGlobalRules(defaultBasic.global_rules);
            setGlobalFieldInfo(defaultBasic.global_field_info);

            const snapshot = JSON.stringify({
              activeEditionYear: 2026,
              palmaresOverview: defaultBasic.palmares_overview,
              globalRules: defaultBasic.global_rules,
              globalFieldInfo: defaultBasic.global_field_info,
              editions: { "2026": defaultSeason }
            });
            lastSavedRef.current = snapshot;

            setIsLoading(false);
            return;
          }
        }
      } catch (dbErr) {
        console.warn("Supabase load failed, falling back to local storage draft or files:", dbErr);
      }

      // Check local storage draft first if DB is unreachable
      const hasLocalData = isBuilderAvailable && localStorage.getItem('iit_editions');
      if (hasLocalData) {
        const localEditions = JSON.parse(localStorage.getItem('iit_editions') || '{}');
        const localActiveYear = parseInt(localStorage.getItem('iit_active_year') || '2026', 10);
        const localPalmares = JSON.parse(localStorage.getItem('iit_palmares_overview') || '[]');
        const localRules = localStorage.getItem('iit_global_rules') || '';
        const localField = JSON.parse(localStorage.getItem('iit_global_field_info') || '{}');

        setSeasonsList(JSON.parse(localStorage.getItem('iit_seasons_list') || '{}'));
        setEditions(localEditions);
        setActiveEditionYear(localActiveYear);
        setPalmaresOverview(localPalmares);
        setGlobalRules(localRules);
        setGlobalFieldInfo(localField);

        const snapshot = JSON.stringify({
          activeEditionYear: localActiveYear,
          palmaresOverview: localPalmares,
          globalRules: localRules,
          globalFieldInfo: localField,
          editions: localEditions
        });
        lastSavedRef.current = snapshot;

        setIsLoading(false);
        return;
      }

      // Fallback load
      fetch('./data/data.json')
        .then(res => {
          if (!res.ok) throw new Error("Could not fetch ./data/data.json");
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") === -1) {
            throw new Error("Could not load database: server returned HTML page instead of JSON. Ensure `./data/data.json` exists.");
          }
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

            const initialSeasonsList = {};
            Object.keys(editionsCopy).forEach(yr => {
              const ed = editionsCopy[yr];
              initialSeasonsList[yr] = {
                year: ed.year,
                isFinished: ed.isFinished || false,
                champion: ed.champion || '',
                runnerUp: ed.runnerUp || '',
                drunkChampion: ed.drunkChampion || '',
                topScorerM: ed.topScorerM || '',
                topScorerW: ed.topScorerW || ''
              };
            });
            setSeasonsList(initialSeasonsList);

            const snapshot = JSON.stringify({
              activeEditionYear: data.activeEditionYear || 2026,
              palmaresOverview: data.palmaresOverview || [],
              globalRules: data.globalRules || "",
              globalFieldInfo: fieldInfoCopy || {},
              editions: editionsCopy
            });
            lastSavedRef.current = snapshot;

            if (isBuilderAvailable) {
              localStorage.setItem('iit_editions', JSON.stringify(editionsCopy));
              if (data.activeEditionYear) {
                localStorage.setItem('iit_active_year', data.activeEditionYear.toString());
              }
              if (data.palmaresOverview) {
                localStorage.setItem('iit_palmares_overview', JSON.stringify(data.palmaresOverview));
              }
              if (data.globalRules) {
                localStorage.setItem('iit_global_rules', data.globalRules);
              }
              if (fieldInfoCopy) {
                localStorage.setItem('iit_global_field_info', JSON.stringify(fieldInfoCopy));
              }
              localStorage.setItem('iit_seasons_list', JSON.stringify(initialSeasonsList));
            }
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load `./data/data.json`:", err);
          setError(err.message);
          setIsLoading(false);
        });
    };

    loadData();
  }, []);

  // 3. Load season details dynamically when activeEditionYear changes
  useEffect(() => {
    if (!supabase || isLoading) return;
    if (editions[activeEditionYear]) return;

    const loadSeasonData = async () => {
      setIsLoading(true);
      try {
        const { data: seasonData } = await supabase
          .from('tournament_seasons')
          .select('*')
          .eq('year', activeEditionYear)
          .single();
          
        if (seasonData) {
          setEditions(prev => {
            const updated = {
              ...prev,
              [activeEditionYear]: seasonData.data
            };
            if (lastSavedRef.current) {
              try {
                const lastSaved = JSON.parse(lastSavedRef.current);
                lastSaved.editions = {
                  ...lastSaved.editions,
                  [activeEditionYear]: seasonData.data
                };
                lastSavedRef.current = JSON.stringify(lastSaved);
              } catch (e) {
                console.error(e);
              }
            }
            return updated;
          });
        }
      } catch (err) {
        console.error(`Failed to load season data for ${activeEditionYear}:`, err);
      }
      setIsLoading(false);
    };

    loadSeasonData();
  }, [activeEditionYear, isLoading, editions]);

  // Load all seasons when entering the history/palmares tab or in builder mode
  useEffect(() => {
    if (!supabase || isLoading) return;
    if (activeTab === 'history' || isBuilder) {
      const missingYears = Object.keys(seasonsList).map(Number).filter(y => !editions[y]);
      if (missingYears.length === 0) return;

      const loadMissingSeasons = async () => {
        setIsLoading(true);
        try {
          const { data: seasonsData } = await supabase
            .from('tournament_seasons')
            .select('*')
            .in('year', missingYears);

          if (seasonsData) {
            setEditions(prev => {
              const updated = { ...prev };
              seasonsData.forEach(row => {
                updated[row.year] = row.data;
              });
              if (lastSavedRef.current) {
                try {
                  const lastSaved = JSON.parse(lastSavedRef.current);
                  lastSaved.editions = {
                    ...lastSaved.editions,
                    ...updated
                  };
                  lastSavedRef.current = JSON.stringify(lastSaved);
                } catch (e) {
                  console.error(e);
                }
              }
              return updated;
            });
          }
        } catch (err) {
          console.error("Failed to load historical seasons:", err);
        }
        setIsLoading(false);
      };

      loadMissingSeasons();
    }
  }, [activeTab, isBuilder, seasonsList, editions, isLoading]);

  // Countdown timer for custom Reset Defaults confirmation dialog
  useEffect(() => {
    let interval;
    if (showResetConfirmModal) {
      interval = setInterval(() => {
        setResetCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showResetConfirmModal]);

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

  // Track dirty state for manual saving
  useEffect(() => {
    if (isLoading || authLoading) return;
    
    if (!lastSavedRef.current) {
      setSaveStatus('saved');
      return;
    }

    const current = JSON.stringify({
      activeEditionYear,
      palmaresOverview,
      globalRules,
      globalFieldInfo,
      editions
    });
    
    const isDirty = current !== lastSavedRef.current;
    setSaveStatus(isDirty ? 'unsaved' : 'saved');
  }, [editions, activeEditionYear, palmaresOverview, globalRules, globalFieldInfo, isLoading, authLoading]);

  // Sync state with hash changes
  const getTabFromHash = () => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    const validTabs = ['home', 'fixtures', 'scorers', 'drunk', 'rules', 'history'];
    return validTabs.includes(hash) ? hash : 'home';
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/builder/')) {
        if (isBuilderAvailable) {
          setIsBuilder(true);
        } else {
          window.location.hash = '#/home';
        }
      } else {
        setIsBuilder(false);
        setActiveTab(getTabFromHash());
      }
    };
    window.addEventListener('hashchange', handleHashChange);

    // Initial routing logic
    const currentHash = window.location.hash;
    if (isBuilderAvailable) {
      if (!currentHash || (!currentHash.startsWith('#/builder/') && !['#/home', '#/fixtures', '#/scorers', '#/drunk', '#/rules', '#/history'].includes(currentHash))) {
        window.location.hash = '#/builder/edition';
      }
    } else {
      if (!currentHash || currentHash.startsWith('#/builder/')) {
        window.location.hash = '#/home';
      }
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

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setEditions(data.editions || {});
          if (data.activeEditionYear) setActiveEditionYear(data.activeEditionYear);
          setPalmaresOverview(data.palmaresOverview || []);
          setGlobalRules(data.globalRules || "");
          setGlobalFieldInfo(data.globalFieldInfo || {
            location: "Via Negrotto Serra Riccò, Genoa, Italy",
            mapUrl: "https://www.google.com/maps/embed/v1/place?key=AIzaSyBs_lAfpuIjfx7DGisR7oUh1ZZ_C5qtGKc&q=Via+Negrotto+Serra+Ricc%C3%B2%2C+Genoa%2C+Italy&maptype=roadmap",
            pitchName: "Pitches B & C",
            pitchDetails: "All matches take place on modern synthetic turf fields equipped with warm showers and artificial lighting."
          });
          setError(null);
        } catch (err) {
          alert("Invalid JSON file: " + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleStartFresh = () => {
    const freshEditions = {
      "2026": {
        year: 2026,
        isFinished: false,
        teams: [],
        matches: [],
        scorers: [],
        drunkContest: [],
        rules: "Tournament rules\n\n    The following rules are set as precautionary measure.\n\n       \n\n    The primary principles shall be common sense and respect of the other participants.",
        customTrophies: []
      }
    };
    setEditions(freshEditions);
    setActiveEditionYear(2026);
    setPalmaresOverview([]);
    setGlobalRules(freshEditions["2026"].rules);
    setGlobalFieldInfo({
      location: "Via Negrotto Serra Riccò, Genoa, Italy",
      mapUrl: "https://www.google.com/maps/embed/v1/place?key=AIzaSyBs_lAfpuIjfx7DGisR7oUh1ZZ_C5qtGKc&q=Via+Negrotto+Serra+Ricc%C3%B2%2C+Genoa%2C+Italy&maptype=roadmap",
      pitchName: "Pitches B & C",
      pitchDetails: "All matches take place on modern synthetic turf fields equipped with warm showers and artificial lighting."
    });
    setError(null);
  };

  const handleResetDefault = () => {
    setResetCountdown(5);
    setShowResetConfirmModal(true);
  };

  const handleExecuteReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setLoginError('');
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (authErr) throw authErr;
      setLoginEmail('');
      setLoginPassword('');
    } catch (err) {
      console.error(err);
      setLoginError(err.message || 'Invalid email or password.');
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      window.location.hash = '#/builder/edition';
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadImage = async (file) => {
    if (!supabase) {
      throw new Error("Supabase is not initialized.");
    }
    const fileName = `${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage
      .from('tournament-images')
      .upload(`images/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadErr) {
      throw uploadErr;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('tournament-images')
      .getPublicUrl(`images/${fileName}`);

    return publicUrl;
  };

  const base64ToBlob = (base64Data, contentType) => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const handleSaveChanges = async () => {
    if (!supabase) return;
    setSaveStatus('saving');
    try {
      // 1. Scan and upload any base64 images to Supabase Storage first
      const updatedEditions = { ...editions };
      let hasUploadedAny = false;

      for (const yr of Object.keys(updatedEditions)) {
        const ed = { ...updatedEditions[yr] };
        if (ed.customTrophies && ed.customTrophies.length > 0) {
          const updatedTrophies = [];
          for (const t of ed.customTrophies) {
            const trophyCopy = { ...t };
            if (trophyCopy.imageData && trophyCopy.imageData.startsWith('data:')) {
              try {
                const parts = trophyCopy.imageData.split(',');
                const mime = parts[0].match(/:(.*?);/)[1];
                const base64Data = parts[1];
                const blob = base64ToBlob(base64Data, mime);
                const ext = mime.split('/')[1] || 'png';
                const file = new File([blob], `trophy_${trophyCopy.id}.${ext}`, { type: mime });
                
                const publicUrl = await handleUploadImage(file);
                trophyCopy.imageData = publicUrl;
                trophyCopy.imagePath = publicUrl;
                hasUploadedAny = true;
              } catch (uploadErr) {
                console.error("Failed to upload base64 image during cloud save:", uploadErr);
              }
            }
            updatedTrophies.push(trophyCopy);
          }
          ed.customTrophies = updatedTrophies;
          updatedEditions[yr] = ed;
        }
      }

      if (hasUploadedAny) {
        setEditions(updatedEditions);
      }

      const updatedSeasonsList = { ...seasonsList };
      Object.keys(updatedEditions).forEach(yr => {
        const ed = updatedEditions[yr];
        updatedSeasonsList[yr] = {
          year: ed.year,
          isFinished: ed.isFinished || false,
          champion: ed.champion || '',
          runnerUp: ed.runnerUp || '',
          drunkChampion: ed.drunkChampion || '',
          topScorerM: ed.topScorerM || '',
          topScorerW: ed.topScorerW || ''
        };
      });

      // Save global data
      const { error: gErr } = await supabase
        .from('tournament_data')
        .upsert({
          id: 'global',
          active_edition_year: activeEditionYear,
          palmares_overview: palmaresOverview,
          global_rules: globalRules,
          global_field_info: globalFieldInfo,
          seasons_list: updatedSeasonsList
        });
      
      if (gErr) throw gErr;

      // Save all seasons detailed docs
      for (const yr of Object.keys(updatedEditions)) {
        const season = updatedEditions[yr];
        if (season) {
          const dbSeasonCopy = { ...season };
          delete dbSeasonCopy.scorers;
          
          const { error: sErr } = await supabase
            .from('tournament_seasons')
            .upsert({
              year: parseInt(yr, 10),
              data: dbSeasonCopy
            });
            
          if (sErr) throw sErr;
        }
      }

      const snapshot = JSON.stringify({
        activeEditionYear,
        palmaresOverview,
        globalRules,
        globalFieldInfo,
        editions: updatedEditions
      });
      lastSavedRef.current = snapshot;

      setSaveStatus('saved');
      alert("Changes saved to cloud successfully! All local base64 images have been uploaded to Supabase Storage.");
    } catch (err) {
      console.error("Failed to save to Supabase:", err);
      setSaveStatus('error');
      alert("Failed to save changes: " + err.message);
    }
  };

  const handleRollbackChanges = async () => {
    if (!window.confirm("Are you sure you want to discard your local draft changes and rollback to the last saved data from the database?")) {
      return;
    }
    setIsLoading(true);
    try {
      if (supabase) {
        const { data: basicData, error: basicErr } = await supabase
          .from('tournament_data')
          .select('*')
          .eq('id', 'global')
          .single();

        if (basicErr) throw basicErr;

        if (basicData) {
          const year = basicData.active_edition_year || 2026;
          const sList = basicData.seasons_list || {};

          // Fetch the active season data first, BEFORE triggering any state changes or intermediate renders
          const { data: seasonData } = await supabase
            .from('tournament_seasons')
            .select('*')
            .eq('year', year)
            .single();

          let activeSeasonData = {};
          if (seasonData) {
            activeSeasonData = seasonData.data || {};
          }

          // Now apply all state changes at once
          setActiveEditionYear(year);
          setPalmaresOverview(basicData.palmares_overview || []);
          setGlobalRules(basicData.global_rules || "");
          setGlobalFieldInfo(basicData.global_field_info || {});
          setSeasonsList(sList);
          setEditions({ [year]: activeSeasonData });

          // Update local storage drafts
          if (isBuilderAvailable) {
            localStorage.setItem('iit_active_year', year.toString());
            localStorage.setItem('iit_palmares_overview', JSON.stringify(basicData.palmares_overview || []));
            localStorage.setItem('iit_global_rules', basicData.global_rules || "");
            localStorage.setItem('iit_global_field_info', JSON.stringify(basicData.global_field_info || {}));
            localStorage.setItem('iit_seasons_list', JSON.stringify(sList));
            localStorage.setItem('iit_editions', JSON.stringify({ [year]: activeSeasonData }));
          }

          const snapshot = JSON.stringify({
            activeEditionYear: year,
            palmaresOverview: basicData.palmares_overview || [],
            globalRules: basicData.global_rules || "",
            globalFieldInfo: basicData.global_field_info || {},
            editions: { [year]: activeSeasonData }
          });
          lastSavedRef.current = snapshot;
        }
      }
      setSaveStatus('saved');
      alert("Rollback successful! Data restored to the last cloud version.");
    } catch (err) {
      console.error("Rollback failed:", err);
      alert("Rollback failed: " + err.message);
    }
    setIsLoading(false);
  };

  if (isLoading || authLoading) {
    return (
      <div className="loading-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a', color: 'white', fontFamily: 'Outfit, sans-serif' }}>
        <div className="spinner" style={{ border: '4px solid rgba(22, 163, 74, 0.2)', borderLeft: '4px solid #16a34a', borderRadius: '50%', width: '50px', height: '50px', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <p style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px' }}>Loading IIT Tournament Database...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error && !isBuilderAvailable) {
    return (
      <div className="error-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at center, #1e1e2f 0%, #0f172a 100%)', color: 'white', fontFamily: 'Outfit, sans-serif', padding: '24px' }}>
        <div className="error-card" style={{ maxWidth: '640px', width: '100%', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '16px', marginRight: '20px' }}>
              <Shield size={36} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>Database Load Error</h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Could not fetch <code>./data/data.json</code></p>
            </div>
          </div>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderLeft: '4px solid #ef4444', padding: '16px 20px', borderRadius: '8px', marginBottom: '28px' }}>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' }}>{error}</p>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px 0', color: '#f8fafc' }}>Troubleshooting &amp; Deployment Guide:</h3>
          <ul style={{ paddingLeft: '20px', margin: '0 0 32px 0', color: '#94a3b8', fontSize: '13px', lineHeight: '1.8' }}>
            <li>Ensure that the database is compiled and copied to the correct path.</li>
            <li>In your repository clone, there must be a folder named <strong><code>data/</code></strong> containing <strong><code>data.json</code></strong> and any uploaded images.</li>
            <li>If you are working locally, web browsers block local file fetching over the <code>file://</code> protocol. You must serve the folder using a local server (e.g. <code>npx serve .</code>).</li>
          </ul>

          <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => window.location.reload()} 
              style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Retry Connection
            </button>
          </div>
        </div>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (error && isBuilderAvailable) {
    return (
      <div className="error-page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'radial-gradient(circle at center, #1e1e2f 0%, #0f172a 100%)', color: 'white', fontFamily: 'Outfit, sans-serif', padding: '24px' }}>
        <div className="error-card" style={{ maxWidth: '640px', width: '100%', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'slideUp 0.4s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '16px', borderRadius: '16px', marginRight: '20px' }}>
              <Shield size={36} color="#eab308" />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#f1f5f9' }}>Database Setup Needed</h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Builder Mode is active, but `./data/data.json` is missing.</p>
            </div>
          </div>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderLeft: '4px solid #eab308', padding: '16px 20px', borderRadius: '8px', marginBottom: '28px' }}>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1' }}>
              To start configuring your tournament, you can either seed the builder by loading an existing <code>data.json</code> file, or start fresh with a clean slate.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              onClick={handleStartFresh} 
              style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Start Fresh (New Blank Database)
            </button>

            <label 
              style={{ background: '#475569', color: 'white', border: 'none', borderRadius: '12px', padding: '14px 20px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', textAlign: 'center', boxShadow: '0 4px 12px rgba(71, 85, 105, 0.2)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Upload data.json
              <input type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (isBuilder && supabase && !currentUser) {
    return (
      <div className="login-page-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1e1e2f 0%, #0f172a 100%)',
        color: 'white',
        fontFamily: 'Outfit, sans-serif',
        padding: '24px'
      }}>
        <div className="login-card" style={{
          maxWidth: '440px',
          width: '100%',
          background: 'rgba(30, 41, 59, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          textAlign: 'center',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <div style={{ display: 'inline-flex', background: 'rgba(22, 163, 74, 0.1)', padding: '16px', borderRadius: '50%', marginBottom: '20px' }}>
            <Shield size={40} color="#16a34a" />
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px 0', color: '#f8fafc' }}>Builder Workspace</h2>
          <p style={{ margin: '0 0 28px 0', color: '#94a3b8', fontSize: '14px' }}>Please sign in to modify the IIT Soccer Tournament database.</p>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', textAlign: 'left', color: '#fca5a5' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.5px' }}>Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginTop: '10px',
                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
              }}
            >
              Sign In
            </button>
          </form>
          <button
            onClick={() => {
              window.location.hash = '#/home';
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '13px',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Back to Public Site
          </button>
        </div>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <>
                <button
                  onClick={handleSaveChanges}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  style={{
                    background: saveStatus === 'saved' ? '#15803d' : (saveStatus === 'saving' ? '#64748b' : '#2563eb'),
                    color: '#ffffff',
                    border: saveStatus === 'saved' ? '1px solid #166534' : 'none',
                    cursor: saveStatus === 'saving' || saveStatus === 'saved' ? 'not-allowed' : 'pointer',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  {saveStatus === 'saving' ? 'Saving...' : (saveStatus === 'saved' ? '💾 Saved' : '💾 Save to Cloud')}
                </button>
                <button
                  onClick={handleRollbackChanges}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  style={{
                    background: saveStatus === 'saved' ? '#475569' : '#dc2626',
                    color: '#ffffff',
                    border: saveStatus === 'saved' ? '1px solid #334155' : '1px solid #991b1b',
                    cursor: saveStatus === 'saving' || saveStatus === 'saved' ? 'not-allowed' : 'pointer',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    opacity: saveStatus === 'saved' ? 0.6 : 1
                  }}
                >
                  ↩ Rollback Draft
                </button>
              </>
            <button 
              onClick={() => {
                if (isBuilder) {
                  window.location.hash = '#/home';
                } else {
                  window.location.hash = '#/builder/edition';
                }
              }}
              className="admin-toggle active"
              style={{ background: 'white', color: isBuilder ? '#1e293b' : '#16a34a', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}
            >
              {isBuilder ? (
                <><Play size={14} className="inline-icon mr-1" /> Open Live Preview</>
              ) : (
                <><BookOpen size={14} className="inline-icon mr-1" /> Back to Builder</>
              )}
            </button>
            {currentUser && (
              <button 
                onClick={handleLogout}
                className="admin-toggle active"
                style={{ background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px' }}
              >
                Sign Out
              </button>
            )}
          </div>
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
          saveStatus={saveStatus}
          onUploadImage={handleUploadImage}
          onSave={handleSaveChanges}
          onRollback={handleRollbackChanges}
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
            <p>© {activeEditionYear} IIT Soccer Tournament.</p>
          </footer>
        </>
      )}
      {showResetConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>⚠️</div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#ef4444',
              margin: '0 0 12px 0'
            }}>Reset to Defaults?</h3>
            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: '0 0 25px 0'
            }}>
              Are you sure you want to reset all data to the values in <code>./data/data.json</code>? Your custom modifications will be lost!
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowResetConfirmModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReset}
                disabled={resetCountdown > 0}
                style={{
                  background: resetCountdown > 0 ? '#64748b' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  cursor: resetCountdown > 0 ? 'not-allowed' : 'pointer',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Confirm Reset {resetCountdown > 0 ? `(${resetCountdown})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
