// ═══════════════════════════════════════════
//  App — 상태 관리, HUD, 맵, 캐릭터 탭, 레벨업
// ═══════════════════════════════════════════

const STORAGE_KEY = 'nursequest_final_v1';

let appState = {
  name: '',
  totalXP: 0,
  clearedQuests: [],
  streak: 0,
  bestStreak: 0,
  totalAnswers: 0,
  correctAnswers: 0,
  tagCounts: {},
  stats: { ...DEFAULT_STATS },
  history: [],
  notes: [],
  introSeen: false,
};

const EPILOGUE_STEPS = [
  {
    narration: '첫 발령을 받고 처음 도착한 병동. 낯선 공간 속에서 긴장한 마음으로 주변을 둘러봅니다.',
    head: '',
    player: '',
  },
  {
    narration: '',
    head: '어서 와요. 오늘부터 이 병동에서 함께할 {name} 간호사죠? 많이 긴장됐을 텐데, 잘 왔어요.',
    player: '',
  },
  {
    narration: '',
    head: '',
    player: '{name}입니다. 잘 부탁드립니다. 많이 배우겠습니다.',
  },
  {
    narration: '',
    head: '환영해요. 처음은 누구나 서툴러요. 오늘의 첫 퀘스트부터 차근차근 함께 시작해봐요.',
    player: '',
  },
];

// ── 저장/로드 ──
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      Object.assign(appState, saved);
      if (!appState.stats) appState.stats = { ...DEFAULT_STATS };
    }
  } catch(e) {}
}

// ── 시작 ──
function clearStartError() {
  const input = document.getElementById('nurseNameInput');
  const error = document.getElementById('startFormError');
  if (input) {
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');
  }
  if (error) error.textContent = '';
}

function startApp() {
  const input = document.getElementById('nurseNameInput');
  const name  = input.value.trim();
  if (!name) {
    const error = document.getElementById('startFormError');
    if (error) error.textContent = '이름이나 닉네임을 입력해 주세요.';
    input.classList.add('input-error');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }
  clearStartError();
  appState.name = name;
  appState.introSeen = false;
  saveState();
  showEpilogue();
}

function showStartScreen() {
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-epilogue').classList.remove('active');
  document.getElementById('screen-result').classList.remove('active');
  document.getElementById('screen-start').classList.add('active');
  const input = document.getElementById('nurseNameInput');
  if (input && appState.name) input.value = appState.name;
  clearStartError();
}

function showApp() {
  document.getElementById('screen-epilogue')?.classList.remove('active');
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-app').classList.add('active');
  document.getElementById('hudName') && (document.getElementById('hudName').textContent = appState.name);
  updateHUD();
  updateMap();
}

let epilogueStep = 0;

function renderEpilogueStep() {
  const step = EPILOGUE_STEPS[epilogueStep];
  const narrationEl = document.getElementById('epilogueNarration');
  const headEl = document.getElementById('epilogueHeadBubble');
  const playerEl = document.getElementById('epiloguePlayerBubble');
  const narrationTextEl = document.getElementById('epilogueNarrationText');
  const headTextEl = document.getElementById('epilogueHeadText');
  const playerSpeakerEl = document.getElementById('epiloguePlayerSpeaker');
  const playerTextEl = document.getElementById('epiloguePlayerText');
  const nextBtn = document.getElementById('epilogueNextBtn');

  const nurseName = appState.name || '이새싹';
  const headText = (step.head || '').replaceAll('{name}', nurseName);
  const playerText = (step.player || '').replaceAll('{name}', nurseName);

  narrationTextEl.textContent = step.narration || '';
  headTextEl.textContent = headText;
  playerSpeakerEl.textContent = nurseName;
  playerTextEl.textContent = playerText || '';

  narrationEl.classList.toggle('show', Boolean(step.narration));
  headEl.classList.toggle('show', Boolean(headText));
  playerEl.classList.toggle('show', Boolean(playerText));

  document.querySelectorAll('.epi-dot').forEach((dot, idx) => {
    dot.classList.toggle('active', idx <= epilogueStep);
  });

  nextBtn.textContent = epilogueStep === EPILOGUE_STEPS.length - 1 ? '퀘스트 맵으로 가기 →' : '다음';
}

function showEpilogue() {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-result').classList.remove('active');
  document.getElementById('screen-epilogue').classList.add('active');
  epilogueStep = 0;
  renderEpilogueStep();
}

function finishEpilogue() {
  appState.introSeen = true;
  saveState();
  showApp();
}

function nextEpilogueStep() {
  if (epilogueStep >= EPILOGUE_STEPS.length - 1) {
    finishEpilogue();
    return;
  }
  epilogueStep += 1;
  renderEpilogueStep();
}

function skipEpilogue() {
  finishEpilogue();
}

// ── HUD ──
function updateHUD() {
  const xp    = appState.totalXP || 0;
  const info  = getStageInfo(xp);

  document.getElementById('hudStageNum').textContent  = info.stage;
  document.getElementById('hudStageName').textContent = info.title;
  document.getElementById('hudXpFill').style.width    = info.pct + '%';
  document.getElementById('hudXpText').textContent    = `${xp} / ${info.nextXP} XP`;
  document.getElementById('hudStreak').textContent    = appState.streak || 0;
  document.getElementById('hudCleared').textContent   = (appState.clearedQuests || []).length;
}

// ── 퀘스트 맵 ──
function updateMap() {
  const cleared    = appState.clearedQuests || [];
  const xp         = appState.totalXP || 0;
  const info       = getStageInfo(xp);
  const stats      = appState.stats || DEFAULT_STATS;
  const persona    = getPersona(appState.tagCounts || {});
  const topStats   = Object.entries(stats).sort((a,b)=>b[1]-a[1]).slice(0,3);
  const listEl     = document.getElementById('chapterList');

  // ── 상단 성장 요약 패널 ──
  let html = `
  <div style="
    background:#fff;
    border:1px solid #f0e8de;
    border-radius:18px;
    padding:16px;
    margin-bottom:16px;
    display:flex;
    gap:14px;
    align-items:center;
  ">
    <!-- 캐릭터 미니 -->
    <img src="${info.img}" alt="내 캐릭터" style="
      width:72px;height:90px;
      object-fit:contain;
      flex-shrink:0;
      filter:drop-shadow(0 4px 8px rgba(196,112,74,.2));
    "/>

    <div style="flex:1;min-width:0;">
      <!-- 스테이지 배지 -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="
          font-size:11px;font-weight:700;
          background:linear-gradient(135deg,#c4704a,#e8904a);
          color:#fff;padding:2px 10px;border-radius:20px;
        ">STAGE ${info.stage}</span>
        <span style="font-size:13px;font-weight:700;color:#3d2b1f;">${info.title}</span>
      </div>

      <!-- XP 바 -->
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:10px;color:#b0957e;">경험치</span>
          <span style="font-size:10px;color:#b0957e;">${xp} / ${info.nextXP} XP</span>
        </div>
        <div style="height:4px;background:#f0e8de;border-radius:2px;overflow:hidden;">
          <div style="height:100%;width:${info.pct}%;background:linear-gradient(90deg,#c4704a,#e8904a);border-radius:2px;transition:width .6s;"></div>
        </div>
      </div>

      <!-- 강점 TOP 3 -->
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
        ${topStats.map(([name], i) => `
          <span style="
            font-size:11px;
            background:${i===0?'#fff0e8':'#fdf8f3'};
            border:1px solid ${i===0?'#f0d8c8':'#f0e8de'};
            color:${i===0?'#c4704a':'#8b6f5e'};
            padding:2px 9px;border-radius:20px;
            font-weight:${i===0?'700':'400'};
          ">${i===0?'⭐ ':''}${name}</span>
        `).join('')}
      </div>

      <!-- 간호 철학 한 줄 -->
      <div style="
        font-size:11px;
        color:#8b6f5e;
        font-style:italic;
        line-height:1.5;
        background:#fdf8f3;
        border-left:2px solid #f0d8c8;
        padding:5px 8px;
        border-radius:0 6px 6px 0;
        overflow:hidden;
        display:-webkit-box;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
      ">${cleared.length > 0 ? '"' + persona.philosophy.split('\n')[0] + '"' : '퀘스트를 클리어하면 나만의 간호 철학이 완성돼요 ✦'}</div>
    </div>
  </div>`;

  // ── 챕터 목록 ──
  const chapterMap = {};
  QUESTS.forEach(q => {
    if (!chapterMap[q.chapter]) chapterMap[q.chapter] = [];
    chapterMap[q.chapter].push(q);
  });

  const chapterIds = Object.keys(chapterMap).map(Number).sort((a,b)=>a-b);

  chapterIds.forEach(chId => {
    const ch      = CHAPTERS.find(c => c.id === chId);
    if (!ch) return;
    const quests  = chapterMap[chId];
    const chDone  = quests.filter(q => cleared.includes(q.id)).length;
    const chTotal = quests.length;

    const prevChId   = chapterIds[chapterIds.indexOf(chId) - 1];
    const prevQuests = prevChId ? (chapterMap[prevChId] || []) : [];
    const chLocked   = prevChId != null && prevQuests.some(q => !cleared.includes(q.id));

    html += `<div class="chapter-card${chLocked ? ' locked' : ''}">
      <div class="ch-header">
        <span class="ch-badge${chLocked ? ' locked' : ''}">Ch ${chId}</span>
        <span class="ch-title">${ch.title}</span>
        <span class="ch-progress">${chDone} / ${chTotal}</span>
      </div>`;

    if (chLocked) {
      html += `<div class="chapter-locked-msg">🔒 이전 챕터를 완료하면 열려요</div>`;
    } else {
      html += `<div class="quest-nodes">`;
      quests.forEach((quest, i) => {
        const isCleared  = cleared.includes(quest.id);
        const isUnlocked = i === 0 || cleared.includes(quests[i-1].id);
        const nodeClass  = isCleared ? 'cleared' : isUnlocked ? 'unlocked' : 'locked';
        const icon       = isCleared ? '<span class="qn-check">✓</span>'
                         : quest.difficulty === 1 ? '🌱'
                         : quest.difficulty === 2 ? '🌿' : '🌳';

        if (i > 0) {
          const prevCleared = cleared.includes(quests[i-1].id);
          html += `<div class="qn-conn${prevCleared ? ' lit' : ''}"></div>`;
        }

        html += `<div class="qn ${nodeClass}" id="qnode-${quest.id}" onclick="openQuest(${quest.id})">
          <div class="qn-circle">${icon}</div>
          <div class="qn-label">${quest.title}</div>
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });

  // Ch1 전체 클리어시 결과 보기 버튼
  const ch1Quests  = QUESTS.filter(q => q.chapter === 1);
  const allCh1Done = ch1Quests.every(q => cleared.includes(q.id));
  if (allCh1Done) {
    html += `<button class="btn-primary" style="margin-top:20px;" onclick="showResult()">✨ 나의 간호 성향 결과 보기</button>`;
  }

  listEl.innerHTML = html;
}

// ── 탭 전환 ──
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  if (tab === 'character') updateCharacterTab();
  if (tab === 'notes')     updateNotesTab();
}

// ── 캐릭터 탭 ──
function updateCharacterTab() {
  const xp    = appState.totalXP || 0;
  const info  = getStageInfo(xp);
  const stats = appState.stats || DEFAULT_STATS;

  // 캐릭터 이미지
  document.getElementById('charCardImg').src       = info.img;
  document.getElementById('charStageBadge').textContent = `STAGE ${info.stage}`;
  document.getElementById('charStageTitle').textContent = info.title;
  document.getElementById('charStageDesc').textContent  = info.desc;
  document.getElementById('charXpFill').style.width     = info.pct + '%';
  document.getElementById('charXpText').textContent     = `${xp} / ${info.nextXP} XP`;

  // 능력치 바
  const statBarsEl = document.getElementById('statBars');
  statBarsEl.innerHTML = Object.entries(stats).map(([name, val]) => `
    <div class="stat-row">
      <div class="stat-name">${name}</div>
      <div class="stat-bar-bg">
        <div class="stat-bar-fill" style="width:${val}%;background:${STAT_COLORS[name]};"></div>
      </div>
      <div class="stat-num">${val}</div>
    </div>`).join('');

  // 레이더 차트
  drawRadar('radarChart', stats, info.color);

  // 성장 트랙
  const cleared = appState.clearedQuests || [];
  const trackEl = document.getElementById('growthTrack');
  trackEl.innerHTML = STAGES.map((s, i) => {
    const isActive = s.stage === info.stage;
    const isDone   = s.stage < info.stage;
    let html = '';
    if (i > 0) html += `<div class="gt-conn${isDone || isActive ? ' done' : ''}"></div>`;
    html += `<div class="gt-node">
      <img src="${s.img}" alt="${s.title}" class="gt-char${isActive ? ' active' : isDone ? ' done' : ''}"/>
      <div class="gt-label${isActive ? ' active' : isDone ? ' done' : ''}">
        Stage ${s.stage}<br>${s.title}
      </div>
    </div>`;
    return html;
  }).join('');

  // 아이템
  const itemsEl = document.getElementById('itemsGrid');
  itemsEl.innerHTML = ITEMS.map(item => {
    const unlocked = info.stage >= item.unlockStage;
    return `<div class="item-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="item-icon">${item.icon}</div>
      <div class="item-label">${item.label}</div>
    </div>`;
  }).join('');
}

// ── 레이더 차트 ──
function drawRadar(canvasId, stats, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx    = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2;
  const r  = Math.min(W, H) * 0.38;
  const keys = Object.keys(stats);
  const n    = keys.length;
  const angleStep = (Math.PI * 2) / n;

  ctx.clearRect(0, 0, W, H);

  // 배경 그물
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI/2;
      const x = cx + Math.cos(angle) * r * (ring/4);
      const y = cy + Math.sin(angle) * r * (ring/4);
      i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(196,112,74,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 축
  for (let i = 0; i < n; i++) {
    const angle = i * angleStep - Math.PI/2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r);
    ctx.strokeStyle = 'rgba(196,112,74,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 데이터 영역
  ctx.beginPath();
  keys.forEach((key, i) => {
    const val   = (stats[key] || 0) / 100;
    const angle = i * angleStep - Math.PI/2;
    const x = cx + Math.cos(angle) * r * val;
    const y = cy + Math.sin(angle) * r * val;
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle   = (color || '#c4704a') + '30';
  ctx.strokeStyle = color || '#c4704a';
  ctx.lineWidth   = 2;
  ctx.fill();
  ctx.stroke();

  // 라벨
  ctx.fillStyle = '#8b6f5e';
  ctx.font      = '11px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  keys.forEach((key, i) => {
    const angle = i * angleStep - Math.PI/2;
    const lx = cx + Math.cos(angle) * (r + 18);
    const ly = cy + Math.sin(angle) * (r + 18);
    ctx.fillText(key, lx, ly);
  });
}

// ── 노트 탭 ──
function updateNotesTab() {
  const notes  = appState.notes || [];
  const listEl = document.getElementById('notesList');
  if (!notes.length) {
    listEl.innerHTML = '<div class="empty-state">📋<br><br>아직 기록된 노트가 없어요<br>퀘스트를 완료하면 여기 쌓여요</div>';
    return;
  }
  listEl.innerHTML = notes.map(n => `
    <div class="note-card">
      <div class="note-title">${n.title}</div>
      <div class="note-body">${n.body.replace(/\n/g,'<br>')}</div>
    </div>`).join('');
}

// ── 결과 화면 ──
function showResult() {
  const persona = getPersona(appState.tagCounts || {});
  const xp      = appState.totalXP || 0;
  const info    = getStageInfo(xp);
  const stats   = appState.stats || DEFAULT_STATS;
  const tags    = Object.entries(appState.tagCounts || {}).sort((a,b)=>b[1]-a[1]).slice(0,6);

  document.getElementById('screen-app').classList.remove('active');
  document.getElementById('screen-result').classList.add('active');

  document.getElementById('resultCharImg').src          = info.img;
  document.getElementById('resultBadge').textContent    = persona.badge + ' ' + persona.title;
  document.getElementById('resultPersona').textContent  = persona.title;
  document.getElementById('resultMsg').innerHTML        = persona.msg.replace(/\n/g,'<br>');
  document.getElementById('resultPhilosophy').innerHTML = persona.philosophy.replace(/\n/g,'<br>');

  // 태그 pills
  document.getElementById('resultTags').innerHTML = tags.map(([tag, cnt]) => {
    const isStrong = persona.tags.includes(tag);
    return `<span class="result-tag-pill" style="${isStrong?'background:var(--terra);color:#fff;border-color:var(--terra);':''}">${tag} ${cnt}회</span>`;
  }).join('');

  // 결과 레이더
  setTimeout(() => drawRadar('resultRadar', stats, info.color), 100);
}

function goBackToMap() {
  document.getElementById('screen-result').classList.remove('active');
  document.getElementById('screen-app').classList.add('active');
  refreshAll();
}

// ── 레벨업 팝업 ──
function stageImageSources(info) {
  const stageNum = info.stage;
  return [
    info.img,
    'images/Stage' + stageNum + '.png',
    'images/stages/stage' + stageNum + '.png',
  ].filter((src, index, list) => src && list.indexOf(src) === index);
}

function showLevelUp(stageNum) {
  const info = STAGES.find(s => s.stage === stageNum);
  if (!info) return;

  const overlay = document.getElementById('levelupOverlay');
  overlay.classList.add('show');

  const img = document.getElementById('luCharImg');
  const sources = stageImageSources(info);
  let sourceIndex = 0;
  img.alt = info.title;
  img.onerror = function () {
    sourceIndex += 1;
    if (sourceIndex < sources.length) img.src = sources[sourceIndex];
  };
  img.src = sources[0];

  document.getElementById('luStageNum').textContent = stageNum;
  document.getElementById('luStageName').textContent = info.title;
  document.getElementById('luStageDesc').textContent = info.desc;

  // 파티클
  spawnParticles();
}

function closeLevelUp() {
  document.getElementById('levelupOverlay').classList.remove('show');
}

function spawnParticles() {
  const container = document.getElementById('luParticles');
  container.innerHTML = '';
  const colors = ['#f0c040','#c4704a','#e8904a','#88c8a8','#a8c8e8','#f5c9a8'];
  const centerX = window.innerWidth  / 2;
  const centerY = window.innerHeight / 2;

  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'lu-particle';
    const size  = 6 + Math.random() * 10;
    const angle = (i / 28) * 360;
    const dist  = 80 + Math.random() * 120;
    const tx    = Math.cos(angle * Math.PI/180) * dist;
    const ty    = Math.sin(angle * Math.PI/180) * dist;
    const delay = Math.random() * 0.3;

    p.style.cssText = `
      left:${centerX}px; top:${centerY}px;
      width:${size}px; height:${size}px;
      background:${colors[i % colors.length]};
      animation: luPart ${0.8 + Math.random()*0.6}s ease-out ${delay}s forwards;
      transform: translate(-50%, -50%);
    `;

    // CSS 변수로 방향 전달
    p.style.setProperty('--tx', tx + 'px');
    p.style.setProperty('--ty', ty + 'px');
    container.appendChild(p);
  }
}

// ── 전체 새로고침 ──
function refreshAll() {
  updateHUD();
  updateMap();
  // 현재 활성 탭 새로고침
  const activeTab = document.querySelector('.tab-content.active');
  if (activeTab && activeTab.id === 'tab-character') updateCharacterTab();
  if (activeTab && activeTab.id === 'tab-notes')     updateNotesTab();
}

// ── 초기화 ──
(function init() {
  loadState();
  if (appState.name) {
    if (appState.introSeen) showApp();
    else showEpilogue();
  }
})();
