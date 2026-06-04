import React, { useState } from 'react';
import JSZip from 'jszip';
import { 
  Settings, 
  Users, 
  Calendar, 
  Users2, 
  Beer, 
  FileText, 
  Award, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  Play,
  ClipboardList
} from 'lucide-react';
import TeamEditor from './TeamEditor';
import MatchEditor from './MatchEditor';
import ScorerEditor from './ScorerEditor';
import TrophyEditor from './TrophyEditor';

const getScorersFromMatches = (matches) => {
  const scorersMap = new Map();
  (matches || []).forEach(m => {
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

function BuilderMain({
  editions,
  setEditions,
  activeEditionYear,
  setActiveEditionYear,
  palmaresOverview,
  setPalmaresOverview,
  globalRules,
  onUpdateGlobalRules,
  globalFieldInfo,
  onUpdateGlobalFieldInfo,
  onResetDefault,
  onPreviewToggle,
  saveStatus,
  onUploadImage,
  onSave,
  onRollback
}) {
  const [activeBuilderTab, setActiveBuilderTab] = useState('edition');
  const [newYear, setNewYear] = useState('');

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
    scorers: getScorersFromMatches(rawEdition.matches)
  };

  // Update active edition key-value helper
  const updateCurrentEdition = (updatedFields) => {
    setEditions({
      ...editions,
      [activeEditionYear]: {
        ...currentEdition,
        ...updatedFields
      }
    });
  };

  // Create new edition
  const handleCreateEdition = (e) => {
    e.preventDefault();
    const yearNum = parseInt(newYear, 10);
    if (!yearNum) return;
    if (editions[yearNum]) {
      alert(`Edition for year ${yearNum} already exists!`);
      return;
    }

    const newEd = {
      year: yearNum,
      isFinished: false,
      champion: '',
      runnerUp: '',
      drunkChampion: '',
      topScorerM: '',
      topScorerW: '',
      teams: [],
      matches: [],
      scorers: [],
      drunkContest: [],
      customTrophies: []
    };

    setEditions({
      ...editions,
      [yearNum]: newEd
    });
    setActiveEditionYear(yearNum);
    setNewYear('');
    alert(`Created new edition for ${yearNum}!`);
  };

  // ZIP Export
  const handleExportZip = async () => {
    const zip = new JSZip();
    
    // Deep clone database for exporting with relative paths
    const dbToExport = {
      activeEditionYear,
      editions: JSON.parse(JSON.stringify(editions)),
      palmaresOverview,
      globalRules,
      globalFieldInfo
    };
    
    const imgFolder = zip.folder("images");
    
    // Extract base64 image data to files inside ZIP
    Object.keys(dbToExport.editions).forEach(yr => {
      const ed = dbToExport.editions[yr];
      if (ed.customTrophies) {
        ed.customTrophies.forEach(t => {
          if (t.imageData && t.imageData.startsWith('data:')) {
            const parts = t.imageData.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const extension = mime.split('/')[1] || 'png';
            const base64Data = parts[1];
            const filename = `trophy_${t.id}.${extension}`;
            
            // Put binary file in ZIP
            imgFolder.file(filename, base64Data, { base64: true });
            
            // Set file path, remove base64 representation
            t.imagePath = `images/${filename}`;
            delete t.imageData;
          }
        });
      }
    });

    zip.file("data.json", JSON.stringify(dbToExport, null, 2));
    
    const content = await zip.generateAsync({ type: "blob" });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(content);
    downloadLink.download = `iit_soccer_database_${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
  };

  // ZIP Import
  const handleImportZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const zip = await JSZip.loadAsync(file);
    const dataJsonFile = zip.file("data.json");
    if (!dataJsonFile) {
      alert("Invalid backup: data.json not found in ZIP.");
      return;
    }
    
    const dataText = await dataJsonFile.async("text");
    const parsedDb = JSON.parse(dataText);
    
    // Re-populate base64 imageData inside CustomTrophy objects from image files in ZIP
    for (const yr of Object.keys(parsedDb.editions)) {
      const ed = parsedDb.editions[yr];
      if (ed.customTrophies) {
        for (const t of ed.customTrophies) {
           if (t.imagePath) {
            let imageZipFile = zip.file(t.imagePath);
            if (!imageZipFile) {
              const basename = t.imagePath.split('/').pop();
              const zipFiles = Object.keys(zip.files);
              const foundKey = zipFiles.find(name => {
                const lower = name.toLowerCase();
                return lower.endsWith(basename.toLowerCase()) ||
                  (lower.includes('images/') && lower.includes(t.id.toLowerCase())) ||
                  (lower.includes('images/') && lower.includes(yr) && (lower.includes('champ') || lower.includes('trophy')));
              });
              if (foundKey) {
                imageZipFile = zip.file(foundKey);
              }
            }
            if (imageZipFile) {
              const base64 = await imageZipFile.async("base64");
              const ext = imageZipFile.name.split('.').pop();
              const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
              t.imageData = `data:${mime};base64,${base64}`;
            }
          }
        }
      }
    }

    setEditions(parsedDb.editions);
    setActiveEditionYear(parsedDb.activeEditionYear);
    setPalmaresOverview(parsedDb.palmaresOverview || []);
    if (parsedDb.globalRules) {
      onUpdateGlobalRules(parsedDb.globalRules);
    }
    if (parsedDb.globalFieldInfo) {
      onUpdateGlobalFieldInfo(parsedDb.globalFieldInfo);
    }
    alert("Database imported successfully from ZIP!");
  };

  return (
    <div className="builder-container" style={{ paddingBottom: '30px' }}>
      {/* Configuration Header Bar */}
      <div className="admin-banner" style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', margin: 0, padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="admin-banner-content" style={{ color: 'var(--text-dark)' }}>
          <Settings className="spin-slow text-green" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>IIT Soccer Tournament Builder</h3>
              {saveStatus && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: saveStatus === 'saved' ? 'rgba(22, 163, 74, 0.1)' :
                              saveStatus === 'saving' ? 'rgba(59, 130, 246, 0.1)' :
                              saveStatus === 'unsaved' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: saveStatus === 'saved' ? '#16a34a' :
                         saveStatus === 'saving' ? '#3b82f6' :
                         saveStatus === 'unsaved' ? '#d97706' : '#ef4444',
                  border: saveStatus === 'saved' ? '1px solid rgba(22, 163, 74, 0.2)' :
                          saveStatus === 'saving' ? '1px solid rgba(59, 130, 246, 0.2)' :
                          saveStatus === 'unsaved' ? '1px solid rgba(234, 179, 8, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  {saveStatus === 'saved' && '● Cloud Synced'}
                  {saveStatus === 'saving' && '◌ Saving Changes...'}
                  {saveStatus === 'unsaved' && '● Local (Unsaved to Cloud)'}
                  {saveStatus === 'error' && '▲ Connection Lost'}
                </span>
              )}
            </div>
            <p className="text-muted text-xs" style={{ margin: '4px 0 0 0' }}>Manage years, log scores, upload trophies, and export ZIP backups.</p>
          </div>
        </div>
        
         <div className="admin-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <button onClick={onPreviewToggle} className="success-btn" style={{ background: '#15803d' }}>
            <Play size={14} /> Live Preview Site
          </button>
          <button onClick={handleExportZip} title="Download ZIP folder backup with images">
            <Download size={14} /> Export ZIP Bundle
          </button>
          <label className="file-upload-label" style={{ margin: 0, display: 'inline-flex' }}>
            <Upload size={14} /> Import ZIP Bundle
            <input type="file" accept=".zip" onChange={handleImportZip} style={{ display: 'none' }} />
          </label>
          <button 
            onClick={onResetDefault} 
            className="danger-btn" 
            style={{ 
              padding: '6px 10px', 
              fontSize: '11px', 
              lineHeight: 1, 
              background: '#94a3b8', 
              color: 'white',
              border: 'none',
              boxShadow: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <RefreshCw size={11} /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Editor Sub-Navigation Tabs */}
      <div className="nav-tabs" style={{ background: 'white', marginTop: '20px', border: '1.5px solid var(--border-color)', padding: '6px' }}>
        <button className={activeBuilderTab === 'edition' ? 'active' : ''} onClick={() => setActiveBuilderTab('edition')}>
          <ClipboardList size={16} /> Edition Setup
        </button>
        <button className={activeBuilderTab === 'teams' ? 'active' : ''} onClick={() => setActiveBuilderTab('teams')}>
          <Users2 size={16} /> Teams Registration
        </button>
        <button className={activeBuilderTab === 'matches' ? 'active' : ''} onClick={() => setActiveBuilderTab('matches')}>
          <Calendar size={16} /> Matches Scheduler
        </button>
        <button className={activeBuilderTab === 'scorers' ? 'active' : ''} onClick={() => setActiveBuilderTab('scorers')}>
          <Users size={16} /> Top Scorers
        </button>
        <button className={activeBuilderTab === 'beers' ? 'active' : ''} onClick={() => setActiveBuilderTab('beers')}>
          <Beer size={16} /> Beer Contest
        </button>
        <button className={activeBuilderTab === 'trophies' ? 'active' : ''} onClick={() => setActiveBuilderTab('trophies')}>
          <Award size={16} /> Custom Trophies
        </button>
      </div>

      {/* Tabs panels */}
      <div className="builder-tab-panels" style={{ marginTop: '20px' }}>
        
        {/* TAB 1: EDITION SETUP */}
        {activeBuilderTab === 'edition' && (
          <div className="home-grid">
            {/* Year management */}
            <div className="home-column">
              <div className="card text-left">
                <div className="card-header">
                  <h3>Active Season Workspace</h3>
                </div>
                <div className="card-body">
                  <div className="admin-form mb-4" style={{ background: '#f8fafc' }}>
                    <label className="block mb-1 font-bold">Select Active Year:</label>
                    <select 
                      value={activeEditionYear} 
                      onChange={e => setActiveEditionYear(parseInt(e.target.value, 10))}
                      style={{ fontSize: '15px', fontWeight: 800, border: '1.5px solid var(--accent-color)' }}
                    >
                      {Object.keys(editions).length === 0 ? (
                        <option value="">No years created</option>
                      ) : (
                        Object.keys(editions).map(y => <option key={y} value={y}>{y} Season</option>)
                      )}
                    </select>
                  </div>

                  <form onSubmit={handleCreateEdition} className="admin-form mb-4" style={{ background: '#f8fafc' }}>
                    <h4>Create New Season / Year</h4>
                    <div className="flex-gap">
                      <input 
                        type="number" 
                        placeholder="Year (e.g. 2026)" 
                        value={newYear} 
                        onChange={e => setNewYear(e.target.value)} 
                        required 
                      />
                      <button type="submit" className="success-btn"><Plus size={14} /> Create Edition</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Finished states */}
            <div className="home-column">
              <div className="card text-left">
                <div className="card-header">
                  <h3>Edition Lock &amp; Championship Details</h3>
                </div>
                <div className="card-body">
                  <div className="admin-form" style={{ background: '#f8fafc' }}>
                    <div className="flex-between items-center mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                      <span className="font-bold">Season Finished:</span>
                      <input 
                        type="checkbox" 
                        checked={currentEdition.isFinished} 
                        onChange={e => updateCurrentEdition({ isFinished: e.target.checked })} 
                        style={{ width: '24px', height: '24px', cursor: 'pointer' }}
                      />
                    </div>

                    {currentEdition.isFinished && (
                      <div className="finished-fields space-y-4">
                        <p className="text-muted text-xs mb-3">Declare winners of this edition to display on the Trophy Room screen.</p>
                        <div>
                          <label>Tournament Champion (Team)</label>
                          <input 
                            type="text" 
                            value={currentEdition.champion || ''} 
                            onChange={e => updateCurrentEdition({ champion: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label>Runner-Up (Team)</label>
                          <input 
                            type="text" 
                            value={currentEdition.runnerUp || ''} 
                            onChange={e => updateCurrentEdition({ runnerUp: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label>Drunk Champions (Team)</label>
                          <input 
                            type="text" 
                            value={currentEdition.drunkChampion || ''} 
                            onChange={e => updateCurrentEdition({ drunkChampion: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label>Top Scorer Men (Player)</label>
                          <input 
                            type="text" 
                            value={currentEdition.topScorerM || ''} 
                            onChange={e => updateCurrentEdition({ topScorerM: e.target.value })} 
                          />
                        </div>
                        <div>
                          <label>Top Scorer Women (Player)</label>
                          <input 
                            type="text" 
                            value={currentEdition.topScorerW || ''} 
                            onChange={e => updateCurrentEdition({ topScorerW: e.target.value })} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rules Textarea */}
            <div className="col-span-2 mt-4" style={{ gridColumn: 'span 2' }}>
              <div className="card text-left">
                <div className="card-header">
                  <h3>Edit Global Tournament Rules</h3>
                </div>
                <div className="card-body">
                  <textarea 
                    className="rules-textarea" 
                    value={globalRules || ''} 
                    onChange={e => onUpdateGlobalRules(e.target.value)}
                    rows={12}
                    style={{ border: '1.5px solid var(--border-color)', borderRadius: '10px' }}
                  />
                </div>
              </div>
            </div>

            {/* Field & Directions Editor */}
            <div className="col-span-2 mt-4" style={{ gridColumn: 'span 2' }}>
              <div className="card text-left">
                <div className="card-header">
                  <h3>Edit Field &amp; Directions</h3>
                </div>
                <div className="card-body">
                  <div className="form-grid mb-4">
                    <div>
                      <label>Field Location/Address</label>
                      <input 
                        type="text" 
                        value={globalFieldInfo?.location || ''} 
                        onChange={e => onUpdateGlobalFieldInfo({ ...globalFieldInfo, location: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label>Google Maps Embed URL</label>
                      <input 
                        type="text" 
                        value={globalFieldInfo?.mapUrl || ''} 
                        onChange={e => onUpdateGlobalFieldInfo({ ...globalFieldInfo, mapUrl: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label>Pitch Name</label>
                      <input 
                        type="text" 
                        value={globalFieldInfo?.pitchName || ''} 
                        onChange={e => onUpdateGlobalFieldInfo({ ...globalFieldInfo, pitchName: e.target.value })} 
                      />
                    </div>
                    <div>
                      <label>Pitch Image</label>
                      <div className="flex-gap" style={{ alignItems: 'center', marginTop: '4px' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              onUpdateGlobalFieldInfo({ ...globalFieldInfo, pitchImage: event.target.result });
                            };
                            reader.readAsDataURL(file);
                          }}
                          style={{ display: 'none' }}
                          id="pitch-image-upload"
                        />
                        <label htmlFor="pitch-image-upload" className="success-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                          <Upload size={14} /> Upload Image
                        </label>
                        {globalFieldInfo?.pitchImage && (
                          <button 
                            type="button" 
                            className="danger-btn btn-sm"
                            onClick={() => onUpdateGlobalFieldInfo({ ...globalFieldInfo, pitchImage: '' })}
                            style={{ padding: '6px 12px' }}
                          >
                            Remove Image
                          </button>
                        )}
                      </div>
                      {globalFieldInfo?.pitchImage && (
                        <div style={{ marginTop: '10px' }}>
                          <img 
                            src={globalFieldInfo.pitchImage} 
                            alt="Pitch layout/view preview" 
                            style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEAMS REGISTRATION */}
        {activeBuilderTab === 'teams' && (
          <TeamEditor 
            teams={currentEdition.teams}
            onAddTeam={(name, color) => {
              const id = 't_' + Date.now();
              const updated = [...currentEdition.teams, { id, name, logoColor: color }];
              updateCurrentEdition({ teams: updated });
            }}
            onDeleteTeam={(id) => {
              const updated = currentEdition.teams.filter(t => t.id !== id);
              updateCurrentEdition({ teams: updated });
            }}
          />
        )}

        {/* TAB 3: MATCHES SCHEDULER */}
        {activeBuilderTab === 'matches' && (
          <MatchEditor 
            matches={currentEdition.matches}
            teams={currentEdition.teams}
            scorers={currentEdition.scorers || []}
            onAddMatch={(m) => {
              const id = 'm_' + Date.now();
              const updated = [...currentEdition.matches, { ...m, id, score1: null, score2: null, status: 'scheduled' }];
              updateCurrentEdition({ matches: updated });
            }}
            onDeleteMatch={(id) => {
              const updated = currentEdition.matches.filter(m => m.id !== id);
              updateCurrentEdition({ matches: updated });
            }}
            onSaveMatch={(id, fields) => {
              const updatedMatches = currentEdition.matches.map(m => m.id === id ? { ...m, ...fields } : m);
              updateCurrentEdition({ matches: updatedMatches });
            }}
          />
        )}

        {/* TAB 4: SCORERS */}
        {activeBuilderTab === 'scorers' && (
          <ScorerEditor 
            scorers={currentEdition.scorers}
            teams={currentEdition.teams}
          />
        )}

        {/* TAB 5: BEER CONTEST */}
        {activeBuilderTab === 'beers' && (
          <div className="card text-left" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-header">
              <h3>Manage Beer Contest</h3>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th className="text-left">Team Name</th>
                      <th>Beers Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentEdition.teams.map((t) => {
                      const match = (currentEdition.drunkContest || []).find(d => d.team.toLowerCase() === t.name.toLowerCase());
                      const beersCount = match ? match.beers : 0;
                      return (
                        <tr key={t.id}>
                          <td className="text-left font-bold">{t.name}</td>
                          <td className="font-bold text-amber" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                            <input 
                              type="number" 
                              min="0"
                              value={beersCount} 
                              onChange={(e) => {
                                const amount = parseInt(e.target.value, 10) || 0;
                                const cleanedBeers = Math.max(0, amount);
                                const exists = (currentEdition.drunkContest || []).some(d => d.team.toLowerCase() === t.name.toLowerCase());
                                let updated;
                                if (exists) {
                                  updated = (currentEdition.drunkContest || []).map(d => d.team.toLowerCase() === t.name.toLowerCase() ? { ...d, beers: cleanedBeers } : d);
                                } else {
                                  updated = [...(currentEdition.drunkContest || []), { team: t.name, beers: cleanedBeers }];
                                }
                                updateCurrentEdition({ drunkContest: updated });
                              }}
                              style={{ width: '70px', padding: '4px', textAlign: 'center', fontWeight: 'bold', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                            />
                            <span>🍺</span>
                          </td>
                        </tr>
                      );
                    })}
                    {currentEdition.teams.length === 0 && (
                      <tr>
                        <td colSpan={2} className="text-center py-4 text-muted">No teams registered. Add teams under the Teams tab first.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AWARDS/TROPHIES */}
        {activeBuilderTab === 'trophies' && (
          <TrophyEditor 
            trophies={currentEdition.customTrophies}
            onAddTrophy={(name, winner, imageData) => {
              const id = 'tr_' + Date.now();
              const updated = [...(currentEdition.customTrophies || []), { id, name, winner, imageData }];
              updateCurrentEdition({ customTrophies: updated });
            }}
            onDeleteTrophy={(id) => {
              const updated = (currentEdition.customTrophies || []).filter(t => t.id !== id);
              updateCurrentEdition({ customTrophies: updated });
            }}
            onUploadImage={onUploadImage}
          />
        )}

      </div>
    </div>
  );
}

export default BuilderMain;
