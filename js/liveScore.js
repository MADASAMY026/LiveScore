// Live Score System with Firebase
let currentLiveMatchId = null;
let liveMatchUnsubscribe = null;
let liveCommentaryUnsubscribe = null;

// Initialize live score system
function initLiveScore() {
  window.startLiveMatch = startLiveMatch;
  window.stopLiveMatch = stopLiveMatch;
  window.updateLiveScore = updateLiveScore;
  window.addLiveCommentary = addLiveCommentary;
}

// Start a live match
async function startLiveMatch(matchData) {
  try {
    if (!window.firebaseDb) return;
    
    const matchRef = window.collection(window.firebaseDb, 'live_matches');
    const docRef = await window.addDoc(matchRef, {
      ...matchData,
      status: 'LIVE',
      innings: 1,
      battingTeam: matchData.teamA,
      bowlingTeam: matchData.teamB,
      runs: 0,
      wickets: 0,
      balls: 0,
      target: null,
      partnership: { runs: 0, balls: 0 },
      striker: null,
      nonStriker: null,
      bowler: null,
      createdAt: window.serverTimestamp(),
      updatedAt: window.serverTimestamp()
    });
    
    currentLiveMatchId = docRef.id;
    
    // Subscribe to real-time updates
    liveMatchUnsubscribe = window.onSnapshot(window.doc(window.firebaseDb, 'live_matches', docRef.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        updateUIFromLiveData(data);
      }
    });
    
    // Subscribe to live commentary
    const commentaryRef = window.query(
      window.collection(window.firebaseDb, 'live_matches', docRef.id, 'commentary'),
      window.orderBy('createdAt', 'desc'),
      window.limit(20)
    );
    liveCommentaryUnsubscribe = window.onSnapshot(commentaryRef, (snapshot) => {
      const comments = [];
      snapshot.forEach(doc => comments.push({ id: doc.id, ...doc.data() }));
      updateLiveCommentaryUI(comments.reverse());
    });
    
    return docRef.id;
  } catch (e) {
    console.error('Error starting live match:', e);
    return null;
  }
}

// Update live score
async function updateLiveScore(data) {
  if (!currentLiveMatchId || !window.firebaseDb) return;
  
  try {
    await window.updateDoc(window.doc(window.firebaseDb, 'live_matches', currentLiveMatchId), {
      ...data,
      updatedAt: window.serverTimestamp()
    });
  } catch (e) {
    console.error('Error updating live score:', e);
  }
}

// Add live commentary
async function addLiveCommentary(text) {
  if (!currentLiveMatchId || !window.firebaseDb) return;
  
  try {
    await window.addDoc(
      window.collection(window.firebaseDb, 'live_matches', currentLiveMatchId, 'commentary'),
      {
        text,
        createdAt: window.serverTimestamp()
      }
    );
  } catch (e) {
    console.error('Error adding commentary:', e);
  }
}

// Stop live match
async function stopLiveMatch(finalStatus = 'FINISHED') {
  if (!currentLiveMatchId || !window.firebaseDb) return;
  
  try {
    await window.updateDoc(window.doc(window.firebaseDb, 'live_matches', currentLiveMatchId), {
      status: finalStatus,
      updatedAt: window.serverTimestamp()
    });
    
    if (liveMatchUnsubscribe) liveMatchUnsubscribe();
    if (liveCommentaryUnsubscribe) liveCommentaryUnsubscribe();
    
    currentLiveMatchId = null;
  } catch (e) {
    console.error('Error stopping live match:', e);
  }
}

// Update UI from live data
function updateUIFromLiveData(data) {
  // Update scoreboard
  if (window.renderAll) {
    window.renderAll();
  }
  
  // Update header badge
  const headerBadge = document.getElementById('header-badge');
  if (headerBadge) {
    if (data.status === 'LIVE') {
      headerBadge.textContent = 'LIVE 🔴';
      headerBadge.style.background = 'linear-gradient(90deg, #ff4444, #ff6b00)';
    } else if (data.status === 'INNINGS_BREAK') {
      headerBadge.textContent = 'INNINGS BREAK';
      headerBadge.style.background = 'linear-gradient(90deg, #ffc107, #ff9800)';
    } else {
      headerBadge.textContent = 'FINISHED';
      headerBadge.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
    }
  }
}

// Update live commentary UI
function updateLiveCommentaryUI(comments) {
  const container = document.getElementById('live-commentary');
  if (!container) return;
  
  container.innerHTML = comments.map(c => `
    <div class="commentary-item">
      <div class="commentary-text">${c.text}</div>
      <div class="commentary-time">${c.createdAt?.toDate ? c.createdAt.toDate().toLocaleTimeString() : 'Just now'}</div>
    </div>
  `).join('');
}

// Score animations
function playFourAnimation() {
  const scoreEl = document.querySelector('.score');
  if (scoreEl) {
    scoreEl.classList.add('four-animate');
    setTimeout(() => scoreEl.classList.remove('four-animate'), 800);
  }
}

function playSixAnimation() {
  const scoreEl = document.querySelector('.score');
  if (scoreEl) {
    scoreEl.classList.add('six-animate');
    setTimeout(() => scoreEl.classList.remove('six-animate'), 800);
  }
}

function playWicketAnimation() {
  const scoreEl = document.querySelector('.score');
  if (scoreEl) {
    scoreEl.classList.add('wicket-animate');
    setTimeout(() => scoreEl.classList.remove('wicket-animate'), 800);
  }
}

// Expose animation functions
window.playFourAnimation = playFourAnimation;
window.playSixAnimation = playSixAnimation;
window.playWicketAnimation = playWicketAnimation;

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLiveScore);
} else {
  initLiveScore();
}
