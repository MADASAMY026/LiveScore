let playerStatsData = {};

function loadPlayerStats() {
  const saved = localStorage.getItem('iplPlayerStats');
  if (saved) {
    playerStatsData = JSON.parse(saved);
  } else {
    initPlayerStats();
  }
}

function initPlayerStats() {
  Object.keys(TEAMS).forEach(teamKey => {
    TEAMS[teamKey].players.forEach(player => {
      if (!playerStatsData[player.name]) {
        playerStatsData[player.name] = {
          name: player.name,
          team: teamKey,
          role: player.role,
          matches: 0,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          highestScore: 0,
          centuries: 0,
          halfCenturies: 0,
          wickets: 0,
          ballsBowled: 0,
          runsConceded: 0,
          bestBowling: '0/0',
          fiveWickets: 0,
          catches: 0,
          stumpings: 0
        };
      }
    });
  });
  savePlayerStats();
}

function savePlayerStats() {
  localStorage.setItem('iplPlayerStats', JSON.stringify(playerStatsData));
}

function updatePlayerStatsAfterMatch(inn1, inn2) {
  const processInnings = (inn) => {
    Object.keys(inn.batStats).forEach(playerName => {
      const stats = inn.batStats[playerName];
      if (playerStatsData[playerName]) {
        playerStatsData[playerName].runs += stats.r;
        playerStatsData[playerName].balls += stats.b;
        playerStatsData[playerName].fours += stats.fours || 0;
        playerStatsData[playerName].sixes += stats.sixes || 0;
        if (stats.r > playerStatsData[playerName].highestScore) {
          playerStatsData[playerName].highestScore = stats.r;
        }
        if (stats.r >= 100) playerStatsData[playerName].centuries += 1;
        else if (stats.r >= 50) playerStatsData[playerName].halfCenturies += 1;
      }
    });

    Object.keys(inn.bowlStats).forEach(playerName => {
      const stats = inn.bowlStats[playerName];
      if (playerStatsData[playerName]) {
        playerStatsData[playerName].wickets += stats.w;
        playerStatsData[playerName].ballsBowled += stats.balls;
        playerStatsData[playerName].runsConceded += stats.r;
        const currentBest = playerStatsData[playerName].bestBowling;
        const [currW, currR] = currentBest.split('/').map(Number);
        if (stats.w > currW || (stats.w === currW && stats.r < currR)) {
          playerStatsData[playerName].bestBowling = `${stats.w}/${stats.r}`;
        }
        if (stats.w >= 5) playerStatsData[playerName].fiveWickets += 1;
      }
    });
  };

  processInnings(inn1);
  processInnings(inn2);
  savePlayerStats();
}

function getTopRunScorers(limit = 10) {
  return Object.values(playerStatsData)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, limit);
}

function getTopWicketTakers(limit = 10) {
  return Object.values(playerStatsData)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, limit);
}

function getBattingAverage(playerName) {
  const p = playerStatsData[playerName];
  if (!p || p.matches === 0) return 0;
  return (p.runs / p.matches).toFixed(2);
}

function getBowlingAverage(playerName) {
  const p = playerStatsData[playerName];
  if (!p || p.wickets === 0) return 0;
  return (p.runsConceded / p.wickets).toFixed(2);
}

function getStrikeRate(playerName) {
  const p = playerStatsData[playerName];
  if (!p || p.balls === 0) return 0;
  return ((p.runs / p.balls) * 100).toFixed(2);
}

function getEconomyRate(playerName) {
  const p = playerStatsData[playerName];
  if (!p || p.ballsBowled === 0) return 0;
  const overs = p.ballsBowled / 6;
  return (p.runsConceded / overs).toFixed(2);
}

function renderPlayerStatsPage() {
  const container = document.getElementById('player-stats-container');
  if (!container) return;

  const topRunScorers = getTopRunScorers(10);
  const topWicketTakers = getTopWicketTakers(10);

  container.innerHTML = `
    <div class="stats-tabs">
      <button class="stats-tab active" onclick="window.playerStats.showTab('batting')">🏏 BATTING</button>
      <button class="stats-tab" onclick="window.playerStats.showTab('bowling')">🎳 BOWLING</button>
      <button class="stats-tab" onclick="window.playerStats.showTab('all')">📊 ALL PLAYERS</button>
    </div>

    <div id="stats-batting" class="stats-panel active">
      <div class="stats-section-title">🏆 TOP RUN SCORERS</div>
      <table class="stats-table">
        <thead>
          <tr>
            <th>RANK</th>
            <th>PLAYER</th>
            <th>TEAM</th>
            <th>RUNS</th>
            <th>HS</th>
            <th>SR</th>
            <th>4s</th>
            <th>6s</th>
          </tr>
        </thead>
        <tbody>
          ${topRunScorers.map((p, i) => `
            <tr class="${i < 3 ? 'top-player' : ''}">
              <td><span class="rank-badge rank-${i + 1}">${i + 1}</span></td>
              <td>
                <div class="player-cell">
                  <div class="player-avatar">${p.name.charAt(0)}</div>
                  <div class="player-info">
                    <div class="player-name">${p.name}</div>
                    <div class="player-role">${p.role}</div>
                  </div>
                </div>
              </td>
              <td><div class="team-badge" style="background:${TEAMS[p.team]?.color || '#666'}">${TEAMS[p.team]?.short || '—'}</div></td>
              <td class="stat-highlight">${p.runs}</td>
              <td>${p.highestScore}</td>
              <td>${getStrikeRate(p.name)}</td>
              <td>${p.fours}</td>
              <td>${p.sixes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div id="stats-bowling" class="stats-panel">
      <div class="stats-section-title">🎯 TOP WICKET TAKERS</div>
      <table class="stats-table">
        <thead>
          <tr>
            <th>RANK</th>
            <th>PLAYER</th>
            <th>TEAM</th>
            <th>WKTS</th>
            <th>BEST</th>
            <th>ECO</th>
            <th>5WI</th>
          </tr>
        </thead>
        <tbody>
          ${topWicketTakers.map((p, i) => `
            <tr class="${i < 3 ? 'top-player' : ''}">
              <td><span class="rank-badge rank-${i + 1}">${i + 1}</span></td>
              <td>
                <div class="player-cell">
                  <div class="player-avatar">${p.name.charAt(0)}</div>
                  <div class="player-info">
                    <div class="player-name">${p.name}</div>
                    <div class="player-role">${p.role}</div>
                  </div>
                </div>
              </td>
              <td><div class="team-badge" style="background:${TEAMS[p.team]?.color || '#666'}">${TEAMS[p.team]?.short || '—'}</div></td>
              <td class="stat-highlight">${p.wickets}</td>
              <td>${p.bestBowling}</td>
              <td>${getEconomyRate(p.name)}</td>
              <td>${p.fiveWickets}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div id="stats-all" class="stats-panel">
      <div class="stats-section-title">📋 ALL PLAYERS</div>
      <div class="player-search">
        <input type="text" id="player-search-input" placeholder="Search player..." oninput="window.playerStats.filterPlayers()">
      </div>
      <table class="stats-table" id="all-players-table">
        <thead>
          <tr>
            <th>PLAYER</th>
            <th>TEAM</th>
            <th>ROLE</th>
            <th>RUNS</th>
            <th>WKTS</th>
            <th>4s</th>
            <th>6s</th>
          </tr>
        </thead>
        <tbody id="all-players-body">
          ${Object.values(playerStatsData).map(p => `
            <tr class="player-row" data-name="${p.name.toLowerCase()}">
              <td>
                <div class="player-cell">
                  <div class="player-avatar">${p.name.charAt(0)}</div>
                  <div class="player-name">${p.name}</div>
                </div>
              </td>
              <td><div class="team-badge" style="background:${TEAMS[p.team]?.color || '#666'}">${TEAMS[p.team]?.short || '—'}</div></td>
              <td>${p.role}</td>
              <td>${p.runs}</td>
              <td>${p.wickets}</td>
              <td>${p.fours}</td>
              <td>${p.sixes}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <button class="next-btn" onclick="window.playerStats.resetStats()" style="margin-top:20px;background:var(--red);">🔄 RESET PLAYER STATS</button>
  `;
}

window.playerStats = {
  loadPlayerStats,
  initPlayerStats,
  savePlayerStats,
  updatePlayerStatsAfterMatch,
  getTopRunScorers,
  getTopWicketTakers,
  getBattingAverage,
  getBowlingAverage,
  getStrikeRate,
  getEconomyRate,
  renderPlayerStatsPage,
  showTab: (tab) => {
    document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.stats-panel').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(`stats-${tab}`).classList.add('active');
  },
  filterPlayers: () => {
    const search = document.getElementById('player-search-input').value.toLowerCase();
    document.querySelectorAll('.player-row').forEach(row => {
      const name = row.getAttribute('data-name');
      row.style.display = name.includes(search) ? '' : 'none';
    });
  },
  resetStats: () => {
    if (confirm('Are you sure you want to reset all player statistics?')) {
      playerStatsData = {};
      initPlayerStats();
      renderPlayerStatsPage();
    }
  }
};

loadPlayerStats();
