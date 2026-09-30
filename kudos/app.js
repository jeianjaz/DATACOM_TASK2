const seedKudos = [
  { id: 1, sender: 'Alex Johnson', senderInitials: 'AJ', recipient: 'Maya Chen', message: 'For turning a complex brief into something the whole team could rally behind. You made it look easy.', time: '12 min ago', avatar: 'avatar-blue' },
  { id: 2, sender: 'Priya Nair', senderInitials: 'PN', recipient: 'Liam O\'Connor', message: 'Your calm energy during yesterday\'s release was exactly what we needed. Thank you for keeping us moving.', time: '48 min ago', avatar: 'avatar-violet' },
  { id: 3, sender: 'Sarah Patel', senderInitials: 'SP', recipient: 'Tom Williams', message: 'You always make space for the quieter voices in the room. That care does not go unnoticed.', time: '2 hrs ago', avatar: 'avatar-pink' },
  { id: 4, sender: 'Jordan Mitchell', senderInitials: 'JM', recipient: 'Priya Nair', message: 'For the thoughtful handover and the tiny details that made this project sing. A true team player.', time: 'Yesterday', avatar: 'avatar-amber' }
];
const colleagues = { maya: 'Maya Chen', liam: "Liam O'Connor", priya: 'Priya Nair', tom: 'Tom Williams', sarah: 'Sarah Patel', alex: 'Alex Johnson' };
const form = document.querySelector('#kudos-form');
const recipient = document.querySelector('#recipient');
const message = document.querySelector('#message');
const charCount = document.querySelector('#char-count');
const feedback = document.querySelector('#form-feedback');
const feedList = document.querySelector('#feed-list');
const monthCount = document.querySelector('#month-count');
const adminToggle = document.querySelector('#admin-toggle');
const moderationDialog = document.querySelector('#moderation-dialog');
const moderationForm = document.querySelector('#moderation-form');
const moderationReason = document.querySelector('#moderation-reason');
const moderationCopy = document.querySelector('#moderation-copy');
let pendingModeration = null;
let adminMode = false;

function getKudos() {
  try { return JSON.parse(localStorage.getItem('kudos-items')) || seedKudos; } catch { return seedKudos; }
}
function saveKudos(items) { localStorage.setItem('kudos-items', JSON.stringify(items)); }
function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }
function renderFeed() {
  const allItems = getKudos();
  const items = adminMode ? allItems.filter(item => item.moderationStatus !== 'deleted') : allItems.filter(item => item.isVisible !== false && item.moderationStatus !== 'hidden' && item.moderationStatus !== 'deleted');
  const emptyMessage = adminMode ? 'No kudos require moderation.' : 'No celebrations yet. Be the first to give kudos.';
  feedList.innerHTML = items.map(item => `
    <article class="feed-item">
      <div class="avatar ${item.avatar || 'avatar-green'}">${escapeHtml(item.senderInitials)}</div>
      <div class="feed-item-content">
        <div class="feed-item-header"><strong>${escapeHtml(item.sender)}</strong><span>gave kudos to</span><strong>${escapeHtml(item.recipient)}</strong><span class="badge">✦</span>${item.moderationStatus === 'hidden' ? '<span class="moderation-badge">Hidden</span>' : ''}</div>
        <p class="feed-message">${escapeHtml(item.message)}</p>
      </div>
      <div class="feed-meta"><time>${escapeHtml(item.time)}</time>${adminMode ? `<div class="moderation-actions"><button data-action="${item.moderationStatus === 'hidden' ? 'restore' : 'hide'}" data-id="${item.id}">${item.moderationStatus === 'hidden' ? 'Restore' : 'Hide'}</button><button data-action="delete" data-id="${item.id}">Delete</button></div>` : ''}</div>
    </article>`).join('') || `<p class="empty-feed">${emptyMessage}</p>`;
  monthCount.textContent = String(20 + allItems.filter(item => item.isVisible !== false && item.moderationStatus !== 'hidden' && item.moderationStatus !== 'deleted').length);
}
function applyModeration(id, action, reason) {
  const items = getKudos();
  const item = items.find(entry => String(entry.id) === String(id));
  if (!item) return;
  item.moderationStatus = action === 'hide' ? 'hidden' : action === 'restore' ? 'visible' : 'deleted';
  item.isVisible = action === 'restore';
  item.moderatedBy = 'Jordan Mitchell';
  item.moderatedAt = new Date().toISOString();
  item.reasonForModeration = reason.trim();
  saveKudos(items);
  renderFeed();
}
function openModerationDialog(id, action) {
  pendingModeration = { id, action };
  moderationCopy.textContent = action === 'delete' ? 'Explain why this kudos should be permanently deleted.' : `Explain why this kudos should be ${action}d.`;
  moderationReason.value = '';
  moderationDialog.showModal();
  moderationReason.focus();
}
moderationForm.addEventListener('submit', event => {
  event.preventDefault();
  const reason = moderationReason.value.trim();
  if (!pendingModeration || !reason) return;
  applyModeration(pendingModeration.id, pendingModeration.action, reason);
  pendingModeration = null;
  moderationDialog.close();
});
document.querySelector('#moderation-cancel').addEventListener('click', () => { pendingModeration = null; moderationDialog.close(); });
adminToggle.addEventListener('click', () => {
  adminMode = !adminMode;
  adminToggle.setAttribute('aria-pressed', String(adminMode));
  adminToggle.textContent = adminMode ? 'Exit admin review' : 'Admin review';
  renderFeed();
});
feedList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (button) openModerationDialog(button.dataset.id, button.dataset.action);
});
message.addEventListener('input', () => { charCount.textContent = `${message.value.length} / 240`; });
form.addEventListener('submit', event => {
  event.preventDefault();
  const selectedName = colleagues[recipient.value];
  const text = message.value.trim();
  if (!selectedName || !text) {
    feedback.textContent = !selectedName ? 'Choose a colleague to celebrate.' : 'Add a short message first.';
    feedback.style.color = '#f38d70';
    if (!selectedName) recipient.focus(); else message.focus();
    return;
  }
  const items = getKudos();
  items.unshift({ id: Date.now(), sender: 'Jordan Mitchell', senderInitials: 'JM', recipient: selectedName, message: text, time: 'Just now', avatar: 'avatar-amber', isVisible: true, moderationStatus: 'visible' });
  saveKudos(items);
  renderFeed();
  form.reset();
  charCount.textContent = '0 / 240';
  feedback.textContent = `Kudos sent to ${selectedName}!`;
  feedback.style.color = '#c8ec65';
});
renderFeed();
