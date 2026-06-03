const AVATARS = ['🎯','🎲','🃏','🎪','🎭','🎨','🌟','🔥','⚡','🌙','🦋','🎸','🎺','🍀','💫'];
let players = [];
let gameMode = null;
let currentPlayerIndex = -1;
let lastTurnIndex = -1;
let currentType = null;
let usedIndices = new Set();

const screenSetup  = document.getElementById('screen-setup');
const screenMode   = document.getElementById('screen-mode');
const screenPlay   = document.getElementById('screen-play');
const playersList  = document.getElementById('players-list');
const playerInput  = document.getElementById('player-input');
const addBtn       = document.getElementById('add-player-btn');
const startBtn     = document.getElementById('start-btn');
const setupError   = document.getElementById('setup-error');

function renderPlayers() {
  playersList.innerHTML = '';
  players.forEach((p, i) => {
    const tag = document.createElement('div');
    tag.className = 'player-tag';
    tag.innerHTML = `
      <span class="player-tag-name">${escapeHtml(p)}</span>
      <span class="player-tag-num">#${i + 1}</span>
      <button class="player-tag-del" onclick="removePlayer(${i})">✕</button>
    `;
    playersList.appendChild(tag);
  });
}

function addPlayer() {
  const name = playerInput.value.trim();
  if (!name) { playerInput.classList.add('shake'); setTimeout(() => playerInput.classList.remove('shake'), 500); return; }
  players.push(name);
  playerInput.value = '';
  playerInput.focus();
  renderPlayers();
  setupError.classList.add('hidden');
}

function removePlayer(i) {
  players.splice(i, 1);
  renderPlayers();
}

function goToModeSelect() {
  if (players.length < 2) {
    setupError.textContent = 'Ajoute au moins 2 joueurs ! 👥';
    setupError.classList.remove('hidden');
    return;
  }
  showScreen('screen-mode');
}

function chooseMode(mode) {
  gameMode = mode;
  const badge = document.getElementById('mode-badge-fixed');
  const labels = { soft: '🌸 Soft', hot: '🔥 Hot', extreme: '💀 Extrême' };
  const classes = { soft: 'badge-soft', hot: 'badge-hot', extreme: 'badge-extreme' };
  badge.textContent = labels[mode];
  badge.className = 'mode-badge-fixed ' + classes[mode];

  // Mode extrême = pas de choix action/vérité
  const choiceRow = document.getElementById('choice-row');
  const extremeBtn = document.getElementById('extreme-btn-wrap');
  if (mode === 'extreme') {
    choiceRow.classList.add('hidden');
    extremeBtn.classList.remove('hidden');
  } else {
    choiceRow.classList.remove('hidden');
    extremeBtn.classList.add('hidden');
  }

  usedIndices.clear();
  showScreen('screen-play');
  nextTurn();
}

addBtn.addEventListener('click', addPlayer);
playerInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });
startBtn.addEventListener('click', goToModeSelect);

function nextTurn() {
  if (usedIndices.size >= players.length) usedIndices.clear();
  let idx, tries = 0;
  do {
    idx = Math.floor(Math.random() * players.length);
    tries++;
  } while ((usedIndices.has(idx) || (idx === lastTurnIndex && players.length > 1)) && tries < 50);
  usedIndices.add(idx);
  lastTurnIndex = idx;
  currentPlayerIndex = idx;
  currentType = null;

  const nameEl = document.getElementById('current-player');
  nameEl.style.animation = 'none'; nameEl.offsetHeight; nameEl.style.animation = '';
  nameEl.textContent = players[idx];
  document.getElementById('avatar').textContent = AVATARS[idx % AVATARS.length];
  showStep('step-player');
}

async function pickType(type) {
  currentType = gameMode === 'extreme' ? 'action' : type;
  await loadChallenge(currentType, gameMode);
}

async function loadChallenge(type, mode) {
  const res = await fetch('/api/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, mode })
  });
  const data = await res.json();

  const labels = { action: '⚡ Action', verite: '💬 Vérité' };
  const badge = document.getElementById('challenge-badge');
  if (mode === 'extreme') {
    badge.textContent = '💀 Extrême';
    badge.style.background = 'rgba(255,50,50,0.15)';
    badge.style.borderColor = 'rgba(255,50,50,0.4)';
    badge.style.color = '#ff5555';
  } else {
    badge.textContent = labels[type] || '⚡';
    badge.style = '';
  }

  document.getElementById('challenge-player').textContent = players[currentPlayerIndex];

  const card = document.getElementById('challenge-card');
  card.className = 'challenge-card' + (mode === 'extreme' ? ' extreme-card' : '');

  const textEl = document.getElementById('challenge-text');
  if (data.empty) {
    textEl.innerHTML = `<em style="color:var(--text-muted)">Aucun défi dans cette catégorie.<br>Ajoute-en dans l'admin ! ⚙️</em>`;
  } else {
    textEl.textContent = data.text;
  }

  card.style.animation = 'none'; card.offsetHeight; card.style.animation = '';
  showStep('step-challenge');
}

async function reroll() {
  await loadChallenge(currentType, gameMode);
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showStep(stepId) {
  document.querySelectorAll('.play-step').forEach(s => s.classList.remove('active-step'));
  document.getElementById(stepId).classList.add('active-step');
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addPlayer = addPlayer;
window.removePlayer = removePlayer;
window.chooseMode = chooseMode;
window.pickType = pickType;
window.reroll = reroll;
window.nextTurn = nextTurn;
