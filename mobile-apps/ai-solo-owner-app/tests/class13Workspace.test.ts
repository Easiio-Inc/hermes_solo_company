import test from 'node:test';
import assert from 'node:assert/strict';

import { class13Tracks } from '../lib/mockData';
import {
  buildClass13ExecutionPlan,
  createInitialClass13WorkspaceState,
  restoreClass13WorkspaceState,
} from '../lib/class13/workspace';

test('createInitialClass13WorkspaceState seeds the first Class 13 commercialization track', () => {
  const state = createInitialClass13WorkspaceState();

  assert.equal(state.selectedTrackId, class13Tracks[0]?.id);
  assert.equal(state.targetCustomer, 'Founder-led service business');
  assert.equal(state.revenueGoal, '$10k in the next 90 days');
  assert.match(state.operatorNote, /commercialization/i);
});

test('buildClass13ExecutionPlan creates milestones and recommended skills for the selected Class 13 track', () => {
  const state = createInitialClass13WorkspaceState();
  const plan = buildClass13ExecutionPlan(state, class13Tracks);

  assert.equal(plan.track.id, class13Tracks[0]?.id);
  assert.equal(plan.recommendedSkills[0], class13Tracks[0]?.skillName);
  assert.ok(plan.milestones.length >= 4);
  assert.ok(plan.checklist.length >= 4);
  assert.match(plan.summary, /90-day/i);
  assert.match(plan.milestones[0]?.title ?? '', /offer|package|positioning/i);
});

test('restoreClass13WorkspaceState keeps valid saved values and falls back when input is invalid', () => {
  const restored = restoreClass13WorkspaceState({
    selectedTrackId: class13Tracks[2]?.id,
    targetCustomer: 'Local retail brand',
    revenueGoal: '$15k launch revenue',
    operatorNote: 'Focus on repeatable offer packaging.',
  });

  assert.equal(restored.selectedTrackId, class13Tracks[2]?.id);
  assert.equal(restored.targetCustomer, 'Local retail brand');
  assert.equal(restored.revenueGoal, '$15k launch revenue');
  assert.equal(restored.operatorNote, 'Focus on repeatable offer packaging.');

  const fallback = restoreClass13WorkspaceState({ selectedTrackId: 123, targetCustomer: null });
  assert.equal(fallback.selectedTrackId, class13Tracks[0]?.id);
  assert.equal(fallback.targetCustomer, 'Founder-led service business');
});
