function renderAll(){
  const s=inn[viewInnings];
  const maxBalls=totalOvers*6;
  const tBat=TEAMS[s.batTeamKey]||{logo:'🏏',short:'BAT',color:'#fff'};
  const tBowl=TEAMS[s.bowlTeamKey]||{logo:'🎯',short:'BOWL',color:'#fff'};

  document.getElementById('stadium-banner').textContent=`🏟️ ${selStadium.name}, ${selStadium.city}`;
  document.getElementById('bat-logo').innerHTML = TEAM_LOGOS[s.batTeamKey] ? `<img src="${TEAM_LOGOS[s.batTeamKey]}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;">` : tBat.logo;
  document.getElementById('bat-team-name').textContent=tBat.short;
  document.getElementById('bat-runs').textContent=s.runs;
  document.getElementById('bat-wkts').textContent=s.wickets;
  document.getElementById('bat-overs').textContent=`${Math.floor(s.balls/6)}.${s.balls%6}`;
  document.getElementById('bowl-logo').innerHTML = TEAM_LOGOS[s.bowlTeamKey] ? `<img src="${TEAM_LOGOS[s.bowlTeamKey]}" style="width:32px;height:32px;object-fit:contain;border-radius:6px;">` : tBowl.logo;
  document.getElementById('bowl-team-name').textContent=tBowl.short;

  if(viewInnings===2){
    const target=inn[1].runs+1;
    const need=target-inn[2].runs;
    const bl=maxBalls-inn[2].balls;
    document.getElementById('bowl-target').textContent=`Target: ${target}`;
    document.getElementById('bowl-need').textContent=need>0?`Need ${need} off ${bl} balls`:'Chased! 🎉';
    document.getElementById('rrr-val').textContent=bl>0&&need>0?((need/bl)*6).toFixed(2):'—';
    document.getElementById('balls-left').textContent=bl;
  } else {
    document.getElementById('bowl-target').textContent='Bowling';
    document.getElementById('bowl-need').textContent='';
    document.getElementById('rrr-val').textContent='—';
    document.getElementById('balls-left').textContent=maxBalls-s.balls;
  }

  const crr=s.balls>0?((s.runs/s.balls)*6).toFixed(2):'0.00';
  document.getElementById('crr-val').textContent=crr;

  const last6=s.allBalls.slice(-6).reduce((a,b)=>{
    if(b.v==='W') return a;
    if(b.v==='NB'||b.v==='WD') return a+1;
    return a+b.v;
  },0);
  document.getElementById('last6-val').textContent=s.allBalls.length>0?last6:'—';

  if (!s.partnership) s.partnership = { runs:0, balls:0 };
  document.getElementById('partnership-val').textContent=`${s.partnership.runs} (${s.partnership.balls})`;
  
  const status=viewInnings===innings&&!matchOver
    ?`🏏 ${s.striker||'—'} | 🎯 ${s.bowler||'—'} | Ov ${Math.floor(s.balls/6)}.${s.balls%6}`
    :`${tBat.short}: ${s.runs}/${s.wickets} (${Math.floor(s.balls/6)}.${s.balls%6} ov)`;
  document.getElementById('status-banner').textContent=status;

  // Balls row
  const row=document.getElementById('balls-row');
  row.innerHTML='';
  let curOv=-1;
  s.allBalls.forEach(b=>{
    if(b.over!==curOv){
      curOv=b.over;
      const l=document.createElement('span');
      l.className='over-label';
      l.textContent=`Ov${b.over+1}:`;
      row.appendChild(l);
    }
    const ball=document.createElement('div');
    const v=b.v;
    let cls='ball ';
    if(v==='W') cls+='ball-W';
    else if(v===4) cls+='ball-4';
    else if(v===6) cls+='ball-6';
    else if(v==='NB') cls+='ball-NB';
    else if(v==='WD') cls+='ball-WD';
    else cls+=`ball-${v}`;
    ball.className=cls;
    ball.textContent=v;
    row.appendChild(ball);
  });

  // Bat SC
  document.getElementById('bat-sc-title').textContent=`🏏 ${tBat.short} BATTING`;
  const btbody=document.getElementById('bat-sc-body');
  btbody.innerHTML='';
  s.batting.forEach(name=>{
    const st=s.batStats[name];
    const sr=st.b>0?((st.r/st.b)*100).toFixed(0):'0';
    const tr=document.createElement('tr');
    if(name===s.striker||name===s.nonStriker) tr.className='batting-now';
    else if(st.out) tr.className='out';
    tr.innerHTML=`<td>${name}${name===s.striker?' 🏏':''}${st.out?' ✗':''}</td><td>${st.r}</td><td>${st.b}</td><td>${st.fours}</td><td>${st.sixes}</td><td>${sr}</td>`;
    btbody.appendChild(tr);
  });
  const totRow=document.createElement('tr');
  totRow.innerHTML=`<td colspan="6" style="font-size:11px;color:var(--muted);">Total: <b style="color:var(--gold)">${s.runs}/${s.wickets}</b> (${Math.floor(s.balls/6)}.${s.balls%6} Ov)</td>`;
  btbody.appendChild(totRow);

  // Bowl SC
  document.getElementById('bowl-sc-title').textContent=`🎯 ${tBowl.short} BOWLING`;
  const bwbody=document.getElementById('bowl-sc-body');
  bwbody.innerHTML='';
  s.bowling.forEach(name=>{
    const st=s.bowlStats[name];
    if(st.balls===0&&st.o===0) return;
    const eco=st.balls>0?((st.r/st.balls)*6).toFixed(2):'0.00';
    const tr=document.createElement('tr');
    if(name===s.bowler) tr.className='bowler-active';
    tr.innerHTML=`<td>${name}${name===s.bowler?' 🎯':''}</td><td>${st.o}.${st.balls%6}</td><td>${st.m}</td><td>${st.r}</td><td>${st.w}</td><td>${eco}</td>`;
    bwbody.appendChild(tr);
  });

  document.getElementById('ball-entry-box').style.display=(viewInnings===innings&&!matchOver)?'block':'none';
}

// ===================== BOWLING RULES =====================
function getMaxOvers() {
  return inSuperOver ? 1 : 4;
}

function getLastBowler(inningsNum) {
  const s = inn[inningsNum];
  if (!s || !s.allBalls || s.allBalls.length === 0) return null;
  
  let lastOv = -1;
  let lastBowler = null;
  
  for (let i = s.allBalls.length - 1; i >= 0; i--) {
    const ball = s.allBalls[i];
    if (ball.over !== lastOv && lastOv !== -1) {
      break;
    }
    lastOv = ball.over;
  }
  
  if (lastOv >= 0) {
    let bowlerForLastOv = null;
    for (let i = 0; i < s.allBalls.length; i++) {
      const ball = s.allBalls[i];
      if (ball.over === lastOv) {
        if (s.bowlerHistory && s.bowlerHistory[ball.over]) {
          bowlerForLastOv = s.bowlerHistory[ball.over];
        }
        break;
      }
    }
    return bowlerForLastOv;
  }
  
  return null;
}

function isPlayerCanBowl(playerName, inningsNum) {
  const s = inn[inningsNum];
  if (!s || !s.playerRoles) return true;
  
  const role = s.playerRoles[playerName];
  return ['BOWL', 'ALL'].includes(role);
}

function isBowlerValid(bowlerName, inningsNum) {
  const s = inn[inningsNum];
  if (!s) return false;
  
  if (!isPlayerCanBowl(bowlerName, inningsNum)) {
    return { valid: false, reason: 'batsman' };
  }
  
  const maxOvers = getMaxOvers();
  const bowlStats = s.bowlStats[bowlerName];
  if (!bowlStats) return false;
  
  const currentOvers = bowlStats.o + (bowlStats.balls >= 6 ? 1 : 0);
  if (currentOvers >= maxOvers) {
    return { valid: false, reason: 'maxOvers' };
  }
  
  const lastBowler = getLastBowler(inningsNum);
  const currentOverNumber = Math.floor(s.balls / 6);
  if (lastBowler && lastBowler === bowlerName && currentOverNumber > 0) {
    return { valid: false, reason: 'consecutive' };
  }
  
  return { valid: true };
}

function validateAndSetBowler(bowlerName) {
  const result = isBowlerValid(bowlerName, innings);
  if (!result.valid) {
    if (result.reason === 'batsman') {
      alert('Batsman cannot bowl');
    } else if (result.reason === 'maxOvers') {
      alert('Maximum overs reached for this bowler!');
    } else if (result.reason === 'consecutive') {
      alert('Same bowler cannot bowl consecutive overs!');
    }
    return false;
  }
  return true;
}

function initBowlerHistory() {
  [1, 2].forEach(innNum => {
    if (inn[innNum]) {
      inn[innNum].bowlerHistory = {};
    }
  });
}

function recordBowlerForOver(overNumber, bowlerName, inningsNum) {
  if (inn[inningsNum] && !inn[inningsNum].bowlerHistory) {
    inn[inningsNum].bowlerHistory = {};
  }
  if (inn[inningsNum]) {
    inn[inningsNum].bowlerHistory[overNumber] = bowlerName;
  }
}

function populateSelects(){
  const s=inn[innings];
  const notOut=s.batting.filter(n=>s.batStats[n] && !s.batStats[n].out);
  const b1=document.getElementById('bat1-sel');
  const b2=document.getElementById('bat2-sel');
  if(b1) b1.innerHTML=notOut.map(n=>`<option ${n===s.striker?'selected':''}>${n}</option>`).join('');
  if(b2) b2.innerHTML=notOut.map(n=>`<option ${n===s.nonStriker?'selected':''}>${n}</option>`).join('');
  const bw=document.getElementById('bowl-sel');
  if(bw) {
    const maxOvers = getMaxOvers();
    const lastBowler = getLastBowler(innings);
    const currentOverNumber = Math.floor(s.balls / 6);
    
    const validBowlers = s.bowling.filter(n => isPlayerCanBowl(n, innings));
    
    bw.innerHTML = validBowlers.map(n => {
      const bowlStats = s.bowlStats[n];
      const currentOvers = bowlStats ? bowlStats.o + (bowlStats.balls >= 6 ? 1 : 0) : 0;
      const isMaxed = currentOvers >= maxOvers;
      const isConsecutive = lastBowler && lastBowler === n && currentOverNumber > 0;
      const disabled = isMaxed || isConsecutive;
      const selected = n === s.bowler && !disabled;
      
      const role = s.playerRoles ? s.playerRoles[n] : '';
      const roleLabel = role === 'BOWL' ? ' (Bowler)' : role === 'ALL' ? ' (All-Rounder)' : '';
      
      return `<option value="${n}" ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}>
        ${n}${roleLabel}${isMaxed ? ' (4/4)' : ''}${isConsecutive ? ' (Consecutive)' : ''}
      </option>`;
    }).join('');
    
    if (!s.bowler || !isBowlerValid(s.bowler, innings).valid) {
      const firstValid = validBowlers.find(n => isBowlerValid(n, innings).valid);
      if (firstValid) {
        s.bowler = firstValid;
        bw.value = firstValid;
      }
    }
  }
  if(b1) b1.onchange=()=>inn[innings].striker=b1.value;
  if(b2) b2.onchange=()=>inn[innings].nonStriker=b2.value;
  if(bw) {
    bw.onchange=()=>{
      if (validateAndSetBowler(bw.value)) {
        inn[innings].bowler = bw.value;
      } else {
        populateSelects();
      }
    };
  }
}

function switchView(n){
  viewInnings=n;
  $cl('tab-inn1',['toggle','on',n===1]);
  $cl('tab-inn2',['toggle','on',n===2]);
  renderAll();
}

// Expose bowling functions to window
window.getMaxOvers = getMaxOvers;
window.getLastBowler = getLastBowler;
window.isBowlerValid = isBowlerValid;
window.isPlayerCanBowl = isPlayerCanBowl;
window.validateAndSetBowler = validateAndSetBowler;
window.initBowlerHistory = initBowlerHistory;
window.recordBowlerForOver = recordBowlerForOver;
window.populateSelects = populateSelects;
window.renderAll = renderAll;

// ===================== NAV =====================