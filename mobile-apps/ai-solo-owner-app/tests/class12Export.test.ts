import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildClass12ExportPackage } from '../lib/class12/export';

test('buildClass12ExportPackage creates a review-first share payload for qualified leads', () => {
  const result = buildClass12ResponsePackage(class12DemoLead);
  const exportPackage = buildClass12ExportPackage(class12DemoLead, result);

  assert.match(exportPackage.title, /Smile Dental|Sarah Chen/i);
  assert.match(exportPackage.subject, /Class 12 handoff/i);
  assert.match(exportPackage.message, /Route: sales qualified/i);
  assert.match(exportPackage.message, /Lead score: 5\/5/i);
  assert.match(exportPackage.message, /Best CTA:/i);
  assert.match(exportPackage.message, /CRM handoff/i);
  assert.match(exportPackage.message, /Auto-send: Disabled — review first/i);
});

test('buildClass12ExportPackage preserves customer-service routing and includes reply drafts', () => {
  const supportLead = {
    ...class12DemoLead,
    inquiryText: 'How many classes do you offer and how can I reset my password?',
    serviceInterest: 'student support',
    budget: '',
    timeline: '',
  };

  const result = buildClass12ResponsePackage(supportLead);
  const exportPackage = buildClass12ExportPackage(supportLead, result);

  assert.match(exportPackage.message, /Route: customer service/i);
  assert.match(exportPackage.message, /Email draft:/i);
  assert.match(exportPackage.message, /DM draft:/i);
  assert.match(exportPackage.message, /Call script:/i);
  assert.match(exportPackage.message, /Follow-up task:/i);
});
