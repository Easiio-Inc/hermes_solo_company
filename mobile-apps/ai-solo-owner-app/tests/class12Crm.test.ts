import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildFollowupQueueItem } from '../lib/class12/queue';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildClass12CrmWritePayload, canSubmitQueueItemToCrm } from '../lib/class12/crm';

test('canSubmitQueueItemToCrm only allows approved queue items that are not already sending or synced', () => {
  const queueItem = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), { status: 'approved' });

  assert.equal(canSubmitQueueItemToCrm(queueItem), true);
  assert.equal(canSubmitQueueItemToCrm({ ...queueItem, status: 'pending_review' }), false);
  assert.equal(canSubmitQueueItemToCrm({ ...queueItem, crmSync: { ...queueItem.crmSync, status: 'sending' } }), false);
  assert.equal(canSubmitQueueItemToCrm({ ...queueItem, crmSync: { ...queueItem.crmSync, status: 'synced' } }), false);
});

test('buildClass12CrmWritePayload creates contact, deal, and follow-up task payload for approved sales leads', () => {
  const result = buildClass12ResponsePackage(class12DemoLead);
  const queueItem = buildFollowupQueueItem(class12DemoLead, result, { status: 'approved', idSuffix: 'crm-test' });
  const payload = buildClass12CrmWritePayload(queueItem, new Date('2026-08-06T10:00:00Z'));

  assert.equal(payload.lead.name, 'Sarah Chen');
  assert.equal(payload.qualification.route, 'sales_qualified');
  assert.equal(payload.writePlan.createDeal, true);
  assert.equal(payload.writePlan.followUpAt, '2026-08-07T10:00:00.000Z');
  assert.match(payload.deal?.title || '', /Smile Dental/i);
  assert.match(payload.activity.body, /workflow review|demo call/i);
});

test('buildClass12CrmWritePayload keeps support requests out of the deal pipeline', () => {
  const supportLead = {
    ...class12DemoLead,
    inquiryText: 'How many classes do you offer and how can I reset my password?',
    serviceInterest: 'student support',
    budget: '',
    timeline: '',
  };
  const result = buildClass12ResponsePackage(supportLead);
  const queueItem = buildFollowupQueueItem(supportLead, result, { status: 'approved', idSuffix: 'support-crm' });
  const payload = buildClass12CrmWritePayload(queueItem, new Date('2026-08-06T10:00:00Z'));

  assert.equal(payload.qualification.route, 'customer_service');
  assert.equal(payload.writePlan.createDeal, false);
  assert.equal(payload.deal, null);
  assert.match(payload.activity.body, /support request|direct answer/i);
});
