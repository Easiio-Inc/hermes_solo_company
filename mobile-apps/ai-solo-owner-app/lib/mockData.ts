import type {
  BotStatus,
  ChatMessage,
  ClassLaunchTrack,
  OwnerProfile,
  SkillSummary,
  WebsiteAlert,
  WebsiteMetric,
} from '@/types/app';

export const ownerProfile: OwnerProfile = {
  id: 'owner-1',
  name: 'AI Solo Owner',
  role: 'Operator',
  companyName: 'AI Solo Company',
};

export const botStatus: BotStatus = {
  mode: 'Online · ready for owner ops',
  lastSyncAt: '5 min ago',
  pendingTasks: 4,
  activeSkillsCount: 8,
};

export const heroActions = [
  { id: 'chat', label: 'Open Hermes chat', href: '/(tabs)/chat' as const },
  { id: 'skills', label: 'Browse skills', href: '/(tabs)/skills' as const },
  { id: 'class12', label: 'Run Class 12', href: '/(tabs)/class12' as const },
  { id: 'class13', label: 'Run Class 13', href: '/(tabs)/class13' as const },
  { id: 'monitor', label: 'Monitor website', href: '/(tabs)/monitor' as const },
];

export const class13Tracks: ClassLaunchTrack[] = [
  {
    id: 'class13-ai-consulting-offer',
    title: 'AI consulting offer builder',
    skillName: 'AI Consulting Offer Builder',
    outcome: 'Package one clear AI service offer with pricing logic, scope, and delivery steps.',
    focus: 'Turn service knowledge into a sellable consulting offer.',
    nextStep: 'Choose one offer, define the buyer problem, and prepare the first proposal skeleton.',
  },
  {
    id: 'class13-business-model',
    title: 'Business model commercialization orchestrator',
    skillName: 'Business Model Commercialization Orchestrator',
    outcome: 'Compare monetization paths and pick the best operating model for the business.',
    focus: 'Decide whether the next growth step should be services, productized packages, SaaS, or hybrid.',
    nextStep: 'Review the trade-offs, then lock one primary monetization path for this quarter.',
  },
  {
    id: 'class13-ecommerce',
    title: 'Ecommerce solo company launch',
    skillName: 'Ecommerce Solo Company Launch',
    outcome: 'Turn one product idea into a launch-ready ecommerce workflow with offer, funnel, and ops.',
    focus: 'Best when the business needs product selection, positioning, and a lightweight commerce launch plan.',
    nextStep: 'Pick the hero product, define the audience, and map the first launch funnel.',
  },
  {
    id: 'class13-local-service',
    title: 'Local service growth launch',
    skillName: 'Local Service Growth Launch',
    outcome: 'Turn a local service concept into a practical acquisition and fulfillment plan.',
    focus: 'Best for service businesses that need local lead generation, trust signals, and repeatable delivery.',
    nextStep: 'Choose the target local niche, pricing starter package, and first outreach channel.',
  },
  {
    id: 'class13-website-skill-recorder',
    title: 'Website skill recorder publishing',
    skillName: 'Class13 Website Skill Recorder Publishing',
    outcome: 'Capture a human website workflow and package it into a reusable Hermes skill draft.',
    focus: 'Best when the business already has a repeatable website task that should be taught to Hermes or another bot.',
    nextStep: 'Record the workflow, review the action timeline, redact sensitive data, and export the skill draft.',
  },
];

export const starterPrompts = [
  'Summarize today\'s website health for the owner.',
  'Which skill should I use for improving my homepage SEO?',
  'Show me the highest priority website issue to fix next.',
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    text: 'Hermes is online. I can help you inspect website health, recommend skills, and prepare owner actions.',
    createdAt: 'Now',
  },
  {
    id: 'm2',
    role: 'user',
    text: 'What should I pay attention to first today?',
    createdAt: 'Now',
  },
  {
    id: 'm3',
    role: 'assistant',
    text: 'Start with the website monitor: your chat widget is healthy, but one lead follow-up and one content refresh are still pending.',
    createdAt: 'Now',
  },
];

export const skillCategories = ['Marketing', 'Website', 'Legal', 'Operations'];

export const skills: SkillSummary[] = [
  {
    id: 'skill-website-chatbot',
    name: 'Website Chatbot CRM',
    category: 'Website',
    shortDescription: 'Connect the website chatbot to owner workflows, leads, and CRM handoff.',
    tags: ['chatbot', 'crm', 'website'],
  },
  {
    id: 'skill-seo-geo',
    name: 'SEO + GEO Growth',
    category: 'Marketing',
    shortDescription: 'Plan content and AI-answer optimization to improve discoverability.',
    tags: ['seo', 'geo', 'content'],
  },
  {
    id: 'skill-legal-review',
    name: 'Legal Review',
    category: 'Legal',
    shortDescription: 'Run first-pass review of contracts, privacy policies, and terms.',
    tags: ['legal', 'contracts', 'risk'],
  },
  {
    id: 'skill-lead-followup',
    name: 'Student Lead Followup',
    category: 'Operations',
    shortDescription: 'Turn captured leads into owner-ready follow-up actions and CRM tasks.',
    tags: ['crm', 'followup', 'ops'],
  },
];

export const websiteMetrics: WebsiteMetric[] = [
  {
    id: 'metric-health',
    label: 'Gateway health',
    value: 'Healthy',
    trend: 'No incidents in last 24h',
    status: 'healthy',
  },
  {
    id: 'metric-bot',
    label: 'Bot response rate',
    value: '97.8%',
    trend: '+1.2% vs yesterday',
    status: 'healthy',
  },
  {
    id: 'metric-leads',
    label: 'Open lead follow-ups',
    value: '6',
    trend: '2 need owner response',
    status: 'warning',
  },
  {
    id: 'metric-content',
    label: 'Content freshness',
    value: '2 pages stale',
    trend: 'GEO refresh suggested',
    status: 'info',
  },
];

export const websiteAlerts: WebsiteAlert[] = [
  {
    id: 'alert-1',
    title: 'Lead follow-up queue needs attention',
    severity: 'warning',
    createdAt: '12 min ago',
    detail: 'Two hot leads have not received owner review within the target response window.',
  },
  {
    id: 'alert-2',
    title: 'Homepage GEO refresh recommended',
    severity: 'info',
    createdAt: '1 hour ago',
    detail: 'FAQ and comparison sections could be refreshed to improve AI answer coverage.',
  },
  {
    id: 'alert-3',
    title: 'Website stack healthy',
    severity: 'healthy',
    createdAt: 'Now',
    detail: 'Site gateway, chatbot API, and website monitor checks all passed on the latest sync.',
  },
];

export function createAssistantReply(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes('skill')) {
    return 'For this owner workflow, start with Website Chatbot CRM for lead operations and SEO + GEO Growth for homepage/content improvements.';
  }

  if (lower.includes('website') || lower.includes('monitor') || lower.includes('health')) {
    return 'Website snapshot: gateway healthy, response rate strong, but lead follow-up and content freshness need owner attention.';
  }

  if (lower.includes('lead')) {
    return 'Owner action: review the two pending hot leads first, then queue a follow-up task in CRM before the end of the day.';
  }

  return 'Hermes owner summary: monitor the website, use the right skill pack for the next task, and keep the owner queue focused on the highest-value actions.';
}
