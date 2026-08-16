const sessionsEl = document.getElementById('sessions');
const packetOutputEl = document.getElementById('packetOutput');

document.getElementById('startButton').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'toggle-recording', enabled: true });
  await refreshSessions();
});

document.getElementById('stopButton').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'toggle-recording', enabled: false });
  await refreshSessions();
});

document.getElementById('refreshButton').addEventListener('click', refreshSessions);

async function refreshSessions() {
  const response = await chrome.runtime.sendMessage({ type: 'get-sessions' });
  renderSessions(response?.sessions || []);
}

function renderSessions(sessions) {
  sessionsEl.innerHTML = '';
  if (!sessions.length) {
    sessionsEl.innerHTML = '<p>No recordings yet. Start recording on the target site, then return here to approve the workflow.</p>';
    return;
  }

  for (const session of sessions) {
    const card = document.createElement('article');
    card.className = 'sessionCard';
    card.innerHTML = `
      <strong>${escapeHtml(session.websiteName || 'Recorded website')}</strong>
      <p>${escapeHtml(session.startUrl || '')}</p>
      <p>${session.steps?.length || 0} approved steps captured</p>
      <div class="sessionActions">
        <button data-action="build" data-tab-id="${session.tabId}">Build draft</button>
        <button class="secondary" data-action="clear" data-tab-id="${session.tabId}">Clear</button>
      </div>
    `;
    sessionsEl.appendChild(card);
  }
}

sessionsEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const tabId = Number(button.dataset.tabId);

  if (action === 'clear') {
    await chrome.runtime.sendMessage({ type: 'clear-session', tabId });
    packetOutputEl.value = '';
    await refreshSessions();
    return;
  }

  if (action === 'build') {
    const response = await chrome.runtime.sendMessage({ type: 'build-publication-packet', tabId });
    packetOutputEl.value = JSON.stringify(response?.packet || response, null, 2);
  }
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

refreshSessions();
