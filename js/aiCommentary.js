let commentaryHistory = [];
const maxHistoryLength = 10;
let voiceEnabled = true;
let voices = [];
let voicesLoaded = false;

function loadVoices() {
  try {
    voices = speechSynthesis.getVoices();
    voicesLoaded = true;
  } catch (e) {
    console.log('Voice loading error:', e);
    voicesLoaded = false;
  }
}

function initSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    try {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } catch (e) {
      console.log('Speech synthesis init error:', e);
    }
  }
}

function speak(text) {
  if (!voiceEnabled) return;
  
  try {
    if (!('speechSynthesis' in window)) {
      return;
    }
    
    speechSynthesis.cancel();
    const cleanText = text.replace(/[^\w\s]/gi, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;
    
    if (voicesLoaded && voices.length > 0) {
      const englishVoices = voices.filter(v => v.lang.toLowerCase().includes('en'));
      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }
    }
    
    speechSynthesis.speak(utterance);
  } catch (e) {
    console.log('Speech error:', e);
  }
}

const commentaryTemplates = {
  four: [
    "What a shot!",
    "Magnificent strokeplay!",
    "That's racing away to the boundary!",
    "Cracking drive!",
    "Sheer timing!",
    "Boundary!"
  ],
  six: [
    "IT'S OUT OF THE GROUND!",
    "MONSTER HIT!",
    "What a maximum!",
    "That's huge!",
    "SIX! SIX! SIX!",
    "Over the ropes!"
  ],
  wicket: [
    "WICKET!",
    "GONE! That's a big wicket!",
    "Bowled him!",
    "What a delivery!",
    "That's the breakthrough!",
    "OUT! Big wicket!"
  ],
  single: [
    "Good running!",
    "Smart single!",
    "Quick single!"
  ],
  double: [
    "Well run!",
    "Two good runs!"
  ],
  triple: [
    "Excellent running!",
    "Three runs! Great effort!"
  ],
  dot: [
    "Good ball!",
    "Dot ball! Tight stuff!",
    "Defended well!"
  ],
  nb: [
    "No Ball! Free hit!",
    "Oh, that's a no ball!",
    "Free hit coming up!"
  ],
  wd: [
    "Wide! Extra run!",
    "That's a wide!",
    "Wide ball! Extra run!"
  ],
  bye: [
    "Byes! Good running!",
    "Byes taken!"
  ],
  legbye: [
    "Leg byes!",
    "Leg byes taken!"
  ]
};

function getRandomCommentary(eventType) {
  const templates = commentaryTemplates[eventType];
  if (!templates) return null;
  return templates[Math.floor(Math.random() * templates.length)];
}

function addCommentary(text) {
  commentaryHistory.unshift(text);
  if (commentaryHistory.length > maxHistoryLength) {
    commentaryHistory.pop();
  }
  renderCommentary();
  speak(text);
}

function processBallEvent(ballValue, batsman, bowler, innings) {
  let eventType = null;
  let text = null;

  if (ballValue === 'W') {
    eventType = 'wicket';
    text = getRandomCommentary('wicket');
  } else if (ballValue === 4) {
    eventType = 'four';
    text = getRandomCommentary('four');
  } else if (ballValue === 6) {
    eventType = 'six';
    text = getRandomCommentary('six');
  } else if (ballValue === 1) {
    eventType = 'single';
    text = getRandomCommentary('single');
  } else if (ballValue === 2) {
    eventType = 'double';
    text = getRandomCommentary('double');
  } else if (ballValue === 3) {
    eventType = 'triple';
    text = getRandomCommentary('triple');
  } else if (ballValue === 0) {
    eventType = 'dot';
    text = getRandomCommentary('dot');
  } else if (ballValue === 'NB') {
    eventType = 'nb';
    text = getRandomCommentary('nb');
  } else if (ballValue === 'WD') {
    eventType = 'wd';
    text = getRandomCommentary('wd');
  } else if (ballValue === 'B') {
    eventType = 'bye';
    text = getRandomCommentary('bye');
  } else if (ballValue === 'LB') {
    eventType = 'legbye';
    text = getRandomCommentary('legbye');
  }

  if (text) {
    addCommentary(text);
  }
}

function processWicket() {
  const text = getRandomCommentary('wicket');
  if (text) addCommentary(text);
}

function processExtra(type, runs = 0) {
  let eventType = null;
  if (type === 'NB') eventType = 'nb';
  else if (type === 'WD') eventType = 'wd';
  else if (type === 'B') eventType = 'bye';
  else if (type === 'LB') eventType = 'legbye';
  
  let text = null;
  if (eventType) text = getRandomCommentary(eventType);
  if (text) addCommentary(text);
  
  if (runs === 4) {
    const boundaryText = getRandomCommentary('four');
    if (boundaryText) addCommentary(boundaryText);
  } else if (runs === 6) {
    const sixText = getRandomCommentary('six');
    if (sixText) addCommentary(sixText);
  } else if (runs === 1) {
    const singleText = getRandomCommentary('single');
    if (singleText) addCommentary(singleText);
  } else if (runs === 2) {
    const doubleText = getRandomCommentary('double');
    if (doubleText) addCommentary(doubleText);
  } else if (runs === 3) {
    const tripleText = getRandomCommentary('triple');
    if (tripleText) addCommentary(tripleText);
  }
}

function renderCommentary() {
  try {
    const container = document.getElementById('commentary-container');
    if (!container) return;
    
    container.innerHTML = commentaryHistory.map(text => `
      <div class="commentary-item">
        <div class="commentary-text">${text}</div>
      </div>
    `).join('');
  } catch (e) {
    console.log('Render commentary error:', e);
  }
}

function initCommentary() {
  commentaryHistory = [];
  addCommentary("Welcome to the match! 🏏");
  addCommentary("Let's play! 🎉");
}

function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  try {
    const btn = document.getElementById('voice-toggle-btn');
    if (btn) {
      btn.textContent = voiceEnabled ? '🔊 VOICE ON' : '🔇 VOICE OFF';
    }
  } catch (e) {
    console.log('Toggle voice error:', e);
  }
}

window.aiCommentary = {
  processBallEvent,
  initCommentary,
  addCommentary,
  processWicket,
  processExtra,
  toggleVoice,
  getVoiceEnabled: () => voiceEnabled
};

initSpeechSynthesis();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCommentary);
} else {
  initCommentary();
}
