import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildFollowupQueueItem } from '../lib/class12/queue';
import { createInitialClass12WorkspaceState, restoreClass12WorkspaceState } from '../lib/class12/state';

test('createInitialClass12WorkspaceState seeds the demo lead and one pending queue item', () => {
  const state = createInitialClass12WorkspaceState();

  assert.equal(state.runCount, 1);
  assert.equal(state.draft.company, class12DemoLead.company);
  assert.equal(state.queue.length, 1);
  assert.equal(state.queue[0].status, 'pending_review');
  assert.equal(state.queue[0].lead.email, class12DemoLead.email);
});

test('restoreClass12WorkspaceState keeps a valid persisted draft, queue, and run count', () => {
  const approved = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    status: 'approved',
    idSuffix: 'persisted-1',
  });

  const restored = restoreClass12WorkspaceState({
    draft: {
      ...class12DemoLead,
      company: 'Persisted Dental',
    },
    submittedLead: {
      ...class12DemoLead,
      company: 'Persisted Dental',
    },
    runCount: 4,
    queue: [approved],
  });

  assert.equal(restored.runCount, 4);
  assert.equal(restored.draft.company, 'Persisted Dental');
  assert.equal(restored.queue[0].status, 'approved');
  assert.equal(restored.queue[0].id, approved.id);
});

test('restoreClass12WorkspaceState falls back to the demo seed when persisted queue or run count is invalid', () => {
  const restored = restoreClass12WorkspaceState({
    draft: {
      ...class12DemoLead,
      company: 'Broken Snapshot Co',
    },
    submittedLead: null,
    runCount: -9,
    queue: [{ id: 'broken' }],
  });

  assert.equal(restored.runCount, 1);
  assert.equal(restored.draft.company, 'Broken Snapshot Co');
  assert.equal(restored.submittedLead.company, class12DemoLead.company);
  assert.equal(restored.queue.length, 1);
  assert.equal(restored.queue[0].status, 'pending_review');
});
