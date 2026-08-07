import type { Class12FollowupQueueItem, Class12Route } from '@/types/class12';

import type { Class12ProposalDraft } from './proposal';
import { buildClass12ProposalPackage, createClass12ProposalDraft } from './proposal';

export type Class12ProposalFileExport = {
  fileName: string;
  mimeType: 'text/markdown';
  content: string;
};

export type Class12ProposalJsonExport = {
  fileName: string;
  mimeType: 'application/json';
  content: string;
};

type Class12ProposalHandoffPayload = {
  export_kind: 'class12_proposal_handoff';
  target_artifact: 'website_workflow_skill';
  source: {
    queue_item_id: string;
    route: Class12Route;
    status: string;
    stage_recommendation: string;
    lead: {
      name: string;
      email: string;
      company: string;
      source: string;
      service_interest: string;
      budget: string;
      timeline: string;
      inquiry_text: string;
      previous_context: string;
    };
  };
  proposal: {
    title: string;
    subject: string;
    quote_band: string;
    scope: string[];
    discovery_questions: string[];
    proposal_note: string;
    operator_warning: string;
  };
  customer_context: {
    summary: string;
    best_cta: string;
    score: number;
    positive_signals: string[];
    red_flags: string[];
    missing_fields: string[];
  };
  skill_seed: {
    website_name: string;
    business_goal: string;
    target_user_action: string;
    operator_steps: string[];
    suggested_skill_sections: string[];
  };
};

function toSlug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lead';
}

function normalizeDraftLines(lines: string[]): string[] {
  return lines.map((line) => String(line || '').trim()).filter(Boolean);
}

function resolveDraft(item: Class12FollowupQueueItem, edits?: Partial<Class12ProposalDraft>): Class12ProposalDraft {
  const draft = createClass12ProposalDraft(item);

  return {
    quoteBand: String(edits?.quoteBand ?? draft.quoteBand).trim() || draft.quoteBand,
    scope: normalizeDraftLines(edits?.scope ?? draft.scope),
    discoveryQuestions: normalizeDraftLines(edits?.discoveryQuestions ?? draft.discoveryQuestions),
    proposalNote: String(edits?.proposalNote ?? draft.proposalNote).trim() || draft.proposalNote,
  };
}

function buildProposalBaseName(item: Class12FollowupQueueItem): string {
  return `${toSlug(item.company || item.lead.name)}-proposal-review-${toSlug(item.id)}`;
}

function buildClass12ProposalHandoffPayload(
  item: Class12FollowupQueueItem,
  edits?: Partial<Class12ProposalDraft>,
): Class12ProposalHandoffPayload {
  const proposalPackage = buildClass12ProposalPackage(item, edits);
  const draft = resolveDraft(item, edits);

  return {
    export_kind: 'class12_proposal_handoff',
    target_artifact: 'website_workflow_skill',
    source: {
      queue_item_id: item.id,
      route: item.route,
      status: item.status,
      stage_recommendation: item.stageRecommendation,
      lead: {
        name: item.lead.name,
        email: item.lead.email,
        company: item.company,
        source: item.lead.source,
        service_interest: item.lead.serviceInterest,
        budget: item.lead.budget,
        timeline: item.lead.timeline,
        inquiry_text: item.lead.inquiryText,
        previous_context: item.lead.previousContext || '',
      },
    },
    proposal: {
      title: proposalPackage.title,
      subject: proposalPackage.subject,
      quote_band: draft.quoteBand,
      scope: draft.scope,
      discovery_questions: draft.discoveryQuestions,
      proposal_note: draft.proposalNote,
      operator_warning: 'Operator approval is still required before sending any proposal or quote.',
    },
    customer_context: {
      summary: item.response.summary,
      best_cta: item.response.response.bestCta,
      score: item.score,
      positive_signals: item.response.qualification.positiveSignals,
      red_flags: item.response.qualification.redFlags,
      missing_fields: item.response.qualification.missingFields,
    },
    skill_seed: {
      website_name: item.company || item.lead.name || 'Unknown website',
      business_goal: item.lead.serviceInterest || item.response.crm.operatorNextAction,
      target_user_action: item.response.response.bestCta,
      operator_steps: [
        `Open ${item.company || item.lead.name} and inspect the current inquiry path for ${item.lead.serviceInterest || 'the requested workflow'}.`,
        `Record the review-first operator checkpoints required before sending responses or quotes to ${item.company || item.lead.name}.`,
        `Turn the approved scope, CTA, and discovery questions into a reusable website workflow skill for future bots.`,
      ],
      suggested_skill_sections: ['Goal', 'Website context', 'Recorded operator steps', 'Approval gates', 'Reusable prompts'],
    },
  };
}

export function buildClass12ProposalFileExport(
  item: Class12FollowupQueueItem,
  edits?: Partial<Class12ProposalDraft>,
): Class12ProposalFileExport {
  const proposalPackage = buildClass12ProposalPackage(item, edits);
  const payload = buildClass12ProposalHandoffPayload(item, edits);

  return {
    fileName: `${buildProposalBaseName(item)}.md`,
    mimeType: 'text/markdown',
    content: [
      '# Proposal Review Package',
      '',
      '## Handoff Metadata',
      `- Export kind: ${payload.export_kind}`,
      `- Target artifact: ${payload.target_artifact}`,
      `- Queue item: ${payload.source.queue_item_id}`,
      `- Route: ${payload.source.route}`,
      `- Queue status: ${payload.source.status}`,
      `- Stage recommendation: ${payload.source.stage_recommendation}`,
      '',
      '## Operator Summary',
      `- Title: ${proposalPackage.title}`,
      `- Subject: ${proposalPackage.subject}`,
      `- Lead: ${payload.source.lead.name}`,
      `- Company: ${payload.source.lead.company}`,
      `- Recommended quote band: ${payload.proposal.quote_band}`,
      `- Best CTA: ${payload.customer_context.best_cta}`,
      '',
      `Summary: ${payload.customer_context.summary}`,
      '',
      '## Website Workflow Skill Draft',
      'Suggested scope:',
      ...payload.proposal.scope.map((line) => `- ${line}`),
      '',
      'Discovery questions:',
      ...payload.proposal.discovery_questions.map((line) => `- ${line}`),
      '',
      'Draft proposal note:',
      payload.proposal.proposal_note,
      '',
      'Operator steps for future skill conversion:',
      ...payload.skill_seed.operator_steps.map((line) => `- ${line}`),
      '',
      payload.proposal.operator_warning,
      '',
      '## Machine-Readable Payload',
      '```json',
      JSON.stringify(payload, null, 2),
      '```',
    ].join('\n'),
  };
}

export function buildClass12ProposalJsonExport(
  item: Class12FollowupQueueItem,
  edits?: Partial<Class12ProposalDraft>,
): Class12ProposalJsonExport {
  const payload = buildClass12ProposalHandoffPayload(item, edits);

  return {
    fileName: `${buildProposalBaseName(item)}.json`,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, 2),
  };
}
