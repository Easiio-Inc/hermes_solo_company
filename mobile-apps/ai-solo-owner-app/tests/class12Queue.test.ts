import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildFollowupQueueItem, sortFollowupQueue } from '../lib/class12/queue';

test('buildFollowupQueueItem turns a qualified lead into an urgent pending task', () => {
  const item = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead));

  assert.equal(item.priority, 'urgent');
  assert.equal(item.status, 'pending_review');
  assert.match(item.title, /Smile Dental|Sarah/i);
  assert.match(item.nextAction, /workflow review|demo|consultative/i);
});

test('buildFollowupQueueItem downgrades support requests to normal priority', () => {
  const supportLead = {
    ...class12DemoLead,
    inquiryText: 'How many classes do you offer and how do I reset my password?',
    serviceInterest: 'student support',
    budget: '',
    timeline: '',
  };

  const item = buildFollowupQueueItem(supportLead, buildClass12ResponsePackage(supportLead));

  assert.equal(item.priority, 'normal');
  assert.equal(item.route, 'customer_service');
});

test('buildFollowupQueueItem can generate distinct ids and preserve a supplied status', () => {
  const result = buildClass12ResponsePackage(class12DemoLead);
  const first = buildFollowupQueueItem(class12DemoLead, result, { idSuffix: 'run-1', status: 'approved' });
  const second = buildFollowupQueueItem(class12DemoLead, result, { idSuffix: 'run-2' });

  assert.notEqual(first.id, second.id);
  assert.equal(first.status, 'approved');
  assert.equal(second.status, 'pending_review');
});

test('sortFollowupQueue orders pending urgent items ahead of deferred and completed items', () => {
  const salesItem = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead));
  const nurtureLead = {
    ...class12DemoLead,
    company: 'Northwind Labs',
    budget: '',
    timeline: '',
    inquiryText: 'We are curious about AI automation for our inquiry flow.',
  };
  const nurtureItem = {
    ...buildFollowupQueueItem(nurtureLead, buildClass12ResponsePackage(nurtureLead)),
    status: 'deferred' as const,
  };
  const completedItem = {
    ...salesItem,
    id: 'completed-item',
    status: 'completed' as const,
    priority: 'high' as const,
  };

  const sorted = sortFollowupQueue([completedItem, nurtureItem, salesItem]);

  assert.equal(sorted[0].status, 'pending_review');
  assert.equal(sorted[0].priority, 'urgent');
  assert.equal(sorted[2].status, 'completed');
});
