import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildFollowupQueueItem } from '../lib/class12/queue';
import { buildClass12ProposalPackage, createClass12ProposalDraft } from '../lib/class12/proposal';

test('createClass12ProposalDraft seeds editable proposal fields for a commercial lead', () => {
  const item = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'run-9',
    status: 'approved',
  });

  const draft = createClass12ProposalDraft(item);

  assert.match(draft.quoteBand, /month|Quote after discovery/i);
  assert.equal(draft.scope.length, 3);
  assert.equal(draft.discoveryQuestions.length, 3);
  assert.match(draft.proposalNote, /workflow review|operator review/i);
});

test('buildClass12ProposalPackage uses edited proposal fields before sharing', () => {
  const item = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'run-9-custom',
    status: 'approved',
  });

  const proposalPackage = buildClass12ProposalPackage(item, {
    quoteBand: '$3,500 setup + $900/month support',
    scope: ['Deploy intake chatbot', 'Connect FAQ answers to support workflow'],
    discoveryQuestions: ['Who approves the final rollout?'],
    proposalNote: 'Send only after owner signs off on pricing and scope.',
  });

  assert.match(proposalPackage.message, /Recommended quote band: \$3,500 setup \+ \$900\/month support/i);
  assert.match(proposalPackage.message, /- Deploy intake chatbot/i);
  assert.match(proposalPackage.message, /- Connect FAQ answers to support workflow/i);
  assert.match(proposalPackage.message, /- Who approves the final rollout\?/i);
  assert.match(proposalPackage.message, /Send only after owner signs off on pricing and scope\./i);
  assert.doesNotMatch(proposalPackage.message, /Map current inquiry and after-hours support flow/i);
});
