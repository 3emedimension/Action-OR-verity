/* ── State ── */
let allChallenges = [];
let activeFilter = 'action-soft';

const TAB_LABELS = {
  'action-soft': 'Actions Soft',
  'action-hot': 'Actions Hot',
  'verite-soft': 'Vérités Soft',
  'verite-hot': 'Vérités Hot',
};

/* ── DOM ── */
const listEl    = document.getElementById('challenges-list');
const addBtn    = document.getElementById('add-btn');
const addText   = document.getElementById('add-text');
const addType   = document.getElementById('add-type');
const addMode   = document.getElementById('add-mode');
const addMsg    = document.getElementById('add-msg');
const tabLabel  = document.getElementById('tab-label');
const tabCount  = document.getElementById('tab-count');

/* ── Load ── */
async function loadChallenges() {
  const res = await fetch('/api/challenges');
  allChallenges = await res.json();
  render();
}

function render() {
  const [type, mode] = activeFilter.split('-');
  const filtered = allChallenges.filter(c => c.type === type && c.mode === mode);
  tabLabel.textContent = TAB_LABELS[activeFilter];
  tabCount.textContent = `${filtered.length} défi${filtered.length !== 1 ? 's' : ''}`;

  listEl.innerHTML = '';
  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="no-challenges">Aucun défi pour cette catégorie.<br>Commence à en ajouter ! 🎉</div>`;
    return;
  }

  filtered.forEach(c => {
    const item = document.createElement('div');
    item.className = 'challenge-item';
    item.dataset.id = c.id;
    item.innerHTML = `
      <div class="challenge-item-text" contenteditable="false">${escapeHtml(c.text)}</div>
      <div class="challenge-item-actions">
        <button class="icon-btn edit" title="Modifier" onclick="editItem(${c.id})">✏️</button>
        <button class="icon-btn save hidden" title="Sauvegarder" onclick="saveItem(${c.id})">✅</button>
        <button class="icon-btn del" title="Supprimer" onclick="deleteItem(${c.id})">🗑️</button>
      </div>
    `;
    listEl.appendChild(item);
  });
}

/* ── Add ── */
addBtn.addEventListener('click', async () => {
  const text = addText.value.trim();
  if (!text) { showMsg('Saisis un défi !', 'err'); return; }
  const type = addType.value;
  const mode = addMode.value;

  addBtn.disabled = true;
  addBtn.textContent = '…';
  const res = await fetch('/api/challenges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, mode, text })
  });

  if (res.ok) {
    const newC = await res.json();
    allChallenges.push(newC);
    addText.value = '';
    showMsg('Défi ajouté ! ✅', 'ok');
    // Switch to the right tab
    activeFilter = `${type}-${mode}`;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === activeFilter);
    });
    render();
  } else {
    showMsg('Erreur lors de l\'ajout.', 'err');
  }
  addBtn.disabled = false;
  addBtn.textContent = 'Ajouter ＋';
});

/* ── Edit / Save ── */
function editItem(id) {
  const item = listEl.querySelector(`[data-id="${id}"]`);
  const textEl = item.querySelector('.challenge-item-text');
  const editBtn = item.querySelector('.icon-btn.edit');
  const saveBtn = item.querySelector('.icon-btn.save');
  textEl.setAttribute('contenteditable', 'true');
  textEl.focus();
  // move cursor to end
  const range = document.createRange();
  range.selectNodeContents(textEl);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  editBtn.classList.add('hidden');
  saveBtn.classList.remove('hidden');
}

async function saveItem(id) {
  const item = listEl.querySelector(`[data-id="${id}"]`);
  const textEl = item.querySelector('.challenge-item-text');
  const editBtn = item.querySelector('.icon-btn.edit');
  const saveBtn = item.querySelector('.icon-btn.save');
  const newText = textEl.textContent.trim();
  if (!newText) { textEl.focus(); return; }

  const res = await fetch(`/api/challenges/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: newText })
  });
  if (res.ok) {
    const c = allChallenges.find(c => c.id === id);
    if (c) c.text = newText;
    textEl.setAttribute('contenteditable', 'false');
    editBtn.classList.remove('hidden');
    saveBtn.classList.add('hidden');
  }
}

/* ── Delete ── */
async function deleteItem(id) {
  if (!confirm('Supprimer ce défi ?')) return;
  const res = await fetch(`/api/challenges/${id}`, { method: 'DELETE' });
  if (res.ok) {
    allChallenges = allChallenges.filter(c => c.id !== id);
    render();
  }
}

/* ── Tabs ── */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeFilter = tab.dataset.filter;
    render();
  });
});

/* ── Msg ── */
function showMsg(text, type) {
  addMsg.textContent = text;
  addMsg.className = `add-msg ${type}`;
  setTimeout(() => { addMsg.className = 'add-msg hidden'; }, 3000);
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Expose globals ── */
window.editItem   = editItem;
window.saveItem   = saveItem;
window.deleteItem = deleteItem;

/* ── Init ── */
loadChallenges();
