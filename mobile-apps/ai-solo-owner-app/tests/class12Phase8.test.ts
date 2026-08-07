import test from 'node:test';
import assert from 'node:assert/strict';

import { class12DemoLead } from '../lib/class12/demo';
import { buildClass12ResponsePackage } from '../lib/class12/workflow';
import { buildFollowupQueueItem, filterFollowupQueue } from '../lib/class12/queue';
import { buildClass12ProposalPackage, canEscalateToProposal } from '../lib/class12/proposal';

test('canEscalateToProposal only enables proposal review for commercial queue items', () => {
  const salesItem = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead));
  const supportLead = {
    ...class12DemoLead,
    inquiryText: 'How many classes do you offer and how can I reset my password?',
    serviceInterest: 'student support',
    budget: '',
    timeline: '',
  };
  const supportItem = buildFollowupQueueItem(supportLead, buildClass12ResponsePackage(supportLead));

  assert.equal(canEscalateToProposal(salesItem), true);
  assert.equal(canEscalateToProposal(supportItem), false);
});

test('buildClass12ProposalPackage creates a review-first quote package for qualified leads', () => {
  const item = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'run-8',
    status: 'approved',
  });

  const proposalPackage = buildClass12ProposalPackage(item);

  assert.match(proposalPackage.title, /proposal review|quote review/i);
  assert.match(proposalPackage.subject, /Smile Dental|Sarah Chen/i);
  assert.match(proposalPackage.message, /Recommended quote band:/i);
  assert.match(proposalPackage.message, /Suggested scope:/i);
  assert.match(proposalPackage.message, /Discovery questions:/i);
  assert.match(proposalPackage.message, /Operator approval is still required before sending any proposal or quote/i);
});

test('filterFollowupQueue narrows the queue for phase 8 detail review', () => {
  const salesPending = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'pending',
    status: 'pending_review',
  });
  const salesApproved = buildFollowupQueueItem(class12DemoLead, buildClass12ResponsePackage(class12DemoLead), {
    idSuffix: 'approved',
    status: 'approved',
  });
  const supportLead = {
    ...class12DemoLead,
    company: 'Northwind Support',
    inquiryText: 'How many classes do you offer and how can I reset my password?',
    serviceInterest: 'student support',
    budget: '',
    timeline: '',
  };
  const supportApproved = buildFollowupQueueItem(supportLead, buildClass12ResponsePackage(supportLead), {
    idSuffix: 'support-approved',
    status: 'approved',
  });

  const proposalReview = filterFollowupQueue([salesPending, salesApproved, supportApproved], 'proposal_review');
  const approvedOnly = filterFollowupQueue([salesPending, salesApproved, supportApproved], 'approved');

  assert.deepEqual(
    proposalReview.map((item) => item.id),
    [salesPending.id, salesApproved.id],
  );
  assert.deepEqual(
    approvedOnly.map((item) => item.id),
    [salesApproved.id, supportApproved.id],
  );
});
