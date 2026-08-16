(() => {
  const shared = globalThis.HermesRecorderShared;
  if (!shared || !globalThis.chrome?.runtime?.sendMessage) return;

  let recordingEnabled = false;

  function collectAction(eventType, node, extra = {}) {
    if (!recordingEnabled || !node) return;
    const payload = shared.sanitizeRecordedAction({
      id: shared.createStepId(),
      url: location.href,
      pageTitle: document.title,
      eventType,
      timestamp: new Date().toISOString(),
      label: shared.getNodeLabel(node),
      fieldName: node.getAttribute?.('name') || '',
      inputType: node.getAttribute?.('type') || '',
      selectorCandidates: shared.buildSelectorCandidates(node),
      textSample: extra.textSample || '',
      notes: extra.notes || '',
    });

    chrome.runtime.sendMessage({ type: 'record-action', action: payload });
  }

  document.addEventListener('click', (event) => {
    collectAction('click', event.target);
  }, true);

  document.addEventListener('change', (event) => {
    const node = event.target;
    collectAction('change', node, { textSample: node?.value || '' });
  }, true);

  document.addEventListener('submit', (event) => {
    collectAction('submit', event.target, { notes: 'Form submitted' });
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      collectAction('confirm', event.target, { notes: 'Enter key used to confirm input' });
    }
  }, true);

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'set-recording-enabled') {
      recordingEnabled = Boolean(message.enabled);
      sendResponse?.({ ok: true, recordingEnabled });
    }
  });
})();
