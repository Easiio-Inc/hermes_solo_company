importScripts('../content/shared.js', '../shared/skill-builder.js');

const sessionsByTab = new Map();

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

async function setRecordingEnabled(enabled) {
  const tab = await getActiveTab();
  if (!tab?.id) return { ok: false, error: 'No active tab available.' };

  const current = sessionsByTab.get(tab.id) || {
    tabId: tab.id,
    websiteName: tab.title || 'Recorded website',
    pageTitle: tab.title || 'Recorded workflow',
    startUrl: tab.url || '',
    domain: safeDomain(tab.url),
    steps: [],
    recordingEnabled: false,
  };

  current.recordingEnabled = Boolean(enabled);
  sessionsByTab.set(tab.id, current);
  await chrome.tabs.sendMessage(tab.id, { type: 'set-recording-enabled', enabled: current.recordingEnabled }).catch(() => null);
  return { ok: true, recordingEnabled: current.recordingEnabled, session: current };
}

function safeDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (_error) {
    return '';
  }
}

function listSessions() {
  return Array.from(sessionsByTab.values()).map((session) => ({
    ...session,
    draft: globalThis.HermesSkillBuilder?.buildSkillDraft?.(session) || null,
  }));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'record-action') {
    const action = globalThis.HermesRecorderShared.sanitizeRecordedAction(message.action || {});
    const domain = safeDomain(action.url);
    const tabId = message.action?.tabId || _sender?.tab?.id || -1;
    const session = sessionsByTab.get(tabId) || {
      tabId,
      websiteName: _sender?.tab?.title || domain || 'Recorded website',
      pageTitle: action.pageTitle || _sender?.tab?.title || 'Recorded workflow',
      startUrl: action.url || _sender?.tab?.url || '',
      domain,
      goal: 'Recreate the approved operator workflow on the target website.',
      steps: [],
      recordingEnabled: true,
    };
    session.steps.push(action);
    session.pageTitle = action.pageTitle || session.pageTitle;
    session.websiteName = _sender?.tab?.title || session.websiteName;
    session.startUrl = session.startUrl || action.url;
    session.domain = session.domain || domain;
    sessionsByTab.set(tabId, session);
    sendResponse({ ok: true, count: session.steps.length });
    return true;
  }

  if (message?.type === 'toggle-recording') {
    setRecordingEnabled(Boolean(message.enabled)).then(sendResponse);
    return true;
  }

  if (message?.type === 'get-sessions') {
    sendResponse({ ok: true, sessions: listSessions() });
    return true;
  }

  if (message?.type === 'clear-session') {
    const tabId = Number(message.tabId);
    if (!Number.isNaN(tabId)) {
      sessionsByTab.delete(tabId);
    }
    sendResponse({ ok: true, sessions: listSessions() });
    return true;
  }

  if (message?.type === 'build-publication-packet') {
    const tabId = Number(message.tabId);
    const session = sessionsByTab.get(tabId);
    if (!session) {
      sendResponse({ ok: false, error: 'No recorded session found for this tab.' });
      return true;
    }
    const packet = globalThis.HermesSkillBuilder.buildPublicationPacket(session);
    sendResponse({ ok: true, packet });
    return true;
  }
});
