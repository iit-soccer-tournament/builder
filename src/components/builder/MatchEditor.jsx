import React, { useState } from 'react';
import { Plus, Trash2, Check, X, Calendar, Trophy } from 'lucide-react';

function MatchEditor({ matches = [], teams = [], scorers = [], onAddMatch, onDeleteMatch, onSaveMatch }) {
  const [editingId, setEditingId] = useState(null);
  const [editType, setEditType] = useState(null); // 'info' or 'results'
  
  // Edit Form states
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPitch, setEditPitch] = useState('C');
  const [editRound, setEditRound] = useState('Regular Season');
  const [editTeam1, setEditTeam1] = useState('');
  const [editTeam2, setEditTeam2] = useState('');
  const [editTeam1Text, setEditTeam1Text] = useState('');
  const [editTeam2Text, setEditTeam2Text] = useState('');
  const [editStatus, setEditStatus] = useState('scheduled');
  const [editScorers1, setEditScorers1] = useState([]);
  const [editScorers2, setEditScorers2] = useState([]);
  const [newScorer1, setNewScorer1] = useState('');
  const [newScorer2, setNewScorer2] = useState('');
  const [goalsCount1, setGoalsCount1] = useState(1);
  const [goalsCount2, setGoalsCount2] = useState(1);
  const [scorerGender1, setScorerGender1] = useState('Men');
  const [scorerGender2, setScorerGender2] = useState('Men');
  
  const [newMatch, setNewMatch] = useState({
    date: '',
    time: '19:00',
    pitch: 'C',
    team1: '',
    team2: '',
    team1Text: '',
    team2Text: '',
    round: 'Regular Season'
  });

  const getTeamName = (teamId, fallback = '') => {
    const t = teams.find(x => x.id === teamId);
    return t ? t.name : fallback;
  };

  const countScorersHelper = (list) => {
    if (!list) return '';
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
      const gender = key.substring(idx + 1);
      const symbol = gender === 'Women' ? '♀' : '♂';
      return `${name} ${count > 1 ? `(${count})` : ''} ${symbol}`.trim();
    });
    return [...regularList, ...ogs].join(', ');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if ((!newMatch.team1 && !newMatch.team1Text) || (!newMatch.team2 && !newMatch.team2Text)) return;
    onAddMatch(newMatch);
    // Reset form fields
    setNewMatch({
      date: '',
      time: '19:00',
      pitch: 'C',
      team1: '',
      team2: '',
      team1Text: '',
      team2Text: '',
      round: 'Regular Season'
    });
  };

  const startEdit = (m, type) => {
    setEditingId(m.id);
    setEditType(type);
    setEditDate(m.date || '');
    setEditTime(m.time || '19:00');
    setEditPitch(m.pitch || 'C');
    setEditRound(m.round || 'Regular Season');
    setEditTeam1(m.team1 || '');
    setEditTeam2(m.team2 || '');
    setEditTeam1Text(m.team1Text || '');
    setEditTeam2Text(m.team2Text || '');
    setEditStatus(m.status || 'scheduled');
    setEditScorers1(m.scorers1 || []);
    setEditScorers2(m.scorers2 || []);
    setNewScorer1('');
    setNewScorer2('');
    setGoalsCount1(1);
    setGoalsCount2(1);
    setScorerGender1('Men');
    setScorerGender2('Men');
  };

  const saveEdit = (id) => {
    if (editType === 'info') {
      onSaveMatch(id, {
        date: editDate,
        time: editTime,
        pitch: editPitch,
        round: editRound,
        team1: editTeam1,
        team2: editTeam2,
        team1Text: editTeam1Text,
        team2Text: editTeam2Text
      });
    } else {
      const finalStatus = (editScorers1.length > 0 || editScorers2.length > 0) ? 'played' : editStatus;
      onSaveMatch(id, {
        status: finalStatus,
        score1: finalStatus === 'played' ? editScorers1.length : null,
        score2: finalStatus === 'played' ? editScorers2.length : null,
        scorers1: finalStatus === 'played' ? editScorers1 : [],
        scorers2: finalStatus === 'played' ? editScorers2 : []
      });
    }
    setEditingId(null);
    setEditType(null);
  };

  return (
    <div className="card text-left">
      <div className="card-header">
        <h3>Manage Matches &amp; Scores</h3>
      </div>
      <div className="card-body">
        {/* Add Match Form */}
        <form onSubmit={handleCreate} className="admin-form mb-4" style={{ background: '#f8fafc' }}>
          <h4>Compile Scheduled Match</h4>
          <div className="form-grid">
            <div>
              <label>Date</label>
              <input 
                type="text" 
                value={newMatch.date} 
                onChange={(e) => setNewMatch({...newMatch, date: e.target.value})} 
                placeholder="e.g. June 3, Wednesday"
                required 
              />
            </div>
            <div>
              <label>Time</label>
              <input 
                type="text" 
                value={newMatch.time} 
                onChange={(e) => setNewMatch({...newMatch, time: e.target.value})} 
                placeholder="e.g. 19:00"
                required 
              />
            </div>
            <div>
              <label>Pitch</label>
              <select value={newMatch.pitch} onChange={(e) => setNewMatch({...newMatch, pitch: e.target.value})}>
                <option value="B">Pitch B</option>
                <option value="C">Pitch C</option>
              </select>
            </div>
            <div>
              <label>Round / Stage</label>
              <select value={newMatch.round} onChange={(e) => setNewMatch({...newMatch, round: e.target.value})}>
                <option value="Regular Season">Regular Season</option>
                <option value="Playoff (Quarter)">Playoff (Quarter)</option>
                <option value="Playout (HoS)">Playout (HoS)</option>
                <option value="Semifinal">Semifinal</option>
                <option value="3rd Place Final">3rd Place Final</option>
                <option value="Hall of Shame Final">Hall of Shame Final</option>
                <option value="Championship Final">Championship Final</option>
              </select>
            </div>

            <div className="col-span-2">
              <label>Team 1 (Select standard or type placeholder)</label>
              <div className="flex-gap">
                <select 
                  value={newMatch.team1} 
                  onChange={(e) => setNewMatch({...newMatch, team1: e.target.value, team1Text: ''})}
                >
                  <option value="">-- Choose Team --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input 
                  type="text" 
                  value={newMatch.team1Text}
                  onChange={(e) => setNewMatch({...newMatch, team1Text: e.target.value, team1: ''})}
                />
              </div>
            </div>

            <div className="col-span-2">
              <label>Team 2 (Select standard or type placeholder)</label>
              <div className="flex-gap">
                <select 
                  value={newMatch.team2} 
                  onChange={(e) => setNewMatch({...newMatch, team2: e.target.value, team2Text: ''})}
                >
                  <option value="">-- Choose Team --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input 
                  type="text" 
                  value={newMatch.team2Text}
                  onChange={(e) => setNewMatch({...newMatch, team2Text: e.target.value, team2: ''})}
                />
              </div>
            </div>
          </div>
          <button type="submit" className="success-btn mt-3"><Plus size={16} /> Add Match</button>
        </form>

        {/* Matches lists */}
        <div className="table-responsive">
          <table className="standings-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Stage</th>
                <th className="text-right">Team 1</th>
                <th>Result</th>
                <th className="text-left">Team 2</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => {
                const hasScorers = m.status === 'played' && ((m.scorers1 && m.scorers1.length > 0) || (m.scorers2 && m.scorers2.length > 0));
                return (
                  <React.Fragment key={m.id}>
                    <tr>
                  {editingId === m.id ? (
                    <td colSpan={6} style={{ background: '#f8fafc', padding: '16px' }}>
                      <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-sm">
                          {editType === 'info' ? 'Edit Match Information' : 'Edit Match Results'}
                        </h4>

                        {editType === 'info' && (
                          <>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
                              <div>
                                <label className="text-xs font-bold block mb-1">Date</label>
                                <input 
                                  type="text" 
                                  value={editDate} 
                                  onChange={e => setEditDate(e.target.value)} 
                                  placeholder="Date (e.g. May 26, Tuesday)"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold block mb-1">Time</label>
                                <input 
                                  type="text" 
                                  value={editTime} 
                                  onChange={e => setEditTime(e.target.value)} 
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold block mb-1">Pitch</label>
                                <select value={editPitch} onChange={e => setEditPitch(e.target.value)}>
                                  <option value="B">Pitch B</option>
                                  <option value="C">Pitch C</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-bold block mb-1">Round</label>
                                <select value={editRound} onChange={e => setEditRound(e.target.value)}>
                                  <option value="Regular Season">Regular Season</option>
                                  <option value="Playoff (Quarter)">Playoff (Quarter)</option>
                                  <option value="Playout (HoS)">Playout (HoS)</option>
                                  <option value="Semifinal">Semifinal</option>
                                  <option value="3rd Place Final">3rd Place Final</option>
                                  <option value="Hall of Shame Final">Hall of Shame Final</option>
                                  <option value="Championship Final">Championship Final</option>
                                </select>
                              </div>
                            </div>

                            <div className="form-grid mt-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                              <div>
                                <label className="text-xs font-bold block mb-1">Team 1</label>
                                <div className="flex-gap">
                                  <select 
                                    value={editTeam1} 
                                    onChange={e => { setEditTeam1(e.target.value); setEditTeam1Text(''); }}
                                  >
                                    <option value="">-- Choose Team --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                  <input 
                                    type="text" 
                                    placeholder="Or placeholder name" 
                                    value={editTeam1Text} 
                                    onChange={e => { setEditTeam1Text(e.target.value); setEditTeam1(''); }}
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="text-xs font-bold block mb-1">Team 2</label>
                                <div className="flex-gap">
                                  <select 
                                    value={editTeam2} 
                                    onChange={e => { setEditTeam2(e.target.value); setEditTeam2Text(''); }}
                                  >
                                    <option value="">-- Choose Team --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                  </select>
                                  <input 
                                    type="text" 
                                    placeholder="Or placeholder name" 
                                    value={editTeam2Text} 
                                    onChange={e => { setEditTeam2Text(e.target.value); setEditTeam2(''); }}
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {editType === 'results' && (
                          <div className="match-scorers-logging mt-3 p-3" style={{ background: '#f1f5f9', borderRadius: '8px' }}>
                            <h5 className="text-xs font-bold mb-2 text-slate-700">⚽ Goal Scorers (Scores calculated automatically)</h5>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                              {/* Team 1 Scorers */}
                              <div>
                                <span className="text-xs font-bold text-green block mb-1">
                                  {getTeamName(editTeam1, editTeam1Text || 'Team 1')} Goals ({editScorers1.length})
                                </span>
                                <div className="space-y-1 mb-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                  {(() => {
                                    const grouped = [];
                                    editScorers1.forEach((sc) => {
                                      const isOg = typeof sc === 'object' && sc !== null && sc.isOwnGoal;
                                      const name = typeof sc === 'object' && sc !== null ? sc.name : sc;
                                      const gender = typeof sc === 'object' && sc !== null ? sc.gender || 'Men' : 'Men';
                                      const match = grouped.find(g => g.name.toLowerCase() === name.toLowerCase() && g.isOwnGoal === isOg && g.gender === gender);
                                      if (match) {
                                        match.count += 1;
                                      } else {
                                        grouped.push({ name, isOwnGoal: isOg, gender, count: 1 });
                                      }
                                    });

                                    const removeOneGoal = (name, isOg, gender = 'Men') => {
                                      const targetName = (name || '').toLowerCase();
                                      const idx = editScorers1.findIndex(item => {
                                        if (!item) return false;
                                        const itemName = (typeof item === 'object' ? item.name : item) || '';
                                        const itemIsOg = typeof item === 'object' ? !!item.isOwnGoal : false;
                                        const itemGender = typeof item === 'object' ? item.gender || 'Men' : 'Men';
                                        return itemName.toLowerCase() === targetName && itemIsOg === isOg && itemGender.toLowerCase() === gender.toLowerCase();
                                      });
                                      if (idx !== -1) {
                                        setEditScorers1(editScorers1.filter((_, i) => i !== idx));
                                      }
                                    };

                                    return grouped.map((sc, idx) => (
                                      <div key={idx} className="flex-between text-xs bg-white p-1 rounded border">
                                        <span>
                                          <strong>{sc.name}</strong>
                                          {sc.count > 1 && <span style={{ marginLeft: '4px', background: '#cbd5e1', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>x{sc.count}</span>}
                                          {sc.isOwnGoal && <strong style={{ color: '#ef4444', marginLeft: '4px' }}>(OG)</strong>}
                                          {!sc.isOwnGoal && <span style={{ color: '#64748b', marginLeft: '4px' }}>({sc.gender || 'Men'})</span>}
                                        </span>
                                        <button 
                                          type="button" 
                                          onClick={() => removeOneGoal(sc.name, sc.isOwnGoal, sc.gender || 'Men')} 
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                          title="Remove one goal"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ));
                                  })()}
                                  {editScorers1.length === 0 && <span className="text-xs text-muted">No goals logged</span>}
                                </div>
                                <div className="flex-gap" style={{ alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Scorer Name"
                                    list="registered-players-list"
                                    value={newScorer1}
                                    onChange={e => setNewScorer1(e.target.value)}
                                    style={{ padding: '4px', fontSize: '12px', flex: 1 }}
                                  />
                                  <select
                                    value={scorerGender1}
                                    onChange={e => setScorerGender1(e.target.value)}
                                    style={{ padding: '4px', fontSize: '12px', border: '1px solid rgba(21, 128, 61, 0.15)', borderRadius: '4px' }}
                                  >
                                    <option value="Men">Man</option>
                                    <option value="Women">Woman</option>
                                  </select>
                                  <input 
                                    type="number" 
                                    min="1"
                                    value={goalsCount1}
                                    onChange={e => setGoalsCount1(parseInt(e.target.value, 10) || 1)}
                                    style={{ padding: '4px', fontSize: '12px', width: '40px', textAlign: 'center', border: '1px solid rgba(21, 128, 61, 0.15)', borderRadius: '4px' }}
                                    title="Goals count"
                                  />
                                  <button 
                                    type="button" 
                                    className="success-btn btn-sm" 
                                    onClick={() => {
                                      if (newScorer1.trim()) {
                                        const count = Math.max(1, goalsCount1);
                                        const newGoals = Array(count).fill(null).map(() => ({
                                          name: newScorer1.trim(),
                                          gender: scorerGender1
                                        }));
                                        setEditScorers1([...editScorers1, ...newGoals]);
                                        setNewScorer1('');
                                        setGoalsCount1(1);
                                        setEditStatus('played');
                                      }
                                    }}
                                  >
                                    Add Goal
                                  </button>
                                  <button 
                                    type="button" 
                                    className="success-btn btn-sm" 
                                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                                    onClick={() => {
                                      const count = Math.max(1, goalsCount1);
                                      const newOGs = Array(count).fill({ name: 'Own Goal', isOwnGoal: true });
                                      setEditScorers1([...editScorers1, ...newOGs]);
                                      setGoalsCount1(1);
                                      setEditStatus('played');
                                    }}
                                  >
                                    Add OG
                                  </button>
                                </div>
                              </div>

                              {/* Team 2 Scorers */}
                              <div>
                                <span className="text-xs font-bold text-green block mb-1">
                                  {getTeamName(editTeam2, editTeam2Text || 'Team 2')} Goals ({editScorers2.length})
                                </span>
                                <div className="space-y-1 mb-2" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                  {(() => {
                                    const grouped = [];
                                    editScorers2.forEach((sc) => {
                                      const isOg = typeof sc === 'object' && sc !== null && sc.isOwnGoal;
                                      const name = typeof sc === 'object' && sc !== null ? sc.name : sc;
                                      const gender = typeof sc === 'object' && sc !== null ? sc.gender || 'Men' : 'Men';
                                      const match = grouped.find(g => g.name.toLowerCase() === name.toLowerCase() && g.isOwnGoal === isOg && g.gender === gender);
                                      if (match) {
                                        match.count += 1;
                                      } else {
                                        grouped.push({ name, isOwnGoal: isOg, gender, count: 1 });
                                      }
                                    });

                                    const removeOneGoal = (name, isOg, gender = 'Men') => {
                                      const targetName = (name || '').toLowerCase();
                                      const idx = editScorers2.findIndex(item => {
                                        if (!item) return false;
                                        const itemName = (typeof item === 'object' ? item.name : item) || '';
                                        const itemIsOg = typeof item === 'object' ? !!item.isOwnGoal : false;
                                        const itemGender = typeof item === 'object' ? item.gender || 'Men' : 'Men';
                                        return itemName.toLowerCase() === targetName && itemIsOg === isOg && itemGender.toLowerCase() === gender.toLowerCase();
                                      });
                                      if (idx !== -1) {
                                        setEditScorers2(editScorers2.filter((_, i) => i !== idx));
                                      }
                                    };

                                    return grouped.map((sc, idx) => (
                                      <div key={idx} className="flex-between text-xs bg-white p-1 rounded border">
                                        <span>
                                          <strong>{sc.name}</strong>
                                          {sc.count > 1 && <span style={{ marginLeft: '4px', background: '#cbd5e1', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>x{sc.count}</span>}
                                          {sc.isOwnGoal && <strong style={{ color: '#ef4444', marginLeft: '4px' }}>(OG)</strong>}
                                          {!sc.isOwnGoal && <span style={{ color: '#64748b', marginLeft: '4px' }}>({sc.gender || 'Men'})</span>}
                                        </span>
                                        <button 
                                          type="button" 
                                          onClick={() => removeOneGoal(sc.name, sc.isOwnGoal, sc.gender || 'Men')} 
                                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                          title="Remove one goal"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    ));
                                  })()}
                                  {editScorers2.length === 0 && <span className="text-xs text-muted">No goals logged</span>}
                                </div>
                                <div className="flex-gap" style={{ alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Scorer Name"
                                    list="registered-players-list"
                                    value={newScorer2}
                                    onChange={e => setNewScorer2(e.target.value)}
                                    style={{ padding: '4px', fontSize: '12px', flex: 1 }}
                                  />
                                  <select
                                    value={scorerGender2}
                                    onChange={e => setScorerGender2(e.target.value)}
                                    style={{ padding: '4px', fontSize: '12px', border: '1px solid rgba(21, 128, 61, 0.15)', borderRadius: '4px' }}
                                  >
                                    <option value="Men">Man</option>
                                    <option value="Women">Woman</option>
                                  </select>
                                  <input 
                                    type="number" 
                                    min="1"
                                    value={goalsCount2}
                                    onChange={e => setGoalsCount2(parseInt(e.target.value, 10) || 1)}
                                    style={{ padding: '4px', fontSize: '12px', width: '40px', textAlign: 'center', border: '1px solid rgba(21, 128, 61, 0.15)', borderRadius: '4px' }}
                                    title="Goals count"
                                  />
                                  <button 
                                    type="button" 
                                    className="success-btn btn-sm" 
                                    onClick={() => {
                                      if (newScorer2.trim()) {
                                        const count = Math.max(1, goalsCount2);
                                        const newGoals = Array(count).fill(null).map(() => ({
                                          name: newScorer2.trim(),
                                          gender: scorerGender2
                                        }));
                                        setEditScorers2([...editScorers2, ...newGoals]);
                                        setNewScorer2('');
                                        setGoalsCount2(1);
                                        setEditStatus('played');
                                      }
                                    }}
                                  >
                                    Add Goal
                                  </button>
                                  <button 
                                    type="button" 
                                    className="success-btn btn-sm" 
                                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                                    onClick={() => {
                                      const count = Math.max(1, goalsCount2);
                                      const newOGs = Array(count).fill({ name: 'Own Goal', isOwnGoal: true });
                                      setEditScorers2([...editScorers2, ...newOGs]);
                                      setGoalsCount2(1);
                                      setEditStatus('played');
                                    }}
                                  >
                                    Add OG
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex-gap mt-3 justify-end">
                          <button 
                            type="button" 
                            onClick={() => saveEdit(m.id)} 
                            className="success-btn"
                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Check size={14} /> Save Changes
                          </button>
                          <button 
                            type="button" 
                            onClick={() => { setEditingId(null); setEditType(null); }} 
                            className="danger-btn" 
                            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="text-xs">
                        <div className="font-bold">{m.date}</div>
                        <div className="text-muted">Pitch {m.pitch} • {m.time}</div>
                      </td>
                      <td className="text-xs font-bold text-green">{m.round}</td>
                      <td className="text-right font-bold">{getTeamName(m.team1, m.team1Text)}</td>
                      <td>
                        {m.status === 'played' ? (
                          <span className="score-badge">{m.score1} - {m.score2}</span>
                        ) : (
                          <span className="text-muted text-xs">vs</span>
                        )}
                      </td>
                      <td className="text-left font-bold">{getTeamName(m.team2, m.team2Text)}</td>
                      <td>
                        <div className="scorer-admin-btns" style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button 
                            onClick={() => startEdit(m, 'info')} 
                            className="plus-btn" 
                            style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'auto', height: 'auto', borderRadius: '6px' }} 
                            title="Edit scheduled info"
                          >
                            <Calendar size={12} /> Info
                          </button>
                          <button 
                            onClick={() => startEdit(m, 'results')} 
                            className="plus-btn" 
                            style={{ padding: '6px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'auto', height: 'auto', borderRadius: '6px', background: '#3b82f6', color: 'white', borderColor: '#3b82f6' }} 
                            title="Edit score & scorers"
                          >
                            <Trophy size={12} /> Result
                          </button>
                          <button 
                            onClick={() => onDeleteMatch(m.id)} 
                            className="trash-btn" 
                            style={{ width: '30px', height: '30px' }} 
                            title="Delete Match"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
                {editingId !== m.id && hasScorers && (
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={2}></td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', textAlign: 'right', fontStyle: 'italic' }}>
                      {countScorersHelper(m.scorers1 || [])}
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
                      ⚽
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: '11px', color: '#64748b', textAlign: 'left', fontStyle: 'italic' }}>
                      {countScorersHelper(m.scorers2 || [])}
                    </td>
                    <td></td>
                  </tr>
                )}
              </React.Fragment>
            )})}
              {matches.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-muted">No matches scheduled.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Suggestions datalist */}
      <datalist id="registered-players-list">
        {scorers.map(s => <option key={s.id} value={s.name} />)}
      </datalist>
    </div>
  );
}

export default MatchEditor;
