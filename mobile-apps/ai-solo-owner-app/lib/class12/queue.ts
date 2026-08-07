import type {
  Class12CrmSyncState,
  Class12FollowupQueueItem,
  Class12LeadInput,
  Class12QueuePriority,
  Class12QueueStatus,
  Class12ResponsePackage,
} from '@/types/class12';

export type Class12QueueFilter = 'all' | 'pending_review' | 'approved' | 'deferred' | 'completed' | 'proposal_review';

const priorityRank: Record<Class12QueuePriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const statusRank: Record<Class12FollowupQueueItem['status'], number> = {
  pending_review: 0,
  approved: 1,
  deferred: 2,
  completed: 3,
};

function toSlug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'lead';
}

function defaultCrmSyncState(): Class12CrmSyncState {
  return {
    status: 'not_sent',
    message: 'Not sent to CRM yet.',
  };
}

export function deriveQueuePriority(result: Class12ResponsePackage): Class12QueuePriority {
  if (result.route === 'sales_qualified' && result.qualification.leadScore >= 5) return 'urgent';
  if (result.route === 'sales_qualified' || result.route === 'nurture') return 'high';
  if (result.route === 'customer_service') return 'normal';
  return 'low';
}

export function buildFollowupQueueItem(
  input: Class12LeadInput,
  result: Class12ResponsePackage,
  options?: { idSuffix?: string; status?: Class12QueueStatus; crmSync?: Class12CrmSyncState },
): Class12FollowupQueueItem {
  const suffix = options?.idSuffix ? `-${toSlug(options.idSuffix)}` : '';

  return {
    id: `${toSlug(input.company || input.name)}-${toSlug(result.route)}${suffix}`,
    title: `${input.company || input.name || 'Lead'} follow-up`,
    company: input.company || 'Unknown company',
    route: result.route,
    priority: deriveQueuePriority(result),
    status: options?.status || 'pending_review',
    score: result.qualification.leadScore,
    source: input.source,
    nextAction: result.crm.followUpTask,
    stageRecommendation: result.crm.stageRecommendation,
    summary: result.crm.operatorNextAction,
    lead: { ...input },
    response: result,
    crmSync: options?.crmSync || defaultCrmSyncState(),
  };
}

export function sortFollowupQueue(items: Class12FollowupQueueItem[]): Class12FollowupQueueItem[] {
  return [...items].sort((a, b) => {
    const statusDiff = statusRank[a.status] - statusRank[b.status];
    if (statusDiff !== 0) return statusDiff;

    const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return b.score - a.score;
  });
}

export function filterFollowupQueue(items: Class12FollowupQueueItem[], filter: Class12QueueFilter): Class12FollowupQueueItem[] {
  if (filter === 'all') return [...items];
  if (filter === 'proposal_review') {
    return items.filter((item) => item.route === 'sales_qualified' || item.route === 'nurture');
  }
  return items.filter((item) => item.status === filter);
}
