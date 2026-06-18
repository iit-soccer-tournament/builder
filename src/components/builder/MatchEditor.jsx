import React, {useState, useEffect} from 'react';
import {Plus, Trash2, Check, X, Calendar, Trophy} from 'lucide-react';
import { formatDateReadable, parseToYyyyMmDd } from '../../dateUtils';

function MatchEditor({
    year = new Date().getFullYear(),
    matches = [],
    teams = [],
    scorers = [],
    onAddMatch,
    onDeleteMatch,
    onSaveMatch,
    pitches = ['B', 'C'],
    rounds = [
        'Regular Season',
        'Playoff (Quarter)',
        'Playout (HoS)',
        'Semifinal',
        '3rd Place Final',
        'Hall of Shame Final',
        'Championship Final'
    ],
    groups = [],
    standings = []
}) {
    const getRoundName = (r) => {
        if (!r) return 'Regular Season';
        return typeof r === 'object' ? r.name : r;
    };

    const firstRoundName = rounds[0] ? getRoundName(rounds[0]) : 'Regular Season';

    const [editingId, setEditingId] = useState(null);
    const [editType, setEditType] = useState(null); // 'info' or 'results'

    // Edit Form states
    const [editDate, setEditDate] = useState('');
    const [editDateSuffix, setEditDateSuffix] = useState('');
    const [editTime, setEditTime] = useState('');
    const [editPitch, setEditPitch] = useState(pitches[0] || 'C');
    const [editRound, setEditRound] = useState(firstRoundName);
    const [editTeam1, setEditTeam1] = useState('');
    const [editTeam2, setEditTeam2] = useState('');
    const [editTeam1Text, setEditTeam1Text] = useState('');
    const [editTeam2Text, setEditTeam2Text] = useState('');
    const [editTeam1Dep, setEditTeam1Dep] = useState(null);
    const [editTeam2Dep, setEditTeam2Dep] = useState(null);
    const [editStatus, setEditStatus] = useState('scheduled');
    const [editScorers1, setEditScorers1] = useState([]);
    const [editScorers2, setEditScorers2] = useState([]);
    const [newScorer1, setNewScorer1] = useState('');
    const [newScorer2, setNewScorer2] = useState('');
    const [goalsCount1, setGoalsCount1] = useState(1);
    const [goalsCount2, setGoalsCount2] = useState(1);
    const [scorerGender1, setScorerGender1] = useState('Men');
    const [scorerGender2, setScorerGender2] = useState('Men');

    const getMatchIdentifier = (m) => {
        if (!m || !m.round) return '';
        const matchesInRound = (matches || [])
            .filter(x => x.round === m.round)
            .sort((a, b) => a.id.localeCompare(b.id));
        if (matchesInRound.length <= 1) {
            return m.round;
        }
        const idx = matchesInRound.findIndex(x => x.id === m.id);
        return `${m.round} #${idx + 1}`;
    };

    const parseQuickOriginValue = (val) => {
        if (!val) return { text: '', dep: null };
        if (val.startsWith('winner:') || val.startsWith('loser:')) {
            const type = val.startsWith('winner:') ? 'match_winner' : 'match_loser';
            const matchId = val.split(':')[1];
            const parentMatch = matches.find(m => m.id === matchId);
            const name = parentMatch ? getMatchIdentifier(parentMatch) : 'Match';
            const label = val.startsWith('winner:') ? `Winner of ${name}` : `Loser of ${name}`;
            return { text: label, dep: { type, matchId } };
        }
        if (val.startsWith('regular_season_rank:')) {
            const rank = parseInt(val.split(':')[1], 10);
            const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
            return { text: `${rank}${suffix} in Regular Season`, dep: { type: 'regular_season_rank', rank } };
        }
        if (val.startsWith('group_rank:')) {
            const parts = val.split(':');
            const groupId = parts[1];
            const rank = parseInt(parts[2], 10);
            const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th';
            return { text: `${rank}${suffix} in Group ${groupId}`, dep: { type: 'group_rank', groupId, rank } };
        }
        return { text: val, dep: null };
    };
    const resolveTeamPlaceholder = (text, dep) => {
        // Helper to check if all group stage matches (regular season/group rounds) are played
        const isGroupCompleted = (groupId = null) => {
            const groupMatches = (matches || []).filter(m => {
                const rObj = (rounds || []).find(r => (typeof r === 'object' ? r.name : r) === m.round);
                const isGroup = rObj ? rObj.type === 'group' : (m.round === 'Regular Season' || m.round.startsWith('Round '));
                if (!isGroup) return false;
                if (groupId) {
                    const groupLetter = groupId.trim().toLowerCase();
                    const t1Obj = teams.find(t => t.id === m.team1);
                    const t2Obj = teams.find(t => t.id === m.team2);
                    const t1Group = t1Obj && t1Obj.group ? t1Obj.group.trim().toLowerCase() : '';
                    const t2Group = t2Obj && t2Obj.group ? t2Obj.group.trim().toLowerCase() : '';
                    return t1Group === groupLetter || t2Group === groupLetter;
                }
                return true;
            });
            return groupMatches.length > 0 && groupMatches.every(m => m.status === 'played');
        };

        // 1. Resolve structured dependency if present
        if (dep && typeof dep === 'object') {
            if (dep.type === 'regular_season_rank') {
                const rank = dep.rank;
                if (isGroupCompleted() && standings && standings[rank - 1]) {
                    return standings[rank - 1];
                }
            }
            if (dep.type === 'group_rank') {
                const rank = dep.rank;
                const groupLetter = (dep.groupId || '').trim().toLowerCase();
                if (isGroupCompleted(groupLetter)) {
                    const groupTeams = standings.filter(t => t.group && t.group.trim().toLowerCase() === groupLetter);
                    if (groupTeams[rank - 1]) {
                        return groupTeams[rank - 1];
                    }
                }
            }
            if (dep.type === 'match_winner' || dep.type === 'match_loser') {
                const isWinnerSearch = dep.type === 'match_winner';
                const foundMatch = (matches || []).find(m => m.id === dep.matchId);
                if (foundMatch && foundMatch.status === 'played') {
                    const s1 = parseInt(foundMatch.score1, 10);
                    const s2 = parseInt(foundMatch.score2, 10);
                    const t1 = foundMatch.team1;
                    const t2 = foundMatch.team2;
                    const t1Text = foundMatch.team1Text;
                    const t2Text = foundMatch.team2Text;
                    const t1Dep = foundMatch.team1Dep;
                    const t2Dep = foundMatch.team2Dep;

                    let winnerId = null;
                    let winnerText = null;
                    let winnerDep = null;
                    let loserId = null;
                    let loserText = null;
                    let loserDep = null;

                    if (s1 > s2) {
                        winnerId = t1; winnerText = t1Text; winnerDep = t1Dep;
                        loserId = t2; loserText = t2Text; loserDep = t2Dep;
                    } else {
                        winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
                        loserId = t1; loserText = t1Text; loserDep = t1Dep;
                    }

                    const resolvedId = isWinnerSearch ? winnerId : loserId;
                    const resolvedText = isWinnerSearch ? winnerText : loserText;
                    const resolvedDep = isWinnerSearch ? winnerDep : loserDep;

                    if (resolvedId) {
                        const tObj = teams.find(t => t.id === resolvedId);
                        if (tObj) return tObj;
                    }
                    if (resolvedText || resolvedDep) {
                        return resolveTeamPlaceholder(resolvedText, resolvedDep) || { name: resolvedText, id: null, logoColor: '#718096' };
                    }
                }
            }
        }

        // 2. Fallback to existing text parsing
        if (!text) return null;
        const cleanText = text.trim();
        const lower = cleanText.toLowerCase();

        const standingsRankRegex = /^(\d+)(?:st|nd|rd|th)\s+in\s+group\s+(.+)$/i;
        const regularRankRegex = /^(\d+)(?:st|nd|rd|th)\s+in\s+regular\s+season$/i;

        const matchGroup = cleanText.match(standingsRankRegex);
        if (matchGroup) {
            const rank = parseInt(matchGroup[1], 10);
            const groupLetter = matchGroup[2].trim().toLowerCase();
            if (isGroupCompleted(groupLetter)) {
                const groupTeams = standings.filter(t => t.group && t.group.trim().toLowerCase() === groupLetter);
                if (groupTeams[rank - 1]) {
                    return groupTeams[rank - 1];
                }
            }
        }

        const matchRegular = cleanText.match(regularRankRegex);
        if (matchRegular) {
            const rank = parseInt(matchRegular[1], 10);
            if (isGroupCompleted() && standings[rank - 1]) {
                return standings[rank - 1];
            }
        }

        if (lower.startsWith('winner of ') || lower.startsWith('loser of ')) {
            const isWinnerSearch = lower.startsWith('winner of ');
            const targetMatchId = lower.replace('winner of ', '').replace('loser of ', '').trim();
            
            const foundMatch = (matches || []).find(m => getMatchIdentifier(m) === targetMatchId);
            if (foundMatch && foundMatch.status === 'played') {
                const s1 = parseInt(foundMatch.score1, 10);
                const s2 = parseInt(foundMatch.score2, 10);
                const t1 = foundMatch.team1;
                const t2 = foundMatch.team2;
                const t1Text = foundMatch.team1Text;
                const t2Text = foundMatch.team2Text;
                const t1Dep = foundMatch.team1Dep;
                const t2Dep = foundMatch.team2Dep;

                let winnerId = null;
                let winnerText = null;
                let winnerDep = null;
                let loserId = null;
                let loserText = null;
                let loserDep = null;

                if (s1 > s2) {
                    winnerId = t1; winnerText = t1Text; winnerDep = t1Dep;
                    loserId = t2; loserText = t2Text; loserDep = t2Dep;
                } else {
                    winnerId = t2; winnerText = t2Text; winnerDep = t2Dep;
                    loserId = t1; loserText = t1Text; loserDep = t1Dep;
                }

                const resolvedId = isWinnerSearch ? winnerId : loserId;
                const resolvedText = isWinnerSearch ? winnerText : loserText;
                const resolvedDep = isWinnerSearch ? winnerDep : loserDep;

                if (resolvedId) {
                    const tObj = teams.find(t => t.id === resolvedId);
                    if (tObj) return tObj;
                }
                if (resolvedText || resolvedDep) {
                    return resolveTeamPlaceholder(resolvedText, resolvedDep) || { name: resolvedText, id: null, logoColor: '#718096' };
                }
            }
        }

        return null;
    };

    const getResolvedTeamInfo = (teamId, text, dep) => {
        if (teamId) {
            const teamObj = teams.find(t => t.id === teamId);
            if (teamObj) return { name: teamObj.name, color: teamObj.logoColor, id: teamObj.id };
        }
        if (text || dep) {
            const resolved = resolveTeamPlaceholder(text, dep);
            if (resolved) {
                return { name: resolved.name, color: resolved.logoColor, id: resolved.id };
            }
            return { name: text || 'TBD', color: '#718096', id: null };
        }
        return { name: 'TBD', color: '#718096', id: null };
    };

    const getMatchDisplayTeamName = (teamId, text, dep) => {
        const resolved = getResolvedTeamInfo(teamId, text, dep);
        if (teamId) {
            return resolved.name;
        }
        if (text) {
            if (resolved.name !== text) {
                return `${resolved.name} (${text})`;
            }
            return text;
        }
        return 'TBD';
    };


    const [newMatch, setNewMatch] = useState({
        date: '',
        dateSuffix: '',
        time: '19:00',
        pitch: pitches[0] || 'C',
        team1: '',
        team2: '',
        team1Text: '',
        team2Text: '',
        team1Dep: null,
        team2Dep: null,
        round: firstRoundName
    });

    useEffect(() => {
        const roundNames = rounds.map(r => typeof r === 'object' && r !== null ? r.name : r);
        setNewMatch(prev => ({
            ...prev,
            pitch: pitches.includes(prev.pitch) ? prev.pitch : (pitches[0] || 'C'),
            round: roundNames.includes(prev.round) ? prev.round : (roundNames[0] || 'Regular Season')
        }));
    }, [pitches, rounds]);

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
            const name = typeof item === 'object' ? item.name : item;
            const isOg = typeof item === 'object' ? !!item.isOwnGoal : false;
            const gender = typeof item === 'object' ? item.gender || 'Men' : 'Men';
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
        const parsedDate = parseToYyyyMmDd(newMatch.date, year);
        onAddMatch({
            ...newMatch,
            date: parsedDate
        });
        // Reset form fields
        setNewMatch({
            date: '',
            dateSuffix: '',
            time: '19:00',
            pitch: pitches[0] || 'C',
            team1: '',
            team2: '',
            team1Text: '',
            team2Text: '',
            team1Dep: null,
            team2Dep: null,
            round: rounds[0] || 'Regular Season'
        });
    };

    const startEdit = (m, type) => {
        setEditingId(m.id);
        setEditType(type);
        setEditDate(m.date || '');
        setEditDateSuffix(m.dateSuffix || '');
        setEditTime(m.time || '19:00');
        setEditPitch(m.pitch || pitches[0] || 'C');
        setEditRound(m.round || rounds[0] || 'Regular Season');
        setEditTeam1(m.team1 || '');
        setEditTeam2(m.team2 || '');
        setEditTeam1Text(m.team1Text || '');
        setEditTeam2Text(m.team2Text || '');
        setEditTeam1Dep(m.team1Dep || null);
        setEditTeam2Dep(m.team2Dep || null);
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

    const removeOneGoal = (editScorers, setEditScorers, name, isOg) => {
        const idx = editScorers.findIndex(item => {
            if (typeof item !== 'object') return false;
            return item.name === name || (typeof isOg == "boolean" && item.isOwnGoal === isOg);
        });
        if (idx !== -1) {
            setEditScorers(editScorers.filter((_, i) => i !== idx));
        }
    }

    const removeOneGoalTeam1 = (name, isOg) => {
        removeOneGoal(editScorers1, setEditScorers1, name, isOg);
    };

    const removeOneGoalTeam2 = (name, isOg) => {
        removeOneGoal(editScorers2, setEditScorers2, name, isOg);
    };

    const saveEdit = (id) => {
        if (editType === 'info') {
            const parsedDate = parseToYyyyMmDd(editDate, year);
            onSaveMatch(id, {
                date: parsedDate,
                dateSuffix: editDateSuffix,
                time: editTime,
                pitch: editPitch,
                round: editRound,
                team1: editTeam1,
                team2: editTeam2,
                team1Text: editTeam1Text,
                team2Text: editTeam2Text,
                team1Dep: editTeam1Dep,
                team2Dep: editTeam2Dep
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
                <form onSubmit={handleCreate} className="admin-form mb-4" style={{background: '#f8fafc'}}>
                    <h4>Compile Scheduled Match</h4>
                    <div className="form-grid">
                        <div>
                            <label>Date</label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                    type="text"
                                    value={newMatch.date}
                                    onChange={(e) => setNewMatch({...newMatch, date: e.target.value})}
                                    placeholder="e.g. 2026-06-03 or June 3"
                                    required
                                    style={{ flex: 1 }}
                                />
                                <input
                                    type="date"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setNewMatch({...newMatch, date: e.target.value});
                                        }
                                    }}
                                    style={{ width: '38px', padding: '0', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                    title="Optional datepicker selector"
                                />
                            </div>
                        </div>
                        <div>
                            <label>Date Suffix (Optional)</label>
                            <input
                                type="text"
                                value={newMatch.dateSuffix || ''}
                                onChange={(e) => setNewMatch({...newMatch, dateSuffix: e.target.value})}
                                placeholder="e.g. Finals, Playout"
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
                            <select value={newMatch.pitch}
                                    onChange={(e) => setNewMatch({...newMatch, pitch: e.target.value})}>
                                {pitches.map((p, idx) => (
                                    <option key={idx} value={p}>Pitch {p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label>Round / Stage</label>
                            <select value={newMatch.round}
                                    onChange={(e) => setNewMatch({...newMatch, round: e.target.value})}>
                                {rounds.map((r, idx) => {
                                    const name = typeof r === 'object' ? r.name : r;
                                    return <option key={idx} value={name}>{name}</option>;
                                })}
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label>Team 1 (Select standard or choose origin placeholder)</label>
                            <div className="flex-gap" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <select
                                    value={newMatch.team1}
                                    onChange={(e) => setNewMatch({...newMatch, team1: e.target.value, team1Text: '', team1Dep: null})}
                                    disabled={!!newMatch.team1Dep}
                                    style={{ flex: 1, minWidth: '140px' }}
                                >
                                    <option value="">-- Choose Team --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                {newMatch.team1Dep ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 12px',
                                        background: '#dcfce7',
                                        border: '1px solid #86efac',
                                        borderRadius: '6px',
                                        color: '#166534',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        flex: 1,
                                        minWidth: '180px'
                                    }}>
                                        <span>{newMatch.team1Text}</span>
                                        <button
                                            type="button"
                                            onClick={() => setNewMatch({...newMatch, team1Dep: null, team1Text: ''})}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#15803d',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                marginLeft: 'auto',
                                                padding: '0 4px'
                                            }}
                                            title="Clear origin dependency"
                                        >
                                            ✕ Clear
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={newMatch.team1Text}
                                        onChange={(e) => setNewMatch({...newMatch, team1Text: e.target.value, team1Dep: null, team1: ''})}
                                        placeholder="Type custom origin (e.g. Winner of QF1)"
                                        style={{ flex: 1, minWidth: '180px' }}
                                    />
                                )}
                                {(() => {
                                    const selectedNewRoundObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === newMatch.round) || { type: 'group' };
                                    if (selectedNewRoundObj.type === 'knockout') {
                                        return (
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const { text, dep } = parseQuickOriginValue(e.target.value);
                                                        setNewMatch({...newMatch, team1Text: text, team1Dep: dep, team1: ''});
                                                    }
                                                }}
                                                style={{ flex: 1, minWidth: '160px', background: '#f0fdf4', border: '1.5px solid #22c55e' }}
                                            >
                                                <option value="">-- Quick Origin 1 --</option>
                                                <optgroup label="Standings Rank">
                                                    {teams.map((_, index) => {
                                                        const pos = index + 1;
                                                        return (
                                                            <option key={pos} value={`regular_season_rank:${pos}`}>
                                                                {pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`} in Regular Season
                                                            </option>
                                                        );
                                                    })}
                                                </optgroup>
                                                {groups.length > 0 && (
                                                    <optgroup label="Group Standings Rank">
                                                        {groups.flatMap(g => [
                                                            <option key={`1st-${g}`} value={`group_rank:${g}:1`}>1st in Group {g}</option>,
                                                            <option key={`2nd-${g}`} value={`group_rank:${g}:2`}>2nd in Group {g}</option>,
                                                            <option key={`3rd-${g}`} value={`group_rank:${g}:3`}>3rd in Group {g}</option>,
                                                            <option key={`4th-${g}`} value={`group_rank:${g}:4`}>4th in Group {g}</option>
                                                        ])}
                                                    </optgroup>
                                                )}
                                                <optgroup label="Match Winners / Losers">
                                                    {matches
                                                        .filter(m => {
                                                            const rObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === m.round);
                                                            return rObj && rObj.type === 'knockout';
                                                        })
                                                        .map(m => {
                                                            const name = getMatchIdentifier(m);
                                                            return (
                                                                <React.Fragment key={m.id}>
                                                                    <option value={`winner:${m.id}`}>Winner of {name}</option>
                                                                    <option value={`loser:${m.id}`}>Loser of {name}</option>
                                                                </React.Fragment>
                                                            );
                                                        })
                                                    }
                                                </optgroup>
                                            </select>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label>Team 2 (Select standard or choose origin placeholder)</label>
                            <div className="flex-gap" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <select
                                    value={newMatch.team2}
                                    onChange={(e) => setNewMatch({...newMatch, team2: e.target.value, team2Text: '', team2Dep: null})}
                                    disabled={!!newMatch.team2Dep}
                                    style={{ flex: 1, minWidth: '140px' }}
                                >
                                    <option value="">-- Choose Team --</option>
                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                {newMatch.team2Dep ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 12px',
                                        background: '#dcfce7',
                                        border: '1px solid #86efac',
                                        borderRadius: '6px',
                                        color: '#166534',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        flex: 1,
                                        minWidth: '180px'
                                    }}>
                                        <span>{newMatch.team2Text}</span>
                                        <button
                                            type="button"
                                            onClick={() => setNewMatch({...newMatch, team2Dep: null, team2Text: ''})}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#15803d',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                marginLeft: 'auto',
                                                padding: '0 4px'
                                            }}
                                            title="Clear origin dependency"
                                        >
                                            ✕ Clear
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        value={newMatch.team2Text}
                                        onChange={(e) => setNewMatch({...newMatch, team2Text: e.target.value, team2Dep: null, team2: ''})}
                                        placeholder="Type custom origin (e.g. Winner of QF2)"
                                        style={{ flex: 1, minWidth: '180px' }}
                                    />
                                )}
                                {(() => {
                                    const selectedNewRoundObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === newMatch.round) || { type: 'group' };
                                    if (selectedNewRoundObj.type === 'knockout') {
                                        return (
                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        const { text, dep } = parseQuickOriginValue(e.target.value);
                                                        setNewMatch({...newMatch, team2Text: text, team2Dep: dep, team2: ''});
                                                    }
                                                }}
                                                style={{ flex: 1, minWidth: '160px', background: '#f0fdf4', border: '1.5px solid #22c55e' }}
                                            >
                                                <option value="">-- Quick Origin 2 --</option>
                                                <optgroup label="Standings Rank">
                                                    {teams.map((_, index) => {
                                                        const pos = index + 1;
                                                        return (
                                                            <option key={pos} value={`regular_season_rank:${pos}`}>
                                                                {pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`} in Regular Season
                                                            </option>
                                                        );
                                                    })}
                                                </optgroup>
                                                {groups.length > 0 && (
                                                    <optgroup label="Group Standings Rank">
                                                        {groups.flatMap(g => [
                                                            <option key={`1st-${g}`} value={`group_rank:${g}:1`}>1st in Group {g}</option>,
                                                            <option key={`2nd-${g}`} value={`group_rank:${g}:2`}>2nd in Group {g}</option>,
                                                            <option key={`3rd-${g}`} value={`group_rank:${g}:3`}>3rd in Group {g}</option>,
                                                            <option key={`4th-${g}`} value={`group_rank:${g}:4`}>4th in Group {g}</option>
                                                        ])}
                                                    </optgroup>
                                                )}
                                                <optgroup label="Match Winners / Losers">
                                                    {matches
                                                        .filter(m => {
                                                            const rObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === m.round);
                                                            return rObj && rObj.type === 'knockout';
                                                        })
                                                        .map(m => {
                                                            const name = getMatchIdentifier(m);
                                                            return (
                                                                <React.Fragment key={m.id}>
                                                                    <option value={`winner:${m.id}`}>Winner of {name}</option>
                                                                    <option value={`loser:${m.id}`}>Loser of {name}</option>
                                                                </React.Fragment>
                                                            );
                                                        })
                                                    }
                                                </optgroup>
                                            </select>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="success-btn mt-3"><Plus size={16}/> Add Match</button>
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
                                            <td colSpan={6} style={{background: '#f8fafc', padding: '16px'}}>
                                                <div className="space-y-4">
                                                    <h4 className="font-bold text-slate-800 text-sm">
                                                        {editType === 'info' ? 'Edit Match Information' : 'Edit Match Results'}
                                                    </h4>

                                                    {editType === 'info' && (
                                                        <>
                                                            <div className="form-grid" style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                                                gap: '12px'
                                                            }}>
                                                                <div>
                                                                    <label
                                                                        className="text-xs font-bold block mb-1">Date</label>
                                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                                        <input
                                                                            type="text"
                                                                            value={editDate}
                                                                            onChange={e => setEditDate(e.target.value)}
                                                                            placeholder="Date (e.g. 2026-05-26)"
                                                                            style={{ flex: 1 }}
                                                                        />
                                                                        <input
                                                                            type="date"
                                                                            onChange={e => {
                                                                                if (e.target.value) {
                                                                                    setEditDate(e.target.value);
                                                                                }
                                                                            }}
                                                                            style={{ width: '38px', padding: '0', cursor: 'pointer', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                                                                            title="Optional datepicker selector"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        className="text-xs font-bold block mb-1">Date Suffix (Optional)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editDateSuffix}
                                                                        onChange={e => setEditDateSuffix(e.target.value)}
                                                                        placeholder="e.g. Finals"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        className="text-xs font-bold block mb-1">Time</label>
                                                                    <input
                                                                        type="text"
                                                                        value={editTime}
                                                                        onChange={e => setEditTime(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        className="text-xs font-bold block mb-1">Pitch</label>
                                                                    <select value={editPitch}
                                                                            onChange={e => setEditPitch(e.target.value)}>
                                                                        {pitches.map((p, idx) => (
                                                                            <option key={idx} value={p}>Pitch {p}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label
                                                                        className="text-xs font-bold block mb-1">Round</label>
                                                                    <select value={editRound}
                                                                            onChange={e => setEditRound(e.target.value)}>
                                                                        {rounds.map((r, idx) => {
                                                                            const name = typeof r === 'object' ? r.name : r;
                                                                            return <option key={idx} value={name}>{name}</option>;
                                                                        })}
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="form-grid mt-3" style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr',
                                                                gap: '16px'
                                                            }}>
                                                                <div>
                                                                    <label className="text-xs font-bold block mb-1">Team 1</label>
                                                                    <div className="flex-gap" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                        <select
                                                                            value={editTeam1}
                                                                            onChange={e => {
                                                                                setEditTeam1(e.target.value);
                                                                                setEditTeam1Text('');
                                                                                setEditTeam1Dep(null);
                                                                            }}
                                                                            disabled={!!editTeam1Dep}
                                                                            style={{ flex: 1, minWidth: '120px' }}
                                                                        >
                                                                            <option value="">-- Choose Team --</option>
                                                                            {teams.map(t => <option key={t.id}
                                                                                                    value={t.id}>{t.name}</option>)}
                                                                        </select>
                                                                        {editTeam1Dep ? (
                                                                            <div style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px',
                                                                                padding: '4px 12px',
                                                                                background: '#dcfce7',
                                                                                border: '1px solid #86efac',
                                                                                borderRadius: '6px',
                                                                                color: '#166534',
                                                                                fontSize: '14px',
                                                                                fontWeight: '500',
                                                                                flex: 1,
                                                                                minWidth: '150px'
                                                                            }}>
                                                                                <span>{editTeam1Text}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setEditTeam1Dep(null);
                                                                                        setEditTeam1Text('');
                                                                                    }}
                                                                                    style={{
                                                                                        background: 'none',
                                                                                        border: 'none',
                                                                                        color: '#15803d',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 'bold',
                                                                                        marginLeft: 'auto',
                                                                                        padding: '0 4px'
                                                                                    }}
                                                                                    title="Clear origin dependency"
                                                                                >
                                                                                    ✕ Clear
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Or placeholder name"
                                                                                value={editTeam1Text}
                                                                                onChange={e => {
                                                                                    setEditTeam1Text(e.target.value);
                                                                                    setEditTeam1Dep(null);
                                                                                    setEditTeam1('');
                                                                                }}
                                                                                style={{ flex: 1, minWidth: '150px' }}
                                                                            />
                                                                        )}
                                                                        {(() => {
                                                                            const selectedEditRoundObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === editRound) || { type: 'group' };
                                                                            if (selectedEditRoundObj.type === 'knockout') {
                                                                                return (
                                                                                    <select
                                                                                        value=""
                                                                                        onChange={e => {
                                                                                            if (e.target.value) {
                                                                                                const { text, dep } = parseQuickOriginValue(e.target.value);
                                                                                                setEditTeam1Text(text);
                                                                                                setEditTeam1Dep(dep);
                                                                                                setEditTeam1('');
                                                                                            }
                                                                                        }}
                                                                                        style={{ flex: 1, minWidth: '140px', background: '#f0fdf4', border: '1.5px solid #22c55e' }}
                                                                                    >
                                                                                        <option value="">-- Quick Origin --</option>
                                                                                        <optgroup label="Standings Rank">
                                                                                            {teams.map((_, index) => {
                                                                                                const pos = index + 1;
                                                                                                return (
                                                                                                    <option key={pos} value={`regular_season_rank:${pos}`}>
                                                                                                        {pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`} in Regular Season
                                                                                                    </option>
                                                                                                );
                                                                                            })}
                                                                                        </optgroup>
                                                                                        {groups.length > 0 && (
                                                                                            <optgroup label="Group Standings Rank">
                                                                                                {groups.flatMap(g => [
                                                                                                    <option key={`1st-${g}`} value={`group_rank:${g}:1`}>1st in Group {g}</option>,
                                                                                                    <option key={`2nd-${g}`} value={`group_rank:${g}:2`}>2nd in Group {g}</option>,
                                                                                                    <option key={`3rd-${g}`} value={`group_rank:${g}:3`}>3rd in Group {g}</option>,
                                                                                                    <option key={`4th-${g}`} value={`group_rank:${g}:4`}>4th in Group {g}</option>
                                                                                                ])}
                                                                                            </optgroup>
                                                                                        )}
                                                                                        <optgroup label="Match Winners / Losers">
                                                                                            {matches
                                                                                                .filter(matchItem => {
                                                                                                    const rObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === matchItem.round);
                                                                                                    return rObj && rObj.type === 'knockout' && matchItem.id !== editingId;
                                                                                                })
                                                                                                .map(matchItem => {
                                                                                                    const name = getMatchIdentifier(matchItem);
                                                                                                    return (
                                                                                                        <React.Fragment key={matchItem.id}>
                                                                                                            <option value={`winner:${matchItem.id}`}>Winner of {name}</option>
                                                                                                            <option value={`loser:${matchItem.id}`}>Loser of {name}</option>
                                                                                                        </React.Fragment>
                                                                                                    );
                                                                                                })
                                                                                            }
                                                                                        </optgroup>
                                                                                    </select>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-xs font-bold block mb-1">Team 2</label>
                                                                    <div className="flex-gap" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                                        <select
                                                                            value={editTeam2}
                                                                            onChange={e => {
                                                                                setEditTeam2(e.target.value);
                                                                                setEditTeam2Text('');
                                                                                setEditTeam2Dep(null);
                                                                            }}
                                                                            disabled={!!editTeam2Dep}
                                                                            style={{ flex: 1, minWidth: '120px' }}
                                                                        >
                                                                            <option value="">-- Choose Team --</option>
                                                                            {teams.map(t => <option key={t.id}
                                                                                                    value={t.id}>{t.name}</option>)}
                                                                        </select>
                                                                        {editTeam2Dep ? (
                                                                            <div style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px',
                                                                                padding: '4px 12px',
                                                                                background: '#dcfce7',
                                                                                border: '1px solid #86efac',
                                                                                borderRadius: '6px',
                                                                                color: '#166534',
                                                                                fontSize: '14px',
                                                                                fontWeight: '500',
                                                                                flex: 1,
                                                                                minWidth: '150px'
                                                                            }}>
                                                                                <span>{editTeam2Text}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setEditTeam2Dep(null);
                                                                                        setEditTeam2Text('');
                                                                                    }}
                                                                                    style={{
                                                                                        background: 'none',
                                                                                        border: 'none',
                                                                                        color: '#15803d',
                                                                                        cursor: 'pointer',
                                                                                        fontWeight: 'bold',
                                                                                        marginLeft: 'auto',
                                                                                        padding: '0 4px'
                                                                                    }}
                                                                                    title="Clear origin dependency"
                                                                                >
                                                                                    ✕ Clear
                                                                                </button>
                                                                            </div>
                                                                        ) : (
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Or placeholder name"
                                                                                value={editTeam2Text}
                                                                                onChange={e => {
                                                                                    setEditTeam2Text(e.target.value);
                                                                                    setEditTeam2Dep(null);
                                                                                    setEditTeam2('');
                                                                                }}
                                                                                style={{ flex: 1, minWidth: '150px' }}
                                                                            />
                                                                        )}
                                                                        {(() => {
                                                                            const selectedEditRoundObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === editRound) || { type: 'group' };
                                                                            if (selectedEditRoundObj.type === 'knockout') {
                                                                                return (
                                                                                    <select
                                                                                        value=""
                                                                                        onChange={e => {
                                                                                            if (e.target.value) {
                                                                                                const { text, dep } = parseQuickOriginValue(e.target.value);
                                                                                                setEditTeam2Text(text);
                                                                                                setEditTeam2Dep(dep);
                                                                                                setEditTeam2('');
                                                                                            }
                                                                                        }}
                                                                                        style={{ flex: 1, minWidth: '140px', background: '#f0fdf4', border: '1.5px solid #22c55e' }}
                                                                                    >
                                                                                        <option value="">-- Quick Origin --</option>
                                                                                        <optgroup label="Standings Rank">
                                                                                            {teams.map((_, index) => {
                                                                                                const pos = index + 1;
                                                                                                return (
                                                                                                    <option key={pos} value={`regular_season_rank:${pos}`}>
                                                                                                        {pos === 1 ? '1st' : pos === 2 ? '2nd' : pos === 3 ? '3rd' : `${pos}th`} in Regular Season
                                                                                                    </option>
                                                                                                );
                                                                                            })}
                                                                                        </optgroup>
                                                                                        {groups.length > 0 && (
                                                                                            <optgroup label="Group Standings Rank">
                                                                                                {groups.flatMap(g => [
                                                                                                    <option key={`1st-${g}`} value={`group_rank:${g}:1`}>1st in Group {g}</option>,
                                                                                                    <option key={`2nd-${g}`} value={`group_rank:${g}:2`}>2nd in Group {g}</option>,
                                                                                                    <option key={`3rd-${g}`} value={`group_rank:${g}:3`}>3rd in Group {g}</option>,
                                                                                                    <option key={`4th-${g}`} value={`group_rank:${g}:4`}>4th in Group {g}</option>
                                                                                                ])}
                                                                                            </optgroup>
                                                                                        )}
                                                                                        <optgroup label="Match Winners / Losers">
                                                                                            {matches
                                                                                                .filter(matchItem => {
                                                                                                    const rObj = rounds.find(r => (typeof r === 'object' ? r.name : r) === matchItem.round);
                                                                                                    return rObj && rObj.type === 'knockout' && matchItem.id !== editingId;
                                                                                                })
                                                                                                .map(matchItem => {
                                                                                                    const name = getMatchIdentifier(matchItem);
                                                                                                    return (
                                                                                                        <React.Fragment key={matchItem.id}>
                                                                                                            <option value={`winner:${matchItem.id}`}>Winner of {name}</option>
                                                                                                            <option value={`loser:${matchItem.id}`}>Loser of {name}</option>
                                                                                                        </React.Fragment>
                                                                                                    );
                                                                                                })
                                                                                            }
                                                                                        </optgroup>
                                                                                    </select>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}

                                                    {editType === 'results' && (
                                                        <div className="match-scorers-logging mt-3 p-3"
                                                             style={{background: '#f1f5f9', borderRadius: '8px'}}>
                                                            <h5 className="text-xs font-bold mb-2 text-slate-700">⚽ Goal
                                                                Scorers (Scores calculated automatically)</h5>

                                                            <div style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '1fr 1fr',
                                                                gap: '20px'
                                                            }}>
                                                                {/* Team 1 Scorers */}
                                                                <div>
                                <span className="text-xs font-bold text-green block mb-1">
                                  {getMatchDisplayTeamName(editTeam1, editTeam1Text, editTeam1Dep)} Goals ({editScorers1.length})
                                </span>
                                                                    <div className="flex-gap mb-2"
                                                                         style={{alignItems: 'center'}}>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Scorer Name"
                                                                            list="registered-players-list-team1"
                                                                            value={newScorer1}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                setNewScorer1(val);
                                                                                const matchedPlayer = scorers.find(s => s.name && s.name.trim().toLowerCase() === val.trim().toLowerCase());
                                                                                if (matchedPlayer && matchedPlayer.gender) {
                                                                                    setScorerGender1(matchedPlayer.gender);
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                padding: '4px',
                                                                                fontSize: '12px',
                                                                                flex: 1
                                                                            }}
                                                                        />
                                                                        <select
                                                                            value={scorerGender1}
                                                                            onChange={e => setScorerGender1(e.target.value)}
                                                                            style={{
                                                                                padding: '4px',
                                                                                fontSize: '12px',
                                                                                border: '1px solid rgba(21, 128, 61, 0.15)',
                                                                                borderRadius: '4px'
                                                                            }}
                                                                        >
                                                                            <option value="Men">Man</option>
                                                                            <option value="Women">Woman</option>
                                                                        </select>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={goalsCount1}
                                                                            onChange={e => setGoalsCount1(parseInt(e.target.value, 10) || 1)}
                                                                            style={{
                                                                                padding: '4px',
                                                                                fontSize: '12px',
                                                                                width: '40px',
                                                                                textAlign: 'center',
                                                                                border: '1px solid rgba(21, 128, 61, 0.15)',
                                                                                borderRadius: '4px'
                                                                            }}
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
                                                                                    setScorerGender1('Men');
                                                                                    setEditStatus('played');
                                                                                }
                                                                            }}
                                                                        >
                                                                            Add Goal
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="success-btn btn-sm"
                                                                            style={{
                                                                                background: '#ef4444',
                                                                                borderColor: '#ef4444'
                                                                            }}
                                                                            onClick={() => {
                                                                                const count = Math.max(1, goalsCount1);
                                                                                const newOGs = Array(count).fill({
                                                                                    name: 'Own Goal',
                                                                                    isOwnGoal: true
                                                                                });
                                                                                setEditScorers1([...editScorers1, ...newOGs]);
                                                                                setGoalsCount1(1);
                                                                                setEditStatus('played');
                                                                            }}
                                                                        >
                                                                            Add OG
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-1 mb-2" style={{
                                                                        maxHeight: '120px',
                                                                        overflowY: 'auto'
                                                                    }}>
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
                                                                                    grouped.push({
                                                                                        name,
                                                                                        isOwnGoal: isOg,
                                                                                        gender,
                                                                                        count: 1
                                                                                    });
                                                                                }
                                                                            });

                                                                            return grouped.map((sc, idx) => (
                                                                                <div key={idx}
                                                                                     className="flex-between text-xs bg-white p-1 rounded border">
                                        <span>
                                          <strong>{sc.name}</strong>
                                            {sc.count > 1 && <span style={{
                                                marginLeft: '4px',
                                                background: '#cbd5e1',
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>x{sc.count}</span>}
                                            {sc.isOwnGoal &&
                                                <strong style={{color: '#ef4444', marginLeft: '4px'}}>(OG)</strong>}
                                            {!sc.isOwnGoal && <span style={{
                                                color: '#64748b',
                                                marginLeft: '4px'
                                            }}>({sc.gender || 'Men'})</span>}
                                        </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeOneGoalTeam1(sc.name, sc.isOwnGoal)}
                                                                                        style={{
                                                                                            background: 'none',
                                                                                            border: 'none',
                                                                                            color: '#ef4444',
                                                                                            cursor: 'pointer'
                                                                                        }}
                                                                                        title="Remove one goal"
                                                                                    >
                                                                                        <Trash2 size={12}/>
                                                                                    </button>
                                                                                </div>
                                                                            ));
                                                                        })()}
                                                                        {editScorers1.length === 0 &&
                                                                            <span className="text-xs text-muted">No goals logged</span>}
                                                                    </div>
                                                                </div>

                                                                {/* Team 2 Scorers */}
                                                                <div>
                                <span className="text-xs font-bold text-green block mb-1">
                                  {getMatchDisplayTeamName(editTeam2, editTeam2Text, editTeam2Dep)} Goals ({editScorers2.length})
                                </span>
                                                                    <div className="flex-gap mb-2"
                                                                         style={{alignItems: 'center'}}>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Scorer Name"
                                                                            list="registered-players-list-team2"
                                                                            value={newScorer2}
                                                                            onChange={e => {
                                                                                const val = e.target.value;
                                                                                setNewScorer2(val);
                                                                                const matchedPlayer = scorers.find(s => s.name && s.name.trim().toLowerCase() === val.trim().toLowerCase());
                                                                                if (matchedPlayer && matchedPlayer.gender) {
                                                                                    setScorerGender2(matchedPlayer.gender);
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                padding: '4px',
                                                                                fontSize: '12px',
                                                                                flex: 1
                                                                            }}
                                                                        />
                                                                        <select
                                                                            value={scorerGender2}
                                                                            onChange={e => setScorerGender2(e.target.value)}
                                                                            style={{
                                                                                padding: '4px',
                                                                                fontSize: '12px',
                                                                                border: '1px solid rgba(21, 128, 61, 0.15)',
                                                                                borderRadius: '4px'
                                                                            }}
                                                                        >
                                                                            <option value="Men">Man</option>
                                                                            <option value="Women">Woman</option>
                                                                        </select>
                                                                        <input
                                                                            type="number"
                                                                            min="1"
                                                                            value={goalsCount2}
                                                                            onChange={e => setGoalsCount2(parseInt(e.target.value, 10) || 1)}
                                                                            style={{
                                                                                padding: '4px',
                                                                                fontSize: '12px',
                                                                                width: '40px',
                                                                                textAlign: 'center',
                                                                                border: '1px solid rgba(21, 128, 61, 0.15)',
                                                                                borderRadius: '4px'
                                                                            }}
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
                                                                                    setScorerGender2('Men');
                                                                                    setEditStatus('played');
                                                                                }
                                                                            }}
                                                                        >
                                                                            Add Goal
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="success-btn btn-sm"
                                                                            style={{
                                                                                background: '#ef4444',
                                                                                borderColor: '#ef4444'
                                                                            }}
                                                                            onClick={() => {
                                                                                const count = Math.max(1, goalsCount2);
                                                                                const newOGs = Array(count).fill({
                                                                                    name: 'Own Goal',
                                                                                    isOwnGoal: true
                                                                                });
                                                                                setEditScorers2([...editScorers2, ...newOGs]);
                                                                                setGoalsCount2(1);
                                                                                setEditStatus('played');
                                                                            }}
                                                                        >
                                                                            Add OG
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-1 mb-2" style={{
                                                                        maxHeight: '120px',
                                                                        overflowY: 'auto'
                                                                    }}>
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
                                                                                    grouped.push({
                                                                                        name,
                                                                                        isOwnGoal: isOg,
                                                                                        gender,
                                                                                        count: 1
                                                                                    });
                                                                                }
                                                                            });

                                                                            return grouped.map((sc, idx) => (
                                                                                <div key={idx}
                                                                                     className="flex-between text-xs bg-white p-1 rounded border">
                                        <span>
                                          <strong>{sc.name}</strong>
                                            {sc.count > 1 && <span style={{
                                                marginLeft: '4px',
                                                background: '#cbd5e1',
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold'
                                            }}>x{sc.count}</span>}
                                            {sc.isOwnGoal &&
                                                <strong style={{color: '#ef4444', marginLeft: '4px'}}>(OG)</strong>}
                                            {!sc.isOwnGoal && <span style={{
                                                color: '#64748b',
                                                marginLeft: '4px'
                                            }}>({sc.gender || 'Men'})</span>}
                                        </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeOneGoalTeam2(sc.name, sc.isOwnGoal)}
                                                                                        style={{
                                                                                            background: 'none',
                                                                                            border: 'none',
                                                                                            color: '#ef4444',
                                                                                            cursor: 'pointer'
                                                                                        }}
                                                                                        title="Remove one goal"
                                                                                    >
                                                                                        <Trash2 size={12}/>
                                                                                    </button>
                                                                                </div>
                                                                            ));
                                                                        })()}
                                                                        {editScorers2.length === 0 &&
                                                                            <span className="text-xs text-muted">No goals logged</span>}
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
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontSize: '13px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <Check size={14}/> Save Changes
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingId(null);
                                                                setEditType(null);
                                                            }}
                                                            className="danger-btn"
                                                            style={{
                                                                padding: '8px 16px',
                                                                borderRadius: '8px',
                                                                fontSize: '13px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                background: '#ef4444',
                                                                color: 'white',
                                                                border: 'none',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <X size={14}/> Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        ) : (
                                            <>
                                                <td className="text-xs"
                                                    style={{borderBottom: hasScorers ? 'none' : undefined}}>
                                                    <div className="font-bold">{formatDateReadable(m.date, m.dateSuffix)}</div>
                                                    <div className="text-muted">Pitch {m.pitch} • {m.time}</div>
                                                </td>
                                                <td className="text-xs font-bold text-green"
                                                    style={{borderBottom: hasScorers ? 'none' : undefined}}>{m.round}</td>
                                                <td className="text-right font-bold"
                                                    style={{borderBottom: hasScorers ? 'none' : undefined}}>{getMatchDisplayTeamName(m.team1, m.team1Text, m.team1Dep)}</td>
                                                <td style={{
                                                    whiteSpace: 'nowrap',
                                                    width: '120px',
                                                    borderBottom: hasScorers ? 'none' : undefined
                                                }}>
                                                    {m.status === 'played' ? (
                                                        <span className="score-badge"
                                                              style={{margin: '0 4px'}}>{m.score1} - {m.score2}</span>
                                                    ) : (
                                                        <span className="text-muted text-xs">vs</span>
                                                    )}
                                                </td>
                                                <td className="text-left font-bold"
                                                    style={{borderBottom: hasScorers ? 'none' : undefined}}>{getMatchDisplayTeamName(m.team2, m.team2Text, m.team2Dep)}</td>
                                                <td style={{borderBottom: hasScorers ? 'none' : undefined}}>
                                                    <div className="scorer-admin-btns" style={{
                                                        display: 'flex',
                                                        gap: '6px',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <button
                                                            onClick={() => startEdit(m, 'info')}
                                                            className="plus-btn"
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '11px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                width: 'auto',
                                                                height: 'auto',
                                                                borderRadius: '6px'
                                                            }}
                                                            title="Edit scheduled info"
                                                        >
                                                            <Calendar size={12}/> Info
                                                        </button>
                                                        <button
                                                            onClick={() => startEdit(m, 'results')}
                                                            className="plus-btn"
                                                            style={{
                                                                padding: '6px 12px',
                                                                fontSize: '11px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                width: 'auto',
                                                                height: 'auto',
                                                                borderRadius: '6px',
                                                                background: '#3b82f6',
                                                                color: 'white',
                                                                borderColor: '#3b82f6'
                                                            }}
                                                            title="Edit score & scorers"
                                                        >
                                                            <Trophy size={12}/> Result
                                                        </button>
                                                        <button
                                                            onClick={() => onDeleteMatch(m.id)}
                                                            className="trash-btn"
                                                            style={{width: '30px', height: '30px'}}
                                                            title="Delete Match"
                                                        >
                                                            <Trash2 size={12}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                    {editingId !== m.id && hasScorers && (
                                        <tr style={{background: '#f8fafc'}}>
                                            <td colSpan={2} style={{borderTop: 'none', padding: '4px 10px'}}></td>
                                            <td style={{
                                                borderTop: 'none',
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                color: '#64748b',
                                                textAlign: 'right',
                                                fontStyle: 'italic'
                                            }}>
                                                {countScorersHelper(m.scorers1 || [])}
                                            </td>
                                            <td style={{
                                                borderTop: 'none',
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                color: '#475569',
                                                textAlign: 'center',
                                                width: '120px'
                                            }}>
                                                ⚽
                                            </td>
                                            <td style={{
                                                borderTop: 'none',
                                                padding: '4px 10px',
                                                fontSize: '11px',
                                                color: '#64748b',
                                                textAlign: 'left',
                                                fontStyle: 'italic'
                                            }}>
                                                {countScorersHelper(m.scorers2 || [])}
                                            </td>
                                            <td style={{borderTop: 'none', padding: '4px 10px'}}></td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })}
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
            <datalist id="registered-players-list-team1">
                {scorers.filter(s => s.team === editTeam1).map(s => <option key={s.id} value={s.name}/>)}
            </datalist>
            <datalist id="registered-players-list-team2">
                {scorers.filter(s => s.team === editTeam2).map(s => <option key={s.id} value={s.name}/>)}
            </datalist>
        </div>
    );
}

export default MatchEditor;
