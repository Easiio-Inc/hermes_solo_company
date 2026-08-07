import type { Class12FollowupQueueItem } from '@/types/class12';

export type Class12ProposalPackage = {
  title: string;
  subject: string;
  message: string;
};

export type Class12ProposalDraft = {
  quoteBand: string;
  scope: string[];
  discoveryQuestions: string[];
  proposalNote: string;
};

function currencyBandFromBudget(rawBudget: string): string {
  const normalized = String(rawBudget || '').toLowerCase();
  const numeric = Number((normalized.match(/\d+(?:[,.]\d+)?/) || ['0'])[0].replace(/,/g, ''));

  if (!numeric) {
    return 'Quote after discovery — budget still needs confirmation';
  }
  if (numeric <= 1000) {
    return '$750-$1,200 / month starter lane';
  }
  if (numeric <= 2000) {
    return '$1,200-$2,000 / month core automation lane';
  }
  if (numeric <= 5000) {
    return '$2,000-$5,000 / month growth lane';
  }
  return '$5,000+ / month custom implementation lane';
}

function suggestedScope(item: Class12FollowupQueueItem): string[] {
  if (item.route === 'sales_qualified') {
    return [
      'Map current inquiry and after-hours support flow',
      'Define top FAQ and escalation rules for the chatbot',
      'Confirm launch timeline, owner review checkpoints, and CRM handoff path',
    ];
  }

  return [
    'Clarify commercial scope before quoting implementation work',
    'Confirm budget, timeline, and success metrics',
    'Keep the first response consultative rather than pushing a hard proposal',
  ];
}

function discoveryQuestions(item: Class12FollowupQueueItem): string[] {
  return [
    `What exact workflow pain should ${item.company} solve first?`,
    'Which questions or lead scenarios appear most often today?',
    'Who approves rollout, budget, and success criteria on the customer side?',
  ];
}

function normalizeDraftLines(lines: string[]): string[] {
  return lines.map((line) => String(line || '').trim()).filter(Boolean);
}

export function createClass12ProposalDraft(item: Class12FollowupQueueItem): Class12ProposalDraft {
  return {
    quoteBand: currencyBandFromBudget(item.lead.budget),
    scope: suggestedScope(item),
    discoveryQuestions: discoveryQuestions(item),
    proposalNote: `Position the next step as a scoped workflow review for ${item.company}, then convert the approved scope into a quote only after operator review.`,
  };
}

export function canEscalateToProposal(item: Class12FollowupQueueItem): boolean {
  return item.route === 'sales_qualified' || item.route === 'nurture';
}

export function buildClass12ProposalPackage(
  item: Class12FollowupQueueItem,
  edits?: Partial<Class12ProposalDraft>,
): Class12ProposalPackage {
  const draft = createClass12ProposalDraft(item);
  const quoteBand = String(edits?.quoteBand ?? draft.quoteBand).trim() || draft.quoteBand;
  const scopeLines = normalizeDraftLines(edits?.scope ?? draft.scope);
  const questionLines = normalizeDraftLines(edits?.discoveryQuestions ?? draft.discoveryQuestions);
  const proposalNote = String(edits?.proposalNote ?? draft.proposalNote).trim() || draft.proposalNote;
  const scope = scopeLines.map((line) => `- ${line}`).join('\n');
  const questions = questionLines.map((line) => `- ${line}`).join('\n');
  const title = `${item.company} — proposal review package`;
  const subject = `Proposal review — ${item.company || item.lead.name || 'lead'}`;

  return {
    title,
    subject,
    message: [
      'Proposal / quote review package',
      '',
      `Lead: ${item.lead.name || 'Unknown lead'}`,
      `Company: ${item.company}`,
      `Route: ${item.route.replace(/_/g, ' ')}`,
      `Queue status: ${item.status.replace(/_/g, ' ')}`,
      `Lead score: ${item.score}/5`,
      `Stage recommendation: ${item.stageRecommendation}`,
      `Recommended quote band: ${quoteBand}`,
      '',
      `Summary: ${item.response.summary}`,
      `Best CTA: ${item.response.response.bestCta}`,
      '',
      'Suggested scope:',
      scope,
      '',
      'Discovery questions:',
      questions,
      '',
      'Draft proposal note:',
      proposalNote,
      '',
      'Operator approval is still required before sending any proposal or quote.',
    ].join('\n'),
  };
}
