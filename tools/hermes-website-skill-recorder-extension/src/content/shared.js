(function (global) {
  const SENSITIVE_PATTERN = /(pass(word)?|secret|token|auth|card|email|phone|otp|code)/i;

  function createStepId(prefix = 'step') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function isSensitiveName(value) {
    return typeof value === 'string' && SENSITIVE_PATTERN.test(value);
  }

  function getNodeLabel(node) {
    if (!node || typeof node !== 'object') return 'Unknown element';
    const aria = node.getAttribute?.('aria-label');
    const text = node.innerText?.trim?.() || node.textContent?.trim?.();
    const placeholder = node.getAttribute?.('placeholder');
    const name = node.getAttribute?.('name');
    return aria || text || placeholder || name || node.tagName?.toLowerCase?.() || 'element';
  }

  function buildSelectorCandidates(node) {
    if (!node || !node.tagName) return [];
    const selectors = [];
    const tag = node.tagName.toLowerCase();
    const id = node.id?.trim();
    const name = node.getAttribute?.('name');
    const testId = node.getAttribute?.('data-testid') || node.getAttribute?.('data-test');
    const aria = node.getAttribute?.('aria-label');
    const type = node.getAttribute?.('type');

    if (id) selectors.push(`#${CSS.escape(id)}`);
    if (testId) selectors.push(`[data-testid="${String(testId).replace(/"/g, '\"')}"]`);
    if (aria) selectors.push(`${tag}[aria-label="${String(aria).replace(/"/g, '\"')}"]`);
    if (name) selectors.push(`${tag}[name="${String(name).replace(/"/g, '\"')}"]`);
    if (type) selectors.push(`${tag}[type="${String(type).replace(/"/g, '\"')}"]`);

    const classes = Array.from(node.classList || []).filter(Boolean).slice(0, 2);
    if (classes.length > 0) selectors.push(`${tag}.${classes.map((value) => CSS.escape(value)).join('.')}`);

    const path = buildDomPath(node);
    if (path) selectors.push(path);

    return Array.from(new Set(selectors)).slice(0, 6);
  }

  function buildDomPath(node) {
    if (!node || !node.tagName) return '';
    const segments = [];
    let current = node;
    while (current && current.nodeType === Node.ELEMENT_NODE && segments.length < 5) {
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent) {
        segments.unshift(tag);
        break;
      }
      const siblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
      const index = siblings.indexOf(current) + 1;
      segments.unshift(`${tag}:nth-of-type(${Math.max(index, 1)})`);
      current = parent;
    }
    return segments.join(' > ');
  }

  function redactValue(rawValue, options = {}) {
    const value = typeof rawValue === 'string' ? rawValue : '';
    const fieldHint = [options.fieldName, options.inputType, options.label].filter(Boolean).join(' ');

    if (!value) return '';
    if (isSensitiveName(fieldHint)) {
      if (/email/i.test(fieldHint)) return '[REDACTED_EMAIL]';
      if (/phone/i.test(fieldHint)) return '[REDACTED_PHONE]';
      if (/pass/i.test(fieldHint)) return '[REDACTED_PASSWORD]';
      return '[REDACTED_SECRET]';
    }
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '[REDACTED_EMAIL]';
    if (/^\+?[\d\s().-]{7,}$/.test(value)) return '[REDACTED_PHONE]';
    if (value.length > 80) return `${value.slice(0, 24)}…[TRUNCATED]`;
    return value;
  }

  function sanitizeRecordedAction(action) {
    const selectorCandidates = Array.isArray(action.selectorCandidates) ? action.selectorCandidates.filter(Boolean).slice(0, 6) : [];
    const primarySelector = selectorCandidates[0] || action.chosenSelector || 'body';
    const fieldName = action.fieldName || '';
    const label = action.label || '';
    const inputType = action.inputType || '';

    return {
      id: action.id || createStepId(),
      url: action.url || '',
      pageTitle: action.pageTitle || '',
      eventType: action.eventType || 'unknown',
      timestamp: action.timestamp || new Date().toISOString(),
      label,
      fieldName,
      inputType,
      selectorCandidates,
      chosenSelector: primarySelector,
      textSample: redactValue(action.textSample || '', { fieldName, inputType, label }),
      notes: action.notes || '',
    };
  }

  const api = {
    buildSelectorCandidates,
    createStepId,
    getNodeLabel,
    redactValue,
    sanitizeRecordedAction,
  };

  global.HermesRecorderShared = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HermesRecorderShared: api, ...api };
  }
})(globalThis);
