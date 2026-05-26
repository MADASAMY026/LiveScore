let tournamentData = {
  teams: {},
  matches: []
};

function initTournament() {
  if (localStorage.getItem('iplTournament')) {
    tournamentData = JSON.parse(localStorage.getItem('iplTournament'));
  } else {
    Object.keys(TEAMS).forEach(key => {
      tournamentData.teams[key] = {
        name: TEAMS[key].short,
        fullName: TEAMS[key].full,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        nrr: 0,
        runsFor: 0,
        oversFor: 0,
        runsAgainst: 0,
        oversAgainst: 0
      };
    });
    saveTournament();
  }
}

function saveTournament() {
  localStorage.setItem('iplTournament', JSON.stringify(tournamentData));
}

function calculateNRR(teamKey) {
  const team = tournamentData.teams[teamKey];
  if (!team) return 0;
  
  if (team.oversFor === 0 || team.oversAgainst === 0) {
    return 0;
  }
  
  const battingRR = team.runsFor / (team.oversFor / 6);
  const bowlingRR = team.runsAgainst / (team.oversAgainst / 6);
  
  return (battingRR - bowlingRR).toFixed(3);
}

function updatePointsTable(winnerKey, loserKey, isTie = false, isNoResult = false) {
  if (isNoResult) {
    if (tournamentData.teams[winnerKey]) {
      tournamentData.teams[winnerKey].played += 1;
      tournamentData.teams[winnerKey].noResult += 1;
      tournamentData.teams[winnerKey].points += 1;
    }
    if (tournamentData.teams[loserKey]) {
      tournamentData.teams[loserKey].played += 1;
      tournamentData.teams[loserKey].noResult += 1;
      tournamentData.teams[loserKey].points += 1;
    }
  } else if (isTie) {
    if (tournamentData.teams[winnerKey]) {
      tournamentData.teams[winnerKey].played += 1;
      tournamentData.teams[winnerKey].tied += 1;
      tournamentData.teams[winnerKey].points += 1;
    }
    if (tournamentData.teams[loserKey]) {
      tournamentData.teams[loserKey].played += 1;
      tournamentData.teams[loserKey].tied += 1;
      tournamentData.teams[loserKey].points += 1;
    }
  } else {
    if (tournamentData.teams[winnerKey]) {
      tournamentData.teams[winnerKey].played += 1;
      tournamentData.teams[winnerKey].won += 1;
      tournamentData.teams[winnerKey].points += 2;
    }
    if (tournamentData.teams[loserKey]) {
      tournamentData.teams[loserKey].played += 1;
      tournamentData.teams[loserKey].lost += 1;
    }
  }
  
  Object.keys(tournamentData.teams).forEach(key => {
    tournamentData.teams[key].nrr = calculateNRR(key);
  });
  
  saveTournament();
}

function updateTeamStats(teamKey, runs, overs) {
  if (tournamentData.teams[teamKey]) {
    tournamentData.teams[teamKey].runsFor += runs;
    tournamentData.teams[teamKey].oversFor += overs;
  }
}

function updateOpponentStats(teamKey, runs, overs) {
  if (tournamentData.teams[teamKey]) {
    tournamentData.teams[teamKey].runsAgainst += runs;
    tournamentData.teams[teamKey].oversAgainst += overs;
  }
}

function getStandings() {
  return Object.keys(tournamentData.teams)
    .map(key => ({ ...tournamentData.teams[key], key }))
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return parseFloat(b.nrr) - parseFloat(a.nrr);
    });
}

function renderPointsTable() {
  const container = document.getElementById('points-table-container');
  if (!container) return;
  
  const standings = getStandings();
  
  container.innerHTML = `
    <table class="points-table">
      <thead>
        <tr>
          <th>Pos</th>
          <th>Team</th>
          <th>P</th>
          <th>W</th>
          <th>L</th>
          <th>T</th>
          <th>NR</th>
          <th>PTS</th>
          <th>NRR</th>
        </tr>
      </thead>
      <tbody>
        ${standings.map((team, index) => `
          <tr class="${index < 4 ? 'qualified' : ''}">
            <td class="pos-cell">${index + 1}</td>
            <td class="team-cell">
              <div class="team-info">
                <span class="team-badge" style="background:${TEAMS[team.key]?.color || '#666'}">
                  ${TEAM_LOGOS[team.key] ? `<img src="${TEAM_LOGOS[team.key]}" style="width:20px;height:20px;">` : team.name}
                </span>
                <span class="team-name">${team.fullName}</span>
              </div>
            </td>
            <td>${team.played}</td>
            <td>${team.won}</td>
            <td>${team.lost}</td>
            <td>${team.tied}</td>
            <td>${team.noResult}</td>
            <td class="points-cell">${team.points}</td>
            <td class="nrr-cell">${team.nrr}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div class="qualification-info">
      <span class="qualified-label">✅ Top 4 Qualified for Playoffs</span>
    </div>
  `;
}

function resetTournament() {
  if (confirm('Are you sure you want to reset the tournament?')) {
    tournamentData = {
      teams: {},
      matches: []
    };
    Object.keys(TEAMS).forEach(key => {
      tournamentData.teams[key] = {
        name: TEAMS[key].short,
        fullName: TEAMS[key].full,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        nrr: 0,
        runsFor: 0,
        oversFor: 0,
        runsAgainst: 0,
        oversAgainst: 0
      };
    });
    saveTournament();
    renderPointsTable();
  }
}

window.pointsTable = {
  initTournament,
  saveTournament,
  updatePointsTable,
  updateTeamStats,
  updateOpponentStats,
  getStandings,
  renderPointsTable,
  resetTournament
};

document.addEventListener('DOMContentLoaded', () => {
  initTournament();
});
