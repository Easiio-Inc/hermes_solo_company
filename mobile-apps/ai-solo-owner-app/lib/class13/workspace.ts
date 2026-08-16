import { class13Tracks } from '@/lib/mockData';
import type { ClassLaunchTrack } from '@/types/app';

export type Class13WorkspaceState = {
  selectedTrackId: string;
  targetCustomer: string;
  revenueGoal: string;
  operatorNote: string;
};

export type Class13PlanMilestone = {
  id: string;
  title: string;
  detail: string;
};

export type Class13ExecutionPlan = {
  track: ClassLaunchTrack;
  summary: string;
  milestones: Class13PlanMilestone[];
  checklist: string[];
  recommendedSkills: string[];
};

function normalizeText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function fallbackTrack(tracks: ClassLaunchTrack[]): ClassLaunchTrack {
  return tracks[0] ?? {
    id: 'class13-fallback',
    title: 'Commercialization launch track',
    skillName: 'Business Model Commercialization Orchestrator',
    outcome: 'Choose a business model and organize the next launch move.',
    focus: 'Turn one promising solo-company workflow into a sellable business motion.',
    nextStep: 'Pick one buyer, one offer, and one acquisition channel.',
  };
}

function resolveTrack(selectedTrackId: string, tracks: ClassLaunchTrack[]): ClassLaunchTrack {
  return tracks.find((track) => track.id === selectedTrackId) ?? fallbackTrack(tracks);
}

function buildTrackMilestones(track: ClassLaunchTrack, state: Class13WorkspaceState): Class13PlanMilestone[] {
  const common = [
    {
      id: `${track.id}-positioning`,
      title: 'Package the offer',
      detail: `Turn the ${track.skillName} path into one concrete offer for ${state.targetCustomer}.`,
    },
    {
      id: `${track.id}-proof`,
      title: 'Collect proof and trust assets',
      detail: 'Prepare case studies, before/after workflow screenshots, and a simple outcome promise.',
    },
    {
      id: `${track.id}-channel`,
      title: 'Pick one acquisition channel',
      detail: track.nextStep,
    },
    {
      id: `${track.id}-cadence`,
      title: 'Run a 90-day operating cadence',
      detail: `Track weekly actions against the goal of ${state.revenueGoal}.`,
    },
  ];

  if (track.id.includes('ecommerce')) {
    common[0] = {
      id: `${track.id}-hero-product`,
      title: 'Choose the hero product and angle',
      detail: `Define the first ecommerce product offer and why ${state.targetCustomer} should buy it now.`,
    };
  }

  if (track.id.includes('local-service')) {
    common[1] = {
      id: `${track.id}-trust-signals`,
      title: 'Build local trust signals',
      detail: 'Prepare service guarantees, local proof, reviews, and a fast-response promise.',
    };
  }

  if (track.id.includes('business-model')) {
    common[2] = {
      id: `${track.id}-model-decision`,
      title: 'Lock the primary monetization model',
      detail: 'Choose the main revenue model now, and document what you are explicitly not doing this quarter.',
    };
  }

  if (track.id.includes('website-skill')) {
    common[0] = {
      id: `${track.id}-capture`,
      title: 'Capture the website workflow',
      detail: `Record the target website workflow for ${state.targetCustomer} and define the exact success condition.`,
    };
    common[1] = {
      id: `${track.id}-review`,
      title: 'Review and redact the timeline',
      detail: 'Remove accidental steps, confirm stable selectors, and redact secrets before export.',
    };
    common[2] = {
      id: `${track.id}-export`,
      title: 'Export the Hermes skill draft',
      detail: 'Build the markdown skill draft and publication packet for human review.',
    };
  }

  return common;
}

export function createInitialClass13WorkspaceState(tracks: ClassLaunchTrack[] = class13Tracks): Class13WorkspaceState {
  return {
    selectedTrackId: fallbackTrack(tracks).id,
    targetCustomer: 'Founder-led service business',
    revenueGoal: '$10k in the next 90 days',
    operatorNote: 'Use Class 13 to turn proven workflows into a focused commercialization plan.',
  };
}

export function restoreClass13WorkspaceState(
  value: unknown,
  tracks: ClassLaunchTrack[] = class13Tracks,
): Class13WorkspaceState {
  const initial = createInitialClass13WorkspaceState(tracks);
  if (!value || typeof value !== 'object') {
    return initial;
  }

  const candidate = value as Record<string, unknown>;
  const selectedTrackId = normalizeText(candidate.selectedTrackId, initial.selectedTrackId);
  const validTrackId = tracks.some((track) => track.id === selectedTrackId) ? selectedTrackId : initial.selectedTrackId;

  return {
    selectedTrackId: validTrackId,
    targetCustomer: normalizeText(candidate.targetCustomer, initial.targetCustomer),
    revenueGoal: normalizeText(candidate.revenueGoal, initial.revenueGoal),
    operatorNote: normalizeText(candidate.operatorNote, initial.operatorNote),
  };
}

export function buildClass13ExecutionPlan(
  state: Class13WorkspaceState,
  tracks: ClassLaunchTrack[] = class13Tracks,
): Class13ExecutionPlan {
  const track = resolveTrack(state.selectedTrackId, tracks);
  const milestones = buildTrackMilestones(track, state);
  const recommendedSkills = [
    track.skillName,
    'Marketing Strategy',
    'CRM Website Reporting',
    'SEO GEO Growth',
  ];

  if (track.id.includes('website-skill')) {
    recommendedSkills.splice(1, recommendedSkills.length - 1, 'Website Chatbot CRM', 'Static Website Local Preview', 'GitHub PR Workflow');
  }

  return {
    track,
    summary: `For the next 90-day commercialization sprint, focus ${state.targetCustomer} on ${track.title} and drive toward ${state.revenueGoal}.`,
    milestones,
    checklist: [
      'Define one buyer and one painful business problem.',
      `Translate the track into one concrete paid offer for ${state.targetCustomer}.`,
      'Collect proof, samples, and objection-handling assets before broad promotion.',
      'Choose one channel and commit to a weekly operating cadence.',
      'Review owner notes and update the plan before handing the workflow to Hermes or another bot.',
    ],
    recommendedSkills,
  };
}
