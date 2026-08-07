import test from 'node:test';
import assert from 'node:assert/strict';

import { buildClass12ResponsePackage, getLeadCompleteness, inferRouteFromLead } from '../lib/class12/workflow';
import { class12DemoLead } from '../lib/class12/demo';

test('inferRouteFromLead marks urgent AI chatbot requests as sales qualified', () => {
  const route = inferRouteFromLead({
    ...class12DemoLead,
    inquiryText: 'We need an AI chatbot for after-hours patient questions and want to launch this month.',
    serviceInterest: 'AI chatbot',
    budget: '$1500/month',
    timeline: 'this month',
  });

  assert.equal(route, 'sales_qualified');
});

test('inferRouteFromLead keeps support-only questions in customer service', () => {
  const route = inferRouteFromLead({
    ...class12DemoLead,
    inquiryText: 'How many classes do you offer and where can I reset my password?',
    serviceInterest: 'student support',
    budget: '',
    timeline: '',
  });

  assert.equal(route, 'customer_service');
});

test('getLeadCompleteness identifies missing commercial fields', () => {
  const missing = getLeadCompleteness({
    ...class12DemoLead,
    company: '',
    budget: '',
    timeline: '',
  });

  assert.deepEqual(missing, ['company', 'budget', 'timeline']);
});

test('buildClass12ResponsePackage returns review-first CRM handoff and multi-channel drafts', () => {
  const result = buildClass12ResponsePackage(class12DemoLead);

  assert.equal(result.route, 'sales_qualified');
  assert.equal(result.qualification.leadScore, 5);
  assert.match(result.response.emailDraft, /Sarah/i);
  assert.match(result.response.bestCta, /workflow review|demo/i);
  assert.match(result.crm.stageRecommendation, /qualified/i);
  assert.equal(result.crm.autoSendRecommended, false);
  assert.ok(result.crm.followUpTask.length > 10);
  assert.ok(result.summary.length > 20);
});
