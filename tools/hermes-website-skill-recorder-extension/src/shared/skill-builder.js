(function (global) {
  const shared = global.HermesRecorderShared || {};

  function toSkillName(domain, pageTitle) {
    const seed = `${domain || ''}-${pageTitle || ''}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    return seed || 'website-workflow-skill';
  }

  function summarizeAction(action, index) {
    const label = action.label || action.fieldName || 'element';
    const selector = action.chosenSelector || action.selectorCandidates?.[0] || 'body';
    const sample = action.textSample ? ` with value \`${action.textSample}\`` : '';
    const note = action.notes ? ` (${action.notes})` : '';
    return `${index + 1}. ${action.eventType} **${label}** using selector \`${selector}\`${sample}${note}`;
  }

  function normalizeRecording(recording) {
    const steps = Array.isArray(recording?.steps) ? recording.steps : [];
    return {
      websiteName: recording?.websiteName || 'Unnamed website',
      startUrl: recording?.startUrl || steps[0]?.url || '',
      pageTitle: recording?.pageTitle || steps[0]?.pageTitle || 'Recorded workflow',
      domain: recording?.domain || safeDomain(recording?.startUrl || steps[0]?.url || ''),
      goal: recording?.goal || 'Complete the recorded website workflow',
      steps: steps.map((step) => (shared.sanitizeRecordedAction ? shared.sanitizeRecordedAction(step) : step)),
    };
  }

  function safeDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (_error) {
      return '';
    }
  }

  function buildSkillDraft(recording) {
    const normalized = normalizeRecording(recording);
    const skillName = toSkillName(normalized.domain, normalized.pageTitle);
    const stepLines = normalized.steps.map(summarizeAction).join('\n');
    const selectorNotes = normalized.steps
      .map((step) => `- ${step.label || step.fieldName || step.eventType}: ${step.selectorCandidates?.join(', ') || step.chosenSelector || 'n/a'}`)
      .join('\n');

    const markdown = `---
name: ${skillName}
description: Review-first website workflow skill recorded from ${normalized.websiteName}.
---

# ${normalized.websiteName} workflow

## Goal
${normalized.goal}

## Prerequisites
- Start from: ${normalized.startUrl || 'operator-provided URL'}
- Confirm the operator has permission to access ${normalized.domain || 'the target site'}
- Do not reuse secrets from the original recording

## Recorded steps
${stepLines || '1. No approved steps yet.'}

## Selector notes
${selectorNotes || '- No selector notes available.'}

## Verification
- Re-run the workflow on a safe test account or non-production record when possible.
- Confirm the final page state matches the operator goal.

## Publication recommendation
- Review redaction before sharing this skill with Hermes or any public catalog.
`;

    return {
      skillName,
      domain: normalized.domain,
      websiteName: normalized.websiteName,
      startUrl: normalized.startUrl,
      goal: normalized.goal,
      steps: normalized.steps,
      markdown,
    };
  }

  function buildPublicationPacket(recording) {
    const draft = buildSkillDraft(recording);
    return {
      meta: {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        domain: draft.domain,
        websiteName: draft.websiteName,
        publishable: false,
      },
      draft,
      checklist: [
        'Review the step list and remove accidental clicks.',
        'Confirm redaction placeholders replaced all secrets and personal data.',
        'Replay or spot-check the workflow before publication.',
      ],
    };
  }

  const api = {
    buildSkillDraft,
    buildPublicationPacket,
    normalizeRecording,
    summarizeAction,
    toSkillName,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.HermesSkillBuilder = api;
})(globalThis);
