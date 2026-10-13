import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { 
  subscribeAssignments, 
  resolveDisputeRefundClient, 
  resolveDisputeReleaseFreelancer,
  submitDisputeMediationNote 
} from '../services/adminService';

export default function DisputesScreen({ navigation }) {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedDispute, setSelectedDispute] = useState(null);

  // Arbitration modal state
  const [arbitrateModal, setArbitrateModal] = useState(false);
  const [arbitrationType, setArbitrationType] = useState('RELEASE'); // 'RELEASE' or 'REFUND'
  const [resolutionReason, setResolutionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Mediation directive modal
  const [directiveModal, setDirectiveModal] = useState(false);
  const [directiveMessage, setDirectiveMessage] = useState('');

  useEffect(() => {
    const unsub = subscribeAssignments(data => setAssignments(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const tabs = ['ALL', 'REVISION_REQUESTED', 'SUBMITTED', 'ACTIVE', 'CANCELLED', 'COMPLETED'];

  // Identify disputed or flagged assignments:
  // Either status is REVISION_REQUESTED, SUBMITTED with delay, or revisionCount > 0, or disputeStatus exists
  const disputedContracts = assignments.filter(a => {
    return (
      a.status === 'REVISION_REQUESTED' ||
      (a.revisionCount && a.revisionCount > 0) ||
      a.disputeStatus ||
      a.status === 'SUBMITTED' ||
      a.status === 'ACTIVE'
    );
  });

  const filteredList = disputedContracts.filter(c => {
    const textMatch = 
      (c.projectTitle || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.freelancerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.revisionNotes || '').toLowerCase().includes(search.toLowerCase());

    if (!textMatch) return false;
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  // Calculate Dispute KPIs
  const totalContested = disputedContracts.length;
  const revisionRequestedCount = assignments.filter(a => a.status === 'REVISION_REQUESTED').length;
  const totalEscrowAtStake = disputedContracts.reduce((sum, c) => sum + (parseFloat(c.agreedBudget) || 0), 0);
  const resolvedCount = assignments.filter(a => a.disputeStatus?.startsWith('RESOLVED')).length;

  const handleOpenArbitration = (contract, type) => {
    setSelectedDispute(contract);
    setArbitrationType(type);
    setResolutionReason('');
    setArbitrateModal(true);
  };

  const handleExecuteArbitration = async () => {
    if (!resolutionReason.trim()) {
      Alert.alert('Required', 'Please enter a clear arbitration reason for the platform audit log.');
      return;
    }

    setProcessing(true);
    try {
      if (arbitrationType === 'RELEASE') {
        await resolveDisputeReleaseFreelancer({
          assignmentId: selectedDispute.id || selectedDispute.assignmentId,
          projectId: selectedDispute.projectId,
          projectTitle: selectedDispute.projectTitle,
          freelancerId: selectedDispute.freelancerId,
          clientId: selectedDispute.clientId,
          amount: selectedDispute.agreedBudget || 0,
          reason: resolutionReason
        });
        Alert.alert('Escrow Released', `₹${selectedDispute.agreedBudget} released to freelancer ${selectedDispute.freelancerName}. Contract marked completed.`);
      } else {
        await resolveDisputeRefundClient({
          assignmentId: selectedDispute.id || selectedDispute.assignmentId,
          projectId: selectedDispute.projectId,
          projectTitle: selectedDispute.projectTitle,
          clientId: selectedDispute.clientId,
          freelancerId: selectedDispute.freelancerId,
          amount: selectedDispute.agreedBudget || 0,
          reason: resolutionReason
        });
        Alert.alert('Escrow Refunded', `₹${selectedDispute.agreedBudget} refunded to client ${selectedDispute.clientName}. Contract marked cancelled.`);
      }

      setProcessing(false);
      setArbitrateModal(false);
      setSelectedDispute(null);
    } catch (err) {
      setProcessing(false);
      Alert.alert('Arbitration Error', err.message);
    }
  };

  const handleSendDirective = async () => {
    if (!directiveMessage.trim()) {
      Alert.alert('Required', 'Please enter a directive message.');
      return;
    }

    try {
      await submitDisputeMediationNote(
        selectedDispute.id || selectedDispute.assignmentId,
        directiveMessage,
        selectedDispute.freelancerId
      );
      await submitDisputeMediationNote(
        selectedDispute.id || selectedDispute.assignmentId,
        directiveMessage,
        selectedDispute.clientId
      );
      Alert.alert('Directive Dispatched', 'Official mediation message was transmitted to both parties.');
      setDirectiveModal(false);
      setDirectiveMessage('');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const renderDisputeCard = ({ item }) => {
    const isRevision = item.status === 'REVISION_REQUESTED';
    return (
      <View style={[styles.card, isRevision && styles.cardHighlight]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {item.projectTitle || 'Assignment Contract'}
            </Text>
            <Text style={styles.contractId}>ID: {item.id || item.assignmentId}</Text>
          </View>
          <StatusBadge label={item.status || 'ACTIVE'} size="small" />
        </View>

        {/* Counterparty Row */}
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Client (Employer)</Text>
            <Text style={styles.partyName}>{item.clientName || 'Client'}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={18} color={colors.textMuted} />
          <View style={styles.partyBox}>
            <Text style={styles.partyLabel}>Student Freelancer</Text>
            <Text style={styles.partyName}>{item.freelancerName || 'Student'}</Text>
          </View>
        </View>

        {/* Locked Escrow Amount */}
        <View style={styles.escrowBanner}>
          <View style={styles.escrowLeft}>
            <Ionicons name="lock-closed" size={16} color={colors.purple} />
            <Text style={styles.escrowBannerLabel}>Escrow Held in Vault:</Text>
          </View>
          <Text style={styles.escrowBannerVal}>₹{item.agreedBudget || 0} INR</Text>
        </View>

        {/* Revision / Complaint note if any */}
        {item.revisionNotes ? (
          <View style={styles.notesBox}>
            <View style={styles.notesHeader}>
              <Ionicons name="warning-outline" size={14} color={colors.warning} />
              <Text style={styles.notesTitle}>
                Client Revision Request ({item.revisionCount || 1} iterations)
              </Text>
            </View>
            <Text style={styles.notesText}>{item.revisionNotes}</Text>
          </View>
        ) : null}

        {/* Deliverables snippet */}
        {Array.isArray(item.deliverables) && item.deliverables.length > 0 ? (
          <View style={styles.deliverablesBox}>
            <Text style={styles.deliverablesLabel}>Student Deliverable Artifacts:</Text>
            {item.deliverables.slice(0, 2).map((d, idx) => (
              <View key={idx} style={styles.deliverableRow}>
                <Ionicons name="document-attach-outline" size={14} color={colors.primary} />
                <Text style={styles.deliverableTitle}>{d.title}:</Text>
                <Text style={styles.deliverableUrl} numberOfLines={1}>{d.url}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Arbitration Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnSuccess]}
            onPress={() => handleOpenArbitration(item, 'RELEASE')}
          >
            <Ionicons name="shield-checkmark" size={14} color={colors.success} />
            <Text style={[styles.btnText, { color: colors.success }]}>Release to Student</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.btnDanger]}
            onPress={() => handleOpenArbitration(item, 'REFUND')}
          >
            <Ionicons name="return-down-back" size={14} color={colors.danger} />
            <Text style={[styles.btnText, { color: colors.danger }]}>Refund Client</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btn, styles.btnDirective]}
            onPress={() => {
              setSelectedDispute(item);
              setDirectiveModal(true);
            }}
          >
            <Ionicons name="megaphone-outline" size={14} color={colors.primary} />
            <Text style={[styles.btnText, { color: colors.primary }]}>Mediate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AdminHeader 
        title="Disputes & Escrow Mediation" 
        subtitle={`${filteredList.length} Contracts Under Supervision`} 
      />

      <View style={styles.scrollHeader}>
        <View style={styles.kpiRow}>
          <StatCard
            title="Contested Contracts"
            value={totalContested.toString()}
            subtext="Under Platform Review"
            icon="shield-outline"
            color={colors.warning}
          />
          <StatCard
            title="Revision Requested"
            value={revisionRequestedCount.toString()}
            subtext="Stalled Deliverables"
            icon="alert-circle-outline"
            color={colors.danger}
          />
          <StatCard
            title="Escrow in Vault"
            value={`₹${totalEscrowAtStake.toLocaleString()}`}
            subtext="Held Pending Verdict"
            icon="lock-closed-outline"
            color={colors.purple}
          />
          <StatCard
            title="Arbitrated Cases"
            value={resolvedCount.toString()}
            subtext="Successfully Resolved"
            icon="checkmark-done"
            color={colors.success}
          />
        </View>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search disputes by contract, client, freelancer, notes..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        data={filteredList}
        keyExtractor={item => item.id || item.assignmentId}
        renderItem={renderDisputeCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.success} />
            <Text style={styles.emptyTitle}>No active contract disputes</Text>
            <Text style={styles.emptySub}>All student freelance contracts are progressing normally without friction.</Text>
          </View>
        }
      />

      {/* Arbitration Verdict Modal */}
      <Modal visible={arbitrateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {arbitrationType === 'RELEASE' ? 'Arbitrate Escrow Release' : 'Arbitrate Client Refund'}
                </Text>
                <Text style={styles.modalSub}>
                  Contract: {selectedDispute?.projectTitle}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setArbitrateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.verdictInfoBox}>
                <Ionicons 
                  name={arbitrationType === 'RELEASE' ? "shield-checkmark" : "refresh-circle"} 
                  size={24} 
                  color={arbitrationType === 'RELEASE' ? colors.success : colors.danger} 
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.verdictHeading}>
                    {arbitrationType === 'RELEASE' 
                      ? `Release ₹${selectedDispute?.agreedBudget || 0} INR to Freelancer`
                      : `Refund ₹${selectedDispute?.agreedBudget || 0} INR to Client`}
                  </Text>
                  <Text style={styles.verdictSub}>
                    {arbitrationType === 'RELEASE'
                      ? `Marks the assignment as COMPLETED, deposits funds to ${selectedDispute?.freelancerName}'s wallet, and dispatches formal notifications.`
                      : `Marks the assignment as CANCELLED, restores funds to ${selectedDispute?.clientName}, and notifies both parties.`}
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>Arbitration Justification & Reason *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={resolutionReason}
                onChangeText={setResolutionReason}
                placeholder="Document your official arbitration reasoning for the platform ledger..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[
                  styles.confirmBtn, 
                  { backgroundColor: arbitrationType === 'RELEASE' ? colors.success : colors.danger }
                ]}
                onPress={handleExecuteArbitration}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={colors.textWhite} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color={colors.textWhite} />
                    <Text style={styles.confirmBtnText}>Execute Arbitration Ruling</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mediation Directive Modal */}
      <Modal visible={directiveModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch Mediation Directive</Text>
              <TouchableOpacity onPress={() => setDirectiveModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.verdictSub}>
                Broadcast an official neutral directive to both {selectedDispute?.clientName} and {selectedDispute?.freelancerName} requesting deliverable revisions or deadline adjustments.
              </Text>

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mediation Directive Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={directiveMessage}
                onChangeText={setDirectiveMessage}
                placeholder="e.g. SkillBridge Admin Notice: Freelancer is requested to submit revised source files within 48 hours..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleSendDirective}
              >
                <Ionicons name="paper-plane" size={18} color={colors.textWhite} />
                <Text style={styles.confirmBtnText}>Broadcast Directive to Both Parties</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollHeader: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  listContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 48,
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHighlight: {
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
    marginRight: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  contractId: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  partiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  partyBox: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  escrowBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.purple + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.purple + '30',
    marginBottom: 10,
  },
  escrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  escrowBannerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  escrowBannerVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.purple,
  },
  notesBox: {
    backgroundColor: colors.warningLight + '50',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  deliverablesBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  deliverablesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 6,
  },
  deliverableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  deliverableTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  deliverableUrl: {
    fontSize: 12,
    color: colors.primary,
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: 10,
    flexWrap: 'wrap',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  btnSuccess: {
    borderColor: colors.success + '50',
    backgroundColor: colors.success + '10',
  },
  btnDanger: {
    borderColor: colors.danger + '50',
    backgroundColor: colors.danger + '10',
  },
  btnDirective: {
    borderColor: colors.primary + '50',
    backgroundColor: colors.primary + '10',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 360,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    gap: 12,
  },
  verdictInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surfaceSubtle,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verdictHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  verdictSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  confirmBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: '700',
  },
});
