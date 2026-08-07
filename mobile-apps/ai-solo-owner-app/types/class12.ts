export type Class12Route = 'sales_qualified' | 'customer_service' | 'nurture' | 'weak_fit';

export type Class12LeadInput = {
  name: string;
  email: string;
  company: string;
  source: string;
  inquiryText: string;
  serviceInterest: string;
  budget: string;
  timeline: string;
  previousContext?: string;
};

export type Class12Qualification = {
  leadScore: 1 | 2 | 3 | 4 | 5;
  scoreReason: string;
  positiveSignals: string[];
  redFlags: string[];
  recommendedNextStep: string;
  missingFields: string[];
};

export type Class12ResponseDrafts = {
  emailDraft: string;
  dmDraft: string;
  callScript: string;
  bestCta: string;
};

export type Class12CrmHandoff = {
  summary: string;
  stageRecommendation: string;
  followUpTask: string;
  missingInformation: string[];
  operatorNextAction: string;
  autoSendRecommended: false;
};

export type Class12ResponsePackage = {
  route: Class12Route;
  summary: string;
  qualification: Class12Qualification;
  response: Class12ResponseDrafts;
  crm: Class12CrmHandoff;
};

export type Class12QueuePriority = 'urgent' | 'high' | 'normal' | 'low';

export type Class12QueueStatus = 'pending_review' | 'approved' | 'deferred' | 'completed';

export type Class12CrmSyncStatus = 'not_sent' | 'sending' | 'synced' | 'error';

export type Class12CrmSyncState = {
  status: Class12CrmSyncStatus;
  message: string;
  contactId?: number;
  dealId?: number;
  activityId?: number;
  syncedAt?: string;
};

export type Class12FollowupQueueItem = {
  id: string;
  title: string;
  company: string;
  route: Class12Route;
  priority: Class12QueuePriority;
  status: Class12QueueStatus;
  score: 1 | 2 | 3 | 4 | 5;
  source: string;
  nextAction: string;
  stageRecommendation: string;
  summary: string;
  lead: Class12LeadInput;
  response: Class12ResponsePackage;
  crmSync: Class12CrmSyncState;
};

export type Class12CrmWritePayload = {
  source: 'class12_owner_app';
  queueItemId: string;
  lead: {
    name: string;
    email: string;
    company: string;
    source: string;
    serviceInterest: string;
    inquiryText: string;
    previousContext: string;
    budget: string;
    timeline: string;
  };
  qualification: {
    route: Class12Route;
    leadScore: 1 | 2 | 3 | 4 | 5;
    scoreReason: string;
    positiveSignals: string[];
    redFlags: string[];
    missingFields: string[];
    recommendedNextStep: string;
  };
  response: {
    bestCta: string;
    emailDraft: string;
    dmDraft: string;
    callScript: string;
  };
  crm: {
    summary: string;
    stageRecommendation: string;
    followUpTask: string;
    operatorNextAction: string;
    missingInformation: string[];
    priority: Class12QueuePriority;
  };
  deal: {
    title: string;
    stage: string;
    probability: number;
    notes: string;
  } | null;
  activity: {
    kind: 'task';
    body: string;
  };
  writePlan: {
    createContact: true;
    createDeal: boolean;
    createActivity: true;
    followUpAt: string;
  };
};

export type Class12CrmWriteResponse = {
  ok: boolean;
  contact_id?: number;
  deal_id?: number;
  activity_id?: number;
  summary?: string;
  stage?: string;
};
