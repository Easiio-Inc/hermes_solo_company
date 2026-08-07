import { class12DemoLead } from '@/lib/class12/demo';
import { buildFollowupQueueItem } from '@/lib/class12/queue';
import { buildClass12ResponsePackage } from '@/lib/class12/workflow';
import type { Class12FollowupQueueItem, Class12LeadInput } from '@/types/class12';

export type Class12WorkspaceState = {
  draft: Class12LeadInput;
  submittedLead: Class12LeadInput;
  runCount: number;
  queue: Class12FollowupQueueItem[];
};

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeLeadInput(value: unknown, fallback: Class12LeadInput): Class12LeadInput {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }

  const lead = value as Record<string, unknown>;
  return {
    name: normalizeText(lead.name, fallback.name),
    email: normalizeText(lead.email, fallback.email),
    company: normalizeText(lead.company, fallback.company),
    source: normalizeText(lead.source, fallback.source),
    inquiryText: normalizeText(lead.inquiryText, fallback.inquiryText),
    serviceInterest: normalizeText(lead.serviceInterest, fallback.serviceInterest),
    budget: normalizeText(lead.budget, fallback.budget),
    timeline: normalizeText(lead.timeline, fallback.timeline),
    previousContext: normalizeText(lead.previousContext, fallback.previousContext || ''),
  };
}

function isQueueItem(value: unknown): value is Class12FollowupQueueItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.company === 'string' &&
    typeof item.route === 'string' &&
    typeof item.priority === 'string' &&
    typeof item.status === 'string' &&
    typeof item.score === 'number' &&
    typeof item.source === 'string' &&
    typeof item.nextAction === 'string' &&
    typeof item.stageRecommendation === 'string' &&
    typeof item.summary === 'string' &&
    Boolean(item.lead) &&
    Boolean(item.response) &&
    Boolean(item.crmSync)
  );
}

export function createInitialClass12WorkspaceState(): Class12WorkspaceState {
  const initialResult = buildClass12ResponsePackage(class12DemoLead);
  return {
    draft: { ...class12DemoLead },
    submittedLead: { ...class12DemoLead },
    runCount: 1,
    queue: [buildFollowupQueueItem(class12DemoLead, initialResult, { idSuffix: 'seed-1' })],
  };
}

export function restoreClass12WorkspaceState(value: unknown): Class12WorkspaceState {
  const initial = createInitialClass12WorkspaceState();
  if (!value || typeof value !== 'object') {
    return initial;
  }

  const candidate = value as Record<string, unknown>;
  const runCount = typeof candidate.runCount === 'number' && candidate.runCount >= 1 ? Math.floor(candidate.runCount) : initial.runCount;
  const queue = Array.isArray(candidate.queue) ? candidate.queue.filter(isQueueItem) : [];

  return {
    draft: normalizeLeadInput(candidate.draft, initial.draft),
    submittedLead: normalizeLeadInput(candidate.submittedLead, initial.submittedLead),
    runCount,
    queue: queue.length > 0 ? queue : initial.queue,
  };
}
