/* ── State ── */
const AVATARS = ['🎯','🎲','🃏','🎪','🎭','🎨','🌟','🔥','⚡','🌙','🦋','🎸','🎺','🍀','💫'];
let players = [];
let gameMode = null; // 'soft' | 'hot'
let currentPlayerIndex = -1;
let lastTurnIndex = -1;
let currentType = null;
let usedIndices = new Set();

/* ── DOM refs ── */
const screenSetup  = document.getElementById('screen-setup');
const screenMode   = document.getElementById('screen-mode');
const screenPlay   = document.getElementById('screen-play');
const playersList  = document.getElementById('players-list');
const playerInput  = document.getElementById('player-input');
const addBtn       = document.getElementById('add-player-btn');
const startBtn     = document.getElementById('start-btn');
const setupError   = document.getElementById('setup-error');

/* ────────────────────────────────────────────────────── */
/* SETUP                                                  */
/* ────────────────────────────────────────────────────── */

function renderPlayers() {
  playersList.innerHTML = '';
  players.forEach((p, i) => {
    const tag = document.createElement('div');
    tag.className = 'player-tag';
    tag.innerHTML = `
      <span class="player-tag-name">${escapeHtml(p)}</span>
      <span class="player-tag-num">#${i + 1}</span>
      <button class="player-tag-del" onclick="removePlayer(${i})" title="Supprimer">✕</button>
    `;
    playersList.appendChild(tag);
  });
}

function addPlayer() {
  const name = playerInput.value.trim();
  if (!name) {
    playerInput.classList.add('shake');
    setTimeout(() => playerInput.classList.remove('shake'), 500);
    return;
  }
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
    setupError.textContent = 'Ajoute au moins 2 joueurs pour commencer ! 👥';
    setupError.classList.remove('hidden');
    return;
  }
  showScreen('screen-mode');
}

function chooseMode(mode) {
  gameMode = mode;
  // Set mode badge
  const badge = document.getElementById('mode-badge-fixed');
  badge.textContent = mode === 'soft' ? '🌸 Mode Soft' : '🔥 Mode Hot';
  badge.className = 'mode-badge-fixed ' + (mode === 'soft' ? 'badge-soft' : 'badge-hot');

  usedIndices.clear();
  showScreen('screen-play');
  nextTurn();
}

addBtn.addEventListener('click', addPlayer);
playerInput.addEventListener('keydown', e => { if (e.key === 'Enter') addPlayer(); });
startBtn.addEventListener('click', goToModeSelect);

/* ────────────────────────────────────────────────────── */
/* GAMEPLAY                                               */
/* ────────────────────────────────────────────────────── */

function nextTurn() {
  if (usedIndices.size >= players.length) usedIndices.clear();

  let idx;
  let tries = 0;
  do {
    idx = Math.floor(Math.random() * players.length);
    tries++;
  } while ((usedIndices.has(idx) || (idx === lastTurnIndex && players.length > 1)) && tries < 50);

  usedIndices.add(idx);
  lastTurnIndex = idx;
  currentPlayerIndex = idx;
  currentType = null;

  const nameEl = document.getElementById('current-player');
  nameEl.style.animation = 'none';
  nameEl.offsetHeight;
  nameEl.style.animation = '';
  nameEl.textContent = players[idx];

  document.getElementById('avatar').textContent = AVATARS[idx % AVATARS.length];

  showStep('step-player');
}

async function pickType(type) {
  currentType = type;
  await loadChallenge(type, gameMode);
}

async function loadChallenge(type, mode) {
  const res = await fetch('/api/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, mode })
  });
  const data = await res.json();

  const typeLabel = type === 'action' ? '⚡ Action' : '💬 Vérité';
  document.getElementById('challenge-badge').textContent = typeLabel;
  document.getElementById('challenge-player').textContent = players[currentPlayerIndex];

  const textEl = document.getElementById('challenge-text');
  if (data.empty) {
    textEl.innerHTML = `<em style="color:var(--text-muted)">Aucun défi dans cette catégorie.<br>Ajoute-en dans le panneau admin ! ⚙️</em>`;
  } else {
    textEl.textContent = data.text;
  }

  // Animate card
  const card = document.getElementById('challenge-card');
  card.style.animation = 'none';
  card.offsetHeight;
  card.style.animation = '';

  showStep('step-challenge');
}

async function reroll() {
  await loadChallenge(currentType, gameMode);
}

/* ────────────────────────────────────────────────────── */
/* NAVIGATION                                             */
/* ────────────────────────────────────────────────────── */

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showStep(stepId) {
  document.querySelectorAll('.play-step').forEach(s => s.classList.remove('active-step'));
  document.getElementById(stepId).classList.add('active-step');
}

/* ── Utils ── */
function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Expose globals ── */
window.addPlayer     = addPlayer;
window.removePlayer  = removePlayer;
window.chooseMode    = chooseMode;
window.pickType      = pickType;
window.reroll        = reroll;
window.nextTurn      = nextTurn;
