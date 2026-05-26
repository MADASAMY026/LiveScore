function addBall(val){
  if(matchOver) return;
  const s=inn[innings];
  const batName=s.striker, bowlName=s.bowler;
  if(!batName||!bowlName){alert('Select batsman and bowler!');return;}
  
  if (window.isBowlerValid) {
    const validationResult = window.isBowlerValid(bowlName, innings);
    if (!validationResult.valid) {
      if (validationResult.reason === 'maxOvers') {
        alert('Maximum overs reached for this bowler!');
      } else if (validationResult.reason === 'consecutive') {
        alert('Same bowler cannot bowl consecutive overs!');
      }
      window.populateSelects();
      return;
    }
  }

  if (!s.partnership) s.partnership = { runs:0, balls:0 };

  const currentOver = Math.floor(s.balls / 6);
  if (!s.bowlerHistory) s.bowlerHistory = {};
  if (!s.bowlerHistory[currentOver] && window.recordBowlerForOver) {
    window.recordBowlerForOver(currentOver, bowlName, innings);
  }

  let legalBall=true;

  if(val==='NB'){
    s.runs+=1; s.bowlStats[bowlName].r+=1;
    s.partnership.runs +=1;
    s.allBalls.push({v:'NB',over:Math.floor(s.balls/6)});
    legalBall=false;
  } else if(val==='WD'){
    s.runs+=1; s.bowlStats[bowlName].r+=1;
    s.partnership.runs +=1;
    s.allBalls.push({v:'WD',over:Math.floor(s.balls/6)});
    legalBall=false;
  } else if(val==='W'){
    s.batStats[batName].b+=1; s.batStats[batName].out=true;
    s.bowlStats[bowlName].w+=1; s.bowlStats[bowlName].balls+=1;
    s.wickets+=1; s.balls+=1;
    s.partnership.balls +=1;
    s.allBalls.push({v:'W',over:Math.floor((s.balls-1)/6)});
    const remaining=s.batting.filter(n=>!s.batStats[n].out&&n!==s.striker&&n!==s.nonStriker);
    s.striker=remaining.length>0?remaining[0]:null;
    s.partnership={runs:0, balls:0};
  } else {
    s.runs+=val; s.batStats[batName].r+=val; s.batStats[batName].b+=1;
    if(val===4) s.batStats[batName].fours+=1;
    if(val===6) s.batStats[batName].sixes+=1;
    s.bowlStats[bowlName].r+=val; s.bowlStats[bowlName].balls+=1;
    s.balls+=1;
    s.partnership.runs += val;
    s.partnership.balls += 1;
    s.allBalls.push({v:val,over:Math.floor((s.balls-1)/6)});
    if(val===1||val===3){const tmp=s.striker;s.striker=s.nonStriker;s.nonStriker=tmp;}
  }

  if(legalBall && s.balls%6===0 && s.balls>0){
    s.bowlStats[bowlName].o+=1;
    const tmp=s.striker;s.striker=s.nonStriker;s.nonStriker=tmp;
  }

  if (window.aiCommentary && window.aiCommentary.processBallEvent) {
    window.aiCommentary.processBallEvent(val, batName, bowlName, innings);
  }
  
  checkInningsEnd();
  renderAll();
  
  // Play animations
  if (val === 4) {
    window.playFourAnimation && window.playFourAnimation();
  } else if (val === 6) {
    window.playSixAnimation && window.playSixAnimation();
  } else if (val === 'W') {
    window.playWicketAnimation && window.playWicketAnimation();
  }
  
  window.populateSelects && window.populateSelects();
}

function checkInningsEnd(){
  const s=inn[innings];
  const maxBalls = inSuperOver ? 6 : totalOvers*6;
  const maxWkts  = inSuperOver ? 2 : 10;

  const inningsOver = s.wickets>=maxWkts || s.balls>=maxBalls;
  if(!inningsOver){
    if(innings===2){
      const target=inn[1].runs+1;
      if(inn[2].runs>=target){ inSuperOver ? endSuperOver() : endMatch(); }
    }
    return;
  }

  if(innings===1){
    innings=2; viewInnings=2;
    $cl('tab-inn2',['add','on']); $cl('tab-inn1',['remove','on']);
    renderAll();
  } else {
    inSuperOver ? endSuperOver() : endMatch();
  }
}

async function saveMatchToHistory(winTeam, t1, t2, i1, i2) {
  const authUser = window.firebaseAuth?.currentUser;
  if (!authUser || !window.firebaseDb) return;
  
  try {
    const { doc, collection, addDoc, serverTimestamp, updateDoc, getDoc } = window;
    const db = window.firebaseDb;
    
    const matchData = {
      userId: authUser.uid,
      teamA: t1.short,
      teamB: t2.short,
      teamAColor: t1.color,
      teamBColor: t2.color,
      teamAScore: i1.runs,
      teamBScore: i2.runs,
      winner: winTeam === t1,
      createdAt: serverTimestamp ? serverTimestamp() : new Date()
    };
    
    const matchesRef = collection(db, 'matches');
    await addDoc(matchesRef, matchData);
    
    const userRef = doc(db, 'users', authUser.uid);
    const userSnap = await getDoc(userRef);
    
    let newMatchesPlayed = 1;
    let newWins = 0;
    let newPoints = 10;
    
    if (userSnap.exists()) {
      newMatchesPlayed = (userSnap.data().matchesPlayed || 0) + 1;
      newWins = winTeam ? (userSnap.data().wins || 0) + 1 : (userSnap.data().wins || 0);
      newPoints = (userSnap.data().points || 0) + (winTeam ? 50 : 10);
    }
    
    await updateDoc(userRef, {
      matchesPlayed: newMatchesPlayed,
      wins: newWins,
      points: newPoints
    });
    
  } catch (e) {
    console.error('Error saving match:', e);
  }
}

function endMatch(){
  matchOver=true;
  const i1=inn[1],i2=inn[2];
  const target=i1.runs+1;
  const t1=TEAMS[i1.batTeamKey],t2=TEAMS[i2.batTeamKey];
  const k1 = i1.batTeamKey;
  const k2 = i2.batTeamKey;
  
  let winner='',sub='';
  let winTeam=null, loseTeam=null;
  let isTie = false;
  
  if(i2.runs>=target){
    winTeam=t2; loseTeam=t1;
    sub=`won by ${10-i2.wickets} wicket${10-i2.wickets!==1?'s':''}!`;
  } else if(i2.runs<i1.runs){
    winTeam=t1; loseTeam=t2;
    sub=`won by ${i1.runs-i2.runs} run${i1.runs-i2.runs!==1?'s':''}!`;
  } else {
    sub='Match Tied!';
    isTie = true;
  }
  
  if (window.pointsTable) {
    const wk1 = k1;
    const wk2 = k2;
    
    if (window.pointsTable.updateTeamStats) {
      window.pointsTable.updateTeamStats(k1, i1.runs, i1.balls);
      window.pointsTable.updateTeamStats(k2, i2.runs, i2.balls);
    }
    
    if (window.pointsTable.updateOpponentStats) {
      window.pointsTable.updateOpponentStats(k1, i2.runs, i2.balls);
      window.pointsTable.updateOpponentStats(k2, i1.runs, i1.balls);
    }
    
    if (window.pointsTable.updatePointsTable) {
      if (isTie) {
        window.pointsTable.updatePointsTable(wk1, wk2, true, false);
      } else if (winTeam) {
        const winKey = winTeam === t1 ? k1 : k2;
        const loseKey = winTeam === t1 ? k2 : k1;
        window.pointsTable.updatePointsTable(winKey, loseKey, false, false);
      }
    }
  }
  
  saveMatchToHistory(winTeam, t1, t2, i1, i2);
  // Winner display — just team short name, no logo tag
  document.getElementById('end-winner').textContent = winTeam ? winTeam.short : 'TIED!';
  document.getElementById('end-sub').textContent=sub;
  document.getElementById('end-trophy').textContent = winTeam ? '🏆' : '🤝';

  // Super over button — show only on tie
  document.getElementById('super-over-btn').style.display = winTeam ? 'none' : 'block';

  // Winner logo image
  const wKey = winTeam ? Object.keys(TEAMS).find(k=>TEAMS[k]===winTeam) : null;
  const wLogoImg = wKey && TEAM_LOGOS[wKey] ? `<img src="${TEAM_LOGOS[wKey]}" style="width:100px;height:100px;object-fit:contain;border-radius:12px;margin-bottom:8px;">` : (winTeam?`<div style="font-size:64px">${winTeam.logo}</div>`:'<div style="font-size:64px">🤝</div>');
  document.getElementById('winner-logo').innerHTML = wLogoImg;

  // Score boxes
  const kt1 = Object.keys(TEAMS).find(k=>TEAMS[k]===t1);
  const kt2 = Object.keys(TEAMS).find(k=>TEAMS[k]===t2);
  const logo1 = kt1&&TEAM_LOGOS[kt1]?`<img src="${TEAM_LOGOS[kt1]}" style="width:36px;height:36px;object-fit:contain;border-radius:6px;">`:t1.logo;
  const logo2 = kt2&&TEAM_LOGOS[kt2]?`<img src="${TEAM_LOGOS[kt2]}" style="width:36px;height:36px;object-fit:contain;border-radius:6px;">`:t2.logo;
  document.getElementById('final-scores').innerHTML=`
    <div class="final-box" style="border:2px solid ${winTeam===t1?'var(--gold)':'var(--border)'}">
      <div class="fb-team">${logo1} ${t1.short}</div>
      <div class="fb-score">${i1.runs}/${i1.wickets}</div>
      <div class="fb-overs">${Math.floor(i1.balls/6)}.${i1.balls%6} ov</div>
    </div>
    <div class="final-box" style="border:2px solid ${winTeam===t2?'var(--gold)':'var(--border)'}">
      <div class="fb-team">${logo2} ${t2.short}</div>
      <div class="fb-score">${i2.runs}/${i2.wickets}</div>
      <div class="fb-overs">${Math.floor(i2.balls/6)}.${i2.balls%6} ov</div>
    </div>`;
  showPage('page-end');
  updateNav('stats');
}

// ===================== RENDER =====================

function startSuperOver(){
  superOverCount++;
  soRound = superOverCount;

  // Reuse exact same team/innings keys from main match
  const bk1 = inn[1].batTeamKey, bwk1 = inn[1].bowlTeamKey;
  const bk2 = inn[2].batTeamKey, bwk2 = inn[2].bowlTeamKey;

  // Resolve player NAMES (same as startMatch does — selectedA/B are indices)
  const namesFor = (teamKey) => {
    const sel = teamKey===selTeamA ? selectedA : selectedB;
    return sel.map(i => TEAMS[teamKey].players[i].name);
  };

  const bat1Names  = namesFor(bk1);   // inn1 batting team players
  const bowl2Names = namesFor(bwk1);  // inn1 bowling team players (bowl in SO inn1)
  const bat2Names  = namesFor(bk2);   // inn2 batting team players
  const bowl1Names = namesFor(bwk2);  // inn2 bowling team players (bowl in SO inn2)

  const mkBatStats  = (names) => { const s={}; names.forEach(n=>s[n]={r:0,b:0,fours:0,sixes:0,out:false}); return s; };
  const mkBowlStats = (names) => { const s={}; names.forEach(n=>s[n]={balls:0,o:0,m:0,r:0,w:0}); return s; };

  soInn[soRound] = {
    1:{runs:0,wickets:0,batTeamKey:bk1,bowlTeamKey:bwk1},
    2:{runs:0,wickets:0,batTeamKey:bk2,bowlTeamKey:bwk2}
  };

  inSuperOver = true;
  innings = 1; viewInnings = 1; matchOver = false;
  totalOvers = 1;

  const soPlayerRoles = {};
  selectedA.forEach(i => { soPlayerRoles[TEAMS[selTeamA].players[i].name] = TEAMS[selTeamA].players[i].role; });
  selectedB.forEach(i => { soPlayerRoles[TEAMS[selTeamB].players[i].name] = TEAMS[selTeamB].players[i].role; });
  
  const validBowlerSO1 = bowl2Names.find(n => ['BOWL', 'ALL'].includes(soPlayerRoles[n]));
  const validBowlerSO2 = bowl1Names.find(n => ['BOWL', 'ALL'].includes(soPlayerRoles[n]));
  
  inn[1] = {
    runs:0, wickets:0, balls:0, allBalls:[],
    batTeamKey:bk1, bowlTeamKey:bwk1,
    batting:[...bat1Names], bowling:[...bowl2Names],
    playerRoles: { ...soPlayerRoles },
    batStats:mkBatStats(bat1Names), bowlStats:mkBowlStats(bowl2Names),
    striker:bat1Names[0], nonStriker:bat1Names[1], bowler:validBowlerSO1 || bowl2Names[0],
    bowlerHistory: {},
    partnership: { runs:0, balls:0 }
  };
  inn[2] = {
    runs:0, wickets:0, balls:0, allBalls:[],
    batTeamKey:bk2, bowlTeamKey:bwk2,
    batting:[...bat2Names], bowling:[...bowl1Names],
    playerRoles: { ...soPlayerRoles },
    batStats:mkBatStats(bat2Names), bowlStats:mkBowlStats(bowl1Names),
    striker:bat2Names[0], nonStriker:bat2Names[1], bowler:validBowlerSO2 || bowl1Names[0],
    bowlerHistory: {},
    partnership: { runs:0, balls:0 }
  };

  showPage('page-match');
  updateNav('score');
  const _t1=$cl('tab-inn1',['add','on']); if(_t1) _t1.textContent='SO INN 1';
  const _t2=$cl('tab-inn2',['remove','on']); if(_t2) _t2.textContent='SO INN 2';
  const banner=document.getElementById('stadium-banner');
  if(banner) banner.textContent=`⚡ SUPER OVER${superOverCount>1?' '+superOverCount:''} — ${selStadium.name}`;
  renderAll();
  window.populateSelects && window.populateSelects();
}

function endSuperOver(){
  const si1 = inn[1], si2 = inn[2];
  const soTarget = si1.runs + 1;

  // Save to history
  soInn[soRound][1].runs = si1.runs; soInn[soRound][1].wickets = si1.wickets;
  soInn[soRound][2].runs = si2.runs; soInn[soRound][2].wickets = si2.wickets;

  const t1 = TEAMS[si1.batTeamKey], t2 = TEAMS[si2.batTeamKey];
  let soWinner = null, soSub = '';

  if(si2.runs >= soTarget){
    soWinner = t2;
    soSub = `won the Super Over by ${2 - si2.wickets} wicket${2-si2.wickets!==1?'s':''}!`;
  } else if(si2.runs < si1.runs){
    soWinner = t1;
    soSub = `won the Super Over by ${si1.runs - si2.runs} run${si1.runs-si2.runs!==1?'s':''}!`;
  } else {
    soSub = 'Super Over Tied! Another one!';
  }

  inSuperOver = false;
  matchOver = true;
  totalOvers = parseInt(document.getElementById('total-overs').value)||20;

  // Build SO history HTML
  const histDiv = document.getElementById('super-over-history');
  histDiv.style.display = 'block';
  let histHTML = '';
  for(let r=1; r<=soRound; r++){
    const s1=soInn[r][1], s2=soInn[r][2];
    const tn1=TEAMS[s1.batTeamKey], tn2=TEAMS[s2.batTeamKey];
    histHTML += `
    <div class="so-label">⚡ SUPER OVER ${soRound>1?r:''}</div>
    <div class="so-scores">
      <div class="so-box"><div class="so-team">${tn1.short}</div><div class="so-runs">${s1.runs}/${s1.wickets}</div></div>
      <div class="so-box"><div class="so-team">${tn2.short}</div><div class="so-runs">${s2.runs}/${s2.wickets}</div></div>
    </div>`;
  }
  histDiv.innerHTML = histHTML;

  // Update end page
  document.getElementById('end-trophy').textContent = soWinner ? '🏆' : '🤝';
  document.getElementById('end-winner').textContent = soWinner ? soWinner.short : 'TIED AGAIN!';
  document.getElementById('end-sub').textContent = soSub;

  const wKey = soWinner ? Object.keys(TEAMS).find(k=>TEAMS[k]===soWinner) : null;
  const wLogoImg = wKey && TEAM_LOGOS[wKey]
    ? `<img src="${TEAM_LOGOS[wKey]}" style="width:100px;height:100px;object-fit:contain;border-radius:12px;margin-bottom:8px;">`
    : soWinner ? `<div style="font-size:64px">${soWinner.logo}</div>` : '<div style="font-size:64px">🤝</div>';
  document.getElementById('winner-logo').innerHTML = wLogoImg;

  // Another super over if still tied
  document.getElementById('super-over-btn').style.display = soWinner ? 'none' : 'block';
  document.getElementById('super-over-btn').textContent = '⚡ ANOTHER SUPER OVER';

  showPage('page-end');
  updateNav('stats');
}

window.addBall = addBall;