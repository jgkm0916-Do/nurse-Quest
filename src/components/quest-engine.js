// ═══════════════════════════════════════════
//  Quest Engine — 병원 배경 + 실제 이미지 버전
// ═══════════════════════════════════════════

let currentQuest = null;
let currentStep  = 0;

function openQuest(questId) {
  const quest = QUESTS.find(q => q.id === questId);
  if (!quest) return;
  const node = document.getElementById('qnode-' + questId);
  if (node && node.classList.contains('locked')) return;
  currentQuest = quest;
  currentStep  = 0;
  document.getElementById('modalMeta').textContent  = `Chapter ${quest.chapter} · 난이도 ${'⭐'.repeat(quest.difficulty)}`;
  document.getElementById('modalTitle').textContent = quest.title;
  renderStep();
  document.getElementById('questModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('questModal').classList.remove('open');
  document.body.style.overflow = '';
  currentQuest = null; currentStep = 0;
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('questModal')) closeModal();
}

function renderStep() {
  const quest      = currentQuest;
  const step       = quest.steps[currentStep];
  const total      = quest.steps.length;
  const body       = document.getElementById('modalBody');
  const stageInfo  = getStageInfo(appState.totalXP || 0);
  const nurseImg   = stageInfo.img;
  const bgImg      = quest.bg || 'images/backgrounds/room.png';
  const patientImg = quest.patientImg || null;

  let html = '';

  // XP + 난이도
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
    <span style="font-size:11px;font-weight:700;background:#fff0e8;color:#c4704a;border:1px solid #f0d8c8;padding:3px 10px;border-radius:20px;">+${quest.xp} XP</span>
    <span style="font-size:11px;color:#b0957e;">난이도 ${'⭐'.repeat(quest.difficulty)}</span>
  </div>`;

  // 진행 점
  if (total > 1) {
    html += `<div style="margin-bottom:12px;">
      <div style="font-size:11px;color:#b0957e;margin-bottom:5px;">${currentStep+1} / ${total} 상황</div>
      <div style="display:flex;gap:5px;">
        ${Array.from({length:total},(_,i)=>`
          <div style="flex:1;height:3px;border-radius:2px;background:${i<=currentStep?'#c4704a':'#f0e8de'};transition:background .3s;"></div>
        `).join('')}
      </div>
    </div>`;
  }

  html += `<div class="quest-scene">`;

  // 말풍선 (캐릭터와 분리)
  if (step.scenario || step.quote) {
    html += `<div class="quest-bubbles">`;
    if (step.scenario) {
      html += `<div class="quest-bubble quest-bubble-scene">
        <div class="quest-bubble-label">📍 상황</div>
        ${step.scenario}
      </div>`;
    }
    if (step.quote) {
      html += `<div class="quest-bubble quest-bubble-quote">
        <div class="quest-bubble-label">💬 환자</div>
        ${step.quote}
      </div>`;
    }
    html += `</div>`;
  }

  // 바이탈/관찰 — 캐릭터 위에 따로 배치해 가리지 않음
  if (step.vitals || (step.observations && step.observations.length)) {
    html += `<div class="quest-clinical">`;
    if (step.vitals) {
      html += `<div class="quest-vitals">`;
      step.vitals.forEach(v => {
        const valColor = v.state==='danger'?'#c0392b':v.state==='warn'?'#b07000':'#3a7a3a';
        html += `<div class="quest-vital-card">
          <div class="quest-vital-label">${v.label}</div>
          <div class="quest-vital-value" style="color:${valColor};">${v.value}</div>
        </div>`;
      });
      html += `</div>`;
    }
    if (step.observations && step.observations.length) {
      html += `<div class="quest-obs">`;
      step.observations.forEach(o => {
        html += `<span class="quest-obs-tag">${o}</span>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  }

  // 배경 스테이지: 배경(80% 불투명) + 상체 캐릭터
  html += `<div class="quest-stage">
    <div class="quest-stage-bg" style="background-image:url('${bgImg}');"></div>
    <div class="quest-stage-chars">`;

  if (patientImg) {
    html += `<div class="quest-char quest-char-patient" aria-label="환자">
      <img src="${patientImg}" alt="환자"/>
    </div>`;
  }

  html += `<div class="quest-char quest-char-nurse" aria-label="간호사">
      <img src="${nurseImg}" alt="간호사"/>
    </div>`;

  html += `</div></div>`;

  // 선택지
  html += `<div class="quest-options">
    <div class="quest-options-label">나라면 어떻게 할까요?</div>
    <div id="optionList" style="display:flex;flex-direction:column;gap:8px;">
      ${step.options.map((opt,i)=>`
        <button class="opt-btn" onclick="chooseOption(${i})">${opt.text}</button>
      `).join('')}
    </div>
  </div>`;

  html += `</div>`;

  html += `<div id="feedbackArea"></div>`;
  body.innerHTML = html;
}

function chooseOption(idx) {
  const step      = currentQuest.steps[currentStep];
  const isCorrect = step.options[idx].correct;
  const tags      = step.options[idx].tags || [];

  appState.tagCounts = appState.tagCounts || {};
  appState.stats     = appState.stats || { ...DEFAULT_STATS };
  tags.forEach(t => {
    appState.tagCounts[t] = (appState.tagCounts[t]||0)+1;
    const stat = TAG_STAT_MAP[t];
    if (stat) appState.stats[stat] = Math.min(99, (appState.stats[stat]||10) + (isCorrect?5:2));
  });

  appState.totalAnswers   = (appState.totalAnswers||0)+1;
  if (isCorrect) {
    appState.correctAnswers = (appState.correctAnswers||0)+1;
    appState.streak         = (appState.streak||0)+1;
    if (appState.streak > (appState.bestStreak||0)) appState.bestStreak = appState.streak;
  } else {
    appState.streak = 0;
  }
  saveState(); updateHUD();

  document.querySelectorAll('.opt-btn').forEach((btn,i) => {
    btn.disabled = true;
    if (i===idx) btn.classList.add(isCorrect?'correct':'wrong');
    else if (step.options[i].correct) btn.classList.add('reveal');
  });

  const isLast = currentStep === currentQuest.steps.length-1;
  document.getElementById('feedbackArea').innerHTML = `
    <div class="feedback ${isCorrect?'correct':'wrong'}" style="margin-top:14px;">
      <div class="fb-title">${isCorrect?'✓ 정답!':'✗ 다시 생각해봐요'}</div>
      <div>${isCorrect?step.feedbackCorrect:step.feedbackWrong}</div>
    </div>
    <div style="text-align:right;margin-top:12px;">
      <button class="btn-next" onclick="nextStep()">${isLast?'퀘스트 완료! 🎉':'다음 상황 →'}</button>
    </div>`;
}

function nextStep() {
  if (currentStep < currentQuest.steps.length-1) {
    currentStep++;
    renderStep();
    document.querySelector('.modal-sheet').scrollTop = 0;
  } else {
    completeQuest(currentQuest);
  }
}

function completeQuest(quest) {
  const prevXP    = appState.totalXP || 0;
  appState.totalXP = prevXP + quest.xp;
  appState.clearedQuests = appState.clearedQuests || [];
  if (!appState.clearedQuests.includes(quest.id)) appState.clearedQuests.push(quest.id);
  appState.history = appState.history || [];
  appState.history.unshift({questTitle:quest.title, xp:quest.xp, date:new Date().toLocaleDateString('ko-KR')});
  if (appState.history.length>30) appState.history.pop();
  appState.notes = appState.notes || [];
  if (!appState.notes.find(n=>n.questId===quest.id)) appState.notes.unshift({questId:quest.id,...quest.note});
  saveState();

  const prevStage = getStageNum(prevXP);
  const newStage  = getStageNum(appState.totalXP);

  document.getElementById('modalBody').innerHTML = `
    <div class="quest-done">
      <div class="qd-icon">🎉</div>
      <div class="qd-title">퀘스트 클리어!</div>
      <div class="qd-body">${quest.note.body.split('\n')[0]}</div>
      <div class="qd-xp">+${quest.xp} XP</div>
      <div class="qd-xp-sub">획득</div>
      <button class="btn-primary" style="max-width:200px;margin:0 auto;" onclick="closeModal();refreshAll();">맵으로 돌아가기</button>
    </div>`;

  updateHUD(); updateMap();
  if (newStage > prevStage) setTimeout(()=>showLevelUp(newStage), 700);
}
