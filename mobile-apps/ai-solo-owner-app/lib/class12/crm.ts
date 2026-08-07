import type {
  Class12CrmWritePayload,
  Class12FollowupQueueItem,
  Class12QueuePriority,
  Class12Route,
} from '@/types/class12';

const followUpDaysByPriority: Record<Class12QueuePriority, number> = {
  urgent: 1,
  high: 2,
  normal: 5,
  low: 7,
};

const probabilityByRoute: Record<Class12Route, number> = {
  sales_qualified: 80,
  nurture: 45,
  customer_service: 10,
  weak_fit: 5,
};

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function canSubmitQueueItemToCrm(item: Class12FollowupQueueItem): boolean {
  return item.status === 'approved' && item.crmSync.status !== 'sending' && item.crmSync.status !== 'synced';
}

export function buildClass12CrmWritePayload(item: Class12FollowupQueueItem, now = new Date()): Class12CrmWritePayload {
  const { lead, response, priority } = item;
  const createDeal = response.route === 'sales_qualified' || response.route === 'nurture';
  const followUpAt = addDays(now, followUpDaysByPriority[priority]).toISOString();
  const companyOrName = lead.company || lead.name || 'Lead';

  return {
    source: 'class12_owner_app',
    queueItemId: item.id,
    lead: {
      name: lead.name,
      email: lead.email,
      company: lead.company,
      source: lead.source,
      serviceInterest: lead.serviceInterest,
      inquiryText: lead.inquiryText,
      previousContext: lead.previousContext || '',
      budget: lead.budget,
      timeline: lead.timeline,
    },
    qualification: {
      route: response.route,
      leadScore: response.qualification.leadScore,
      scoreReason: response.qualification.scoreReason,
      positiveSignals: response.qualification.positiveSignals,
      redFlags: response.qualification.redFlags,
      missingFields: response.qualification.missingFields,
      recommendedNextStep: response.qualification.recommendedNextStep,
    },
    response: {
      bestCta: response.response.bestCta,
      emailDraft: response.response.emailDraft,
      dmDraft: response.response.dmDraft,
      callScript: response.response.callScript,
    },
    crm: {
      summary: response.crm.summary,
      stageRecommendation: response.crm.stageRecommendation,
      followUpTask: response.crm.followUpTask,
      operatorNextAction: response.crm.operatorNextAction,
      missingInformation: response.crm.missingInformation,
      priority,
    },
    deal: createDeal
      ? {
          title: `${companyOrName} — ${lead.serviceInterest || 'AI workflow'}`,
          stage: response.crm.stageRecommendation,
          probability: probabilityByRoute[response.route],
          notes: `${response.summary}\n\nNext action: ${response.crm.followUpTask}`,
        }
      : null,
    activity: {
      kind: 'task',
      body: [
        `Class 12 review-first handoff for ${companyOrName}.`,
        `Route: ${response.route}. Lead score: ${response.qualification.leadScore}/5.`,
        `Support / follow-up action: ${response.crm.followUpTask}`,
        `Operator next action: ${response.crm.operatorNextAction}`,
        `Best CTA: ${response.response.bestCta}`,
      ].join(' '),
    },
    writePlan: {
      createContact: true,
      createDeal,
      createActivity: true,
      followUpAt,
    },
  };
}
