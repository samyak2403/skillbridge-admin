import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView,
  TextInput,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import AdminHeader from '../components/AdminHeader';
import SearchBar from '../components/SearchBar';
import StatusBadge from '../components/StatusBadge';
import { 
  subscribeAssignments, 
  releaseMilestonePayment, 
  updateAssignmentStatus,
  updateAssignmentDoc
} from '../services/adminService';

export default function ContractsScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 800 ? 4 : width >= 500 ? 2 : 1;

  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedContract, setSelectedContract] = useState(null);

  // Contract Edit State
  const [editingContract, setEditingContract] = useState(null);
  const [editBudget, setEditBudget] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editDeliveryNotes, setEditDeliveryNotes] = useState('');
  const [editMilestones, setEditMilestones] = useState([]);
  const [savingContract, setSavingContract] = useState(false);

  useEffect(() => {
    const unsub = subscribeAssignments(data => setAssignments(data));
    return () => { if (unsub) unsub(); };
  }, []);

  const tabs = ['ALL', 'ACTIVE', 'SUBMITTED', 'COMPLETED', 'CANCELLED'];

  const filteredContracts = assignments.filter(c => {
    const textMatch = (c.projectTitle || '').toLowerCase().includes(search.toLowerCase()) ||
                      (c.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
                      (c.freelancerName || '').toLowerCase().includes(search.toLowerCase());
    
    if (!textMatch) return false;
    if (activeTab === 'ALL') return true;
    return c.status === activeTab;
  });

  const handleManualRelease = (contract) => {
    Alert.alert(
      'Manual Escrow Release',
      `Release escrow funds of ₹${contract.agreedBudget || 0} INR to freelancer ${contract.freelancerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Release Payment', 
          onPress: async () => {
            try {
              await releaseMilestonePayment({
                assignmentId: contract.id,
                milestoneId: 'admin_release',
                amount: contract.agreedBudget || 0,
                freelancerId: contract.freelancerId,
                projectId: contract.projectId,
                projectTitle: contract.projectTitle
              });
              await updateAssignmentStatus(contract.id, 'COMPLETED');
              Alert.alert('Payment Released', `Funds credited to ${contract.freelancerName}'s wallet.`);
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const handleCancelContract = (contract) => {
    Alert.alert(
      'Cancel & Refund Contract',
      `Cancel contract for "${contract.projectTitle}" and refund client ${contract.clientName}?`,
      [
        { text: 'Back', style: 'cancel' },
        { 
          text: 'Cancel Contract', 
          style: 'destructive',
          onPress: async () => {
            try {
              await updateAssignmentStatus(contract.id, 'CANCELLED');
              Alert.alert('Cancelled', 'Contract marked as CANCELLED.');
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  };

  const handleOpenEdit = (contract) => {
    setEditingContract(contract);
    setEditBudget(String(contract.agreedBudget ?? 0));
    setEditStatus(contract.status || 'ACTIVE');
    setEditDeliveryNotes(contract.deliveryNotes || '');
    setEditMilestones(Array.isArray(contract.milestones) ? JSON.parse(JSON.stringify(contract.milestones)) : []);
  };

  const handleToggleMilestone = (idx) => {
    setEditMilestones(prev => {
      const updated = [...prev];
      const isDone = updated[idx].status === 'COMPLETED' || updated[idx].isCompleted;
      updated[idx] = {
        ...updated[idx],
        status: isDone ? 'PENDING' : 'COMPLETED',
        isCompleted: !isDone
      };
      return updated;
    });
  };

  const handleSaveEdit = async () => {
    if (!editBudget || isNaN(parseFloat(editBudget))) {
      Alert.alert('Required', 'Please enter a valid agreed budget.');
      return;
    }
    setSavingContract(true);
    try {
      await updateAssignmentDoc(editingContract.id, {
        agreedBudget: parseFloat(editBudget) || 0,
        status: editStatus,
        deliveryNotes: editDeliveryNotes.trim(),
        milestones: editMilestones
      });
      if (selectedContract?.id === editingContract.id) {
        setSelectedContract(prev => prev ? {
          ...prev,
          agreedBudget: parseFloat(editBudget) || 0,
          status: editStatus,
          deliveryNotes: editDeliveryNotes.trim(),
          milestones: editMilestones
        } : null);
      }
      setSavingContract(false);
      setEditingContract(null);
      Alert.alert('Success', 'Contract and escrow terms updated.');
    } catch (err) {
      setSavingContract(false);
      Alert.alert('Error', err.message);
    }
  };

  const renderContractItem = ({ item }) => (
    <View style={[styles.cardWrapper, { width: `${100 / numColumns}%` }, numColumns === 1 && { marginBottom: 16 }]}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardHeader}>
            <View style={styles.titleWrap}>
              <Text style={styles.title} numberOfLines={1}>{item.projectTitle || 'Assignment Contract'}</Text>
              <Text style={styles.parties} numberOfLines={1}>
                Client: <Text style={styles.bold}>{item.clientName}</Text> • Freelancer: <Text style={styles.bold}>{item.freelancerName}</Text>
              </Text>
            </View>
            <StatusBadge label={item.status || 'ACTIVE'} size="small" />
          </View>

          <View style={styles.escrowBox}>
            <View>
              <Text style={styles.escrowLabel}>ESCROW BUDGET</Text>
              <Text style={styles.escrowAmount}>₹{item.agreedBudget || 0} INR</Text>
            </View>
            <View style={styles.escrowBadge}>
              <Ionicons name="shield-checkmark" size={13} color={colors.success} />
              <Text style={styles.escrowBadgeText}>Protected</Text>
            </View>
          </View>

          {/* Milestones count */}
          {Array.isArray(item.milestones) && item.milestones.length > 0 ? (
            <View style={styles.milestonesSummary}>
              <Text style={styles.milestonesTitle} numberOfLines={1}>
                Milestones: {item.milestones.filter(m => m.status === 'COMPLETED').length} / {item.milestones.length} Done
              </Text>
            </View>
          ) : null}
        </View>

        {/* Admin Action Buttons */}
        <View style={styles.cardBottom}>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnInfo, { flex: 1 }]}
              onPress={() => setSelectedContract(item)}
            >
              <Ionicons name="document-text-outline" size={13} color={colors.info} />
              <Text style={[styles.btnText, { color: colors.info }]} numberOfLines={1}>Scope</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btn, styles.btnSecondary, { flex: 1 }]}
              onPress={() => handleOpenEdit(item)}
            >
              <Ionicons name="create-outline" size={13} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]} numberOfLines={1}>Edit</Text>
            </TouchableOpacity>
          </View>

          {item.status !== 'COMPLETED' && item.status !== 'CANCELLED' ? (
            <View style={[styles.actionsRow, { marginTop: 4 }]}>
              <TouchableOpacity 
                style={[styles.btn, styles.btnSuccess, { flex: 1 }]}
                onPress={() => handleManualRelease(item)}
              >
                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                <Text style={[styles.btnText, { color: colors.success }]} numberOfLines={1}>Release</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, styles.btnDanger]}
                onPress={() => handleCancelContract(item)}
              >
                <Ionicons name="close-circle-outline" size={13} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <AdminHeader title="Contracts & Escrow" subtitle={`${filteredContracts.length} Active Contracts`} />

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search contracts by title, parties..."
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <FlatList
        key={numColumns}
        data={filteredContracts}
        keyExtractor={item => item.id}
        numColumns={numColumns}
        renderItem={renderContractItem}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No contracts found</Text>
            <Text style={styles.emptySub}>No contracts match the current filters.</Text>
          </View>
        }
      />

      {/* Contract Detail Modal */}
      <Modal visible={!!selectedContract} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contract & Milestones Details</Text>
              <TouchableOpacity onPress={() => setSelectedContract(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedContract ? (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contract Title:</Text>
                  <Text style={styles.detailVal}>{selectedContract.projectTitle}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client & Freelancer:</Text>
                  <Text style={styles.detailVal}>{selectedContract.clientName} (Client) ↔ {selectedContract.freelancerName} (Freelancer)</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Agreed Amount:</Text>
                  <Text style={styles.detailVal}>₹{selectedContract.agreedBudget} INR</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contract Status:</Text>
                  <StatusBadge label={selectedContract.status} />
                </View>

                {Array.isArray(selectedContract.milestones) && selectedContract.milestones.length > 0 ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Milestone Breakdown:</Text>
                    {selectedContract.milestones.map((m, idx) => (
                      <View key={idx} style={styles.milestoneCard}>
                        <View style={styles.milestoneHeader}>
                          <Text style={styles.milestoneTitle}>{m.title || `Milestone ${idx + 1}`}</Text>
                          <StatusBadge label={m.status || 'PENDING'} size="small" />
                        </View>
                        <Text style={styles.milestoneMeta}>Amount: ₹{m.amount || 0} • Due: {m.deadline || 'N/A'}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {selectedContract.deliveryNotes ? (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Work Delivery Submission Notes:</Text>
                    <Text style={styles.detailVal}>{selectedContract.deliveryNotes}</Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary, { marginTop: 14, justifyContent: 'center', paddingVertical: 10 }]}
                  onPress={() => {
                    const c = selectedContract;
                    setSelectedContract(null);
                    handleOpenEdit(c);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={[styles.btnText, { color: colors.primary, fontSize: 13 }]}>Edit Contract Terms & Milestones</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Full Control: Edit Contract & Escrow Modal */}
      <Modal visible={!!editingContract} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 560, maxHeight: '88%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Contract & Escrow</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary }}>ID: {editingContract?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingContract(null)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editingContract ? (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.formLabel}>Agreed Escrow Budget (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={editBudget}
                  onChangeText={setEditBudget}
                  keyboardType="numeric"
                  placeholder="e.g. 15000"
                />

                <Text style={styles.formLabel}>Contract Status</Text>
                <View style={styles.statusChipsRow}>
                  {['ACTIVE', 'SUBMITTED', 'COMPLETED', 'CANCELLED'].map(st => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusChip, editStatus === st && styles.statusChipActive]}
                      onPress={() => setEditStatus(st)}
                    >
                      <Text style={[styles.statusChipText, editStatus === st && styles.statusChipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Milestones Management */}
                {editMilestones.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.formLabel}>Milestone Milestones Checklist (Tap to Toggle)</Text>
                    {editMilestones.map((m, idx) => {
                      const isDone = m.status === 'COMPLETED' || m.isCompleted;
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.milestoneCheckItem, isDone && styles.milestoneCheckItemDone]}
                          onPress={() => handleToggleMilestone(idx)}
                        >
                          <Ionicons 
                            name={isDone ? "checkbox" : "square-outline"} 
                            size={20} 
                            color={isDone ? colors.success : colors.textMuted} 
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={[styles.milestoneCheckTitle, isDone && styles.milestoneCheckTitleDone]}>
                              {m.title || `Milestone ${idx + 1}`}
                            </Text>
                            <Text style={styles.milestoneCheckSub}>
                              ₹{m.amount || 0} INR • Due: {m.deadline || 'Flexible'}
                            </Text>
                          </View>
                          <StatusBadge label={isDone ? 'COMPLETED' : 'PENDING'} size="small" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <Text style={styles.formLabel}>Work Submission / Delivery Notes</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                  value={editDeliveryNotes}
                  onChangeText={setEditDeliveryNotes}
                  placeholder="Submission links, notes from freelancer or admin comments..."
                  multiline
                />

                <View style={styles.editModalActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setEditingContract(null)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveBtn, savingContract && { opacity: 0.7 }]} 
                    onPress={handleSaveEdit}
                    disabled={savingContract}
                  >
                    {savingContract ? (
                      <ActivityIndicator size="small" color={colors.textWhite} />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={16} color={colors.textWhite} />
                        <Text style={styles.saveBtnText}>Save Contract</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
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
  listContent: {
    maxWidth: 1600,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 48,
  },
  columnWrapper: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 16,
  },
  cardWrapper: {
    paddingHorizontal: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardTop: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardBottom: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrap: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  parties: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  escrowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  escrowLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  escrowAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 1,
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  escrowBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  milestonesSummary: {
    marginBottom: 8,
  },
  milestonesTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
  },
  btnSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '40',
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  btnInfo: {
    backgroundColor: colors.infoLight,
    borderColor: colors.info + '40',
  },
  btnDanger: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger + '40',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    padding: 40,
    alignItems: 'center',
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modalBody: {
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    lineHeight: 20,
  },
  milestoneCard: {
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  milestoneMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.border,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: 10,
  },
  formInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  statusChip: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: colors.primary,
  },
  milestoneCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  milestoneCheckItemDone: {
    backgroundColor: colors.successLight,
    borderColor: colors.success + '40',
  },
  milestoneCheckTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  milestoneCheckTitleDone: {
    color: colors.success,
  },
  milestoneCheckSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textWhite,
  },
});

