let liveMatches = [];
let currentLiveTab = 'live';
let liveUpdateInterval = null;
let activeMatchId = null;

function initLiveScores() {
  createDemoMatches();
  renderLiveMatches();
  startLiveUpdates();
}

function createDemoMatches() {
  liveMatches = [
    {
      id: 1,
      status: 'LIVE',
      teamA: 'csk',
      teamB: 'mi',
      scoreA: { runs: 145, wickets: 3, balls: 92 },
      scoreB: { runs: 0, wickets: 0, balls: 0 },
      innings: 1,
      target: null,
      venue: 'Wankhede, Mumbai',
      overs: '15.2',
      runRate: '9.45',
      lastBall: 'Four! 🔥 What a shot by Gaikwad!',
      lastUpdate: Date.now(),
      isDemo: true
    },
    {
      id: 2,
      status: 'LIVE',
      teamA: 'rcb',
      teamB: 'kkr',
      scoreA: { runs: 89, wickets: 4, balls: 78 },
      scoreB: { runs: 0, wickets: 0, balls: 0 },
      innings: 1,
      target: null,
      venue: 'Chinnaswamy, Bangalore',
      overs: '13.0',
      runRate: '6.84',
      lastBall: 'Wicket! Russell strikes! 🎯',
      lastUpdate: Date.now(),
      isDemo: true
    },
    {
      id: 3,
      status: 'UPCOMING',
      teamA: 'gt',
      teamB: 'dc',
      scoreA: { runs: 0, wickets: 0, balls: 0 },
      scoreB: { runs: 0, wickets: 0, balls: 0 },
      innings: 0,
      target: null,
      venue: 'Narendra Modi, Ahmedabad',
      overs: '—',
      runRate: '—',
      lastBall: 'Match starts at 7:30 PM',
      lastUpdate: Date.now()
    },
    {
      id: 4,
      status: 'FINISHED',
      teamA: 'srh',
      teamB: 'rr',
      scoreA: { runs: 178, wickets: 5, balls: 120 },
      scoreB: { runs: 172, wickets: 7, balls: 120 },
      innings: 2,
      target: null,
      venue: 'Chepauk, Chennai',
      overs: '20.0',
      runRate: '—',
      lastBall: 'SRH won by 6 runs! 🎉',
      winner: 'srh',
      lastUpdate: Date.now()
    },
    {
      id: 5,
      status: 'FINISHED',
      teamA: 'lsg',
      teamB: 'pbks',
      scoreA: { runs: 192, wickets: 4, balls: 120 },
      scoreB: { runs: 185, wickets: 6, balls: 120 },
      innings: 2,
      target: null,
      venue: 'Eden Gardens, Kolkata',
      overs: '20.0',
      runRate: '—',
      lastBall: 'LSG won by 7 runs! 🏆',
      winner: 'lsg',
      lastUpdate: Date.now()
    }
  ];
}

function switchLiveTab(tab) {
  currentLiveTab = tab;
  document.querySelectorAll('.live-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.live-tab[data-tab="${tab}"]`).classList.add('active');
  renderLiveMatches();
}

function renderLiveMatches() {
  const container = document.getElementById('live-matches-container');
  if (!container) return;

  let filteredMatches = [];
  if (currentLiveTab === 'live') {
    filteredMatches = liveMatches.filter(m => m.status === 'LIVE');
  } else if (currentLiveTab === 'upcoming') {
    filteredMatches = liveMatches.filter(m => m.status === 'UPCOMING');
  } else {
    filteredMatches = liveMatches.filter(m => m.status === 'FINISHED');
  }

  if (filteredMatches.length === 0) {
    container.innerHTML = `
      <div class="live-no-matches">
        No ${currentLiveTab} matches at the moment!
      </div>
    `;
    return;
  }

  container.innerHTML = filteredMatches.map(match => renderMatchCard(match)).join('');
}

function renderMatchCard(match) {
  const teamA = TEAMS[match.teamA];
  const teamB = TEAMS[match.teamB];
  const statusClass = match.status.toLowerCase();
  
  return `
    <div class="live-match-card ${statusClass}">
      <div class="live-match-header">
        <div class="live-match-status">
          <span class="live-status-dot ${statusClass}"></span>
          <span>${match.status}</span>
          ${match.isActive ? '<span style="margin-left:8px;color:var(--orange);font-weight:700;">(YOUR MATCH)</span>' : ''}
        </div>
        <div class="live-match-venue">${match.venue}</div>
      </div>
      
      <div class="live-teams-row">
        <div class="live-team">
          <div class="live-team-badge" style="background:${teamA?.color || '#666'}">
            ${teamA?.short || 'A'}
          </div>
          <div class="live-team-info">
            <div class="live-team-name">${teamA?.full || 'Team A'}</div>
          </div>
          <div class="live-team-score">${match.scoreA.runs}/${match.scoreA.wickets}</div>
        </div>
        
        <div class="live-vs">VS</div>
        
        <div class="live-team" style="justify-content:flex-end;">
          <div class="live-team-score">${match.scoreB.runs}/${match.scoreB.wickets}</div>
          <div class="live-team-info" style="text-align:right;">
            <div class="live-team-name">${teamB?.full || 'Team B'}</div>
          </div>
          <div class="live-team-badge" style="background:${teamB?.color || '#666'}">
            ${teamB?.short || 'B'}
          </div>
        </div>
      </div>
      
      ${match.striker && match.nonStriker && match.bowler && match.isActive ? `
        <div style="margin-top:12px;padding:10px 12px;background:var(--dark3);border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;flex-direction:column;gap:4px;">
              <div style="font-size:11px;color:var(--gold);font-family:'Rajdhani',sans-serif;font-weight:700;">⚡ ${match.striker}*</div>
              <div style="font-size:11px;color:var(--muted);font-family:'Rajdhani',sans-serif;">${match.nonStriker}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;color:var(--blue);font-family:'Rajdhani',sans-serif;font-weight:700;">🎯 ${match.bowler}</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${match.lastBall ? `
        <div class="live-commentary-mini">
          ${match.lastBall}
        </div>
      ` : ''}
      
      <div class="live-match-info">
        <div class="live-overs">${match.overs} ov</div>
        <div class="live-runrate">CRR: ${match.runRate}</div>
        ${match.target ? `<div class="live-target">Target: ${match.target}</div>` : ''}
      </div>
    </div>
  `;
}

function startLiveUpdates() {
  if (liveUpdateInterval) {
    clearInterval(liveUpdateInterval);
  }
  
  liveUpdateInterval = setInterval(() => {
    updateLiveMatches();
    renderLiveMatches();
  }, 3000);
}

function updateLiveMatches() {
  liveMatches.forEach(match => {
    if (!match.isDemo || match.status !== 'LIVE') return;
    
    const now = Date.now();
    if (now - match.lastUpdate < 2500) return;
    
    match.lastUpdate = now;
    
    const outcomes = ['dot', '1', '2', '3', '4', '6', 'wicket'];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    if (outcome === 'wicket') {
      if (match.scoreA.wickets < 10) {
        match.scoreA.wickets++;
        match.scoreA.balls++;
        match.lastBall = getWicketCommentary();
      }
    } else if (outcome === '4') {
      match.scoreA.runs += 4;
      match.scoreA.balls++;
      match.lastBall = getFourCommentary();
    } else if (outcome === '6') {
      match.scoreA.runs += 6;
      match.scoreA.balls++;
      match.lastBall = getSixCommentary();
    } else if (outcome === '1') {
      match.scoreA.runs += 1;
      match.scoreA.balls++;
      match.lastBall = 'Single taken! 🏃';
    } else if (outcome === '2') {
      match.scoreA.runs += 2;
      match.scoreA.balls++;
      match.lastBall = 'Two runs! Well run! 👏';
    } else if (outcome === '3') {
      match.scoreA.runs += 3;
      match.scoreA.balls++;
      match.lastBall = 'Three! Excellent running! 💨';
    } else {
      match.scoreA.balls++;
      match.lastBall = 'Dot ball! Tight! 🔒';
    }
    
    const overs = Math.floor(match.scoreA.balls / 6);
    const balls = match.scoreA.balls % 6;
    match.overs = `${overs}.${balls}`;
    
    if (match.scoreA.balls > 0) {
      const crr = (match.scoreA.runs / match.scoreA.balls) * 6;
      match.runRate = crr.toFixed(2);
    }
    
    if (match.scoreA.balls >= 120) {
      match.status = 'INNINGS_BREAK';
      match.lastBall = 'Innings break! 🏏';
    }
  });
}

function getFourCommentary() {
  const comments = [
    'FOUR! What a shot! 🔥',
    'Boundary! Beautiful timing! ✨',
    'Cracking drive! 👏',
    'Racing away! 💨',
    'Four! Excellent shot! 🏏'
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function getSixCommentary() {
  const comments = [
    'SIX! Out of the ground! 🚀',
    'Maximum! Huge hit! 💥',
    'Six! What a blow! 🌟',
    'Over the ropes! 🔥',
    'Monstrous six! 🎉'
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function getWicketCommentary() {
  const comments = [
    'WICKET! Big wicket! 🎯',
    'GONE! That\'s a breakthrough! ⚡',
    'Out! Excellent bowling! 👏',
    'Wicket! Perfect delivery! 🎯',
    'Bowled him! 🔥'
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function addActiveMatchToLiveScores(teamAKey, teamBKey, stadiumName, strikerName, nonStrikerName, bowlerName) {
  activeMatchId = Date.now();
  
  const activeMatch = {
    id: activeMatchId,
    status: 'LIVE',
    teamA: teamAKey,
    teamB: teamBKey,
    scoreA: { runs: 0, wickets: 0, balls: 0 },
    scoreB: { runs: 0, wickets: 0, balls: 0 },
    innings: 1,
    target: null,
    venue: stadiumName,
    overs: '0.0',
    runRate: '0.00',
    lastBall: 'Match started! 🏏 Let\'s go!',
    striker: strikerName || '—',
    nonStriker: nonStrikerName || '—',
    bowler: bowlerName || '—',
    lastUpdate: Date.now(),
    isActive: true,
    isDemo: false
  };
  
  liveMatches = [activeMatch, ...liveMatches.filter(m => m.isActive !== true)];
  renderLiveMatches();
}

function updateActiveMatchScore(inningsData, currentInnings, commentary, strikerName, nonStrikerName, bowlerName) {
  const match = liveMatches.find(m => m.id === activeMatchId);
  if (!match) return;
  
  if (currentInnings === 1) {
    match.scoreA.runs = inningsData.runs;
    match.scoreA.wickets = inningsData.wickets;
    match.scoreA.balls = inningsData.balls;
  } else {
    match.scoreB.runs = inningsData.runs;
    match.scoreB.wickets = inningsData.wickets;
    match.scoreB.balls = inningsData.balls;
  }
  
  const inningsToShow = currentInnings === 1 ? match.scoreA : match.scoreB;
  const overs = Math.floor(inningsToShow.balls / 6);
  const balls = inningsToShow.balls % 6;
  match.overs = `${overs}.${balls}`;
  
  if (inningsToShow.balls > 0) {
    const crr = (inningsToShow.runs / inningsToShow.balls) * 6;
    match.runRate = crr.toFixed(2);
  }
  
  if (commentary) {
    match.lastBall = commentary;
  }
  
  if (strikerName) match.striker = strikerName;
  if (nonStrikerName) match.nonStriker = nonStrikerName;
  if (bowlerName) match.bowler = bowlerName;
  
  match.lastUpdate = Date.now();
  renderLiveMatches();
}

function finishActiveMatch(winnerKey) {
  const match = liveMatches.find(m => m.id === activeMatchId);
  if (!match) return;
  
  match.status = 'FINISHED';
  match.winner = winnerKey;
  match.lastBall = `${TEAMS[winnerKey]?.short || winnerKey} won! 🏆`;
  renderLiveMatches();
  activeMatchId = null;
}

window.switchLiveTab = switchLiveTab;
window.addActiveMatchToLiveScores = addActiveMatchToLiveScores;
window.updateActiveMatchScore = updateActiveMatchScore;
window.finishActiveMatch = finishActiveMatch;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiveScores);
} else {
  initLiveScores();
}
