import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildFollowupQueueItem } from '../lib/class12/queue';
import { buildClass12ProposalFileExport, buildClass12ProposalJsonExport } from '../lib/class12/proposalExport';

test('buildClass12ProposalFileExport creates a structured markdown handoff file package', () => {
  const item = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'run-10',
    status: 'approved',
  });

  const fileExport = buildClass12ProposalFileExport(item, {
    quoteBand: '$4,000 setup + $1,250/month',
    scope: ['Deploy lead intake bot', 'Create owner review workflow'],
    discoveryQuestions: ['Who signs final approval?'],
    proposalNote: 'Use this as a review-only draft until owner approval is complete.',
  });

  assert.match(fileExport.fileName, /smile-dental.*proposal-review.*\.md/i);
  assert.equal(fileExport.mimeType, 'text/markdown');
  assert.match(fileExport.content, /^# Proposal Review Package/m);
  assert.match(fileExport.content, /^## Handoff Metadata$/m);
  assert.match(fileExport.content, /^## Operator Summary$/m);
  assert.match(fileExport.content, /^## Website Workflow Skill Draft$/m);
  assert.match(fileExport.content, /^## Machine-Readable Payload$/m);
  assert.match(fileExport.content, /Recommended quote band: \$4,000 setup \+ \$1,250\/month/i);
  assert.match(fileExport.content, /- Deploy lead intake bot/i);
  assert.match(fileExport.content, /- Create owner review workflow/i);
  assert.match(fileExport.content, /- Who signs final approval\?/i);
  assert.match(fileExport.content, /Use this as a review-only draft until owner approval is complete\./i);
  assert.match(fileExport.content, /```json[\s\S]*"export_kind": "class12_proposal_handoff"/i);
  assert.match(fileExport.content, /"target_artifact": "website_workflow_skill"/i);
});

test('buildClass12ProposalJsonExport creates a machine-ingestible JSON handoff package', () => {
  const item = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'run-11',
    status: 'approved',
  });

  const jsonExport = buildClass12ProposalJsonExport(item, {
    quoteBand: '$4,000 setup + $1,250/month',
    scope: ['Deploy lead intake bot', 'Create owner review workflow'],
    discoveryQuestions: ['Who signs final approval?'],
    proposalNote: 'Use this as a review-only draft until owner approval is complete.',
  });

  assert.match(jsonExport.fileName, /smile-dental.*proposal-review.*\.json/i);
  assert.equal(jsonExport.mimeType, 'application/json');

  const parsed = JSON.parse(jsonExport.content);
  assert.equal(parsed.export_kind, 'class12_proposal_handoff');
  assert.equal(parsed.target_artifact, 'website_workflow_skill');
  assert.equal(parsed.source.queue_item_id, item.id);
  assert.equal(parsed.source.lead.company, item.company);
  assert.equal(parsed.proposal.quote_band, '$4,000 setup + $1,250/month');
  assert.deepEqual(parsed.proposal.scope, ['Deploy lead intake bot', 'Create owner review workflow']);
  assert.deepEqual(parsed.proposal.discovery_questions, ['Who signs final approval?']);
  assert.equal(parsed.proposal.proposal_note, 'Use this as a review-only draft until owner approval is complete.');
  assert.equal(parsed.skill_seed.website_name, item.company);
  assert.ok(Array.isArray(parsed.skill_seed.operator_steps));
  assert.ok(parsed.skill_seed.operator_steps.length >= 3);
});
