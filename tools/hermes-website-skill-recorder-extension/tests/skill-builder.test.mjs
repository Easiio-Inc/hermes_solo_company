import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.HermesRecorderShared = require('../src/content/shared.js').HermesRecorderShared || globalThis.HermesRecorderShared;
const { buildSkillDraft, buildPublicationPacket, toSkillName } = require('../src/shared/skill-builder.js');
const { sanitizeRecordedAction, redactValue } = globalThis.HermesRecorderShared;

test('redactValue masks obvious sensitive inputs', () => {
  assert.equal(redactValue('secret-password', { fieldName: 'password' }), '[REDACTED_PASSWORD]');
  assert.equal(redactValue('owner@example.com', { fieldName: 'email' }), '[REDACTED_EMAIL]');
  assert.equal(redactValue('+1 555 111 2222', { fieldName: 'phone' }), '[REDACTED_PHONE]');
});

test('sanitizeRecordedAction keeps selectors and redacts text samples', () => {
  const action = sanitizeRecordedAction({
    eventType: 'change',
    label: 'Email',
    fieldName: 'user_email',
    selectorCandidates: ['input[name="email"]'],
    textSample: 'owner@example.com',
  });

  assert.equal(action.chosenSelector, 'input[name="email"]');
  assert.equal(action.textSample, '[REDACTED_EMAIL]');
});

test('buildSkillDraft creates markdown steps from sanitized recordings', () => {
  const draft = buildSkillDraft({
    websiteName: 'Demo CRM',
    startUrl: 'https://demo.example.com/login',
    goal: 'Log in and open the leads page.',
    steps: [
      {
        eventType: 'change',
        label: 'Email',
        fieldName: 'email',
        selectorCandidates: ['input[name="email"]'],
        textSample: 'owner@example.com',
      },
      {
        eventType: 'click',
        label: 'Sign in',
        selectorCandidates: ['button[type="submit"]'],
      },
    ],
  });

  assert.equal(draft.domain, 'demo.example.com');
  assert.match(draft.markdown, /Demo CRM workflow/);
  assert.match(draft.markdown, /\[REDACTED_EMAIL\]/);
  assert.match(draft.markdown, /button\[type="submit"\]/);
});

test('buildPublicationPacket includes a review checklist and publishable false by default', () => {
  const packet = buildPublicationPacket({
    websiteName: 'Ops Portal',
    startUrl: 'https://ops.example.com',
    steps: [],
  });

  assert.equal(packet.meta.publishable, false);
  assert.ok(packet.checklist.length >= 3);
  assert.match(packet.draft.markdown, /Publication recommendation/);
});

test('toSkillName normalizes website names into a slug-like identifier', () => {
  assert.equal(toSkillName('demo.example.com', 'Login Flow'), 'demo-example-com-login-flow');
});
