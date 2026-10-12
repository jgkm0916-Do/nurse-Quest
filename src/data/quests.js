// ═══════════════════════════════════════════
//  NurseQuest — 데이터 시스템
// ═══════════════════════════════════════════

const STAGES = [
  { stage:1, title:'새내기 간호사',     desc:'설레임과 긴장이 공존하는 시작',      minXP:0,    img:'images/stages/stage1.png', color:'#c4704a' },
  { stage:2, title:'성장하는 간호사',   desc:'조금씩 익숙해지고 자신감이 생겨요', minXP:200,  img:'images/stages/stage2.png', color:'#4a90c4' },
  { stage:3, title:'신뢰받는 간호사',   desc:'임상 판단력이 높아지는 단계',        minXP:500,  img:'images/stages/stage3.png', color:'#2a9068' },
  { stage:4, title:'전문성 있는 간호사',desc:'근거를 바탕으로 판단하고 행동해요', minXP:900,  img:'images/stages/stage4.png', color:'#7050c0' },
  { stage:5, title:'리더십 간호사',     desc:'팀과 함께 더 좋은 간호를 만들어요',  minXP:1400, img:'images/stages/stage5.png', color:'#b06020' },
  { stage:6, title:'통합적 간호사',     desc:'전인적 관점으로 간호를 실천해요',    minXP:2000, img:'images/stages/stage6.png', color:'#3a7a90' },
  { stage:7, title:'영감을 주는 간호사',desc:'누군가의 롤모델이 되는 간호사',      minXP:2800, img:'images/stages/stage7.png', color:'#c8900a' },
];

function getStageInfo(xp) {
  let info = STAGES[0];
  for (const s of STAGES) { if (xp >= s.minXP) info = s; }
  const idx  = STAGES.indexOf(info);
  const next = STAGES[idx + 1];
  const prevXP = info.minXP;
  const nextXP = next ? next.minXP : prevXP + 800;
  const pct    = Math.min(100, Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100));
  return { ...info, nextXP, pct, isMax: !next };
}

function getStageNum(xp) { return getStageInfo(xp).stage; }

const CHAPTERS = [
  { id:1, title:'이상한 걸 알아채는 눈',  sub:'단일 증상 인식' },
  { id:2, title:'지금 뭐가 더 급한가',    sub:'복합 판단'      },
  { id:3, title:'말하고 연결하는 힘',     sub:'SBAR 보고'      },
  { id:4, title:'왜 그렇게 하는가',       sub:'근거기반 판단'  },
  { id:5, title:'나는 어떤 간호사인가',   sub:'간호 철학 완성' },
];

const TAG_STAT_MAP = {
  '관찰형':'임상판단', '근거형':'근거', '공감형':'공감',
  '협력형':'소통', '직관형':'임상판단', '안전형':'안전',
  '행동형':'임상판단', '탐구형':'근거', '리더형':'리더십',
};

const ITEMS = [
  { id:'notebook',   icon:'📒', label:'간호 기록 노트',    unlockStage:1 },
  { id:'stetho',     icon:'🩺', label:'청진기',            unlockStage:1 },
  { id:'guidebook',  icon:'📘', label:'임상 가이드북',     unlockStage:2 },
  { id:'tablet',     icon:'💻', label:'환자 교육 태블릿',  unlockStage:2 },
  { id:'sbar',       icon:'📋', label:'SBAR 카드',          unlockStage:3 },
  { id:'calculator', icon:'🖩',  label:'핸드폰/알림기',    unlockStage:3 },
  { id:'badge',      icon:'🪪',  label:'직은 배지',         unlockStage:4 },
  { id:'thankyou',   icon:'💌', label:'감사 카드',          unlockStage:5 },
];

// 배경 이미지 경로
const BG = {
  room:      'images/backgrounds/room.png',
  hallway:   'images/backgrounds/hallway.png',
  station:   'images/backgrounds/station.png',
  treatment: 'images/backgrounds/treatment.png',
  lobby:     'images/backgrounds/lobby.png',
  icu:       'images/backgrounds/icu.png',
  er:        'images/backgrounds/er.png',
  lounge:    'images/backgrounds/lounge.png',
};

// 환자 이미지 경로
const PATIENT = {
  fever:     'images/patients/fever.png',
  breathing: 'images/patients/breathing.png',
  dizziness: 'images/patients/dizziness.png',
  fall:      'images/patients/fall.png',
  chest:     'images/patients/chest.png',
};

const QUESTS = [

  // ════ Chapter 1 ════

  {
    id:0, chapter:1,
    title:'열이 나요', subtitle:'단일 증상 · 발열',
    xp:80, difficulty:1,
    bg: BG.room,
    patientImg: PATIENT.fever,
    note:{
      title:'발열 환자 기본 대응',
      body:'발열 기준: 38.0°C 이상\n추가 확인: 동반 증상(기침, 소변이상, 오한)\n기본 대응: 재측정 → 동반 증상 파악 → 보고\n당뇨 환자는 감염에 취약 → 신속 보고 필수',
    },
    steps:[
      {
        scenario:'오전 10시, 609호 병실 라운딩 중',
        quote:'"선생님, 아까부터 오한이 나고 열이 나는 것 같아요."',
        vitals:[
          {label:'체온',  value:'38.7°C', state:'danger'},
          {label:'맥박',  value:'98회/분', state:'warn'},
          {label:'혈압',  value:'128/80',  state:'ok'},
          {label:'SpO₂', value:'97%',     state:'ok'},
        ],
        observations: null,
        question:'이 상황에서 먼저 해야 할 것은?',
        options:[
          {text:'38.7도면 미열이라 다음 라운딩 때 다시 확인한다.', correct:false, tags:['안전형']},
          {text:'체온을 다시 측정하고, 동반 증상을 추가로 확인한다.', correct:true, tags:['관찰형','근거형']},
          {text:'바로 해열제를 투여한다.', correct:false, tags:['행동형']},
          {text:'보호자에게 먼저 연락한다.', correct:false, tags:['공감형','협력형']},
        ],
        feedbackCorrect:'맞아요! 발열이 확인되면 재측정하고 동반 증상을 파악하는 게 첫 번째예요. 당뇨 환자는 감염에 취약해서 열 하나도 가볍게 넘기면 안 됩니다.',
        feedbackWrong:'38.7°C는 발열(38.0°C 이상) 기준을 넘어요. 즉시 약을 주거나 지켜보기보다, 재측정 + 동반 증상 확인이 먼저예요.',
      },
      {
        scenario:'체온 재측정 결과 38.9°C. 오한과 기침, 소변색도 어제부터 진하다고 합니다.',
        quote:null,
        vitals:[
          {label:'체온',   value:'38.9°C', state:'danger'},
          {label:'소변색', value:'진함',   state:'warn'},
        ],
        observations:['오한 호소','기침(경미)','소변색 짙음'],
        question:'지금 가장 가능성 높은 상황과 행동은?',
        options:[
          {text:'단순 감기일 가능성이 높다. 해열제 처방을 요청한다.', correct:false, tags:['행동형']},
          {text:'발열 + 소변이상 + 기침 = 감염 가능성. 담당의에게 SBAR로 즉시 보고한다.', correct:true, tags:['근거형','협력형']},
          {text:'수액이 부족해서 그럴 수 있다. 수액 속도를 올린다.', correct:false, tags:['행동형']},
          {text:'혈당이 올라서 그런 것 같다. 혈당부터 측정한다.', correct:false, tags:['관찰형']},
        ],
        feedbackCorrect:'발열 + 소변이상 + 기침의 조합은 감염을 강하게 시사해요. 당뇨 환자는 패혈증으로 빠르게 진행할 수 있어서 즉시 보고가 맞아요.',
        feedbackWrong:'세 가지 증상이 함께 있어요. 이 조합은 감염 의심 → 즉시 보고가 필요합니다.',
      },
    ],
  },

  {
    id:1, chapter:1,
    title:'숨이 차요', subtitle:'단일 증상 · 호흡곤란',
    xp:100, difficulty:1,
    bg: BG.room,
    patientImg: PATIENT.breathing,
    note:{
      title:'호흡곤란 환자 핵심',
      body:'위험 신호: SpO₂ < 94%, 호흡수 > 20회/분\n즉각 대응: 보조호흡근 사용 + 식은땀\n행동 순서: 산소 적용 → 즉시 보고 → SBAR\n신규간호사: 혼자 해결하지 말고 에스컬레이션',
    },
    steps:[
      {
        scenario:'오전 10시, 603호 병실 라운딩 중',
        quote:'"선생님… 아까부터 숨이 좀 차요."',
        vitals:[
          {label:'SpO₂',  value:'88%',     state:'danger'},
          {label:'호흡수', value:'28회/분', state:'danger'},
          {label:'맥박',  value:'108회/분',state:'warn'},
          {label:'혈압',  value:'138/88',   state:'ok'},
        ],
        observations:['보조호흡근 사용','식은땀','안절부절못함'],
        question:'이 환자를 보고 가장 먼저 드는 생각은?',
        options:[
          {text:'체위를 바꿔드리고 다음 라운딩 때 다시 확인한다.', correct:false, tags:['안전형']},
          {text:'지금 상태가 정상이 아니다. 즉시 뭔가 해야 한다.', correct:true, tags:['직관형','관찰형']},
          {text:'입원 중에 흔한 증상이니까 차트를 먼저 확인한다.', correct:false, tags:['근거형']},
          {text:'보호자에게 먼저 연락해서 상황을 전달한다.', correct:false, tags:['공감형']},
        ],
        feedbackCorrect:'SpO₂ 88%, 호흡수 28회, 보조호흡근 사용 — 세 가지 모두 위험신호예요. "뭔가 이상하다"는 직감을 믿는 것, 그게 첫 번째 임상 역량이에요.',
        feedbackWrong:'SpO₂ 88%는 정상(94~100%)보다 훨씬 낮고 보조호흡근 사용까지 있어요. 즉각 반응이 필요한 상황이에요.',
      },
      {
        scenario:'위험하다고 판단했습니다. 지금 당장 첫 번째 행동은?',
        quote:null, vitals:null, observations:null,
        question:'나는 지금 무엇을 해야 하나?',
        options:[
          {text:'차트를 열어 최근 주치의 오더를 확인한다.', correct:false, tags:['근거형']},
          {text:'산소를 적용하고 담당 의사 또는 charge nurse에게 즉시 보고한다.', correct:true, tags:['협력형','안전형']},
          {text:'환자를 안심시키고 잠시 변화를 관찰한다.', correct:false, tags:['공감형']},
          {text:'다른 환자 처치를 먼저 마무리한다.', correct:false, tags:['안전형']},
        ],
        feedbackCorrect:'산소 적용 → 즉시 보고가 핵심이에요. 혼자 판단하지 않고 에스컬레이션하는 것 자체가 실력입니다.',
        feedbackWrong:'호흡 곤란 환자는 기다릴 시간이 없어요. 산소 적용 → 즉시 보고 순서를 기억하세요.',
      },
      {
        scenario:'담당 레지던트에게 전화로 보고합니다.',
        quote:null, vitals:null, observations:null,
        question:'가장 적절한 보고 방식은?',
        options:[
          {text:'"603호 환자 좀 이상한 것 같아요, 와서 봐주세요."', correct:false, tags:['직관형']},
          {text:'"603호 김철수 환자, 68세, 폐렴 3일째입니다. SpO₂ 88%, 호흡수 28회, 보조호흡근 사용 중이고 식은땀을 흘립니다. 호흡 상태 악화로 보고드립니다."', correct:true, tags:['근거형','협력형']},
          {text:'"선생님 지금 바쁘세요? 603호 환자가 숨차다고 해서요."', correct:false, tags:['공감형']},
          {text:'"603호 환자 산소포화도가 떨어졌는데 어떻게 할까요?"', correct:false, tags:['협력형']},
        ],
        feedbackCorrect:'완벽한 SBAR 보고예요! 환자 정보·수치·증상·판단을 담았어요. 의사가 전화 한 통으로 결정을 내릴 수 있는 보고입니다.',
        feedbackWrong:'보고할 때는 환자 이름 + 나이 + 진단 + 객관적 수치 + 현재 상태가 필요해요. 이것을 SBAR 보고라고 해요.',
      },
    ],
  },

  {
    id:2, chapter:1,
    title:'어지러워요', subtitle:'단일 증상 · 기립성 저혈압',
    xp:90, difficulty:1,
    bg: BG.hallway,
    patientImg: PATIENT.dizziness,
    note:{
      title:'어지럼증 환자 감별 포인트',
      body:'혈압 측정 필수 (기립성 저혈압 확인)\n혈당 측정 필수 (저혈당 70mg/dL 미만)\n낙상 위험 → 즉시 앉히고 혼자 이동 금지\n원인 파악 후 보고',
    },
    steps:[
      {
        scenario:'오후 2시, 복도에서 발견. 512호 이순자 환자(72세)가 벽을 짚고 서 있습니다.',
        quote:'"선생님, 갑자기 눈앞이 빙글빙글 도네요. 일어서다가 그랬어요."',
        vitals:[
          {label:'혈압(앉음)', value:'88/52', state:'danger'},
          {label:'맥박',       value:'92회/분',state:'warn'},
        ],
        observations:['벽 짚고 서 있음','얼굴 창백','식은땀'],
        question:'이 상황에서 가장 먼저 해야 할 것은?',
        options:[
          {text:'바로 혈압과 혈당을 측정한다.', correct:false, tags:['관찰형','근거형']},
          {text:'환자를 즉시 앉히거나 눕혀 낙상을 예방한 뒤 활력징후를 측정한다.', correct:true, tags:['안전형','관찰형']},
          {text:'수분 섭취를 권유하고 잠시 기다려본다.', correct:false, tags:['공감형']},
          {text:'의사에게 바로 전화한다.', correct:false, tags:['협력형']},
        ],
        feedbackCorrect:'맞아요! 어지럼증 환자의 첫 번째는 낙상 예방이에요. 앉힌 후에 수치를 측정하세요.',
        feedbackWrong:'어지럼증 환자는 낙상 위험이 있어요. 수치 측정 전에 먼저 안전하게 앉혀야 해요.',
      },
    ],
  },

  {
    id:3, chapter:1,
    title:'소변이 안 나와요', subtitle:'단일 증상 · 핍뇨',
    xp:90, difficulty:1,
    bg: BG.room,
    patientImg: PATIENT.fever,
    note:{
      title:'핍뇨 환자 체크리스트',
      body:'정상 소변량: 0.5mL/kg/hr 이상\n핍뇨 기준: 400mL/day 미만\n확인 사항: 수분 섭취량, 카테터 막힘, 혈압\n즉시 보고: 신기능 저하 가능성',
    },
    steps:[
      {
        scenario:'오후 3시, 805호 병실. 심부전 환자 소변줄이 8시간째 거의 안 나옵니다.',
        quote:null,
        vitals:[
          {label:'소변량(8hr)', value:'80mL',    state:'danger'},
          {label:'혈압',        value:'142/88',   state:'warn'},
          {label:'부종',        value:'양측 하지',state:'warn'},
        ],
        observations:['하지 부종','8시간 소변 80mL','유치도뇨관 유지 중'],
        question:'가장 먼저 확인해야 할 것은?',
        options:[
          {text:'수분 섭취량을 늘리도록 물을 더 마시게 한다.', correct:false, tags:['행동형']},
          {text:'카테터가 막혔는지 확인하고, I/O를 계산한 뒤 담당의에게 보고한다.', correct:true, tags:['관찰형','근거형']},
          {text:'심부전 환자라 원래 소변이 적을 수 있으니 다음 교대 때 확인한다.', correct:false, tags:['안전형']},
          {text:'이뇨제를 바로 투여한다.', correct:false, tags:['행동형']},
        ],
        feedbackCorrect:'카테터 막힘 확인이 먼저고, I/O 계산 후 보고가 맞는 순서예요. 심부전 환자의 핍뇨는 신기능 악화 신호일 수 있어요.',
        feedbackWrong:'8시간에 80mL는 핍뇨예요. 카테터 상태 확인 → I/O 계산 → 보고 순서로 접근해야 해요.',
      },
    ],
  },

  // ════ Chapter 2 ════

  {
    id:4, chapter:2,
    title:'두 가지가 동시에', subtitle:'복합 증상 · 호흡 + 의식',
    xp:140, difficulty:2,
    bg: BG.room,
    patientImg: PATIENT.breathing,
    note:{
      title:'복합 증상 판단 원칙',
      body:'발열 + 호흡수 증가 + 의식 변화 = 패혈증 의심\nqSOFA: 호흡수 ≥22, 의식 변화, 수축기 혈압 ≤100\n2개 이상 해당 → 즉시 응급 보고\n골든타임: 1시간 이내 항생제 투여가 예후 결정',
    },
    steps:[
      {
        scenario:'야간 순회 중 802호 병실. 복부수술 후 2일째 환자가 처져 있습니다.',
        quote:'"…선생님, 좀 힘들어요." (목소리가 약함)',
        vitals:[
          {label:'SpO₂',  value:'91%',     state:'danger'},
          {label:'호흡수', value:'24회/분', state:'danger'},
          {label:'체온',  value:'38.5°C',   state:'warn'},
          {label:'혈압',  value:'98/62',    state:'danger'},
        ],
        observations:['반응 느림','목소리 힘없음','발한','창백'],
        question:'이 환자에서 가장 우려되는 상황은?',
        options:[
          {text:'단순 피로이다. 내일 아침 담당의에게 보고한다.', correct:false, tags:['안전형']},
          {text:'발열 + 호흡저하 + 저혈압 + 의식 변화 = 패혈증 의심. 즉시 보고한다.', correct:true, tags:['근거형','직관형']},
          {text:'산소만 올려주면 충분하다.', correct:false, tags:['행동형']},
          {text:'가족에게 먼저 연락한다.', correct:false, tags:['공감형','협력형']},
        ],
        feedbackCorrect:'발열 + 빠른 호흡 + 저혈압 + 의식 저하는 패혈증의 대표 징후예요(qSOFA 3개 해당). 즉각 보고가 생명을 살립니다.',
        feedbackWrong:'이 네 가지 조합은 패혈증을 강하게 시사해요. 즉시 보고해야 해요.',
      },
      {
        scenario:'보고 후 30분, 혈압이 더 떨어졌습니다.',
        quote:null,
        vitals:[
          {label:'혈압',  value:'82/50',   state:'danger'},
          {label:'SpO₂',  value:'89%',    state:'danger'},
          {label:'맥박',  value:'118회/분',state:'danger'},
        ],
        observations:['30분 전보다 악화','의식 더 저하'],
        question:'이 상황에서 어떻게 해야 하나?',
        options:[
          {text:'지시받은 대로 계속 모니터하며 기다린다.', correct:false, tags:['안전형']},
          {text:'상황이 악화됐으니 즉시 다시 보고하고, 필요시 응급팀 호출을 요청한다.', correct:true, tags:['협력형','직관형','리더형']},
          {text:'수액 속도를 임의로 올린다.', correct:false, tags:['행동형']},
          {text:'다음 교대 간호사에게 인계하면서 알린다.', correct:false, tags:['협력형']},
        ],
        feedbackCorrect:'처음 보고 후에도 상황이 악화되면 반드시 재보고해야 해요. 재보고가 두 번째 임상 역량이에요.',
        feedbackWrong:'"지시받았으니 기다린다"는 위험해요. 상황이 악화되면 즉시 재보고해야 해요.',
      },
    ],
  },

  {
    id:5, chapter:2,
    title:'우선순위를 정해야 해', subtitle:'복합 판단 · 다중 환자',
    xp:150, difficulty:2,
    bg: BG.station,
    patientImg: null,
    note:{
      title:'우선순위 판단 원칙 (ABCDE)',
      body:'A — Airway (기도): 막힘이 있으면 최우선\nB — Breathing (호흡): SpO₂, 호흡수 이상\nC — Circulation (순환): 혈압, 맥박, 출혈\nD — Disability (신경): 의식 수준 변화\nE — Exposure (노출): 발열, 피부 이상\n→ 문제가 앞쪽일수록 먼저 대응',
    },
    steps:[
      {
        scenario:'오전 10시, 간호사 스테이션. 세 환자에게서 동시에 호출이 왔습니다.',
        quote:null,
        vitals: null,
        observations:[
          '🔔 401호: SpO₂ 86%, 호흡곤란 호소',
          '🔔 402호: 통증 10점, 진통제 요청',
          '🔔 403호: 식사 도움 요청',
        ],
        question:'어떤 순서로 대응해야 하나?',
        options:[
          {text:'호출 순서대로 403호 → 402호 → 401호 순으로 간다.', correct:false, tags:['안전형']},
          {text:'401호(SpO₂ 86%, 호흡곤란) → 402호(통증) → 403호(식사) 순으로 대응한다.', correct:true, tags:['근거형','직관형']},
          {text:'가장 가까운 방부터 먼저 간다.', correct:false, tags:['행동형']},
          {text:'charge nurse에게 도움을 요청하고 동시에 대응한다.', correct:false, tags:['협력형']},
        ],
        feedbackCorrect:'SpO₂ 86%는 생명 위협적 상황이에요. ABCDE 원칙에서 B(호흡)가 위협받으면 최우선이에요.',
        feedbackWrong:'우선순위는 호출 순서나 거리가 아니라 임상적 중증도로 정해요. SpO₂ 86%가 무조건 1순위예요.',
      },
    ],
  },
];

const PERSONAS = [
  {
    key:'observer', title:'임상판단 전문가',
    tags:['관찰형','근거형'], badge:'🔭',
    msg:'수치 하나, 표정 하나를 놓치지 않는 눈을 가졌어요.\n데이터 기반으로 생각하는 이 능력이 위기 상황에서 팀을 지킵니다.',
    philosophy:'"나는 보이지 않는 것을 보는 간호사가 되고 싶다.\n환자의 숫자 뒤에 있는 이야기를 읽는 것, 그게 나의 간호다."',
  },
  {
    key:'empath', title:'환자의 정신적 지주',
    tags:['공감형','안전형'], badge:'🤝',
    msg:'수치보다 사람을 먼저 보는 따뜻함이 있어요.\n환자가 두려울 때 가장 먼저 떠올리는 이름이 될 거예요.',
    philosophy:'"환자의 손을 잡는 것도 치료다.\n나는 수치를 보기 전에 눈을 먼저 본다."',
  },
  {
    key:'connector', title:'팀의 허브',
    tags:['협력형','리더형'], badge:'🌐',
    msg:'혼자 해결하려 하지 않고 적재적소에 연결하는 능력이 탁월해요.\n팀이 잘 돌아가게 만드는 간호사, 그게 당신이에요.',
    philosophy:'"좋은 간호사는 모든 걸 아는 사람이 아니라,\n누구에게 물어야 하는지 아는 사람이다."',
  },
  {
    key:'evidence', title:'근거기반 전문가',
    tags:['근거형','탐구형'], badge:'📚',
    msg:'"왜?"라는 질문을 멈추지 않는 탐구형 간호사예요.\n프로토콜을 단순히 따르는 게 아니라 이해하고 적용하는 능력이 있어요.',
    philosophy:'"나는 습관이 아닌 이해로 간호한다.\n매번 근거를 물어보는 것, 그게 나의 방식이다."',
  },
  {
    key:'intuitive', title:'위기대응 리더',
    tags:['직관형','행동형'], badge:'⚡',
    msg:'상황을 빠르게 읽고 먼저 움직이는 결단력이 있어요.\n위기 상황에서 팀이 믿고 따라가는 사람이에요.',
    philosophy:'"생각하는 동안 환자는 기다리지 않는다.\n나는 느끼고, 움직이고, 그리고 설명한다."',
  },
  {
    key:'guardian', title:'안전수호자',
    tags:['안전형','관찰형'], badge:'🛡',
    msg:'오류 하나, 위험 하나를 절대 넘기지 않는 꼼꼼함이 있어요.\n이 병동이 안전한 이유 중 하나가 당신이에요.',
    philosophy:'"예방은 치료보다 강하다.\n작은 신호를 보는 것이 가장 중요한 기술이라 믿는다."',
  },
];

function getPersona(tagCounts) {
  let best = PERSONAS[0], bestScore = 0;
  for (const p of PERSONAS) {
    const score = p.tags.reduce((s,t) => s + (tagCounts[t]||0), 0);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

const DEFAULT_STATS = {근거:10, 임상판단:10, 안전:10, 공감:10, 소통:10, 리더십:10};
const STAT_COLORS   = {근거:'#4a90c4', 임상판단:'#c4704a', 안전:'#2a9068', 공감:'#c4508a', 소통:'#7050c0', 리더십:'#b06020'};
