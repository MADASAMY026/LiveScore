function buildTeamGrids(){
  ['A','B'].forEach(side=>{
    const grid = document.getElementById(`teams${side}-grid`);
    grid.innerHTML='';
    Object.entries(TEAMS).forEach(([key,t])=>{
      const d=document.createElement('div');
      d.className='team-select-card';
      d.id=`tcard-${side}-${key}`;
      const tc = TEAM_COLORS[key] || {top:t.color, bottom:'#0a0a14'};
      d.style.background = tc.top;
      d.style.borderColor = tc.top+'88';
      const logoImg = TEAM_LOGOS[key];
      d.style.borderColor = tc.top+'66';
      
      // Add edit icon
      const editIcon = document.createElement('button');
      editIcon.className = 'team-edit-btn';
      editIcon.innerHTML = '✏️';
      editIcon.onclick = (e) => {
        e.stopPropagation();
        openTeamModal(key);
      };
      
      if(logoImg){
        d.innerHTML=`
          <div class="tsc-top" style="background-image:url(${logoImg});"></div>
          <div class="tsc-bottom"><div class="team-short">${t.short}</div></div>`;
      } else {
        d.innerHTML=`
          <div class="tsc-top" style="background:${tc.top};display:flex;align-items:center;justify-content:center;font-size:48px;">${t.logo}</div>
          <div class="tsc-bottom"><div class="team-short">${t.short}</div></div>`;
      }
      
      d.appendChild(editIcon);
      d.onclick=()=>selectTeam(side,key,t);
      grid.appendChild(d);
    });
  });
}

function selectTeam(side,key,t){
  if(side==='A' && key===selTeamB) return;
  if(side==='B' && key===selTeamA) return;
  if(side==='A'){
    selTeamA=key;
    document.querySelectorAll('[id^="tcard-A-"]').forEach(c=>c.classList.remove('picked'));
    document.getElementById(`tcard-A-${key}`).classList.add('picked');
    document.getElementById(`tcard-A-${key}`).style.borderColor=t.color;
    document.getElementById('step1-next').disabled=false;
    // Auto go to step 2 (Team B)
    setTimeout(() => {
      goStep2();
    }, 300);
  } else {
    selTeamB=key;
    document.querySelectorAll('[id^="tcard-B-"]').forEach(c=>c.classList.remove('picked'));
    document.getElementById(`tcard-B-${key}`).classList.add('picked');
    document.getElementById(`tcard-B-${key}`).style.borderColor=t.color;
    // Update summary bar team B
    document.getElementById('sum-b-name').textContent=t.short;
    document.getElementById('sum-b-badge').style.background=t.color;
    if(TEAM_LOGOS[key]){
      document.getElementById('sum-b-badge').innerHTML=`<img src="${TEAM_LOGOS[key]}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;">`;
    } else {
      document.getElementById('sum-b-badge').textContent=t.short.slice(0,3);
    }
    document.getElementById('step2-next').disabled=false;
    // Auto go to step 3 (Venue)
    setTimeout(() => {
      goStep3();
    }, 300);
  }
}

function goStep2(){
  if(!selTeamA) return;
  setStep(2);
  document.querySelectorAll('[id^="tcard-B-"]').forEach(c=>c.classList.remove('disabled-team'));
  document.getElementById(`tcard-B-${selTeamA}`)?.classList.add('disabled-team');
  const ta=TEAMS[selTeamA];
  document.getElementById('sum-a-name').textContent=ta.short;
  document.getElementById('sum-a-badge').style.background=ta.color;
  if(TEAM_LOGOS[selTeamA]){
    document.getElementById('sum-a-badge').innerHTML=`<img src="${TEAM_LOGOS[selTeamA]}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;">`;
  } else {
    document.getElementById('sum-a-badge').textContent=ta.short.slice(0,3);
  }
  document.getElementById('sum-b-name').textContent='—';
  document.getElementById('sel-summary-bar').style.display='flex';
}

function goStep3(){
  if(!selTeamB) return;
  setStep(3);
}

function setStep(n){
  [1,2,3].forEach(i=>{
    $cl(`step${i}`,['toggle','active',i===n]);
    const dot=document.getElementById(`sdot${i}`);
    const lbl=document.getElementById(`slbl${i}`);
    if(dot){ dot.classList.remove('active','done'); }
    if(lbl){ lbl.classList.remove('active','done'); }
    if(i<n){ if(dot){dot.classList.add('done');dot.textContent='✓';} if(lbl) lbl.classList.add('done'); }
    else if(i===n){ if(dot) dot.classList.add('active'); if(lbl) lbl.classList.add('active'); }
  });
  $cl('sline1',['toggle','done',n>1]);
  $cl('sline2',['toggle','done',n>2]);
  window.scrollTo({top:0,behavior:'smooth'});
}

function checkTeamsNext(){
  // legacy — no longer needed but kept for safety
}

function buildStadiumGrid(){
  const grid=document.getElementById('stadium-grid');
  grid.innerHTML='';
  STADIUMS.forEach((s,i)=>{
    const d=document.createElement('div');
    d.className='stadium-card'+(i===0?' picked':'');
    const sImg = STADIUM_IMAGES[s.name];
    if(sImg){
      d.className='stadium-card'+(i===0?' picked':'');
      d.innerHTML=`<img class="stadium-img" src="${sImg}" alt="${s.name}"><div class="stadium-info"><div class="stadium-name">${s.name}</div><div class="stadium-city">${s.city}</div></div>`;
    } else {
      d.className='stadium-card-plain'+(i===0?' picked':'');
      d.innerHTML=`<div style="font-size:24px;margin-bottom:4px">${s.emoji}</div><div class="stadium-name" style="color:var(--text)">${s.name}</div><div class="stadium-city">${s.city}</div>`;
    }
    d.onclick=()=>{
      document.querySelectorAll('.stadium-card,.stadium-card-plain').forEach(c=>c.classList.remove('picked'));
      d.classList.add('picked');
      selStadium=s;
      // Auto go to players page
      setTimeout(() => {
        goToPlayers();
      }, 300);
    };
    grid.appendChild(d);
  });
}

function goToPlayers(){
  totalOvers=parseInt(document.getElementById('total-overs').value)||20;
  selectedA=[]; selectedB=[];
  buildPlayerPool('A');
  buildPlayerPool('B');
  const ta=TEAMS[selTeamA], tb=TEAMS[selTeamB];
  document.getElementById('players-title').textContent=`${ta.short} vs ${tb.short}`;
  // Use img if logo available, else emoji — set via innerHTML on span
  const logoA = TEAM_LOGOS[selTeamA] ? `<img src="${TEAM_LOGOS[selTeamA]}" style="width:20px;height:20px;object-fit:contain;border-radius:3px;vertical-align:middle;">` : `<span>${ta.logo}</span>`;
  const logoB = TEAM_LOGOS[selTeamB] ? `<img src="${TEAM_LOGOS[selTeamB]}" style="width:20px;height:20px;object-fit:contain;border-radius:3px;vertical-align:middle;">` : `<span>${tb.logo}</span>`;
  document.getElementById('ptab-a-name').innerHTML=`${logoA} ${ta.short}`;
  document.getElementById('ptab-b-name').innerHTML=`${logoB} ${tb.short}`;
  document.getElementById('ptab-a-count').textContent='0/11';
  document.getElementById('ptab-b-count').textContent='0/11';
  // Style tabs with team colors
  document.getElementById('ptab-A').style.setProperty('--tab-color', ta.color);
  document.getElementById('ptab-B').style.setProperty('--tab-color', tb.color);
  switchPlayerTab('A');
  showPage('page-players');
  updateNav('squad');
}

function switchPlayerTab(side){
  ['A','B'].forEach(s=>{
    document.getElementById(`ptab-${s}`).classList.toggle('active', s===side);
    document.getElementById(`tpanel-${s}`).classList.toggle('active', s===side);
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

function buildPlayerPool(side){
  const key=side==='A'?selTeamA:selTeamB;
  const players=TEAMS[key].players;
  const pool=document.getElementById(`pool${side}`);
  pool.innerHTML='';
  players.forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='player-card';
    d.id=`pc-${side}-${i}`;
    const tc = TEAMS[key].color;
    const roleColors = {BAT:'#3498db',BOWL:'#e74c3c',ALL:'#f39c12','WK-BAT':'#9b59b6'};
    const rc = roleColors[p.role]||'#888';
    const jerseyAvatar = `<svg width="42" height="42" viewBox="0 0 42 42" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="jg${side}${i}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${tc};stop-opacity:1"/>
          <stop offset="100%" style="stop-color:${tc}99;stop-opacity:1"/>
        </linearGradient>
      </defs>
      <circle cx="21" cy="21" r="20" fill="url(#jg${side}${i})" stroke="${tc}" stroke-width="1.5"/>
      <text x="21" y="17" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="8" fill="rgba(255,255,255,0.7)" letter-spacing="1">${p.role}</text>
      <text x="21" y="30" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="16" font-weight="900" fill="#fff">${p.num}</text>
    </svg>`;
    d.innerHTML=`
      <div class="player-avatar" style="background:transparent;border-color:${tc}66;padding:0;overflow:hidden;">${jerseyAvatar}</div>
      <div class="player-info">
        <div class="p-name">${p.name}</div>
        <div class="p-role" style="color:${rc}">${p.role}</div>
      </div>
      <div class="p-check">✓</div>`;
    // Edit icon (pencil)
    const editIcon = document.createElement('span');
    editIcon.className = 'p-edit';
    editIcon.innerHTML = '✏️';
    editIcon.onclick = (e) => { e.stopPropagation(); openEditModal(side, i, key); };
    d.appendChild(editIcon);

    d.onclick=()=>togglePlayer(side,i,key);
    pool.appendChild(d);
  });

  // Add player button
  const addBtn = document.createElement('button');
  addBtn.className = 'add-player-btn';
  addBtn.innerHTML = '＋ ADD PLAYER';
  addBtn.onclick = () => openAddModal(side, key);
  pool.appendChild(addBtn);
}

function togglePlayer(side,idx,teamKey){
  const sel=side==='A'?selectedA:selectedB;
  const id=`pc-${side}-${idx}`;
  const card=document.getElementById(id);
  if(sel.includes(idx)){
    sel.splice(sel.indexOf(idx),1);
    card.classList.remove('selected');
  } else {
    if(sel.length>=11) return;
    sel.push(idx);
    card.classList.add('selected');
  }
  const tabCountId=side==='A'?'ptab-a-count':'ptab-b-count';
  document.getElementById(tabCountId).textContent=`${sel.length}/11`;
  // Auto-switch to B tab after A is full
  if(side==='A' && sel.length===11){
    setTimeout(()=>switchPlayerTab('B'),300);
  }
  TEAMS[teamKey].players.forEach((_,i)=>{
    const c=document.getElementById(`pc-${side}-${i}`);
    if(!sel.includes(i)&&sel.length>=11) c.classList.add('disabled');
    else c.classList.remove('disabled');
  });
  checkPlayersNext();
}

function checkPlayersNext(){
  document.getElementById('players-next-btn').disabled=!(selectedA.length===11&&selectedB.length===11);
}

// ===================== TOSS =====================

function navClick(id){
  if(id==='home'){ showPage('page-teams'); updateNav('home'); }
  else if(id==='score'){ showPage('page-match'); updateNav('score'); renderAll(); }
  else if(id==='squad'){ showPage('page-players'); updateNav('squad'); }
  else if(id==='points'){ 
    showPage('page-points'); 
    updateNav('points');
    if (window.pointsTable && window.pointsTable.renderPointsTable) {
      window.pointsTable.renderPointsTable();
    }
  }
  else if(id==='stats'){ showPage('page-end'); updateNav('stats'); }
  else if (window.navClickExtra) {
    window.navClickExtra(id);
  }
}

function updateNav(active){
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.classList.remove('active');
    const dot = el.querySelector('.nav-dot');
    if (dot) dot.style.display='none';
  });
  const el=document.getElementById(`nav-${active}`);
  if(el){
    el.classList.add('active');
    const dot = el.querySelector('.nav-dot');
    if (dot) dot.style.display='block';
  }
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const pg=document.getElementById(id); if(pg) pg.classList.add('active');
  const themeMap = {
    'page-teams':  'theme-teams',
    'page-players':'theme-players',
    'page-toss':   'theme-toss',
    'page-match':  'theme-match',
    'page-end':    'theme-end',
    'page-points': 'theme-teams',
  };
  document.body.className = themeMap[id] || 'theme-teams';
}

function playAgain(){
  selTeamA=null;selTeamB=null;selStadium=STADIUMS[0];
  selectedA=[];selectedB=[];innings=1;viewInnings=1;matchOver=false;
  tossWinner=null;batChoice=null;
  inn[1]={batting:[],bowling:[],runs:0,wickets:0,balls:0,batStats:{},bowlStats:{},allBalls:[],striker:null,nonStriker:null,bowler:null};
  inn[2]={batting:[],bowling:[],runs:0,wickets:0,balls:0,batStats:{},bowlStats:{},allBalls:[],striker:null,nonStriker:null,bowler:null};
  superOverCount=0; soInn={}; soInnings=1; soRound=0; inSuperOver=false;
  totalOvers=parseInt(document.getElementById('total-overs').value)||20;
  document.getElementById('super-over-history').style.display='none';
  document.getElementById('super-over-btn').style.display='none';
  document.getElementById('header-badge').textContent='SELECT';
  document.getElementById('sel-summary-bar').style.display='none';
  document.getElementById('step1-next').disabled=true;
  document.getElementById('step2-next').disabled=true;
  // Reset step dots text
  [1,2,3].forEach(i=>{ const d=document.getElementById(`sdot${i}`); if(d) d.textContent=i; });
  setStep(1);
  buildTeamGrids();buildStadiumGrid();
  showPage('page-teams');updateNav('home');
}

// ===================== MODAL =====================
let _modalSide=null, _modalIdx=null, _modalTeamKey=null, _modalMode='edit';

function openEditModal(side, idx, teamKey){
  _modalSide=side; _modalIdx=idx; _modalTeamKey=teamKey; _modalMode='edit';
  const p = TEAMS[teamKey].players[idx];
  document.getElementById('modal-title').textContent = 'EDIT PLAYER';
  document.getElementById('modal-name').value = p.name;
  document.getElementById('modal-num').value = p.num;
  document.getElementById('modal-role').value = p.role;
  document.getElementById('modal-delete-btn').classList.remove('hidden');
  document.getElementById('edit-modal').classList.remove('hidden');
}

function openAddModal(side, teamKey){
  _modalSide=side; _modalIdx=null; _modalTeamKey=teamKey; _modalMode='add';
  document.getElementById('modal-title').textContent = 'ADD PLAYER';
  document.getElementById('modal-name').value = '';
  document.getElementById('modal-num').value = '';
  document.getElementById('modal-role').value = 'BAT';
  document.getElementById('modal-delete-btn').classList.add('hidden');
  document.getElementById('edit-modal').classList.remove('hidden');
}

function closeModal(){
  document.getElementById('edit-modal').classList.add('hidden');
}

function savePlayer(){
  const name = document.getElementById('modal-name').value.trim();
  const num  = parseInt(document.getElementById('modal-num').value)||0;
  const role = document.getElementById('modal-role').value;
  if(!name){ alert('Enter player name!'); return; }
  if(_modalMode==='edit'){
    const p = TEAMS[_modalTeamKey].players[_modalIdx];
    p.name = name; p.num = num; p.role = role;
  } else {
    TEAMS[_modalTeamKey].players.push({name, num, role, emoji:'🏏'});
  }
  closeModal();
  buildPlayerPool(_modalSide);
  // Re-restore selections
  const sel = _modalSide==='A' ? selectedA : selectedB;
  sel.forEach(idx => {
    const c = document.getElementById(`pc-${_modalSide}-${idx}`);
    if(c) c.classList.add('selected');
  });
}

function deletePlayer(){
  if(!confirm('Delete this player?')) return;
  const sel = _modalSide==='A' ? selectedA : selectedB;
  // Remove from selections if selected
  const fi = sel.indexOf(_modalIdx);
  if(fi>-1) sel.splice(fi,1);
  TEAMS[_modalTeamKey].players.splice(_modalIdx, 1);
  closeModal();
  buildPlayerPool(_modalSide);
}

// ===================== ADD STADIUM MODAL =====================
function openAddStadiumModal(){
  document.getElementById('stadium-modal-name').value='';
  document.getElementById('stadium-modal-city').value='';
  document.getElementById('stadium-modal-img').value='';
  document.getElementById('stadium-img-preview').style.display='none';
  document.getElementById('add-stadium-modal').classList.remove('hidden');
  setTimeout(()=>document.getElementById('stadium-modal-name').focus(),100);
  // Live preview on URL input
  document.getElementById('stadium-modal-img').oninput=function(){
    const url=this.value.trim();
    if(url){
      const prev=document.getElementById('stadium-img-preview');
      const img=document.getElementById('stadium-preview-img');
      img.src=url;
      img.onload=()=>prev.style.display='block';
      img.onerror=()=>prev.style.display='none';
    } else {
      document.getElementById('stadium-img-preview').style.display='none';
    }
  };
}

function closeAddStadiumModal(){
  document.getElementById('add-stadium-modal').classList.add('hidden');
}

function saveNewStadium(){
  const name = document.getElementById('stadium-modal-name').value.trim();
  const city = document.getElementById('stadium-modal-city').value.trim();
  const imgUrl = document.getElementById('stadium-modal-img').value.trim();
  if(!name){ alert('Please enter a stadium name!'); return; }
  if(!city){ alert('Please enter a city!'); return; }
  const newStadium = {name, city, emoji:'🏟️'};
  STADIUMS.push(newStadium);
  if(imgUrl) STADIUM_IMAGES[name] = imgUrl;
  closeAddStadiumModal();
  buildStadiumGrid();
  // Auto-select the newly added stadium
  selStadium = newStadium;
  const cards = document.querySelectorAll('.stadium-card,.stadium-card-plain');
  cards.forEach(c=>c.classList.remove('picked'));
  cards[cards.length-1].classList.add('picked');
}

// ===================== ADD TEAM MODAL =====================
let _addTeamSide = 'A';

function openAddTeamModal(side){
  _addTeamSide = side;
  document.getElementById('add-team-modal-title').textContent = `CREATE TEAM ${side}`;
  document.getElementById('tm-fullname').value = '';
  document.getElementById('tm-short').value = '';
  document.getElementById('tm-color').value = '#FF6B00';
  document.getElementById('tm-color-preview').style.background = '#FF6B00';
  document.getElementById('tm-color-hex').textContent = '#FF6B00';
  document.getElementById('tm-logo-url').value = '';
  document.getElementById('tm-logo-preview').style.display = 'none';
  document.getElementById('add-team-modal').classList.remove('hidden');

  // Color picker live update
  document.getElementById('tm-color').oninput = function(){
    document.getElementById('tm-color-preview').style.background = this.value;
    document.getElementById('tm-color-hex').textContent = this.value.toUpperCase();
  };
  // Auto uppercase short name
  document.getElementById('tm-short').oninput = function(){
    this.value = this.value.toUpperCase();
  };
  // Logo URL preview
  document.getElementById('tm-logo-url').oninput = function(){
    const url = this.value.trim();
    const prev = document.getElementById('tm-logo-preview');
    const img = document.getElementById('tm-logo-img');
    if(url){ img.src=url; img.onload=()=>prev.style.display='block'; img.onerror=()=>prev.style.display='none'; }
    else prev.style.display='none';
  };
}

function closeAddTeamModal(){
  document.getElementById('add-team-modal').classList.add('hidden');
}

function pickSwatch(hex){
  document.getElementById('tm-color').value = hex;
  document.getElementById('tm-color-preview').style.background = hex;
  document.getElementById('tm-color-hex').textContent = hex.toUpperCase();
}

function saveNewTeam(){
  const full  = document.getElementById('tm-fullname').value.trim();
  const short = document.getElementById('tm-short').value.trim().toUpperCase();
  const color = document.getElementById('tm-color').value;
  const logoUrl = document.getElementById('tm-logo-url').value.trim();
  if(!full)  { alert('Enter team name!'); return; }
  if(!short) { alert('Enter short name!'); return; }

  // Generate a unique key
  const key = 'custom_' + short.toLowerCase() + '_' + Date.now();

  TEAMS[key] = {
    short, full, logo: '🏏', color,
    players: [
      {name:'Player 1',role:'BAT',num:1,emoji:'🏏'},
      {name:'Player 2',role:'BAT',num:2,emoji:'🏏'},
      {name:'Player 3',role:'BAT',num:3,emoji:'🏏'},
      {name:'Player 4',role:'BAT',num:4,emoji:'🏏'},
      {name:'Player 5',role:'ALL',num:5,emoji:'⚡'},
      {name:'Player 6',role:'ALL',num:6,emoji:'⚡'},
      {name:'Player 7',role:'ALL',num:7,emoji:'⚡'},
      {name:'Player 8',role:'BOWL',num:8,emoji:'🎯'},
      {name:'Player 9',role:'BOWL',num:9,emoji:'🎯'},
      {name:'Player 10',role:'BOWL',num:10,emoji:'🎯'},
      {name:'Player 11',role:'WK-BAT',num:11,emoji:'🧤'},
    ]
  };
  if(logoUrl) TEAM_LOGOS[key] = logoUrl;

  closeAddTeamModal();
  buildTeamGrids();

  // Auto-select the new team for the right side
  const t = TEAMS[key];
  if(_addTeamSide === 'A'){
    selTeamA = key;
    document.querySelectorAll('[id^="tcard-A-"]').forEach(c=>c.classList.remove('picked'));
    const card = document.getElementById(`tcard-A-${key}`);
    if(card){ card.classList.add('picked'); card.style.borderColor=color; }
    document.getElementById('step1-next').disabled = false;
  } else {
    if(key === selTeamA) return;
    selTeamB = key;
    document.querySelectorAll('[id^="tcard-B-"]').forEach(c=>c.classList.remove('picked'));
    const card = document.getElementById(`tcard-B-${key}`);
    if(card){ card.classList.add('picked'); card.style.borderColor=color; }
    document.getElementById('sum-b-name').textContent = t.short;
    document.getElementById('sum-b-badge').style.background = color;
    document.getElementById('sum-b-badge').innerHTML = logoUrl
      ? `<img src="${logoUrl}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;">`
      : short.slice(0,3);
    document.getElementById('step2-next').disabled = false;
  }
}

// ===================== WICKET & EXTRAS MODALS =====================
let extraType = null;

window.openWicketModal = function() {
  document.getElementById('wicket-modal').classList.remove('hidden');
  const s = inn[innings];
  const select = document.getElementById('w-who');
  select.innerHTML = '';
  if (s.striker) {
    select.innerHTML += `<option value="${s.striker}">${s.striker}</option>`;
  }
  if (s.nonStriker) {
    select.innerHTML += `<option value="${s.nonStriker}">${s.nonStriker}</option>`;
  }
};

window.closeWicketModal = function() {
  document.getElementById('wicket-modal').classList.add('hidden');
};

window.onWicketTypeChange = function() {
  const type = document.getElementById('w-type').value;
  document.getElementById('runout-opts').style.display = (type === 'RUNOUT') ? 'block' : 'none';
};

window.confirmWicket = function() {
  const type = document.getElementById('w-type').value;
  const s = inn[innings];
  const batName = s.striker;
  const bowlName = s.bowler;
  
  if (!s.partnership) s.partnership = { runs:0, balls:0 };
  
  s.batStats[batName].b += 1;
  s.batStats[batName].out = true;
  s.bowlStats[bowlName].w += 1;
  s.bowlStats[bowlName].balls += 1;
  s.wickets += 1;
  s.balls += 1;
  s.partnership.balls +=1;
  s.allBalls.push({ v: 'W', over: Math.floor((s.balls - 1) / 6) });
  
  if (type === 'RUNOUT') {
    const whoOut = document.getElementById('w-who').value;
    const runs = parseInt(document.getElementById('w-runs').value) || 0;
    if (runs > 0) {
      s.runs += runs;
      s.batStats[whoOut].r += runs;
      s.partnership.runs += runs;
    }
  }
  
  const remaining = s.batting.filter(n => !s.batStats[n].out && n !== s.striker && n !== s.nonStriker);
  s.striker = remaining.length > 0 ? remaining[0] : null;
  s.partnership = { runs:0, balls:0 };
  
  if (window.aiCommentary && window.aiCommentary.processWicket) {
    window.aiCommentary.processWicket();
  }
  
  window.closeWicketModal();
  checkInningsEnd();
  renderAll();
  populateSelects();
};

window.openExtrasModal = function(type) {
  extraType = type;
  document.getElementById('ex-title').textContent = type === 'NB' ? 'NO BALL' : type === 'WD' ? 'WIDE' : type === 'B' ? 'BYE' : 'LEG BYE';
  document.getElementById('extras-modal').classList.remove('hidden');
};

window.closeExtrasModal = function() {
  document.getElementById('extras-modal').classList.add('hidden');
};

window.confirmExtra = function(runs) {
  const s = inn[innings];
  const bowlName = s.bowler;
  const batName = s.striker;
  
  if (!s.partnership) s.partnership = { runs:0, balls:0 };
  
  if (extraType === 'NB') {
    s.runs += 1 + runs;
    s.bowlStats[bowlName].r += 1 + runs;
    s.partnership.runs += (1 + runs);
    s.batStats[batName].r += runs;
    if (runs > 0) {
      s.batStats[batName].b += 1;
      s.partnership.balls +=1;
    }
    s.allBalls.push({ v: 'NB', over: Math.floor(s.balls / 6) });
  } else if (extraType === 'WD') {
    s.runs += 1 + runs;
    s.bowlStats[bowlName].r += 1 + runs;
    s.partnership.runs += (1 + runs);
    s.allBalls.push({ v: 'WD', over: Math.floor(s.balls / 6) });
  } else if (extraType === 'B' || extraType === 'LB') {
    s.runs += runs;
    s.bowlStats[bowlName].r += runs;
    s.bowlStats[bowlName].balls += 1;
    s.balls += 1;
    s.partnership.runs += runs;
    s.partnership.balls +=1;
    s.allBalls.push({ v: extraType, over: Math.floor((s.balls - 1) / 6) });
  }
  
  if ((extraType === 'B' || extraType === 'LB') && s.balls % 6 === 0 && s.balls > 0) {
    s.bowlStats[bowlName].o += 1;
    const tmp = s.striker;
    s.striker = s.nonStriker;
    s.nonStriker = tmp;
  }
  
  if (runs === 1 || runs === 3) {
    const tmp = s.striker;
    s.striker = s.nonStriker;
    s.nonStriker = tmp;
  }
  
  if (window.aiCommentary && window.aiCommentary.processExtra) {
    window.aiCommentary.processExtra(extraType, runs);
  }
  
  window.closeExtrasModal();
  checkInningsEnd();
  renderAll();
  populateSelects();
};

// Team Edit Functions
let currentTeamKey = null;
let originalTeamData = {}; // Store original team data for reset

// Expose to window
window.openTeamLogoModal = openTeamModal;
window.closeTeamLogoModal = closeTeamModal;
window.saveTeamLogo = saveTeam;
window.resetTeamLogo = resetTeam;
window.saveTeam = saveTeam;
window.resetTeam = resetTeam;

// Initialize original data backup
function initOriginalData() {
  Object.keys(TEAMS).forEach(key => {
    originalTeamData[key] = {
      full: TEAMS[key].full,
      short: TEAMS[key].short,
      logo: TEAM_LOGOS[key]
    };
  });
}

function openTeamModal(teamKey) {
  currentTeamKey = teamKey;
  const modal = document.getElementById('team-logo-modal');
  const preview = document.getElementById('team-logo-modal-preview');
  const fileInput = document.getElementById('team-logo-input');
  const urlInput = document.getElementById('team-logo-url-input');
  const fullNameInput = document.getElementById('team-fullname-input');
  const shortNameInput = document.getElementById('team-shortname-input');
  
  // Reset inputs
  fileInput.value = '';
  urlInput.value = '';
  
  // Populate current values
  const team = TEAMS[teamKey];
  fullNameInput.value = team.full;
  shortNameInput.value = team.short;
  
  // Show current logo
  const currentLogo = TEAM_LOGOS[teamKey];
  if (currentLogo) {
    preview.innerHTML = `<img src="${currentLogo}" style="width:100%;height:100%;object-fit:contain;">`;
  } else {
    preview.innerHTML = `<div style="font-size:48px;">${team.logo}</div>`;
  }
  
  modal.classList.remove('hidden');
  
  // Add event listeners for preview
  fileInput.onchange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;object-fit:contain;">`;
        urlInput.value = '';
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  urlInput.oninput = (e) => {
    if (e.target.value) {
      preview.innerHTML = `<img src="${e.target.value}" style="width:100%;height:100%;object-fit:contain;">`;
      fileInput.value = '';
    } else {
      if (currentLogo) {
        preview.innerHTML = `<img src="${currentLogo}" style="width:100%;height:100%;object-fit:contain;">`;
      } else {
        preview.innerHTML = `<div style="font-size:48px;">${team.logo}</div>`;
      }
    }
  };
}

function closeTeamModal() {
  document.getElementById('team-logo-modal').classList.add('hidden');
  currentTeamKey = null;
}

function resetTeam() {
  if (!currentTeamKey) return;
  const original = originalTeamData[currentTeamKey];
  if (original) {
    TEAMS[currentTeamKey].full = original.full;
    TEAMS[currentTeamKey].short = original.short;
    if (original.logo) {
      TEAM_LOGOS[currentTeamKey] = original.logo;
    } else {
      delete TEAM_LOGOS[currentTeamKey];
    }
  }
  saveTeamData();
  buildTeamGrids();
  closeTeamModal();
}

function saveTeam() {
  if (!currentTeamKey) return;
  
  const fileInput = document.getElementById('team-logo-input');
  const urlInput = document.getElementById('team-logo-url-input');
  const fullNameInput = document.getElementById('team-fullname-input');
  const shortNameInput = document.getElementById('team-shortname-input');
  
  // Update team names
  if (fullNameInput.value.trim()) {
    TEAMS[currentTeamKey].full = fullNameInput.value.trim();
  }
  if (shortNameInput.value.trim()) {
    TEAMS[currentTeamKey].short = shortNameInput.value.trim().toUpperCase();
  }
  
  // Handle logo
  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (event) => {
      TEAM_LOGOS[currentTeamKey] = event.target.result;
      saveTeamData();
      buildTeamGrids();
      closeTeamModal();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else if (urlInput.value) {
    TEAM_LOGOS[currentTeamKey] = urlInput.value;
    saveTeamData();
    buildTeamGrids();
    closeTeamModal();
  } else {
    saveTeamData();
    buildTeamGrids();
    closeTeamModal();
  }
}

function saveTeamData() {
  const data = {
    logos: TEAM_LOGOS,
    teams: {}
  };
  Object.keys(TEAMS).forEach(key => {
    data.teams[key] = {
      full: TEAMS[key].full,
      short: TEAMS[key].short
    };
  });
  localStorage.setItem('ipl_team_data', JSON.stringify(data));
}

function loadTeamData() {
  const saved = localStorage.getItem('ipl_team_data');
  if (saved) {
    const loaded = JSON.parse(saved);
    if (loaded.logos) {
      Object.keys(loaded.logos).forEach(key => {
        TEAM_LOGOS[key] = loaded.logos[key];
      });
    }
    if (loaded.teams) {
      Object.keys(loaded.teams).forEach(key => {
        if (TEAMS[key]) {
          TEAMS[key].full = loaded.teams[key].full;
          TEAMS[key].short = loaded.teams[key].short;
        }
      });
    }
  }
  initOriginalData();
}

// Initialize UI on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadTeamData();
    buildTeamGrids();
    buildStadiumGrid();
  });
} else {
  loadTeamData();
  buildTeamGrids();
  buildStadiumGrid();
}

// ===================== SUPER OVER =====================