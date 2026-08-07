import type {
  Class12CrmHandoff,
  Class12LeadInput,
  Class12Qualification,
  Class12ResponseDrafts,
  Class12ResponsePackage,
  Class12Route,
} from '@/types/class12';

const supportKeywords = ['password', 'reset', 'class count', 'where', 'how many', 'support', 'login', 'student'];
const salesKeywords = ['ai', 'chatbot', 'automation', 'workflow', 'demo', 'quote', 'proposal', 'pricing'];
const weakFitKeywords = ['job', 'career', 'refund', 'complaint', 'partnership'];

function normalizeText(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function getLeadCompleteness(input: Class12LeadInput): string[] {
  const fields: Array<[keyof Class12LeadInput, string]> = [
    ['name', input.name],
    ['email', input.email],
    ['company', input.company],
    ['inquiryText', input.inquiryText],
    ['serviceInterest', input.serviceInterest],
    ['budget', input.budget],
    ['timeline', input.timeline],
  ];

  return fields.filter(([, value]) => !String(value || '').trim()).map(([key]) => key.replace('Text', '_text'));
}

export function inferRouteFromLead(input: Class12LeadInput): Class12Route {
  const text = `${input.inquiryText} ${input.serviceInterest} ${input.previousContext || ''}`.toLowerCase();
  const hasSupportIntent = supportKeywords.some((keyword) => text.includes(keyword));
  const hasSalesIntent = salesKeywords.some((keyword) => text.includes(keyword));
  const hasWeakFitSignal = weakFitKeywords.some((keyword) => text.includes(keyword));
  const hasBudget = Boolean(input.budget.trim());
  const hasTimeline = Boolean(input.timeline.trim());

  if (hasWeakFitSignal && !hasSalesIntent) {
    return 'weak_fit';
  }

  if (hasSalesIntent && (hasBudget || hasTimeline)) {
    return 'sales_qualified';
  }

  if (hasSupportIntent && !hasBudget && !hasTimeline) {
    return 'customer_service';
  }

  if (hasSalesIntent) {
    return 'nurture';
  }

  return hasSupportIntent ? 'customer_service' : 'nurture';
}

export function buildQualification(input: Class12LeadInput, route: Class12Route): Class12Qualification {
  const missingFields = getLeadCompleteness(input);
  const positiveSignals: string[] = [];
  const redFlags: string[] = [];

  if (input.budget.trim()) positiveSignals.push('budget signal');
  if (input.timeline.trim()) positiveSignals.push('timeline signal');
  if (normalizeText(input.inquiryText).includes('after-hours')) positiveSignals.push('clear business pain');
  if (normalizeText(input.serviceInterest).includes('ai') || normalizeText(input.inquiryText).includes('chatbot')) positiveSignals.push('specific AI service fit');

  if (route === 'weak_fit') redFlags.push('request appears outside target service scope');
  if (missingFields.includes('budget')) redFlags.push('budget missing');
  if (missingFields.includes('timeline')) redFlags.push('timeline missing');

  let leadScore: Class12Qualification['leadScore'] = 3;
  if (route === 'sales_qualified') leadScore = positiveSignals.length >= 4 ? 5 : 4;
  if (route === 'customer_service') leadScore = 2;
  if (route === 'weak_fit') leadScore = 1;

  const scoreReasonByRoute: Record<Class12Route, string> = {
    sales_qualified: 'Clear commercial fit with specific pain, service match, and timing for a sales follow-up.',
    customer_service: 'This looks like a service/support request, so the priority is a helpful direct answer rather than a sales push.',
    nurture: 'The inquiry shows interest, but key buying details are still missing, so the operator should nurture and clarify.',
    weak_fit: 'The inquiry is outside the current service lane, so respond politely and avoid forcing it into a sales workflow.',
  };

  const nextStepByRoute: Record<Class12Route, string> = {
    sales_qualified: 'book demo call',
    customer_service: 'send direct support answer',
    nurture: 'ask one or two qualification questions',
    weak_fit: 'decline gracefully or reroute',
  };

  return {
    leadScore,
    scoreReason: scoreReasonByRoute[route],
    positiveSignals,
    redFlags,
    recommendedNextStep: nextStepByRoute[route],
    missingFields,
  };
}

function buildResponseDrafts(input: Class12LeadInput, route: Class12Route): Class12ResponseDrafts {
  const name = input.name.trim() || 'there';
  const company = input.company.trim() || 'your team';

  if (route === 'customer_service') {
    return {
      emailDraft: `Hi ${name},\n\nThanks for reaching out. Based on your question, the fastest next step is to answer it directly and make sure ${company} can keep moving without delay. I can help clarify the class/login details and point you to the right account-recovery path.\n\nBest,\nAI Solo Company`,
      dmDraft: `Hi ${name} — thanks for the question. I can help with the support details first, then flag any bigger workflow needs for review.`,
      callScript: `Thanks for reaching out, ${name}. I want to solve the support issue first, confirm what blocked your team, and then note whether there is a larger workflow opportunity worth reviewing later.`,
      bestCta: 'Reply with the exact support issue or screenshot so we can answer it quickly',
    };
  }

  if (route === 'weak_fit') {
    return {
      emailDraft: `Hi ${name},\n\nThanks for the note. After reviewing the request, I do not want to over-promise a fit where our current workflow may not be the best match. If useful, I can still point you toward the closest next step or a better channel.\n\nBest,\nAI Solo Company`,
      dmDraft: `Thanks ${name} — this looks a bit outside our main workflow lane, so I would rather redirect clearly than force a bad fit.`,
      callScript: `Thanks for the inquiry. I want to be transparent that this may not be a strong fit for our current service scope, but I can still suggest the closest next step.`,
      bestCta: 'Clarify the exact outcome you need so we can confirm fit',
    };
  }

  const bestCta = route === 'sales_qualified' ? 'Book a 20-minute workflow review' : 'Reply with budget and timeline so we can recommend the best next step';

  return {
    emailDraft: `Hi ${name},\n\nThanks for sharing what ${company} is trying to solve. Based on your note, the strongest next step is a short workflow review so we can confirm scope, timing, and the best AI implementation path without guessing.\n\nIf helpful, we can walk through your current inquiry flow, the after-hours questions you see most often, and what a practical launch would look like.\n\nBest,\nAI Solo Company`,
    dmDraft: `Hi ${name} — thanks for the detail. This looks like a good fit for a short workflow review so we can map the chatbot use case, rollout timing, and next step clearly.`,
    callScript: `Thanks for reaching out, ${name}. I understand ${company} wants help with ${input.serviceInterest || 'the workflow'}. I would confirm the business pain, budget comfort, and launch timing, then invite them into a short workflow review.`,
    bestCta,
  };
}

function buildCrmHandoff(input: Class12LeadInput, route: Class12Route, qualification: Class12Qualification): Class12CrmHandoff {
  const stageRecommendationByRoute: Record<Class12Route, string> = {
    sales_qualified: 'qualified',
    customer_service: 'support',
    nurture: 'new',
    weak_fit: 'unqualified',
  };

  const followUpTaskByRoute: Record<Class12Route, string> = {
    sales_qualified: 'Send consultative response today and invite the lead to a workflow review or demo call.',
    customer_service: 'Answer the support request directly, then note whether any deeper workflow opportunity emerges.',
    nurture: 'Ask for budget, timeline, and current workflow constraints before advancing the opportunity.',
    weak_fit: 'Close the loop politely and suggest the closest alternative path if helpful.',
  };

  const operatorNextActionByRoute: Record<Class12Route, string> = {
    sales_qualified: 'Review the draft, personalize one business-specific sentence, and send only after approval.',
    customer_service: 'Approve a direct answer and avoid turning a support issue into a sales pitch.',
    nurture: 'Use the draft to clarify missing commercial context before scheduling time.',
    weak_fit: 'Decline cleanly and protect operator time from low-fit follow-up.',
  };

  return {
    summary: `${input.company || input.name} asked about ${input.serviceInterest || 'a workflow need'} via ${input.source}. Main route: ${route}.`,
    stageRecommendation: stageRecommendationByRoute[route],
    followUpTask: followUpTaskByRoute[route],
    missingInformation: qualification.missingFields,
    operatorNextAction: operatorNextActionByRoute[route],
    autoSendRecommended: false,
  };
}

export function buildClass12ResponsePackage(input: Class12LeadInput): Class12ResponsePackage {
  const route = inferRouteFromLead(input);
  const qualification = buildQualification(input, route);
  const response = buildResponseDrafts(input, route);
  const crm = buildCrmHandoff(input, route, qualification);

  return {
    route,
    summary: `${input.name || 'Lead'} from ${input.company || 'unknown company'} is routed to ${route.replace('_', ' ')} with a review-first recommendation to ${qualification.recommendedNextStep}.`,
    qualification,
    response,
    crm,
  };
}
