import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionChip } from '@/components/ui/ActionChip';
import { Screen } from '@/components/ui/Screen';
import { SectionCard } from '@/components/ui/SectionCard';
import { theme } from '@/constants/theme';
import { useOwnerApp } from '@/context/OwnerAppContext';
import { OWNER_APP_CLASS13_WORKSPACE_KEY } from '@/lib/defaults';
import { class13Tracks } from '@/lib/mockData';
import { loadJsonValue, saveJsonValue } from '@/lib/persistence';
import {
  buildClass13ExecutionPlan,
  createInitialClass13WorkspaceState,
  restoreClass13WorkspaceState,
} from '@/lib/class13/workspace';

const initialWorkspace = createInitialClass13WorkspaceState();

export default function Class13Screen() {
  const { ownerCompanyName, ownerName } = useOwnerApp();
  const [selectedTrackId, setSelectedTrackId] = useState(initialWorkspace.selectedTrackId);
  const [targetCustomer, setTargetCustomer] = useState(initialWorkspace.targetCustomer);
  const [revenueGoal, setRevenueGoal] = useState(initialWorkspace.revenueGoal);
  const [operatorNote, setOperatorNote] = useState(initialWorkspace.operatorNote);
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);

  const workspaceState = useMemo(
    () => ({ selectedTrackId, targetCustomer, revenueGoal, operatorNote }),
    [operatorNote, revenueGoal, selectedTrackId, targetCustomer],
  );
  const plan = useMemo(() => buildClass13ExecutionPlan(workspaceState), [workspaceState]);

  useEffect(() => {
    let cancelled = false;

    async function restoreWorkspace() {
      const persisted = await loadJsonValue(OWNER_APP_CLASS13_WORKSPACE_KEY);
      if (cancelled) return;
      const restored = restoreClass13WorkspaceState(persisted);
      setSelectedTrackId(restored.selectedTrackId);
      setTargetCustomer(restored.targetCustomer);
      setRevenueGoal(restored.revenueGoal);
      setOperatorNote(restored.operatorNote);
      setWorkspaceHydrated(true);
    }

    void restoreWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!workspaceHydrated) return;
    void saveJsonValue(OWNER_APP_CLASS13_WORKSPACE_KEY, workspaceState);
  }, [workspaceHydrated, workspaceState]);

  return (
    <Screen
      title="Class 13 launch console"
      subtitle={`Guide ${ownerCompanyName} from workflow success into commercialization. ${ownerName} can choose one launch track, define the buyer, and stage a 90-day plan.`}>
      <SectionCard eyebrow="Commercialization focus" title={plan.track.skillName} rightLabel="Class 13">
        <Text style={styles.summary}>{plan.summary}</Text>
        <View style={styles.chipRow}>
          {class13Tracks.map((track) => (
            <ActionChip key={track.id} label={track.title} onPress={() => setSelectedTrackId(track.id)} />
          ))}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Track brief" title={plan.track.title}>
        <Text style={styles.metaLabel}>Outcome</Text>
        <Text style={styles.bodyText}>{plan.track.outcome}</Text>
        <Text style={styles.metaLabel}>Focus</Text>
        <Text style={styles.bodyText}>{plan.track.focus}</Text>
        <Text style={styles.metaLabel}>Next step</Text>
        <Text style={styles.bodyText}>{plan.track.nextStep}</Text>
      </SectionCard>

      <SectionCard eyebrow="Owner inputs" title="Shape the commercialization sprint">
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Target customer</Text>
          <TextInput value={targetCustomer} onChangeText={setTargetCustomer} style={styles.input} placeholderTextColor={theme.colors.textMuted} />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>90-day revenue goal</Text>
          <TextInput value={revenueGoal} onChangeText={setRevenueGoal} style={styles.input} placeholderTextColor={theme.colors.textMuted} />
        </View>
        <View style={styles.fieldWrap}>
          <Text style={styles.inputLabel}>Operator note</Text>
          <TextInput
            value={operatorNote}
            onChangeText={setOperatorNote}
            multiline
            style={[styles.input, styles.multilineInput]}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      </SectionCard>

      <SectionCard eyebrow="90-day milestones" title="Execution plan">
        {plan.milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.listCard}>
            <Text style={styles.listStep}>Step {index + 1}</Text>
            <Text style={styles.listTitle}>{milestone.title}</Text>
            <Text style={styles.bodyText}>{milestone.detail}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard eyebrow="Commercialization checklist" title="What Hermes should help with next">
        {plan.checklist.map((item) => (
          <View key={item} style={styles.checkRow}>
            <Text style={styles.checkBullet}>•</Text>
            <Text style={styles.checkText}>{item}</Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard eyebrow="Recommended skills" title="Skill handoff pack" rightLabel={`${plan.recommendedSkills.length} skills`}>
        <Text style={styles.bodyText}>{operatorNote}</Text>
        <View style={styles.chipRow}>
          {plan.recommendedSkills.map((skill) => (
            <ActionChip key={skill} label={skill} />
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metaLabel: {
    color: theme.colors.tint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bodyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldWrap: {
    gap: theme.spacing.xs,
  },
  inputLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.cardSoft,
    color: theme.colors.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  listCard: {
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.cardSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
  },
  listStep: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  checkRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  checkBullet: {
    color: theme.colors.tint,
    fontSize: 18,
    lineHeight: 20,
  },
  checkText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
