let overByOverData = [];

function calculateCRR(runs, balls) {
  if (balls === 0) return 0;
  const overs = balls / 6;
  return (runs / overs).toFixed(2);
}

function calculateRRR(runsNeeded, ballsRemaining) {
  if (ballsRemaining === 0) return '—';
  const oversRemaining = ballsRemaining / 6;
  return (runsNeeded / oversRemaining).toFixed(2);
}

function calculateProjectedScore(currentRuns, ballsFaced, totalOvers) {
  if (ballsFaced === 0) return '—';
  const totalBalls = totalOvers * 6;
  const ballsRemaining = totalBalls - ballsFaced;
  const crr = currentRuns / (ballsFaced / 6);
  const projectedRuns = currentRuns + (crr * (ballsRemaining / 6));
  return Math.round(projectedRuns);
}


function recordOverData(inningsNum, overNumber, runsInOver, totalRuns) {
  if (!overByOverData[inningsNum]) {
    overByOverData[inningsNum] = [];
  }
  overByOverData[inningsNum][overNumber] = {
    runs: runsInOver,
    total: totalRuns,
    runRate: totalRuns / ((overNumber + 1) / 6)
  };
}

function initRunRateData() {
  overByOverData = [];
}

function renderRunRateStats() {
  const s = inn[viewInnings];
  if (!s) return;
  
  const crrEl = document.getElementById('crr-val');
  const rrrEl = document.getElementById('rrr-val');
  const last6El = document.getElementById('last6-val');
  const ballsLeftEl = document.getElementById('balls-left');
  
  if (crrEl) {
    crrEl.textContent = calculateCRR(s.runs, s.balls);
  }
  
  if (viewInnings === 2) {
    const target = inn[1].runs + 1;
    const need = target - s.runs;
    const bl = (totalOvers * 6) - s.balls;
    
    if (rrrEl) {
      rrrEl.textContent = bl > 0 && need > 0 ? calculateRRR(need, bl) : '—';
    }
    
    if (ballsLeftEl) {
      ballsLeftEl.textContent = bl;
    }
  } else {
    if (rrrEl) rrrEl.textContent = '—';
    if (ballsLeftEl) {
      ballsLeftEl.textContent = (totalOvers * 6) - s.balls;
    }
  }
  
  const last6 = s.allBalls.slice(-6).reduce((a, b) => {
    if (b.v === 'W') return a;
    if (b.v === 'NB' || b.v === 'WD') return a + 1;
    return a + b.v;
  }, 0);
  
  if (last6El) {
    last6El.textContent = s.allBalls.length > 0 ? last6 : '—';
  }
}

window.runRate = {
  calculateCRR,
  calculateRRR,
  calculateProjectedScore,
  recordOverData,
  initRunRateData,
  renderRunRateStats
};
