import { auth, googleProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, onAuthStateChanged, signOut, db, doc, setDoc, getDoc, serverTimestamp } from './firebase.js';

async function saveUserData(user, isNew = false) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      matchesPlayed: userSnap.exists() ? userSnap.data().matchesPlayed : 0,
      wins: userSnap.exists() ? userSnap.data().wins : 0,
      points: userSnap.exists() ? userSnap.data().points : 0,
      isAdmin: userSnap.exists() ? userSnap.data().isAdmin : false,
      lastLogin: serverTimestamp()
    };
    
    if (!userSnap.exists()) {
      await setDoc(userRef, userData);
    } else {
      await setDoc(userRef, userData, { merge: true });
    }
    
    window.currentUser = userData;
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

function showError(message) {
  const errDiv = document.getElementById('auth-error');
  if(errDiv) {
    errDiv.textContent = message;
    errDiv.style.display = 'block';
    setTimeout(() => { errDiv.style.display = 'none'; }, 5000);
  }
}

// Global functions for inline HTML onclick handlers
window.handleLogin = async () => {
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-password').value;
  if(!email || !pass) return showError("Please enter email and password.");
  
  try {
    const btn = document.getElementById('btn-login');
    btn.textContent = 'SIGNING IN...';
    btn.disabled = true;
    
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    await saveUserData(userCredential.user, false);
    // Success will be handled by onAuthStateChanged
  } catch (error) {
    showError(error.message);
    const btn = document.getElementById('btn-login');
    btn.textContent = 'SIGN IN';
    btn.disabled = false;
  }
};

window.handleRegister = async () => {
  const email = document.getElementById('auth-email').value;
  const pass = document.getElementById('auth-password').value;
  if(!email || !pass) return showError("Please enter email and password.");
  
  try {
    const btn = document.getElementById('btn-register');
    btn.textContent = 'CREATING...';
    btn.disabled = true;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await saveUserData(userCredential.user, true);
    // Success will be handled by onAuthStateChanged
  } catch (error) {
    showError(error.message);
    const btn = document.getElementById('btn-register');
    btn.textContent = 'CREATE ACCOUNT';
    btn.disabled = false;
  }
};

window.handleGoogleLogin = async () => {
  try {
    const btn = document.getElementById('btn-google');
    btn.textContent = 'CONNECTING...';
    btn.disabled = true;
    
    const userCredential = await signInWithPopup(auth, googleProvider);
    await saveUserData(userCredential.user, true);
  } catch (error) {
    showError(error.message);
    const btn = document.getElementById('btn-google');
    btn.textContent = '🌐 SIGN IN WITH GOOGLE';
    btn.disabled = false;
  }
};

window.handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};

// Monitor authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User logged in: ", user.email);
    await saveUserData(user, false);
    
    // Hide auth page, show teams page
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const teamsPage = document.getElementById('page-teams');
    if (teamsPage) teamsPage.classList.add('active');
    document.body.className = 'theme-teams';
    window.updateNav && window.updateNav('home');
    
    // Add logout and profile button to header if it doesn't exist
    const headerInner = document.querySelector('.header-inner');
    if(headerInner && !document.getElementById('header-btns')) {
      const headerBtns = document.createElement('div');
      headerBtns.id = 'header-btns';
      headerBtns.style.display = 'flex';
      headerBtns.style.gap = '12px';
      
      const profileBtn = document.createElement('div');
      profileBtn.id = 'profile-btn';
      profileBtn.innerHTML = '👤';
      profileBtn.style.cursor = 'pointer';
      profileBtn.style.fontSize = '20px';
      profileBtn.onclick = () => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const profilePage = document.getElementById('page-profile');
        if (profilePage) {
          profilePage.classList.add('active');
          window.features && window.features.loadProfile && window.features.loadProfile();
        }
      };
      
      const logoutBtn = document.createElement('div');
      logoutBtn.id = 'logout-btn';
      logoutBtn.innerHTML = '🚪';
      logoutBtn.style.cursor = 'pointer';
      logoutBtn.style.fontSize = '20px';
      logoutBtn.onclick = window.handleLogout;
      
      headerBtns.appendChild(profileBtn);
      headerBtns.appendChild(logoutBtn);
      headerInner.appendChild(headerBtns);
    }
    
  } else {
    console.log("User logged out");
    window.currentUser = null;
    
    // Show auth page, hide other pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-auth').classList.add('active');
    
    const headerBtns = document.getElementById('header-btns');
    if(headerBtns) headerBtns.remove();
  }
});
