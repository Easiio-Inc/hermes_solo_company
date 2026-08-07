import type { Class12FollowupQueueItem } from '@/types/class12';
import type { OwnerCrmSnapshot } from '@/types/app';

export type Class12StageAnalytics = {
  queue: {
    pendingReview: number;
    approved: number;
    deferred: number;
    completed: number;
  };
  crm: {
    synced: number;
    errors: number;
    openDeals: number;
    dueFollowups: number;
  };
  routes: {
    salesQualified: number;
    customerService: number;
    nurture: number;
    weakFit: number;
  };
};

export type Class12TimelineEntry = {
  id: string;
  kind: 'queue_synced' | 'queue_completed' | 'crm_deal' | 'crm_followup';
  title: string;
  detail: string;
  at: string;
};

function isoOrNull(value?: string): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}

export function buildClass12StageAnalytics(queue: Class12FollowupQueueItem[], crm: OwnerCrmSnapshot): Class12StageAnalytics {
  return {
    queue: {
      pendingReview: queue.filter((item) => item.status === 'pending_review').length,
      approved: queue.filter((item) => item.status === 'approved').length,
      deferred: queue.filter((item) => item.status === 'deferred').length,
      completed: queue.filter((item) => item.status === 'completed').length,
    },
    crm: {
      synced: queue.filter((item) => item.crmSync.status === 'synced').length,
      errors: queue.filter((item) => item.crmSync.status === 'error').length,
      openDeals: Number(crm.summary?.open_deals || 0),
      dueFollowups: Number(crm.summary?.due_followups || 0),
    },
    routes: {
      salesQualified: queue.filter((item) => item.route === 'sales_qualified').length,
      customerService: queue.filter((item) => item.route === 'customer_service').length,
      nurture: queue.filter((item) => item.route === 'nurture').length,
      weakFit: queue.filter((item) => item.route === 'weak_fit').length,
    },
  };
}

export function buildClass12Timeline(queue: Class12FollowupQueueItem[], crm: OwnerCrmSnapshot): Class12TimelineEntry[] {
  const localEntries: Class12TimelineEntry[] = queue.flatMap((item) => {
    const entries: Class12TimelineEntry[] = [];

    if (item.status === 'completed') {
      entries.push({
        id: `${item.id}-completed`,
        kind: 'queue_completed',
        title: `${item.company} marked completed`,
        detail: item.nextAction,
        at: item.crmSync.syncedAt || crm.lastRefreshedAt || new Date(0).toISOString(),
      });
      return entries;
    }

    if (item.crmSync.status === 'synced' && item.crmSync.syncedAt) {
      entries.push({
        id: `${item.id}-synced`,
        kind: 'queue_synced',
        title: `${item.company} synced to CRM`,
        detail: item.crmSync.message,
        at: item.crmSync.syncedAt,
      });
    }

    return entries;
  });

  const crmDealEntries = crm.recentDeals.reduce<Class12TimelineEntry[]>((entries, deal) => {
    const at = isoOrNull(deal.updated_at || deal.happened_at);
    if (!at) return entries;
    entries.push({
      id: `crm-deal-${deal.id}`,
      kind: 'crm_deal',
      title: `${deal.title || deal.contact_name || 'CRM deal'} moved to ${deal.stage || 'active stage'}`,
      detail: deal.contact_name ? `Lead: ${deal.contact_name}` : 'Owner CRM deal activity.',
      at,
    });
    return entries;
  }, []);

  const crmFollowupEntries = crm.nextFollowups.reduce<Class12TimelineEntry[]>((entries, followup) => {
    const at = isoOrNull(followup.follow_up_at || followup.updated_at || followup.happened_at);
    if (!at) return entries;
    entries.push({
      id: `crm-followup-${followup.id}`,
      kind: 'crm_followup',
      title: `${followup.contact_name || 'CRM contact'} follow-up due`,
      detail: followup.body || 'Next follow-up task is due.',
      at,
    });
    return entries;
  }, []);

  return [...localEntries, ...crmDealEntries, ...crmFollowupEntries].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
