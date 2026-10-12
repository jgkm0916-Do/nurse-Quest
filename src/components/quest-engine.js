// ═══════════════════════════════════════════
//  Quest Engine — 병원 배경 + 실제 이미지 버전
// ═══════════════════════════════════════════

let currentQuest = null;
let currentStep  = 0;
let completingQuest = false;
let advancingStep = false;

function isQuestCleared(questId) {
  return (appState.clearedQuests || []).includes(questId);
}

function stepQuestionText(step) {
  const question = step && step.question != null ? String(step.question).trim() : '';
  return question || '나라면 어떻게 할까요?';
}

function openQuest(questId) {
  const quest = QUESTS.find(q => q.id === questId);
  if (!quest) return;
  const node = document.getElementById('qnode-' + questId);
  if (node && node.classList.contains('locked')) return;
  currentQuest = quest;
  currentStep  = 0;
  completingQuest = false;
  advancingStep = false;
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
  completingQuest = false;
  advancingStep = false;
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
  const isReview   = isQuestCleared(quest.id);

  let html = '';

  // XP + 난이도 (이미 완료한 퀘스트는 복습 안내)
  html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">`;
  if (isReview) {
    html += `<span style="font-size:11px;font-weight:700;background:#f6f1eb;color:#8b6f5e;border:1px solid #e8ddd2;padding:3px 10px;border-radius:20px;">복습 · 경험치 지급 없음</span>`;
  } else {
    html += `<span style="font-size:11px;font-weight:700;background:#fff0e8;color:#c4704a;border:1px solid #f0d8c8;padding:3px 10px;border-radius:20px;">+${quest.xp} XP</span>`;
  }
  html += `<span style="font-size:11px;color:#b0957e;">난이도 ${'⭐'.repeat(quest.difficulty)}</span>
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

  // 상황 설명 — 씬 위 작은 텍스트
  if (step.scenario) {
    html += `<div class="quest-scenario-line">📍 ${step.scenario}</div>`;
  }

  // 바이탈/관찰
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

  // VN 스테이지: 배경 + 양옆 캐릭터 + 말풍선
  const nurseThought = step.nurseThought || '어떡하지..?';
  html += `<div class="quest-stage">
    <div class="quest-stage-bg" style="background-image:url('${bgImg}');"></div>`;

  if (step.quote) {
    html += `<div class="quest-vn-bubble quest-vn-bubble-patient">
      <div class="quest-vn-bubble-label">환자</div>
      <div class="quest-vn-bubble-text">${step.quote}</div>
    </div>`;
  }

  html += `<div class="quest-vn-bubble quest-vn-bubble-nurse">
    <div class="quest-vn-bubble-label">나</div>
    <div class="quest-vn-bubble-text">${nurseThought}</div>
  </div>`;

  html += `<div class="quest-stage-chars${patientImg ? ' has-patient' : ''}">`;

  if (patientImg) {
    html += `<div class="quest-char quest-char-patient" aria-label="환자">
      <img src="${patientImg}" alt="환자"/>
    </div>`;
  }

  html += `<div class="quest-char quest-char-nurse" aria-label="간호사">
      <img src="${nurseImg}" alt="간호사"/>
    </div>`;

  html += `</div></div>`;

  // 선택지 — 상황별 question, 없으면 기본 문구
  html += `<div class="quest-options">
    <div class="quest-options-label">${stepQuestionText(step)}</div>
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
  if (!currentQuest || completingQuest || advancingStep) return;
  advancingStep = true;
  const nextBtn = document.querySelector('#feedbackArea .btn-next');
  if (nextBtn) nextBtn.disabled = true;
  if (currentStep < currentQuest.steps.length-1) {
    currentStep++;
    renderStep();
    const sheet = document.querySelector('.modal-sheet');
    if (sheet) sheet.scrollTop = 0;
    advancingStep = false;
  } else {
    completeQuest(currentQuest);
  }
}

function completeQuest(quest) {
  if (!quest || completingQuest) return;
  completingQuest = true;

  const prevXP = appState.totalXP || 0;
  appState.clearedQuests = appState.clearedQuests || [];
  const alreadyCleared = appState.clearedQuests.includes(quest.id);

  if (!alreadyCleared) {
    appState.totalXP = prevXP + quest.xp;
    appState.clearedQuests.push(quest.id);
    appState.history = appState.history || [];
    appState.history.unshift({questTitle:quest.title, xp:quest.xp, date:new Date().toLocaleDateString('ko-KR')});
    if (appState.history.length>30) appState.history.pop();
    appState.notes = appState.notes || [];
    if (!appState.notes.find(n=>n.questId===quest.id)) appState.notes.unshift({questId:quest.id,...quest.note});
    saveState();
  }

  const newStage = getStageNum(appState.totalXP || 0);
  const rewardHtml = alreadyCleared
    ? `<div class="qd-xp" style="font-size:16px;">복습 · 경험치 지급 없음</div>
      <div class="qd-xp-sub">이미 완료한 퀘스트예요</div>`
    : `<div class="qd-xp">+${quest.xp} XP</div>
      <div class="qd-xp-sub">획득</div>`;

  document.getElementById('modalBody').innerHTML = `
    <div class="quest-done">
      <div class="qd-icon">🎉</div>
      <div class="qd-title">퀘스트 클리어!</div>
      <div class="qd-body">${quest.note.body.split('\n')[0]}</div>
      ${rewardHtml}
      <button class="btn-primary" style="max-width:200px;margin:0 auto;" onclick="closeModal();refreshAll();">맵으로 돌아가기</button>
    </div>`;

  updateHUD(); updateMap();
  if (!alreadyCleared && newStage > getStageNum(prevXP)) setTimeout(()=>showLevelUp(newStage), 700);
}
