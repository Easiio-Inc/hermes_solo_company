import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ActionChip } from '@/components/ui/ActionChip';
import { Screen } from '@/components/ui/Screen';
import { SectionCard } from '@/components/ui/SectionCard';
import { theme } from '@/constants/theme';
import { OWNER_APP_CLASS12_WORKSPACE_KEY } from '@/lib/defaults';
import { useOwnerApp } from '@/context/OwnerAppContext';
import { buildClass12StageAnalytics, buildClass12Timeline } from '@/lib/class12/analytics';
import { buildClass12CrmWritePayload, canSubmitQueueItemToCrm } from '@/lib/class12/crm';
import { class12DemoLead } from '@/lib/class12/demo';
import { buildClass12ExportPackage, buildClass12QueueItemExportPackage } from '@/lib/class12/export';
import { buildClass12ProposalPackage, canEscalateToProposal, createClass12ProposalDraft } from '@/lib/class12/proposal';
import { buildClass12ProposalFileExport, buildClass12ProposalJsonExport } from '@/lib/class12/proposalExport';
import { buildFollowupQueueItem, filterFollowupQueue, sortFollowupQueue, type Class12QueueFilter } from '@/lib/class12/queue';
import { createInitialClass12WorkspaceState, restoreClass12WorkspaceState } from '@/lib/class12/state';
import { buildClass12ResponsePackage } from '@/lib/class12/workflow';
import { submitMobileClass12CrmHandoff } from '@/lib/liveGateway';
import { loadJsonValue, removeJsonValue, saveJsonValue } from '@/lib/persistence';
import type { Class12CrmSyncStatus, Class12FollowupQueueItem, Class12LeadInput, Class12QueueStatus } from '@/types/class12';

const emptyLead: Class12LeadInput = {
  name: '',
  email: '',
  company: '',
  source: 'website_chatbot',
  inquiryText: '',
  serviceInterest: '',
  budget: '',
  timeline: '',
  previousContext: '',
};

type FieldKey = keyof Class12LeadInput;

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
};

function Field({ label, value, onChangeText, multiline = false }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        autoCapitalize="sentences"
        placeholderTextColor={theme.colors.textMuted}
      />
    </View>
  );
}

function statusLabel(status: Class12QueueStatus): string {
  switch (status) {
    case 'pending_review':
      return 'Pending review';
    case 'approved':
      return 'Approved';
    case 'deferred':
      return 'Deferred';
    case 'completed':
      return 'Completed';
  }
}

function crmSyncLabel(status: Class12CrmSyncStatus): string {
  switch (status) {
    case 'not_sent':
      return 'Not sent';
    case 'sending':
      return 'Sending…';
    case 'synced':
      return 'Synced';
    case 'error':
      return 'Sync error';
  }
}

function relativeLabel(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes <= 0) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

const initialWorkspace = createInitialClass12WorkspaceState();

export default function Class12Screen() {
  const { authSession, config, monitor, refreshOwnerData } = useOwnerApp();
  const [draft, setDraft] = useState<Class12LeadInput>(initialWorkspace.draft);
  const [submittedLead, setSubmittedLead] = useState<Class12LeadInput>(initialWorkspace.submittedLead);
  const [runCount, setRunCount] = useState(initialWorkspace.runCount);
  const [phase4Notice, setPhase4Notice] = useState<string | null>(null);
  const [phase6Notice, setPhase6Notice] = useState<string | null>(null);
  const [phase7Notice, setPhase7Notice] = useState<string | null>(null);
  const [phase8Notice, setPhase8Notice] = useState<string | null>(null);
  const [phase9Notice, setPhase9Notice] = useState<string | null>(null);
  const [phase10Notice, setPhase10Notice] = useState<string | null>(null);
  const [queue, setQueue] = useState<Class12FollowupQueueItem[]>(initialWorkspace.queue);
  const [selectedQueueFilter, setSelectedQueueFilter] = useState<Class12QueueFilter>('all');
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(initialWorkspace.queue[0]?.id ?? null);
  const [proposalQuoteBand, setProposalQuoteBand] = useState('');
  const [proposalScopeText, setProposalScopeText] = useState('');
  const [proposalQuestionsText, setProposalQuestionsText] = useState('');
  const [proposalNoteText, setProposalNoteText] = useState('');
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);

  const result = useMemo(() => buildClass12ResponsePackage(submittedLead), [submittedLead]);
  const exportPackage = useMemo(() => buildClass12ExportPackage(submittedLead, result), [submittedLead, result]);
  const filteredQueue = useMemo(() => filterFollowupQueue(queue, selectedQueueFilter), [queue, selectedQueueFilter]);
  const selectedQueueItem = useMemo(
    () => filteredQueue.find((item) => item.id === selectedQueueId) ?? filteredQueue[0] ?? null,
    [filteredQueue, selectedQueueId],
  );
  const selectedQueueExportPackage = useMemo(
    () => (selectedQueueItem ? buildClass12QueueItemExportPackage(selectedQueueItem) : null),
    [selectedQueueItem],
  );
  const selectedProposalPackage = useMemo(() => {
    if (!selectedQueueItem || !canEscalateToProposal(selectedQueueItem)) {
      return null;
    }
    return buildClass12ProposalPackage(selectedQueueItem, {
      quoteBand: proposalQuoteBand,
      scope: proposalScopeText.split('\n'),
      discoveryQuestions: proposalQuestionsText.split('\n'),
      proposalNote: proposalNoteText,
    });
  }, [selectedQueueItem, proposalNoteText, proposalQuestionsText, proposalQuoteBand, proposalScopeText]);
  const selectedProposalMarkdownExport = useMemo(() => {
    if (!selectedQueueItem || !canEscalateToProposal(selectedQueueItem)) {
      return null;
    }
    return buildClass12ProposalFileExport(selectedQueueItem, {
      quoteBand: proposalQuoteBand,
      scope: proposalScopeText.split('\n'),
      discoveryQuestions: proposalQuestionsText.split('\n'),
      proposalNote: proposalNoteText,
    });
  }, [selectedQueueItem, proposalNoteText, proposalQuestionsText, proposalQuoteBand, proposalScopeText]);
  const selectedProposalJsonExport = useMemo(() => {
    if (!selectedQueueItem || !canEscalateToProposal(selectedQueueItem)) {
      return null;
    }
    return buildClass12ProposalJsonExport(selectedQueueItem, {
      quoteBand: proposalQuoteBand,
      scope: proposalScopeText.split('\n'),
      discoveryQuestions: proposalQuestionsText.split('\n'),
      proposalNote: proposalNoteText,
    });
  }, [selectedQueueItem, proposalNoteText, proposalQuestionsText, proposalQuoteBand, proposalScopeText]);
  const queueStats = useMemo(
    () => ({
      pending: queue.filter((item) => item.status === 'pending_review').length,
      approved: queue.filter((item) => item.status === 'approved').length,
      deferred: queue.filter((item) => item.status === 'deferred').length,
      completed: queue.filter((item) => item.status === 'completed').length,
      synced: queue.filter((item) => item.crmSync.status === 'synced').length,
    }),
    [queue],
  );

  const stageAnalytics = useMemo(() => buildClass12StageAnalytics(queue, monitor.crm), [queue, monitor.crm]);
  const timelineEntries = useMemo(() => buildClass12Timeline(queue, monitor.crm).slice(0, 8), [queue, monitor.crm]);

  useEffect(() => {
    let cancelled = false;

    async function restoreWorkspace() {
      const persisted = await loadJsonValue(OWNER_APP_CLASS12_WORKSPACE_KEY);
      if (cancelled) return;
      const restored = restoreClass12WorkspaceState(persisted);
      setDraft(restored.draft);
      setSubmittedLead(restored.submittedLead);
      setRunCount(restored.runCount);
      setQueue(restored.queue);
      setPhase6Notice(persisted ? 'Phase 6 restored your saved Class 12 draft and follow-up queue.' : 'Phase 6 local workspace persistence is active for this device.');
      setWorkspaceHydrated(true);
    }

    void restoreWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!workspaceHydrated) return;
    void saveJsonValue(OWNER_APP_CLASS12_WORKSPACE_KEY, {
      draft,
      submittedLead,
      runCount,
      queue,
    });
  }, [draft, submittedLead, runCount, queue, workspaceHydrated]);

  useEffect(() => {
    if (!filteredQueue.length) {
      if (selectedQueueId !== null) {
        setSelectedQueueId(null);
      }
      return;
    }
    if (!selectedQueueId || !filteredQueue.some((item) => item.id === selectedQueueId)) {
      setSelectedQueueId(filteredQueue[0].id);
    }
  }, [filteredQueue, selectedQueueId]);

  useEffect(() => {
    if (!selectedQueueItem || !canEscalateToProposal(selectedQueueItem)) {
      setProposalQuoteBand('');
      setProposalScopeText('');
      setProposalQuestionsText('');
      setProposalNoteText('');
      return;
    }
    const draft = createClass12ProposalDraft(selectedQueueItem);
    setProposalQuoteBand(draft.quoteBand);
    setProposalScopeText(draft.scope.join('\n'));
    setProposalQuestionsText(draft.discoveryQuestions.join('\n'));
    setProposalNoteText(draft.proposalNote);
    setPhase9Notice(null);
  }, [selectedQueueItem]);

  function updateField(field: FieldKey, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function replaceOrAppendQueueItem(nextItem: Class12FollowupQueueItem) {
    setQueue((current) => sortFollowupQueue([nextItem, ...current]));
  }

  function updateQueueItem(id: string, updater: (item: Class12FollowupQueueItem) => Class12FollowupQueueItem) {
    setQueue((current) => sortFollowupQueue(current.map((item) => (item.id === id ? updater(item) : item))));
  }

  function loadDemo() {
    setDraft(initialWorkspace.draft);
    setSubmittedLead(initialWorkspace.submittedLead);
    setRunCount(initialWorkspace.runCount);
    setPhase4Notice(null);
    setPhase6Notice('Loaded the demo lead into the Phase 6 local workspace.');
    setQueue(initialWorkspace.queue);
  }

  function clearForm() {
    setDraft(emptyLead);
    setSubmittedLead(emptyLead);
    setRunCount(0);
    setPhase4Notice(null);
    setPhase6Notice('Cleared the current Class 12 draft. The empty workspace will stay saved locally until you replace it.');
  }

  async function resetSavedWorkspace() {
    await removeJsonValue(OWNER_APP_CLASS12_WORKSPACE_KEY);
    setDraft(initialWorkspace.draft);
    setSubmittedLead(initialWorkspace.submittedLead);
    setRunCount(initialWorkspace.runCount);
    setQueue(initialWorkspace.queue);
    setPhase4Notice(null);
    setPhase6Notice('Reset the saved Class 12 workspace back to the default demo seed.');
  }

  async function sharePackage(title: string, message: string, onSuccess: string, setNotice: (message: string | null) => void) {
    try {
      await Share.share(
        {
          title,
          message,
        },
        Platform.OS === 'android' ? { dialogTitle: title } : undefined,
      );
      setNotice(onSuccess);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unable to share the current Class 12 package.';
      setNotice(messageText);
    }
  }

  async function shareCurrentPackage() {
    await sharePackage(
      exportPackage.title,
      exportPackage.message,
      'Phase 7 opened the device share flow for the current Class 12 handoff package.',
      setPhase7Notice,
    );
  }

  async function shareSelectedQueuePackage() {
    if (!selectedQueueExportPackage) {
      setPhase8Notice('Select a queue item first before sharing a queue review package.');
      return;
    }
    await sharePackage(
      selectedQueueExportPackage.title,
      selectedQueueExportPackage.message,
      'Phase 8 opened the device share flow for the selected queue review package.',
      setPhase8Notice,
    );
  }

  function resetProposalEditor() {
    if (!selectedQueueItem || !canEscalateToProposal(selectedQueueItem)) {
      setPhase9Notice('Select a commercial queue item before resetting the proposal editor.');
      return;
    }
    const draft = createClass12ProposalDraft(selectedQueueItem);
    setProposalQuoteBand(draft.quoteBand);
    setProposalScopeText(draft.scope.join('\n'));
    setProposalQuestionsText(draft.discoveryQuestions.join('\n'));
    setProposalNoteText(draft.proposalNote);
    setPhase9Notice('Phase 9 reset the proposal editor back to the suggested draft for this lead.');
  }

  async function shareSelectedProposalPackage() {
    if (!selectedProposalPackage) {
      setPhase9Notice('The selected queue item is not a commercial lead, so there is no proposal review package to share yet.');
      return;
    }
    await sharePackage(
      selectedProposalPackage.title,
      selectedProposalPackage.message,
      'Phase 9 opened the device share flow for the edited proposal/quote review package.',
      setPhase9Notice,
    );
  }

  async function exportProposalAsset(asset: { fileName: string; mimeType: string; content: string }) {
    try {
      if (Platform.OS === 'web') {
        const blob = new Blob([asset.content], { type: asset.mimeType });
        const url = globalThis.URL.createObjectURL(blob);
        const anchor = globalThis.document.createElement('a');
        anchor.href = url;
        anchor.download = asset.fileName;
        globalThis.document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        globalThis.URL.revokeObjectURL(url);
        setPhase10Notice(`Phase 10 downloaded ${asset.fileName} so the operator can hand the proposal review package to another bot or workflow.`);
        return;
      }

      const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!baseDirectory) {
        throw new Error('No writable device directory is available for exporting the proposal handoff file.');
      }

      const fileUri = `${baseDirectory}${asset.fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, asset.content);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: asset.fileName,
          mimeType: asset.mimeType,
          UTI: asset.mimeType === 'application/json' ? 'public.json' : 'net.daringfireball.markdown',
        });
        setPhase10Notice(`Phase 10 exported ${asset.fileName} and opened the native share sheet.`);
        return;
      }

      await sharePackage(
        asset.fileName,
        asset.content,
        `Phase 10 exported ${asset.fileName} and fell back to a plain-text share flow because file sharing is unavailable on this device.`,
        setPhase10Notice,
      );
    } catch (error) {
      const messageText = error instanceof Error ? error.message : 'Unable to export the current proposal review file.';
      setPhase10Notice(messageText);
    }
  }

  async function exportSelectedProposalFile() {
    if (!selectedProposalMarkdownExport) {
      setPhase10Notice('Select a commercial lead in Phase 8 before exporting a proposal handoff file.');
      return;
    }

    await exportProposalAsset(selectedProposalMarkdownExport);
  }

  async function exportSelectedProposalJsonFile() {
    if (!selectedProposalJsonExport) {
      setPhase10Notice('Select a commercial lead in Phase 8 before exporting a proposal JSON handoff file.');
      return;
    }

    await exportProposalAsset(selectedProposalJsonExport);
  }

  function runWorkflow() {
    const nextLead = { ...draft };
    const nextResult = buildClass12ResponsePackage(nextLead);
    const nextRunCount = runCount + 1;
    const nextQueueItem = buildFollowupQueueItem(nextLead, nextResult, { idSuffix: `run-${nextRunCount}` });
    setSubmittedLead(nextLead);
    setRunCount(nextRunCount);
    setPhase4Notice(null);
    setSelectedQueueFilter('all');
    setSelectedQueueId(nextQueueItem.id);
    replaceOrAppendQueueItem(nextQueueItem);
  }

  function updateQueueStatus(id: string, status: Class12QueueStatus) {
    setPhase4Notice(null);
    setQueue((current) => sortFollowupQueue(current.map((item) => (item.id === id ? { ...item, status } : item))));
  }

  async function syncQueueItemToCrm(item: Class12FollowupQueueItem) {
    if (!canSubmitQueueItemToCrm(item)) {
      setPhase4Notice(
        item.crmSync.status === 'synced'
          ? 'This queue item is already synced to Solo CRM. Re-open or create a new run only if you intentionally want another handoff.'
          : 'Approve the queue item before sending it to Solo CRM.',
      );
      return;
    }

    if (!authSession.token) {
      setPhase4Notice('Owner sign-in is required before Phase 4 can write approved items into Solo CRM.');
      return;
    }

    updateQueueItem(item.id, (current) => ({
      ...current,
      crmSync: {
        ...current.crmSync,
        status: 'sending',
        message: 'Sending approved handoff to Solo CRM…',
      },
    }));

    try {
      const response = await submitMobileClass12CrmHandoff(config, authSession.token, buildClass12CrmWritePayload(item));
      if (!response.ok) {
        throw new Error(response.summary || 'Solo CRM rejected the approved Class 12 handoff.');
      }
      updateQueueItem(item.id, (current) => ({
        ...current,
        crmSync: {
          status: 'synced',
          message: response.summary || 'Approved Class 12 handoff was written to Solo CRM.',
          contactId: response.contact_id,
          dealId: response.deal_id,
          activityId: response.activity_id,
          syncedAt: new Date().toISOString(),
        },
      }));
      setPhase4Notice('Phase 4 CRM sync completed. Refreshing protected owner data…');
      await refreshOwnerData();
      setPhase4Notice('Phase 4 CRM sync completed and the protected owner CRM snapshot was refreshed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to write the approved Class 12 handoff to Solo CRM.';
      updateQueueItem(item.id, (current) => ({
        ...current,
        crmSync: {
          ...current.crmSync,
          status: 'error',
          message,
        },
      }));
      setPhase4Notice(message);
    }
  }

  return (
    <Screen
      title="Class 12 workspace"
      subtitle="Turn one inquiry into route classification, qualification, reply drafts, and a review-first CRM handoff. Phase 4 adds approved-item Solo CRM sync so the owner can push vetted follow-ups into the mobile-safe admin path.">
      <SectionCard eyebrow="Phase 2" title="Lead intake" rightLabel={`Runs ${runCount}`}>
        <Text style={styles.note}>
          This mobile-safe workspace mirrors the Class 12 teaching flow: collect one lead, run the package, then let the operator review before anything is sent or written.
        </Text>
        <View style={styles.chipRow}>
          <ActionChip label="Load demo lead" onPress={loadDemo} />
          <ActionChip label="Clear form" onPress={clearForm} />
        </View>
        <Field label="Lead name" value={draft.name} onChangeText={(value) => updateField('name', value)} />
        <Field label="Email" value={draft.email} onChangeText={(value) => updateField('email', value)} />
        <Field label="Company" value={draft.company} onChangeText={(value) => updateField('company', value)} />
        <Field label="Source" value={draft.source} onChangeText={(value) => updateField('source', value)} />
        <Field label="Service interest" value={draft.serviceInterest} onChangeText={(value) => updateField('serviceInterest', value)} />
        <Field label="Budget" value={draft.budget} onChangeText={(value) => updateField('budget', value)} />
        <Field label="Timeline" value={draft.timeline} onChangeText={(value) => updateField('timeline', value)} />
        <Field label="Inquiry text" value={draft.inquiryText} onChangeText={(value) => updateField('inquiryText', value)} multiline />
        <Field label="Previous context" value={draft.previousContext || ''} onChangeText={(value) => updateField('previousContext', value)} multiline />
        <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={runWorkflow}>
          <Text style={styles.primaryButtonText}>Run Class 12 package</Text>
        </Pressable>
      </SectionCard>

      <SectionCard eyebrow="Presentation" title="Lead summary" rightLabel={result.route.replace('_', ' ')}>
        <Text style={styles.summaryText}>{result.summary}</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Lead score</Text>
            <Text style={styles.metricValue}>{result.qualification.leadScore}/5</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Recommended next step</Text>
            <Text style={styles.metricDetail}>{result.qualification.recommendedNextStep}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Qualification" title="Signals and risks">
        <Text style={styles.sectionLead}>{result.qualification.scoreReason}</Text>
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Positive signals</Text>
          {result.qualification.positiveSignals.map((signal) => (
            <Text key={signal} style={styles.listItem}>• {signal}</Text>
          ))}
          {result.qualification.positiveSignals.length === 0 ? <Text style={styles.listItem}>• No strong positive signals yet</Text> : null}
        </View>
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Red flags / missing details</Text>
          {[...result.qualification.redFlags, ...result.qualification.missingFields.map((field) => `${field} missing`)].map((flag) => (
            <Text key={flag} style={styles.listItem}>• {flag}</Text>
          ))}
          {result.qualification.redFlags.length === 0 && result.qualification.missingFields.length === 0 ? <Text style={styles.listItem}>• No major gaps detected</Text> : null}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Reply package" title="Multi-channel drafts">
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Best CTA</Text>
          <Text style={styles.bodyText}>{result.response.bestCta}</Text>
        </View>
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Email draft</Text>
          <Text style={styles.bodyText}>{result.response.emailDraft}</Text>
        </View>
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>DM draft</Text>
          <Text style={styles.bodyText}>{result.response.dmDraft}</Text>
        </View>
        <View style={styles.listBlock}>
          <Text style={styles.listTitle}>Call script</Text>
          <Text style={styles.bodyText}>{result.response.callScript}</Text>
        </View>
      </SectionCard>

      <SectionCard eyebrow="CRM handoff" title="Operator-approved next action">
        <Text style={styles.bodyText}>{result.crm.summary}</Text>
        <View style={styles.crmRow}>
          <Text style={styles.crmKey}>Stage recommendation</Text>
          <Text style={styles.crmValue}>{result.crm.stageRecommendation}</Text>
        </View>
        <View style={styles.crmRow}>
          <Text style={styles.crmKey}>Follow-up task</Text>
          <Text style={styles.crmValue}>{result.crm.followUpTask}</Text>
        </View>
        <View style={styles.crmRow}>
          <Text style={styles.crmKey}>Operator next action</Text>
          <Text style={styles.crmValue}>{result.crm.operatorNextAction}</Text>
        </View>
        <View style={styles.crmRow}>
          <Text style={styles.crmKey}>Auto-send</Text>
          <Text style={styles.crmValue}>{result.crm.autoSendRecommended ? 'Enabled' : 'Disabled — review first'}</Text>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Phase 7" title="Export and share handoff" rightLabel="Review-first package">
        <Text style={styles.note}>
          Phase 7 turns the current Class 12 result into a portable handoff package you can send to email, chat, notes, or any device share target without enabling auto-send.
        </Text>
        <View style={styles.exportCard}>
          <Text style={styles.metricLabel}>Share title</Text>
          <Text style={styles.queueTitle}>{exportPackage.title}</Text>
          <Text style={styles.exportPreview}>{exportPackage.message}</Text>
        </View>
        <View style={styles.chipRow}>
          <ActionChip label="Share current package" onPress={() => void shareCurrentPackage()} />
        </View>
        {phase7Notice ? <Text style={styles.phaseNotice}>{phase7Notice}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Phase 8" title="Proposal review + queue detail" rightLabel={`${filteredQueue.length} visible`}>
        <Text style={styles.note}>
          Phase 8 adds focused queue review: filter the queue, inspect one item in detail, share a specific queue package, and escalate commercial leads into a proposal/quote review handoff without sending anything automatically.
        </Text>
        <View style={styles.chipRow}>
          <ActionChip label={selectedQueueFilter === 'all' ? 'All ✓' : 'All'} onPress={() => setSelectedQueueFilter('all')} />
          <ActionChip label={selectedQueueFilter === 'pending_review' ? 'Pending ✓' : 'Pending'} onPress={() => setSelectedQueueFilter('pending_review')} />
          <ActionChip label={selectedQueueFilter === 'approved' ? 'Approved ✓' : 'Approved'} onPress={() => setSelectedQueueFilter('approved')} />
          <ActionChip label={selectedQueueFilter === 'proposal_review' ? 'Proposal review ✓' : 'Proposal review'} onPress={() => setSelectedQueueFilter('proposal_review')} />
        </View>
        {!selectedQueueItem ? (
          <Text style={styles.bodyText}>No queue items match this filter yet. Run the workflow or switch filters to inspect another item.</Text>
        ) : (
          <View style={styles.exportCard}>
            <View style={styles.queueHeader}>
              <View style={styles.queueHeaderText}>
                <Text style={styles.queueTitle}>{selectedQueueItem.title}</Text>
                <Text style={styles.queueMeta}>{selectedQueueItem.company} · {selectedQueueItem.route.replace(/_/g, ' ')} · score {selectedQueueItem.score}/5</Text>
              </View>
              <View style={styles.badgeStack}>
                <Text style={[styles.badge, styles.priorityBadge]}>{selectedQueueItem.priority}</Text>
                <Text style={[styles.badge, styles.statusBadge]}>{statusLabel(selectedQueueItem.status)}</Text>
              </View>
            </View>
            <Text style={styles.bodyText}>{selectedQueueItem.summary}</Text>
            <View style={styles.crmRowCompact}>
              <Text style={styles.crmKey}>Best CTA</Text>
              <Text style={styles.crmValue}>{selectedQueueItem.response.response.bestCta}</Text>
            </View>
            <View style={styles.crmRowCompact}>
              <Text style={styles.crmKey}>Email draft</Text>
              <Text style={styles.crmValue}>{selectedQueueItem.response.response.emailDraft}</Text>
            </View>
            <View style={styles.crmRowCompact}>
              <Text style={styles.crmKey}>CRM sync</Text>
              <Text style={styles.crmValue}>{crmSyncLabel(selectedQueueItem.crmSync.status)} · {selectedQueueItem.crmSync.message}</Text>
            </View>
            {selectedProposalPackage ? (
              <View style={styles.chipRow}>
                <ActionChip label="Share queue item" onPress={() => void shareSelectedQueuePackage()} />
              </View>
            ) : (
              <View style={styles.chipRow}>
                <ActionChip label="Share queue item" onPress={() => void shareSelectedQueuePackage()} />
              </View>
            )}
          </View>
        )}
        <View style={styles.queueSelectionList}>
          {filteredQueue.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.queueSelectRow, item.id === selectedQueueItem?.id && styles.queueSelectRowActive, pressed && styles.buttonPressed]}
              onPress={() => setSelectedQueueId(item.id)}>
              <View style={styles.queueHeaderText}>
                <Text style={styles.queueTitle}>{item.title}</Text>
                <Text style={styles.queueMeta}>{statusLabel(item.status)} · {item.route.replace(/_/g, ' ')} · {item.priority}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        {phase8Notice ? <Text style={styles.phaseNotice}>{phase8Notice}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Phase 9" title="Editable proposal review" rightLabel={selectedProposalPackage ? 'Commercial lead selected' : 'Select a commercial lead'}>
        <Text style={styles.note}>
          Phase 9 lets the operator edit the quote band, scope bullets, discovery questions, and proposal note before sharing a proposal review package. This stays review-first and never auto-sends.
        </Text>
        {!selectedQueueItem || !canEscalateToProposal(selectedQueueItem) ? (
          <Text style={styles.bodyText}>Choose a sales-qualified or nurture item in Phase 8 to edit a proposal review package.</Text>
        ) : (
          <>
            <Field label="Quote band" value={proposalQuoteBand} onChangeText={setProposalQuoteBand} />
            <Field label="Suggested scope (one bullet per line)" value={proposalScopeText} onChangeText={setProposalScopeText} multiline />
            <Field label="Discovery questions (one per line)" value={proposalQuestionsText} onChangeText={setProposalQuestionsText} multiline />
            <Field label="Proposal note" value={proposalNoteText} onChangeText={setProposalNoteText} multiline />
            {selectedProposalPackage ? (
              <View style={styles.exportCard}>
                <Text style={styles.metricLabel}>Edited proposal preview</Text>
                <Text style={styles.queueTitle}>{selectedProposalPackage.title}</Text>
                <Text style={styles.exportPreview}>{selectedProposalPackage.message}</Text>
              </View>
            ) : null}
            <View style={styles.chipRow}>
              <ActionChip label="Reset proposal draft" onPress={resetProposalEditor} />
              <ActionChip label="Share edited proposal" onPress={() => void shareSelectedProposalPackage()} />
            </View>
          </>
        )}
        {phase9Notice ? <Text style={styles.phaseNotice}>{phase9Notice}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Phase 10" title="Downloadable proposal handoff" rightLabel={selectedProposalPackage ? 'Ready to export' : 'Select a commercial lead'}>
        <Text style={styles.note}>
          Phase 10 now produces two structured handoff artifacts for future bot ingestion: a readable markdown brief with explicit sections plus a machine-ingestible JSON payload. Web downloads each file directly; native exports them through the device share sheet.
        </Text>
        {!selectedQueueItem || !canEscalateToProposal(selectedQueueItem) || !selectedProposalPackage || !selectedProposalMarkdownExport || !selectedProposalJsonExport ? (
          <Text style={styles.bodyText}>Choose a commercial lead in Phase 8 and keep the Phase 9 proposal draft open before exporting the handoff files.</Text>
        ) : (
          <>
            <View style={styles.exportCard}>
              <Text style={styles.metricLabel}>Markdown handoff</Text>
              <Text style={styles.queueTitle}>{selectedProposalMarkdownExport.fileName}</Text>
              <Text style={styles.exportPreview}>{selectedProposalPackage.message}</Text>
            </View>
            <View style={styles.exportCard}>
              <Text style={styles.metricLabel}>JSON handoff</Text>
              <Text style={styles.queueTitle}>{selectedProposalJsonExport.fileName}</Text>
              <Text style={styles.exportPreview}>Structured payload for future Hermes skill-building workflows, including lead context, proposal edits, and suggested operator steps.</Text>
            </View>
            <View style={styles.chipRow}>
              <ActionChip label={Platform.OS === 'web' ? 'Download markdown file' : 'Export markdown file'} onPress={() => void exportSelectedProposalFile()} />
              <ActionChip label={Platform.OS === 'web' ? 'Download JSON file' : 'Export JSON file'} onPress={() => void exportSelectedProposalJsonFile()} />
            </View>
          </>
        )}
        {phase10Notice ? <Text style={styles.phaseNotice}>{phase10Notice}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Phase 4" title="Solo CRM write integration" rightLabel={authSession.user ? 'Signed in' : 'Sign in required'}>
        <Text style={styles.note}>
          Approved queue items can now be sent through the mobile-safe owner API into Solo CRM. This stays review-first: nothing is written until the operator approves the item and explicitly taps send.
        </Text>
        <View style={styles.queueStatsRow}>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Synced items</Text>
            <Text style={styles.metricValue}>{queueStats.synced}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Owner auth</Text>
            <Text style={styles.metricValueSmall}>{authSession.user ? authSession.user.email : 'Signed out'}</Text>
          </View>
        </View>
        {phase4Notice ? <Text style={styles.phaseNotice}>{phase4Notice}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Phase 5" title="Stage analytics" rightLabel={monitor.crm.usingFallback ? 'Local only' : 'CRM linked'}>
        <Text style={styles.note}>
          Phase 5 turns the Class 12 queue plus protected owner CRM data into a compact operator dashboard for stage mix, sync health, and route balance.
        </Text>
        <View style={styles.queueStatsRow}>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Pending review</Text>
            <Text style={styles.metricValue}>{stageAnalytics.queue.pendingReview}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Open CRM deals</Text>
            <Text style={styles.metricValue}>{stageAnalytics.crm.openDeals}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Due follow-ups</Text>
            <Text style={styles.metricValue}>{stageAnalytics.crm.dueFollowups}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Sync errors</Text>
            <Text style={styles.metricValue}>{stageAnalytics.crm.errors}</Text>
          </View>
        </View>
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Route mix</Text>
            <Text style={styles.bodyText}>Sales qualified {stageAnalytics.routes.salesQualified} · Customer service {stageAnalytics.routes.customerService} · Nurture {stageAnalytics.routes.nurture} · Weak fit {stageAnalytics.routes.weakFit}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Queue stage mix</Text>
            <Text style={styles.bodyText}>Approved {stageAnalytics.queue.approved} · Deferred {stageAnalytics.queue.deferred} · Completed {stageAnalytics.queue.completed} · Synced {stageAnalytics.crm.synced}</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Phase 5" title="Activity timeline" rightLabel={`${timelineEntries.length} events`}>
        <Text style={styles.note}>
          This timeline merges local Class 12 milestones with recent owner CRM deals and follow-up events so the operator can see what happened most recently.
        </Text>
        {timelineEntries.length === 0 ? (
          <Text style={styles.bodyText}>No queue or CRM activity yet. Approve a lead or refresh the owner CRM feed to populate the timeline.</Text>
        ) : (
          timelineEntries.map((entry) => (
            <View key={entry.id} style={styles.timelineCard}>
              <View style={styles.timelineHeader}>
                <Text style={styles.queueTitle}>{entry.title}</Text>
                <Text style={styles.timelineAt}>{relativeLabel(entry.at)}</Text>
              </View>
              <Text style={styles.queueMeta}>{entry.kind.replace(/_/g, ' ')}</Text>
              <Text style={styles.bodyText}>{entry.detail}</Text>
            </View>
          ))
        )}
      </SectionCard>

      <SectionCard eyebrow="Phase 6" title="Workspace persistence" rightLabel={workspaceHydrated ? 'Restored locally' : 'Hydrating…'}>
        <Text style={styles.note}>
          Phase 6 keeps the Class 12 draft, latest submitted lead, run counter, and follow-up queue saved on this device so operators can leave and come back without losing in-progress work.
        </Text>
        <View style={styles.queueStatsRow}>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Saved queue items</Text>
            <Text style={styles.metricValue}>{queue.length}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Latest run</Text>
            <Text style={styles.metricValue}>{runCount}</Text>
          </View>
        </View>
        <View style={styles.chipRow}>
          <ActionChip label="Load demo lead" onPress={loadDemo} />
          <ActionChip label="Reset saved workspace" onPress={() => void resetSavedWorkspace()} />
        </View>
        {phase6Notice ? <Text style={styles.phaseNotice}>{phase6Notice}</Text> : null}
      </SectionCard>

      <SectionCard eyebrow="Phase 3" title="Follow-up queue UI" rightLabel={`${queue.length} items`}>
        <Text style={styles.note}>
          This queue stays local until the operator approves a next step. Phase 4 adds optional Solo CRM sync for approved items, but deferred and pending items remain editable inside the app.
        </Text>
        <View style={styles.queueStatsRow}>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Pending</Text>
            <Text style={styles.metricValue}>{queueStats.pending}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Approved</Text>
            <Text style={styles.metricValue}>{queueStats.approved}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Deferred</Text>
            <Text style={styles.metricValue}>{queueStats.deferred}</Text>
          </View>
          <View style={styles.queueStatCard}>
            <Text style={styles.metricLabel}>Completed</Text>
            <Text style={styles.metricValue}>{queueStats.completed}</Text>
          </View>
        </View>

        {queue.map((item) => (
          <View key={item.id} style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <View style={styles.queueHeaderText}>
                <Text style={styles.queueTitle}>{item.title}</Text>
                <Text style={styles.queueMeta}>{item.company} · {item.route.replace('_', ' ')} · score {item.score}/5</Text>
              </View>
              <View style={styles.badgeStack}>
                <Text style={[styles.badge, styles.priorityBadge]}>{item.priority}</Text>
                <Text style={[styles.badge, styles.statusBadge]}>{statusLabel(item.status)}</Text>
              </View>
            </View>
            <Text style={styles.bodyText}>{item.summary}</Text>
            <View style={styles.crmRowCompact}>
              <Text style={styles.crmKey}>Stage</Text>
              <Text style={styles.crmValue}>{item.stageRecommendation}</Text>
            </View>
            <View style={styles.crmRowCompact}>
              <Text style={styles.crmKey}>Next action</Text>
              <Text style={styles.crmValue}>{item.nextAction}</Text>
            </View>
            <View style={styles.crmRowCompact}>
              <Text style={styles.crmKey}>CRM sync</Text>
              <Text style={styles.crmValue}>{crmSyncLabel(item.crmSync.status)} · {item.crmSync.message}</Text>
              {item.crmSync.contactId || item.crmSync.dealId || item.crmSync.activityId ? (
                <Text style={styles.queueMeta}>contact #{item.crmSync.contactId || '—'} · deal #{item.crmSync.dealId || '—'} · activity #{item.crmSync.activityId || '—'}</Text>
              ) : null}
            </View>
            <View style={styles.chipRow}>
              <ActionChip label="Approve" onPress={() => updateQueueStatus(item.id, 'approved')} />
              <ActionChip label="Defer" onPress={() => updateQueueStatus(item.id, 'deferred')} />
              <ActionChip label="Complete" onPress={() => updateQueueStatus(item.id, 'completed')} />
              <ActionChip label="Re-open" onPress={() => updateQueueStatus(item.id, 'pending_review')} />
              <ActionChip
                label={item.crmSync.status === 'sending' ? 'Sending…' : item.crmSync.status === 'synced' ? 'Synced' : 'Send to CRM'}
                onPress={() => void syncQueueItemToCrm(item)}
              />
            </View>
            {item.status !== 'approved' ? <Text style={styles.queueMeta}>Approve this item before using the Phase 4 CRM write action.</Text> : null}
          </View>
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  phaseNotice: {
    color: theme.colors.tint,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  fieldWrap: {
    gap: 6,
  },
  inputLabel: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.cardSoft,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.tint,
    paddingVertical: 13,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#08111F',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  metricsRow: {
    gap: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  queueStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  queueStatCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  metricValueSmall: {
    color: theme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  metricDetail: {
    color: theme.colors.tint,
    fontSize: 15,
    fontWeight: '700',
  },
  exportCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  exportPreview: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  queueSelectionList: {
    gap: theme.spacing.sm,
  },
  queueSelectRow: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  queueSelectRowActive: {
    borderColor: theme.colors.tint,
  },
  sectionLead: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  listBlock: {
    gap: 6,
  },
  listTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  listItem: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  crmRow: {
    gap: 4,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  crmRowCompact: {
    gap: 4,
  },
  crmKey: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  crmValue: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  queueCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  queueHeaderText: {
    flex: 1,
    gap: 4,
  },
  queueTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  queueMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  timelineCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 6,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  timelineAt: {
    color: theme.colors.tint,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeStack: {
    alignItems: 'flex-end',
    gap: 6,
  },
  badge: {
    overflow: 'hidden',
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    backgroundColor: theme.colors.tint,
    color: '#08111F',
  },
  statusBadge: {
    backgroundColor: theme.colors.chip,
    color: theme.colors.text,
  },
});
