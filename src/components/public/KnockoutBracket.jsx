const STAGE_ORDER = ['round_of_16', 'quarters', 'semis', 'final'];
const STAGE_LABELS = {
  round_of_16: 'Round of 16',
  quarters: 'Quarter-finals',
  semis: 'Semi-finals',
  final: 'Final'
};

function isDependency(dep) {
  return dep && (dep.type === 'match_winner' || dep.type === 'match_loser');
}

function getStageMatches(stages, key) {
  return [...(stages[key] || [])].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function getMatchWinnerInfo(match, getResolvedTeamInfo) {
  if (!match || match.status !== 'played') return null;
  const score1 = parseInt(match.score1, 10);
  const score2 = parseInt(match.score2, 10);
  if (score1 > score2) return getResolvedTeamInfo(match.team1, match.team1Text, match.team1Dep);
  if (score2 > score1) return getResolvedTeamInfo(match.team2, match.team2Text, match.team2Dep);
  return null;
}

function isFinalRound(match) {
  const round = (match.round || '').toLowerCase();
  return round.includes('championship') || (round.includes('final') && !round.includes('3rd') && !round.includes('third'));
}

function isThirdPlaceRound(match) {
  const round = (match.round || '').toLowerCase();
  return round.includes('3rd') || round.includes('third') || round.includes('3/4');
}

function BracketMatchCard({ match, getResolvedTeamInfo, compact = false, isFinal = false, isThirdPlace = false }) {
  const isPlayed = match.status === 'played';
  const score1 = isPlayed ? parseInt(match.score1, 10) : null;
  const score2 = isPlayed ? parseInt(match.score2, 10) : null;
  const team1Winner = isPlayed && score1 > score2;
  const team2Winner = isPlayed && score2 > score1;
  const team1Info = getResolvedTeamInfo(match.team1, match.team1Text, match.team1Dep);
  const team2Info = getResolvedTeamInfo(match.team2, match.team2Text, match.team2Dep);
  const nameMaxWidth = compact ? 96 : 130;

  const rowStyle = (isWinner, withDivider = false) => ({
    alignItems: 'center',
    borderBottom: withDivider ? '1px solid #e2e8f0' : 'none',
    display: 'flex',
    justifyContent: 'space-between',
    minHeight: compact ? '17px' : '22px',
    opacity: isPlayed && !isWinner ? 0.58 : 1,
    paddingBottom: withDivider ? '2px' : 0
  });

  const nameStyle = (isWinner) => ({
    color: '#1e293b',
    fontSize: compact ? '10px' : '12px',
    fontWeight: isWinner ? 800 : 600,
    maxWidth: `${nameMaxWidth}px`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  });

  return (
    <div
      style={{
        background: '#fff',
        border: isFinal ? '2px solid #15803d' : (isThirdPlace ? '1px dashed #64748b' : '1px solid #cbd5e1'),
        borderRadius: '7px',
        boxShadow: '0 2px 5px rgba(15, 23, 42, 0.08)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: compact ? '2px' : '4px',
        padding: compact ? '5px 7px' : '7px 10px',
        width: '100%'
      }}
      title={`${match.round}${match.time ? ` - ${match.time}` : ''}${match.pitch ? ` - Pitch ${match.pitch}` : ''}`}
    >
      <div style={rowStyle(team1Winner, true)}>
        <div style={{ alignItems: 'center', display: 'flex', gap: compact ? '4px' : '6px', minWidth: 0 }}>
          <span style={{ background: team1Info.color, borderRadius: '50%', flexShrink: 0, height: compact ? '6px' : '7px', width: compact ? '6px' : '7px' }} />
          <span style={nameStyle(team1Winner)}>{team1Info.name}</span>
        </div>
        {isPlayed && <span style={{ color: '#0f172a', fontSize: compact ? '10px' : '12px', fontWeight: team1Winner ? 900 : 600 }}>{match.score1}</span>}
      </div>
      <div style={rowStyle(team2Winner)}>
        <div style={{ alignItems: 'center', display: 'flex', gap: compact ? '4px' : '6px', minWidth: 0 }}>
          <span style={{ background: team2Info.color, borderRadius: '50%', flexShrink: 0, height: compact ? '6px' : '7px', width: compact ? '6px' : '7px' }} />
          <span style={nameStyle(team2Winner)}>{team2Info.name}</span>
        </div>
        {isPlayed && <span style={{ color: '#0f172a', fontSize: compact ? '10px' : '12px', fontWeight: team2Winner ? 900 : 600 }}>{match.score2}</span>}
      </div>
    </div>
  );
}

function buildBracketModel(stages) {
  const columns = STAGE_ORDER
    .map((key) => ({ key, label: STAGE_LABELS[key], matches: getStageMatches(stages, key) }))
    .filter((stage) => stage.matches.length > 0);
  const allMatches = columns.flatMap((stage) => stage.matches);
  const matchById = new Map(allMatches.map((match) => [match.id, match]));
  const columnOf = {};
  const parentOf = Object.fromEntries(allMatches.map((match) => [match.id, []]));

  columns.forEach((column, colIndex) => {
    column.matches.forEach((match) => {
      columnOf[match.id] = colIndex;
    });
  });

  allMatches.forEach((match) => {
    [match.team1Dep, match.team2Dep].forEach((dep) => {
      if (isDependency(dep) && matchById.has(dep.matchId) && columnOf[dep.matchId] < columnOf[match.id]) {
        parentOf[match.id].push(dep.matchId);
      }
    });
  });

  columns.forEach((column) => {
    const ordered = [];
    const remaining = new Set(column.matches.map((match) => match.id));
    columns.slice(columnOf[column.matches[0]?.id] + 1).flatMap((nextColumn) => nextColumn.matches).forEach((child) => {
      (parentOf[child.id] || []).forEach((parentId) => {
        if (remaining.has(parentId)) {
          ordered.push(parentId);
          remaining.delete(parentId);
        }
      });
    });
    remaining.forEach((matchId) => ordered.push(matchId));
    column.matches = ordered.map((matchId) => matchById.get(matchId)).filter(Boolean);
  });

  return { allMatches, columnOf, columns, matchById, parentOf };
}

export default function KnockoutBracket({ stages, getResolvedTeamInfo, compact = false }) {
  const thirdPlaceMatches = getStageMatches(stages, 'third_place');
  const { allMatches, columnOf, columns, matchById, parentOf } = buildBracketModel(stages);

  if (allMatches.length === 0 && thirdPlaceMatches.length === 0) return null;

  const MATCH_W = compact ? 154 : 192;
  const MATCH_H = compact ? 52 : 62;
  const COL_GAP = compact ? 58 : 72;
  const ROW_GAP = compact ? 18 : 24;
  const HEADER_H = 30;
  const COL_W = MATCH_W + COL_GAP;
  const yPos = {};

  const toPercent = (value, total) => `${(value / total) * 100}%`;

  columns.forEach((column, colIndex) => {
    if (colIndex === 0) {
      column.matches.forEach((match, index) => {
        yPos[match.id] = index * (MATCH_H + ROW_GAP);
      });
      return;
    }

    column.matches.forEach((match, index) => {
      const parents = (parentOf[match.id] || []).filter((parentId) => yPos[parentId] !== undefined);
      if (parents.length > 1) {
        const centers = parents.map((parentId) => yPos[parentId] + MATCH_H / 2);
        yPos[match.id] = (Math.min(...centers) + Math.max(...centers)) / 2 - MATCH_H / 2;
      } else if (parents.length === 1) {
        yPos[match.id] = yPos[parents[0]];
      } else {
        const previous = column.matches.slice(0, index);
        const lastY = previous.length > 0 ? Math.max(...previous.map((prev) => yPos[prev.id] + MATCH_H + ROW_GAP)) : 0;
        yPos[match.id] = lastY;
      }
    });
  });

  const allY = Object.values(yPos);
  const treeHeight = allY.length > 0 ? Math.max(...allY) + MATCH_H : MATCH_H;
  const thirdPlaceHeight = thirdPlaceMatches.length > 0 ? thirdPlaceMatches.length * (MATCH_H + 10) + 34 : 0;
  const totalHeight = HEADER_H + treeHeight + thirdPlaceHeight + 12;
  const totalWidth = Math.max(1, columns.length) * MATCH_W + Math.max(0, columns.length - 1) * COL_GAP;

  const isAdvanced = (parentMatch, childMatch) => {
    if (!parentMatch || !childMatch || parentMatch.status !== 'played') return false;

    // Find the dependency in childMatch that points to parentMatch
    let dep = null;
    let isTeam1 = false;

    if (childMatch.team1Dep && childMatch.team1Dep.matchId === parentMatch.id) {
      dep = childMatch.team1Dep;
      isTeam1 = true;
    } else if (childMatch.team2Dep && childMatch.team2Dep.matchId === parentMatch.id) {
      dep = childMatch.team2Dep;
      isTeam1 = false;
    }

    if (!dep) return false;

    // Determine the expected team info from the parent match based on the score and dependency type
    const score1 = parseInt(parentMatch.score1, 10);
    const score2 = parseInt(parentMatch.score2, 10);
    if (isNaN(score1) || isNaN(score2)) return false;

    let parentWinnerIsTeam1 = null;
    if (score1 > score2) {
      parentWinnerIsTeam1 = true;
    } else if (score2 > score1) {
      parentWinnerIsTeam1 = false;
    }

    if (parentWinnerIsTeam1 === null) return false;

    const wantsWinner = dep.type === 'match_winner';
    const useParentTeam1 = wantsWinner ? parentWinnerIsTeam1 : !parentWinnerIsTeam1;

    const expected = useParentTeam1
      ? getResolvedTeamInfo(parentMatch.team1, parentMatch.team1Text, parentMatch.team1Dep)
      : getResolvedTeamInfo(parentMatch.team2, parentMatch.team2Text, parentMatch.team2Dep);

    const actual = isTeam1
      ? getResolvedTeamInfo(childMatch.team1, childMatch.team1Text, childMatch.team1Dep)
      : getResolvedTeamInfo(childMatch.team2, childMatch.team2Text, childMatch.team2Dep);

    return !!(expected && actual && expected.id && actual.id && expected.id === actual.id);
  };

  const connectorLines = [];
  allMatches.forEach((child) => {
    const childX = columnOf[child.id] * COL_W;
    const childCenterY = HEADER_H + (yPos[child.id] || 0) + MATCH_H / 2;
    const parents = parentOf[child.id] || [];

    parents.forEach((parentId) => {
      const parent = matchById.get(parentId);
      if (!parent) return;
      const parentX = columnOf[parentId] * COL_W + MATCH_W;
      const parentCenterY = HEADER_H + (yPos[parentId] || 0) + MATCH_H / 2;
      const elbowX = parentX + COL_GAP / 2;
      const color = isAdvanced(parent, child) ? '#16a34a' : '#94a3b8';
      const strokeWidth = isAdvanced(parent, child) ? 2.5 : 2;

      connectorLines.push(
        <path
          d={`M ${parentX} ${parentCenterY} H ${elbowX} V ${childCenterY} H ${childX}`}
          fill="none"
          key={`${parentId}-${child.id}`}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      );
    });
  });

  return (
    <div style={{ overflow: 'hidden', paddingBottom: '12px', width: '100%' }}>
      <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
        {columns.map((column, colIndex) => (
          <div
            key={`header-${colIndex}`}
            style={{
              borderBottom: '1px solid rgba(21, 128, 61, 0.2)',
              color: '#15803d',
              fontSize: compact ? '10px' : '11px',
              fontWeight: 800,
              height: `${HEADER_H - 5}px`,
              left: toPercent(colIndex * COL_W, totalWidth),
              letterSpacing: '0.3px',
              lineHeight: `${HEADER_H - 8}px`,
              position: 'absolute',
              textAlign: 'center',
              textTransform: 'uppercase',
              top: 0,
              width: toPercent(MATCH_W, totalWidth)
            }}
          >
            {column.label}
          </div>
        ))}

        <svg
          preserveAspectRatio="none"
          style={{ height: `${totalHeight}px`, left: 0, pointerEvents: 'none', position: 'absolute', top: 0, width: '100%' }}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        >
          {connectorLines}
        </svg>

        {columns.map((column, colIndex) => column.matches.map((match) => (
          <div
            key={match.id}
            style={{
              left: toPercent(colIndex * COL_W, totalWidth),
              position: 'absolute',
              top: `${HEADER_H + (yPos[match.id] || 0)}px`,
              width: toPercent(MATCH_W, totalWidth)
            }}
          >
            <BracketMatchCard
              compact={compact}
              getResolvedTeamInfo={getResolvedTeamInfo}
              isFinal={isFinalRound(match)}
              isThirdPlace={isThirdPlaceRound(match)}
              match={match}
            />
          </div>
        )))}

        {thirdPlaceMatches.length > 0 && (
          <div style={{ left: toPercent((columns.length - 1) * COL_W, totalWidth), position: 'absolute', top: `${HEADER_H + treeHeight + 24}px`, width: toPercent(MATCH_W, totalWidth) }}>
            <div style={{ color: '#64748b', fontSize: compact ? '10px' : '11px', fontWeight: 800, marginBottom: '6px', textAlign: 'center', textTransform: 'uppercase' }}>
              Third place
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {thirdPlaceMatches.map((match) => (
                <BracketMatchCard
                  compact={compact}
                  getResolvedTeamInfo={getResolvedTeamInfo}
                  isThirdPlace
                  key={match.id}
                  match={match}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
