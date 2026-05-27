function goToToss(){
  tossWinner=null; batChoice=null;
  document.getElementById('toss-result').innerHTML='';
  document.getElementById('toss-choice-section').style.display='none';
  document.getElementById('flip-btn').style.display='inline-block';
  document.getElementById('toss-start-btn').disabled=true;
  const coin=document.getElementById('coin');
  coin.classList.remove('flipping','show-heads','show-tails');
  coin.classList.add('show-heads');
  document.getElementById('toss-sub').textContent=`${TEAMS[selTeamA].short} vs ${TEAMS[selTeamB].short}`;
  showPage('page-toss');
  updateNav('home');
}

function flipCoin(){
  document.getElementById('flip-btn').style.display='none';
  const coin=document.getElementById('coin');

  // Remove previous state classes
  coin.classList.remove('flipping','show-heads','show-tails');
  void coin.offsetWidth;

  // Randomly decide result
  const isHeads = Math.random() < 0.5;
  const winner = Math.random()<0.5 ? selTeamA : selTeamB;

  // Start flip animation
  coin.classList.add('flipping');

  setTimeout(()=>{
    coin.classList.remove('flipping');
    // Show correct face
    if(isHeads){
      coin.classList.add('show-heads');
    } else {
      coin.classList.add('show-tails');
    }

    // Show result text
    tossWinner = winner;
    const t = TEAMS[winner];
    const faceText = isHeads ? '🟡 HEADS' : '⚪ TAILS';
    const tossLogoHtml = TEAM_LOGOS[winner] ? `<img src="${TEAM_LOGOS[winner]}" style="width:28px;height:28px;object-fit:contain;border-radius:4px;vertical-align:middle;">` : t.logo;
    document.getElementById('toss-result').innerHTML=`
      <div style="font-size:20px;color:var(--gold);margin-bottom:6px;">${faceText}</div>
      <div style="font-size:22px;color:var(--green);">${tossLogoHtml} ${t.short} wins the toss!</div>`;
    document.getElementById('toss-winner-text').textContent=`${t.short} elects to:`;
    document.getElementById('toss-choice-section').style.display='block';
  }, 2100);
}

function chooseBatOrBowl(choice,el){
  batChoice=choice;
  document.querySelectorAll('.toss-choice').forEach(c=>c.classList.remove('picked'));
  el.classList.add('picked');
  document.getElementById('toss-start-btn').disabled=false;
}

// ===================== MATCH START =====================
function startMatch(){
  const tA=TEAMS[selTeamA], tB=TEAMS[selTeamB];
  const tossLoser=tossWinner===selTeamA?selTeamB:selTeamA;

  // Who bats first
  let batFirst, bowlFirst;
  if(batChoice==='bat'){ batFirst=tossWinner; bowlFirst=tossLoser; }
  else { batFirst=tossLoser; bowlFirst=tossWinner; }

  const batTeamKey=batFirst, bowlTeamKey=bowlFirst;
  const batTeam=TEAMS[batTeamKey], bowlTeam=TEAMS[bowlTeamKey];

  const selBatPlayers = batTeamKey===selTeamA
    ? selectedA.map(i=>batTeam.players[i].name)
    : selectedB.map(i=>batTeam.players[i].name);
  const selBowlPlayers = bowlTeamKey===selTeamA
    ? selectedA.map(i=>bowlTeam.players[i].name)
    : selectedB.map(i=>bowlTeam.players[i].name);
    
  const playerRoles = {};
  selectedA.forEach(i => { playerRoles[TEAMS[selTeamA].players[i].name] = TEAMS[selTeamA].players[i].role; });
  selectedB.forEach(i => { playerRoles[TEAMS[selTeamB].players[i].name] = TEAMS[selTeamB].players[i].role; });

  // Inn1: batFirst bats
  inn[1].batting=selBatPlayers;
  inn[1].bowling=selBowlPlayers;
  inn[1].playerRoles = { ...playerRoles };
  inn[1].batStats={};
  selBatPlayers.forEach(n=>inn[1].batStats[n]={r:0,b:0,fours:0,sixes:0,out:false});
  inn[1].bowlStats={};
  selBowlPlayers.forEach(n=>inn[1].bowlStats[n]={o:0,m:0,r:0,w:0,balls:0});
  inn[1].striker=selBatPlayers[0];
  inn[1].nonStriker=selBatPlayers[1];
  
  const validBowler1 = selBowlPlayers.find(n => ['BOWL', 'ALL'].includes(playerRoles[n]));
  inn[1].bowler=validBowler1 || selBowlPlayers[0];
  inn[1].runs=0;inn[1].wickets=0;inn[1].balls=0;inn[1].allBalls=[];
  inn[1].bowlerHistory={};
  inn[1].partnership={runs:0,balls:0};

  // Inn2: bowlFirst bats
  const sel2BatPlayers = bowlTeamKey===selTeamA
    ? selectedA.map(i=>TEAMS[selTeamA].players[i].name)
    : selectedB.map(i=>TEAMS[selTeamB].players[i].name);
  const sel2BowlPlayers = batTeamKey===selTeamA
    ? selectedA.map(i=>TEAMS[selTeamA].players[i].name)
    : selectedB.map(i=>TEAMS[selTeamB].players[i].name);

  inn[2].batting=sel2BatPlayers;
  inn[2].bowling=sel2BowlPlayers;
  inn[2].playerRoles = { ...playerRoles };
  inn[2].batStats={};
  sel2BatPlayers.forEach(n=>inn[2].batStats[n]={r:0,b:0,fours:0,sixes:0,out:false});
  inn[2].bowlStats={};
  sel2BowlPlayers.forEach(n=>inn[2].bowlStats[n]={o:0,m:0,r:0,w:0,balls:0});
  inn[2].striker=sel2BatPlayers[0];
  inn[2].nonStriker=sel2BatPlayers[1];
  
  const validBowler2 = sel2BowlPlayers.find(n => ['BOWL', 'ALL'].includes(playerRoles[n]));
  inn[2].bowler=validBowler2 || sel2BowlPlayers[0];
  inn[2].runs=0;inn[2].wickets=0;inn[2].balls=0;inn[2].allBalls=[];
  inn[2].bowlerHistory={};
  inn[2].partnership={runs:0,balls:0};

  // Store team keys for reference
  inn[1].batTeamKey=batTeamKey;
  inn[1].bowlTeamKey=bowlTeamKey;
  inn[2].batTeamKey=bowlTeamKey;
  inn[2].bowlTeamKey=batTeamKey;

  innings=1; viewInnings=1; matchOver=false;
  $cl('tab-inn1',['add','on']); $cl('tab-inn2',['remove','on']);
  document.getElementById('header-badge').textContent='LIVE';
  
  // ADD TO LIVE SCORES!
  if (window.addActiveMatchToLiveScores) {
    window.addActiveMatchToLiveScores(
      inn[1].batTeamKey, 
      inn[2].batTeamKey, 
      `${selStadium.name}, ${selStadium.city}`,
      inn[1].striker,
      inn[1].nonStriker,
      inn[1].bowler
    );
  }
  
  // INITIALIZE AI COMMENTARY!
  if (window.aiCommentary && window.aiCommentary.initCommentary) {
    window.aiCommentary.initCommentary();
  }
  
  showPage('page-match');
  updateNav('score');
  renderAll();
  window.populateSelects && window.populateSelects();
}

// ===================== BALL LOGIC =====================