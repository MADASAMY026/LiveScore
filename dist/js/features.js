import { db, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs, onSnapshot, serverTimestamp, addDoc } from './firebase.js';

let currentUser = null;
let unsubscribeChat = null;

function initFeatures() {
  // Expose functions to window
  window.saveProfile = saveProfile;
  window.sendChatMessage = sendChatMessage;
  window.featuresShowPage = featuresShowPage;
  window.switchLeaderboardTab = switchLeaderboardTab;
  window.filterLeaderboard = filterLeaderboard;
  
  // Update navClick to handle new pages
  if (window.navClick) {
    const originalNavClick = window.navClick;
    window.navClick = function(page) {
      switch(page) {
        case 'home':
          featuresShowPage('page-teams');
          window.updateNav('home');
          break;
        case 'chat':
          featuresShowPage('page-chat');
          window.updateNav('chat');
          break;
        case 'leaderboard':
          featuresShowPage('page-leaderboard');
          window.updateNav('leaderboard');
          break;
        case 'admin':
          featuresShowPage('page-admin');
          window.updateNav('admin');
          break;
        case 'points':
          featuresShowPage('page-points');
          window.updateNav('points');
          if (window.pointsTable && window.pointsTable.renderPointsTable) {
            window.pointsTable.renderPointsTable();
          }
          break;
        case 'stats':
          featuresShowPage('page-player-stats');
          window.updateNav('stats');
          if (window.playerStats && window.playerStats.renderPlayerStatsPage) {
            window.playerStats.renderPlayerStatsPage();
          }
          break;
        case 'score':
        case 'squad':
          originalNavClick(page);
          break;
        default:
          originalNavClick(page);
      }
    };
  }
  
  // Update updateNav to handle new items
  if (window.updateNav) {
    const originalUpdateNav = window.updateNav;
    window.updateNav = function(active) {
      document.querySelectorAll('.nav-item').forEach(el=>{
        el.classList.remove('active');
        el.querySelector('.nav-dot').style.display='none';
      });
      const el=document.getElementById(`nav-${active}`);
      if(el){el.classList.add('active');el.querySelector('.nav-dot').style.display='block';}
    };
  }
  
  // Update showPage to handle new pages
  if (window.showPage) {
    const originalShowPage = window.showPage;
    window.showPage = function(pageId) {
      originalShowPage(pageId);
      
      if (pageId === 'page-profile') {
        loadProfile();
      } else if (pageId === 'page-leaderboard') {
        loadLeaderboard();
      } else if (pageId === 'page-history') {
        loadMatchHistory();
      } else if (pageId === 'page-chat') {
        loadChat();
      } else if (pageId === 'page-admin') {
        loadAdminPanel();
      }
    };
  }
}

function featuresShowPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) {
    page.classList.add('active');
    
    // Update theme if needed
    const themeMap = {
      'page-teams':  'theme-teams',
      'page-players':'theme-players',
      'page-toss':   'theme-toss',
      'page-match':  'theme-match',
      'page-end':    'theme-end',
      'page-points': 'theme-teams',
      'page-player-stats': 'theme-teams',
    };
    document.body.className = themeMap[pageId] || 'theme-teams';
    
    if (pageId === 'page-profile') {
      loadProfile();
    } else if (pageId === 'page-leaderboard') {
      loadLeaderboard();
    } else if (pageId === 'page-history') {
      loadMatchHistory();
    } else if (pageId === 'page-chat') {
      loadChat();
    } else if (pageId === 'page-admin') {
      loadAdminPanel();
    } else if (pageId === 'page-player-stats') {
      if (window.playerStats && window.playerStats.renderPlayerStatsPage) {
        window.playerStats.renderPlayerStatsPage();
      }
    }
  }
}

async function loadProfile() {
  const authUser = window.firebaseAuth?.currentUser;
  if (!authUser) return;
  
  const userRef = doc(db, 'users', authUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    currentUser = userSnap.data();
    window.currentUser = currentUser;
    document.getElementById('profile-name').textContent = currentUser.displayName;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('stat-matches').textContent = currentUser.matchesPlayed || 0;
    document.getElementById('stat-wins').textContent = currentUser.wins || 0;
    document.getElementById('stat-points').textContent = currentUser.points || 0;
    document.getElementById('edit-display-name').value = currentUser.displayName;
    
    if (currentUser.photoURL) {
      document.getElementById('profile-avatar').innerHTML = `<img src="${currentUser.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
    }
    
    if (currentUser.isAdmin) {
      const nav = document.querySelector('.bottom-nav');
      const adminExists = document.getElementById('nav-admin');
      if (!adminExists) {
        const adminItem = document.createElement('div');
        adminItem.className = 'nav-item';
        adminItem.id = 'nav-admin';
        adminItem.innerHTML = `<span style="font-size:20px;">⚙️</span><span>Admin</span><div class="nav-dot"></div>`;
        adminItem.onclick = () => {
          window.navClick && window.navClick('admin');
        };
        nav.appendChild(adminItem);
      }
    }
  }
}

async function saveProfile() {
  const authUser = window.firebaseAuth?.currentUser;
  if (!authUser) return;
  
  const newDisplayName = document.getElementById('edit-display-name').value.trim();
  if (!newDisplayName) return;
  
  const userRef = doc(db, 'users', authUser.uid);
  await updateDoc(userRef, {
    displayName: newDisplayName
  });
  
  currentUser.displayName = newDisplayName;
  document.getElementById('profile-name').textContent = newDisplayName;
}

let currentLeaderboardTab = 'global';
let allLeaderboardUsers = [];

function switchLeaderboardTab(tab) {
  currentLeaderboardTab = tab;
  document.querySelectorAll('.leaderboard-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  loadLeaderboard();
}

function filterLeaderboard(query) {
  const filtered = allLeaderboardUsers.filter(user => 
    user.displayName?.toLowerCase().includes(query.toLowerCase()) || 
    user.email?.toLowerCase().includes(query.toLowerCase())
  );
  renderLeaderboard(filtered);
}

function renderLeaderboard(users) {
  const listEl = document.getElementById('leaderboard-list');
  if (!listEl) return;
  let html = '';
  let rank = 1;
  
  users.forEach((user) => {
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const avatar = user.photoURL ? `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : '👤';
    const matchesPlayed = user.matchesPlayed || 0;
    const wins = user.wins || 0;
    const winPercent = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
    const highestScore = user.highestScore || 0;
    const trophyIcon = rank === 1 ? '🏆' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    
    html += `
      <div class="leaderboard-item">
        <div class="leaderboard-rank ${rankClass}">
          ${trophyIcon}
          <span style="font-weight:800;">${rank}</span>
        </div>
        <div class="leaderboard-avatar">${avatar}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${user.displayName}</div>
          <div class="leaderboard-email">${user.email}</div>
          <div class="leaderboard-stats">
            <span class="lb-stat">🎮 ${matchesPlayed} matches</span>
            <span class="lb-stat">✅ ${wins} wins</span>
            <span class="lb-stat">📊 ${winPercent}% WR</span>
            <span class="lb-stat">🔥 ${highestScore} high score</span>
          </div>
        </div>
        <div class="leaderboard-points">
          <div class="lb-points-label">PTS</div>
          <div class="lb-points-value">${user.points || 0}</div>
        </div>
      </div>
    `;
    rank++;
  });
  
  listEl.innerHTML = html || '<div style="text-align:center;color:var(--muted);padding:40px;font-size:14px;">No users found</div>';
}

async function loadLeaderboard() {
  const leaderboardRef = collection(db, 'users');
  let q;
  
  if (currentLeaderboardTab === 'global') {
    q = query(leaderboardRef, orderBy('points', 'desc'), limit(50));
  } else if (currentLeaderboardTab === 'tournament') {
    q = query(leaderboardRef, orderBy('tournamentPoints', 'desc'), limit(50));
  } else {
    q = query(leaderboardRef, orderBy('weeklyPoints', 'desc'), limit(50));
  }
  
  const querySnapshot = await getDocs(q);
  allLeaderboardUsers = [];
  
  querySnapshot.forEach((doc) => {
    allLeaderboardUsers.push({ ...doc.data(), id: doc.id });
  });
  
  // Filter out any empty entries and sort by points
  allLeaderboardUsers = allLeaderboardUsers
    .filter(u => u.displayName)
    .sort((a, b) => {
      const ptsA = currentLeaderboardTab === 'global' ? (a.points || 0) : 
                   currentLeaderboardTab === 'tournament' ? (a.tournamentPoints || 0) : 
                   (a.weeklyPoints || 0);
      const ptsB = currentLeaderboardTab === 'global' ? (b.points || 0) : 
                   currentLeaderboardTab === 'tournament' ? (b.tournamentPoints || 0) : 
                   (b.weeklyPoints || 0);
      return ptsB - ptsA;
    });
  
  renderLeaderboard(allLeaderboardUsers);
}

async function loadMatchHistory() {
  const authUser = window.firebaseAuth?.currentUser;
  if (!authUser) return;
  
  const historyRef = collection(db, 'matches');
  const q = query(historyRef, orderBy('createdAt', 'desc'), limit(50));
  const querySnapshot = await getDocs(q);
  
  const listEl = document.getElementById('history-list');
  let html = '';
  
  querySnapshot.forEach((docSnap) => {
    const match = docSnap.data();
    if (match.userId !== authUser.uid) return;
    
    const isWin = match.winner;
    const resultClass = isWin ? 'win' : 'lose';
    const resultText = isWin ? 'WON' : 'LOST';
    const date = match.createdAt?.toDate ? match.createdAt.toDate().toLocaleDateString() : 'Recent';
    
    html += `
      <div class="history-item">
        <div class="history-teams">
          <div class="history-team">
            <div class="history-team-badge" style="background:${match.teamAColor || '#FF6B00'};">${match.teamA || 'A'}</div>
            <div style="font-weight:700;">${match.teamAScore || 0}</div>
          </div>
          <div class="history-result ${resultClass}">${resultText}</div>
          <div class="history-team" style="justify-content:flex-end;">
            <div style="font-weight:700;">${match.teamBScore || 0}</div>
            <div class="history-team-badge" style="background:${match.teamBColor || '#0099FF'};">${match.teamB || 'B'}</div>
          </div>
        </div>
        <div class="history-date">${date}</div>
      </div>
    `;
  });
  
  listEl.innerHTML = html || '<div style="text-align:center;color:var(--muted);padding:20px;">No matches yet</div>';
}

function loadChat() {
  if (unsubscribeChat) {
    unsubscribeChat();
  }
  
  const chatRef = collection(db, 'chat');
  const q = query(chatRef, orderBy('createdAt', 'desc'), limit(50));
  
  unsubscribeChat = onSnapshot(q, (querySnapshot) => {
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    messages.reverse();
    renderMessages(messages);
  });
}

function renderMessages(messages) {
  const authUser = window.firebaseAuth?.currentUser;
  const listEl = document.getElementById('chat-messages');
  let html = '';
  
  messages.forEach((msg) => {
    const isOwn = authUser && msg.userId === authUser.uid;
    const avatar = msg.userPhoto ? `<img src="${msg.userPhoto}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : '👤';
    
    html += `
      <div class="chat-message ${isOwn ? 'own' : ''}">
        <div class="chat-avatar">${avatar}</div>
        <div class="chat-bubble">
          <div class="chat-name">${msg.userName}</div>
          <div class="chat-text">${msg.text}</div>
        </div>
      </div>
    `;
  });
  
  listEl.innerHTML = html;
  listEl.scrollTop = listEl.scrollHeight;
}

async function sendChatMessage() {
  const authUser = window.firebaseAuth?.currentUser;
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  
  if (!authUser || !text) return;
  
  const chatRef = collection(db, 'chat');
  await addDoc(chatRef, {
    userId: authUser.uid,
    userName: currentUser?.displayName || authUser.email?.split('@')[0],
    userPhoto: currentUser?.photoURL || '',
    text: text,
    createdAt: serverTimestamp()
  });
  
  input.value = '';
}

async function loadAdminPanel() {
  const authUser = window.firebaseAuth?.currentUser;
  if (!authUser) return;
  
  const userRef = doc(db, 'users', authUser.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists() || !userSnap.data().isAdmin) {
    document.getElementById('admin-content').innerHTML = '<div style="text-align:center;color:var(--red);padding:40px;">Access Denied</div>';
    return;
  }
  
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('createdAt', 'desc'), limit(50));
  const querySnapshot = await getDocs(q);
  
  let html = `
    <div class="admin-section">
      <div class="admin-section-title">USER MANAGEMENT</div>
  `;
  
  querySnapshot.forEach((doc) => {
    const user = doc.data();
    const avatar = user.photoURL ? `<img src="${user.photoURL}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : '👤';
    const adminBtnText = user.isAdmin ? 'Remove Admin' : 'Make Admin';
    const adminBtnClass = user.isAdmin ? 'remove-admin' : 'make-admin';
    
    html += `
      <div class="admin-user-item">
        <div class="admin-user-info">
          <div class="admin-user-avatar">${avatar}</div>
          <div>
            <div class="admin-user-name">${user.displayName}</div>
            <div class="admin-user-email">${user.email} ${user.isAdmin ? '<span style="color:var(--blue);font-weight:700;">(Admin)</span>' : ''}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="admin-btn ${adminBtnClass}" onclick="toggleAdmin('${doc.id}', ${!user.isAdmin})">${adminBtnText}</button>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  document.getElementById('admin-content').innerHTML = html;
}

window.toggleAdmin = async function(userId, makeAdmin) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isAdmin: makeAdmin
  });
  loadAdminPanel();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeatures);
} else {
  initFeatures();
}

window.features = {
  featuresShowPage,
  loadProfile,
  loadLeaderboard,
  loadMatchHistory,
  loadChat,
  loadAdminPanel
};
