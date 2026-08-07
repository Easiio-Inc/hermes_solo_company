import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFollowupQueueItem } from '../lib/class12/queue';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12StageAnalytics, buildClass12Timeline } from '../lib/class12/analytics';
import type { OwnerCrmSnapshot } from '../types/app';

const crmSnapshot: OwnerCrmSnapshot = {
  summary: {
    websites: 1,
    visitors: 12,
    visits: 31,
    contacts: 4,
    open_deals: 2,
    due_followups: 1,
  },
  topCustomers: [],
  recentSubmissions: [],
  recentVisitors: [],
  recentDeals: [
    {
      id: 88,
      title: 'Smile Dental — AI chatbot',
      stage: 'qualified',
      updated_at: '2026-08-06T11:00:00.000Z',
      contact_name: 'Sarah Chen',
      contact_email: 'sarah@example.com',
    },
  ],
  nextFollowups: [
    {
      id: 77,
      body: 'Send workflow recap and confirm demo time',
      follow_up_at: '2026-08-07T10:00:00.000Z',
      contact_name: 'Sarah Chen',
      contact_email: 'sarah@example.com',
    },
  ],
  usingFallback: false,
  lastRefreshedAt: '2026-08-06T11:05:00.000Z',
  error: null,
};

test('buildClass12StageAnalytics summarizes queue stages, CRM sync state, and owner CRM counts', () => {
  const approved = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    status: 'approved',
    crmSync: {
      status: 'synced',
      message: 'Synced to CRM.',
      contactId: 10,
      dealId: 20,
      activityId: 30,
      syncedAt: '2026-08-06T10:05:00.000Z',
    },
    idSuffix: 'analytics-1',
  });
  const completed = buildFollowupQueueItem(
    {
      ...class12DemoLead,
      company: 'Northwind Labs',
      inquiryText: 'Need support with class login and dashboard setup.',
      budget: '',
      timeline: '',
      serviceInterest: 'student support',
    },
    buildClass12ResponsePackage({
      ...class12DemoLead,
      company: 'Northwind Labs',
      inquiryText: 'Need support with class login and dashboard setup.',
      budget: '',
      timeline: '',
      serviceInterest: 'student support',
    }),
    { status: 'completed', idSuffix: 'analytics-2' },
  );

  const analytics = buildClass12StageAnalytics([approved, completed], crmSnapshot);

  assert.equal(analytics.queue.pendingReview, 0);
  assert.equal(analytics.queue.approved, 1);
  assert.equal(analytics.queue.completed, 1);
  assert.equal(analytics.crm.synced, 1);
  assert.equal(analytics.crm.openDeals, 2);
  assert.equal(analytics.crm.dueFollowups, 1);
  assert.equal(analytics.routes.salesQualified, 1);
  assert.equal(analytics.routes.customerService, 1);
});

test('buildClass12Timeline merges local queue milestones with owner CRM events in reverse-chronological order', () => {
  const synced = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    status: 'approved',
    crmSync: {
      status: 'synced',
      message: 'Synced to CRM.',
      contactId: 10,
      dealId: 20,
      activityId: 30,
      syncedAt: '2026-08-06T10:05:00.000Z',
    },
    idSuffix: 'timeline-1',
  });
  const completed = {
    ...synced,
    id: 'timeline-2',
    status: 'completed' as const,
  };

  const timeline = buildClass12Timeline([synced, completed], crmSnapshot);

  assert.equal(timeline[0].kind, 'crm_followup');
  assert.equal(timeline[1].kind, 'crm_deal');
  assert.equal(timeline[2].kind, 'queue_synced');
  assert.equal(timeline[3].kind, 'queue_completed');
  assert.match(timeline[0].title, /follow-up|follow up/i);
  assert.match(timeline[1].title, /qualified|deal/i);
});
